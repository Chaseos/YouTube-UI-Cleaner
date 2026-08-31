import AppKit
import StoreKit

struct TipOption: Identifiable, Equatable {
    let id: String
    let name: String
    let description: String
    let price: String
}

struct TipDelivery {
    let id: UInt64
    let productID: String
    let verified: Bool
    let finish: () async -> Void
}

enum TipPurchaseResult { case success(TipDelivery), pending, cancelled }

@MainActor
protocol TipClient: AnyObject {
    var canMakePayments: Bool { get }
    var updates: AsyncStream<TipDelivery> { get }
    func products(ids: [String]) async throws -> [TipOption]
    func purchase(id: String, window: NSWindow) async throws -> TipPurchaseResult
    func unfinished() async -> [TipDelivery]
}

@MainActor
final class StoreKitTipClient: TipClient {
    private var loaded: [String: Product] = [:]
    var canMakePayments: Bool { AppStore.canMakePayments }
    let updates: AsyncStream<TipDelivery>

    init() {
        updates = AsyncStream { continuation in
            let task = Task {
                for await result in StoreKit.Transaction.updates {
                    if Task.isCancelled { break }
                    continuation.yield(Self.delivery(result))
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    func products(ids: [String]) async throws -> [TipOption] {
        let products = try await Product.products(for: ids)
        loaded = Dictionary(uniqueKeysWithValues: products.map { ($0.id, $0) })
        return products.filter { $0.type == .consumable }.map {
            TipOption(id: $0.id, name: $0.displayName, description: $0.description, price: $0.displayPrice)
        }
    }

    func purchase(id: String, window: NSWindow) async throws -> TipPurchaseResult {
        guard let product = loaded[id], product.type == .consumable else { throw PurchaseError.unavailable }
        let result: Product.PurchaseResult
        if #available(macOS 15.2, *) {
            result = try await product.purchase(confirmIn: window, options: [])
        } else {
            result = try await product.purchase(options: [])
        }
        switch result {
        case .success(let verification): return .success(Self.delivery(verification))
        case .pending: return .pending
        case .userCancelled: return .cancelled
        @unknown default: throw PurchaseError.unknown
        }
    }

    func unfinished() async -> [TipDelivery] {
        var deliveries: [TipDelivery] = []
        for await result in StoreKit.Transaction.unfinished { deliveries.append(Self.delivery(result)) }
        return deliveries
    }

    private static func delivery(_ result: VerificationResult<StoreKit.Transaction>) -> TipDelivery {
        switch result {
        case .verified(let transaction):
            return TipDelivery(id: transaction.id, productID: transaction.productID,
                               verified: transaction.productType == .consumable, finish: { await transaction.finish() })
        case .unverified(let transaction, _):
            return TipDelivery(id: transaction.id, productID: transaction.productID, verified: false, finish: {})
        }
    }
    private enum PurchaseError: Error { case unavailable, unknown }
}
