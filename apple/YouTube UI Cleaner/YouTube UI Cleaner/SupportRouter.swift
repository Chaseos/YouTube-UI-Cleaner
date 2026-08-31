import Foundation

@MainActor
final class SupportRouter {
    private let scheme: String
    private(set) var pending = false
    var present: (() -> Bool)?

    init(scheme: String) { self.scheme = scheme }

    @discardableResult
    func handle(_ url: URL) -> Bool {
        guard let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.scheme?.lowercased() == scheme.lowercased(),
              parts.host?.lowercased() == "support",
              parts.path.isEmpty || parts.path == "/",
              parts.query == nil, parts.fragment == nil,
              parts.user == nil, parts.password == nil, parts.port == nil else { return false }
        pending = true
        flush()
        return true
    }

    func flush() {
        guard pending else { return }
        if present?() == true { pending = false }
    }
}
