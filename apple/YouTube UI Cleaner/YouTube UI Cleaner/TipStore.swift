import AppKit
import Combine

@MainActor
final class TipStore: ObservableObject {
    @Published private(set) var products: [TipOption] = []
    @Published private(set) var isLoading = false
    @Published private(set) var purchasingProductID: String?
    @Published private(set) var status: String?
    @Published private(set) var deliveryNotice: String?
    @Published private(set) var missingProducts = false
    var purchaseWindow: (() -> NSWindow?)?
    private let client: any TipClient
    private let productIDs: [String]
    private var updatesTask: Task<Void, Never>?
    private var recoveryTask: Task<Void, Never>?
    private var completed = Set<UInt64>()
    private var finishing: [UInt64: Task<Void, Never>] = [:]
    var canMakePayments: Bool { client.canMakePayments }

    init(client: any TipClient, productIDs: [String]) {
        self.client = client
        self.productIDs = productIDs
    }

    func start() {
        guard updatesTask == nil else { return }
        let stream = client.updates
        updatesTask = Task { [weak self] in
            for await delivery in stream {
                guard !Task.isCancelled else { break }
                await self?.receive(delivery)
            }
        }
        reconcile()
    }

    deinit { updatesTask?.cancel(); recoveryTask?.cancel() }

    func reconcile() {
        guard recoveryTask == nil else { return }
        recoveryTask = Task { [weak self, client] in
            let deliveries = await client.unfinished()
            for delivery in deliveries { await self?.receive(delivery) }
            self?.recoveryTask = nil
        }
    }

    func loadProducts() async {
        guard !isLoading, purchasingProductID == nil else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let loaded = try await client.products(ids: productIDs)
            products = productIDs.compactMap { id in loaded.first { $0.id == id } }
            missingProducts = products.count != productIDs.count
            status = products.isEmpty ? "Tips are unavailable. Please try again." : nil
        } catch {
            status = "Tip options could not be loaded. Check your connection and try again."
            missingProducts = true
        }
    }

    func purchase(_ product: TipOption) async {
        guard purchasingProductID == nil, !isLoading,
              productIDs.contains(product.id), products.contains(where: { $0.id == product.id }) else { return }
        guard client.canMakePayments else { status = "Purchases are not allowed on this Mac."; return }
        guard let window = purchaseWindow?(), window.isVisible else {
            status = "Please reopen Support options and try again."
            return
        }
        purchasingProductID = product.id
        status = nil
        deliveryNotice = nil
        defer { purchasingProductID = nil }
        do {
            switch try await client.purchase(id: product.id, window: window) {
            case .success(let delivery):
                guard delivery.productID == product.id else { status = "The purchase returned an unexpected product."; return }
                let accepted = await receive(delivery)
                status = accepted ? "Thank you for your tip!" : "This purchase could not be verified. Please try again later."
            case .pending:
                status = "Your \(product.name) request is pending approval. No completed purchase is confirmed for this request."
            case .cancelled: status = nil
            }
        } catch is CancellationError {
            status = "The purchase was interrupted. You can try again."
        } catch {
            status = "The purchase could not be completed. Please try again."
        }
    }

    @discardableResult
    func receive(_ delivery: TipDelivery) async -> Bool {
        guard productIDs.contains(delivery.productID) else { return false }
        guard delivery.verified else {
            deliveryNotice = "A tip transaction could not be verified. It has not been accepted. Please try again later."
            return false
        }
        if completed.contains(delivery.id) { return true }
        if let task = finishing[delivery.id] {
            await task.value
            return true
        }
        let task = Task { await delivery.finish() }
        finishing[delivery.id] = task
        await task.value
        finishing[delivery.id] = nil
        completed.insert(delivery.id)
        // Separate delivery evidence from the current attempt, which may still be pending.
        deliveryNotice = "A verified tip transaction was completed. Thank you!"
        return true
    }
}
