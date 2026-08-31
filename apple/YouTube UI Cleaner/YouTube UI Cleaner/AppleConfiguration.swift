import Foundation

struct AppleConfiguration: Decodable {
    struct Tip: Decodable { let id: String; let name: String; let price: String; let description: String }
    let name: String
    let bundleID: String
    let extensionBundleID: String
    let urlScheme: String
    let appStoreID: String
    let supportURL: String
    let privacyURL: String
    let tips: [Tip]

    static let current: AppleConfiguration = {
        guard let url = Bundle.main.url(forResource: "configuration", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let value = try? JSONDecoder().decode(Self.self, from: data) else {
            fatalError("Missing validated Apple configuration. Run npm run prepare:apple.")
        }
        return value
    }()

    var reviewURL: URL? {
        guard !appStoreID.isEmpty, appStoreID.allSatisfy(\.isNumber) else { return nil }
        return URL(string: "https://apps.apple.com/app/id\(appStoreID)?action=write-review")
    }
}
