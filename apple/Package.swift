// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "AppleLogic", platforms: [.macOS(.v13)], targets: [
    .target(name: "AppleLogic", path: "YouTube UI Cleaner/YouTube UI Cleaner",
        exclude: ["AppDelegate.swift", "ViewController.swift", "SupportViews.swift", "AppleConfiguration.swift", "Assets.xcassets", "Info.plist"],
        sources: ["SupportRouter.swift", "TipClient.swift", "TipStore.swift"]),
    .testTarget(name: "AppleLogicTests", dependencies: ["AppleLogic"], path: "Tests")
])
