import AppKit

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    private lazy var store = TipStore(client: StoreKitTipClient(), productIDs: AppleConfiguration.current.tips.map(\.id))
    private lazy var router = SupportRouter(scheme: AppleConfiguration.current.urlScheme)
    private var window: NSWindow?
    private var controller: ViewController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let menu = NSMenu()
        let item = NSMenuItem()
        menu.addItem(item)
        let applicationMenu = NSMenu()
        applicationMenu.addItem(withTitle: "Quit YouTube UI Cleaner", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        item.submenu = applicationMenu
        NSApp.mainMenu = menu
        store.start()
        let controller = ViewController(store: store)
        let window = NSWindow(contentViewController: controller)
        window.title = AppleConfiguration.current.name
        window.setContentSize(NSSize(width: 560, height: 620))
        window.minSize = NSSize(width: 440, height: 440)
        window.styleMask = [.titled, .closable, .miniaturizable, .resizable]
        window.delegate = self
        window.center()
        self.controller = controller
        self.window = window
        router.present = { [weak self] in
            guard let self, let window = self.window, let controller = self.controller else { return false }
            window.deminiaturize(nil)
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            controller.showSupport()
            return true
        }
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        controller.model.refresh()
        router.flush()
    }
    func applicationDidBecomeActive(_ notification: Notification) {
        store.reconcile()
        controller?.model.refresh()
        router.flush()
    }
    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls { if router.handle(url) { break } }
    }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows: Bool) -> Bool {
        window?.makeKeyAndOrderFront(nil)
        return true
    }
    func windowShouldClose(_ sender: NSWindow) -> Bool { store.purchasingProductID == nil }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        store.purchasingProductID == nil ? .terminateNow : .terminateCancel
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

@main
enum AppMain {
    @MainActor static func main() {
        let application = NSApplication.shared
        let delegate = AppDelegate()
        application.delegate = delegate
        application.setActivationPolicy(.regular)
        withExtendedLifetime(delegate) { application.run() }
    }
}
