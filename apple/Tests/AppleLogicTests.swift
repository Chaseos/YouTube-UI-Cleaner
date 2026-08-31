import XCTest
import AppKit
@testable import AppleLogic

@MainActor
final class FakeClient: TipClient {
    var canMakePayments = true
    let updates: AsyncStream<TipDelivery>
    let continuation: AsyncStream<TipDelivery>.Continuation
    var options = [TipOption(id: "tip.small", name: "Small", description: "Optional tip", price: "$0.99")]
    var loadError = false
    var loadCalls = 0
    var purchaseCalls = 0
    var recoveryCalls = 0
    var result = TipPurchaseResult.cancelled
    var purchaseError = false
    var pausePurchase: CheckedContinuation<Void, Never>?
    var shouldPause = false
    var recovered: [TipDelivery] = []
    init() { (updates, continuation) = AsyncStream.makeStream() }
    func products(ids: [String]) async throws -> [TipOption] {
        loadCalls += 1
        if loadError { throw NSError(domain: "test", code: 1) }
        return options
    }
    func purchase(id: String, window: NSWindow) async throws -> TipPurchaseResult {
        purchaseCalls += 1
        if shouldPause { await withCheckedContinuation { pausePurchase = $0 } }
        if purchaseError { throw NSError(domain: "test", code: 2) }
        return result
    }
    func unfinished() async -> [TipDelivery] { recoveryCalls += 1; await Task.yield(); return recovered }
}

@MainActor
final class VisibleWindow: NSWindow {
    override var isVisible: Bool { true }
}

