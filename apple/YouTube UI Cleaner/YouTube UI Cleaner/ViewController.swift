import AppKit
import Combine
import SafariServices
import SwiftUI

@MainActor
final class SetupModel: ObservableObject {
    @Published var extensionStatus = "Checking Safari extension…"
    @Published var message: String?
    func refresh() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: AppleConfiguration.current.extensionBundleID) { [weak self] state, error in
            Task { @MainActor in
                self?.extensionStatus = state.map { $0.isEnabled ? "The Safari extension is enabled." : "The Safari extension is disabled." }
                    ?? "Safari extension status is unavailable. Check Safari Settings."
            }
        }
    }
}

struct SetupView: View {
    @ObservedObject var model: SetupModel
    let settings: () -> Void
    let rate: () -> Void
    let support: () -> Void
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Image(nsImage: NSApp.applicationIconImage).resizable().frame(width: 96, height: 96)
                Text(AppleConfiguration.current.name).font(.largeTitle.bold()).multilineTextAlignment(.center)
                Text(model.extensionStatus).font(.headline).multilineTextAlignment(.center)
                Text("1. Enable YouTube UI Cleaner in Safari Settings → Extensions.\n2. Allow access to youtube.com in Safari’s website permissions.\n3. Reload open YouTube pages, then use the toolbar popup to choose what to hide.")
                    .fixedSize(horizontal: false, vertical: true).lineSpacing(7)
                Text("Extension enablement does not confirm website permission. Preferences stay on this Mac; Safari does not sync them between devices.")
                    .font(.callout).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                Button("Open Safari Extension Settings", action: settings).controlSize(.large)
                HStack {
                    Link("Help", destination: URL(string: AppleConfiguration.current.supportURL)!)
                    Link("Privacy", destination: URL(string: AppleConfiguration.current.privacyURL)!)
                }
                if let message = model.message { Text(message).font(.callout).multilineTextAlignment(.center) }
                SupportActionStrip(rate: rate, support: support)
            }.padding(30).frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
        }
    }
}

@MainActor
final class ViewController: NSViewController {
    let model = SetupModel()
    private let store: TipStore
    private var sheet: NSViewController?
    init(store: TipStore) { self.store = store; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("Use init(store:)") }

    override func loadView() {
        view = NSView()
        let host = NSHostingController(rootView: SetupView(model: model,
            settings: { [weak self] in self?.openSettings() },
            rate: { [weak self] in self?.rate() },
            support: { [weak self] in self?.showSupport() }))
        embed(host, into: self)
    }

    func showSupport() {
        guard sheet == nil, view.window?.isVisible == true else { return }
        let controller = NSViewController()
        controller.view = NSView()
        controller.title = "Support YouTube UI Cleaner"
        let host = NSHostingController(rootView: TipSheet(store: store) { [weak self] in self?.dismissSupport() })
        // StoreKit must insert remote views into an AppKit-owned root.
        embed(host, into: controller)
        controller.preferredContentSize = NSSize(width: max(470, host.view.fittingSize.width), height: 500)
        sheet = controller
        store.purchaseWindow = { [weak controller] in controller?.view.window }
        presentAsSheet(controller)
    }
    func dismissSupport() {
        guard store.purchasingProductID == nil, let sheet else { return }
        dismiss(sheet)
        self.sheet = nil
        store.purchaseWindow = nil
    }
    private func openSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: AppleConfiguration.current.extensionBundleID) { [weak self] error in
            Task { @MainActor in
                if error != nil { self?.model.message = "Open Safari → Settings → Extensions to enable YouTube UI Cleaner." }
            }
        }
    }
    private func rate() {
        guard let url = AppleConfiguration.current.reviewURL else {
            model.message = "Rating is unavailable until this app has an App Store page."
            return
        }
        model.message = "The App Store rating page may be unavailable until the app is published."
        NSWorkspace.shared.open(url)
    }
    private func embed(_ child: NSViewController, into parent: NSViewController) {
        parent.addChild(child)
        parent.view.addSubview(child.view)
        child.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            child.view.leadingAnchor.constraint(equalTo: parent.view.leadingAnchor),
            child.view.trailingAnchor.constraint(equalTo: parent.view.trailingAnchor),
            child.view.topAnchor.constraint(equalTo: parent.view.topAnchor),
            child.view.bottomAnchor.constraint(equalTo: parent.view.bottomAnchor)
        ])
    }
}