final class AppleLogicTests: XCTestCase {
    @MainActor func testRouterValidatesAndCoalescesColdRequests() {
        let router = SupportRouter(scheme: "youtubeuicleaner")
        for input in ["https://support", "youtubeuicleaner://purchase", "youtubeuicleaner://support?buy=small", "youtubeuicleaner://support/path", "youtubeuicleaner://user@support", "youtubeuicleaner://support:42", "youtubeuicleaner://support#purchase"] {
            XCTAssertFalse(router.handle(URL(string: input)!))
        }
        XCTAssertTrue(router.handle(URL(string: "youtubeuicleaner://support")!))
        XCTAssertTrue(router.handle(URL(string: "youtubeuicleaner://support")!))
        var presented = 0
        router.present = { presented += 1; return true }
        router.flush(); router.flush()
        XCTAssertEqual(presented, 1)
        XCTAssertFalse(router.pending)
    }
    @MainActor func testLoadFailureEmptyPartialAndRetry() async {
        let client = FakeClient(); let store = TipStore(client: client, productIDs: ["tip.small", "tip.large"])
        client.loadError = true
        await store.loadProducts(); XCTAssertFalse(store.isLoading); XCTAssertNotNil(store.status)
        client.loadError = false; client.options = []
        await store.loadProducts(); XCTAssertTrue(store.products.isEmpty); XCTAssertTrue(store.missingProducts)
        client.options = [.init(id: "tip.small", name: "Small", description: "Tip", price: "$1")]
        await store.loadProducts(); XCTAssertEqual(store.products.count, 1); XCTAssertTrue(store.missingProducts)
        XCTAssertEqual(client.loadCalls, 3)
    }
    @MainActor func testVerificationFilteringAndIdempotentCompletion() async {
        let store = TipStore(client: FakeClient(), productIDs: ["tip.small"])
        var finishes = 0
        let delivery = TipDelivery(id: 1, productID: "tip.small", verified: true, finish: { finishes += 1; await Task.yield() })
        async let a = store.receive(delivery)
        async let b = store.receive(delivery)
        _ = await (a, b)
        _ = await store.receive(delivery)
        _ = await store.receive(.init(id: 2, productID: "other", verified: true, finish: { finishes += 1 }))
        _ = await store.receive(.init(id: 3, productID: "tip.small", verified: false, finish: { finishes += 1 }))
        XCTAssertEqual(finishes, 1)
    }
    @MainActor func testLaunchUpdatesAndNonoverlappingRecoveryWithoutSheet() async {
        let client = FakeClient(); var finishes = 0
        client.recovered = [.init(id: 1, productID: "tip.small", verified: true, finish: { finishes += 1 })]
        let store = TipStore(client: client, productIDs: ["tip.small"])
        store.start(); store.reconcile(); store.reconcile()
        for _ in 0..<30 { await Task.yield() }
        XCTAssertEqual(client.recoveryCalls, 1); XCTAssertEqual(finishes, 1)
        client.continuation.yield(.init(id: 2, productID: "tip.small", verified: true, finish: { finishes += 1 }))
        for _ in 0..<30 { await Task.yield() }
        XCTAssertEqual(finishes, 2)
        client.continuation.finish()
    }
    @MainActor func testDuplicateDeliveryWaitsForFinishAndUnverifiedNoticeDoesNotCredit() async {
        let store = TipStore(client: FakeClient(), productIDs: ["tip.small"])
        var finishContinuation: CheckedContinuation<Void, Never>?
        var returned = 0
        let delivery = TipDelivery(id: 20, productID: "tip.small", verified: true, finish: {
            await withCheckedContinuation { finishContinuation = $0 }
        })
        let first = Task { await store.receive(delivery); returned += 1 }
        while finishContinuation == nil { await Task.yield() }
        let duplicate = Task { await store.receive(delivery); returned += 1 }
        for _ in 0..<10 { await Task.yield() }
        XCTAssertEqual(returned, 0, "no caller may report completion before finish returns")
        finishContinuation?.resume()
        await first.value; await duplicate.value
        XCTAssertEqual(returned, 2)
        let accepted = await store.receive(.init(id: 21, productID: "tip.small", verified: false,
                                                finish: { XCTFail("must not finish unverified delivery") }))
        XCTAssertFalse(accepted)
        XCTAssertTrue(store.deliveryNotice!.contains("not been accepted"))
    }
    @MainActor func testPurchaseGuardAndTerminalPaths() async {
        _ = NSApplication.shared
        let window = VisibleWindow(contentRect: .zero, styleMask: [], backing: .buffered, defer: false)
        let client = FakeClient(); let store = TipStore(client: client, productIDs: ["tip.small"])
        await store.loadProducts()
        let product = store.products[0]
        await store.purchase(product); XCTAssertEqual(client.purchaseCalls, 0); XCTAssertNotNil(store.status)
        store.purchaseWindow = { [weak window] in window }
        client.canMakePayments = false
        await store.purchase(product); XCTAssertEqual(client.purchaseCalls, 0)
        client.canMakePayments = true; client.shouldPause = true
        let first = Task { await store.purchase(product) }
        while client.pausePurchase == nil { await Task.yield() }
        await store.purchase(product); XCTAssertEqual(client.purchaseCalls, 1)
        client.pausePurchase?.resume(); await first.value
        XCTAssertNil(store.purchasingProductID); XCTAssertNil(store.status)
        client.shouldPause = false; client.result = .pending
        await store.purchase(product); XCTAssertNil(store.purchasingProductID); XCTAssertTrue(store.status!.contains("pending"))
        _ = await store.receive(.init(id: 6, productID: product.id, verified: true, finish: {}))
        XCTAssertTrue(store.status!.contains("pending"), "background delivery must not claim this request finished")
        client.purchaseError = true
        await store.purchase(product); XCTAssertNil(store.purchasingProductID); XCTAssertTrue(store.status!.contains("could not"))
        client.purchaseError = false; var count = 0
        for id in [UInt64(7), UInt64(8)] {
            client.result = .success(.init(id: id, productID: product.id, verified: true, finish: { count += 1 }))
            await store.purchase(product); XCTAssertNil(store.purchasingProductID)
        }
        XCTAssertEqual(count, 2)
    }
}
