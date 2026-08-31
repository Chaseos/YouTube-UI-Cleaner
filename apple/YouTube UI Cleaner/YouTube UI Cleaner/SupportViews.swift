import SwiftUI

struct SupportActionStrip: View {
    let rate: () -> Void
    let support: () -> Void
    @State private var hovered: String?
    @FocusState private var focused: String?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 8) {
            action("Rate this app", symbol: "star.fill", color: colorScheme == .dark
                   ? Color(red: 1, green: 0.78, blue: 0.34) : Color(red: 0.51, green: 0.32, blue: 0), perform: rate)
            action("Support options", symbol: "heart.fill", color: colorScheme == .dark
                   ? Color(red: 1, green: 0.38, blue: 0.42) : Color(red: 0.7, green: 0.1, blue: 0.18), perform: support)
        }
        .padding(6)
        .background(.ultraThinMaterial, in: Capsule())
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: hovered)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: focused)
    }
    private func action(_ title: String, symbol: String, color: Color, perform: @escaping () -> Void) -> some View {
        let expanded = hovered == title || focused == title
        return Button(action: perform) {
            HStack(spacing: 7) {
                Image(systemName: symbol).font(.system(size: 22, weight: .semibold))
                if expanded { Text(title).font(.callout).fixedSize(horizontal: false, vertical: true) }
            }
            .padding(10).frame(minWidth: 44, minHeight: 44)
            .foregroundStyle(color)
            .background(color.opacity(expanded ? 0.12 : 0), in: Capsule())
            .overlay(Capsule().stroke(color.opacity(focused == title ? 1 : 0), lineWidth: 2))
        }
        .buttonStyle(.plain).opacity(expanded ? 1 : 0.8)
        .focused($focused, equals: title)
        .accessibilityLabel(title).help(title)
        .onHover { inside in hovered = inside ? title : (hovered == title ? nil : hovered) }
    }
}

struct TipSheet: View {
    @ObservedObject var store: TipStore
    let dismiss: () -> Void
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Support my work").font(.title2.bold())
                Spacer()
                Button("Done", action: dismiss).keyboardShortcut(.cancelAction)
                    .disabled(store.purchasingProductID != nil)
            }.padding(20)
            Divider()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Tips are optional and support continued development. They unlock no features, content, status, or other benefit.")
                        .foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    if store.isLoading { ProgressView("Loading tip options…").frame(maxWidth: .infinity) }
                    if !store.canMakePayments { Text("Purchases are not allowed on this Mac.") }
                    ForEach(store.products) { product in
                        Button { Task { await store.purchase(product) } } label: {
                            HStack(alignment: .center, spacing: 12) {
                                Image(systemName: "heart.fill").foregroundStyle(.red)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(product.name).fontWeight(.semibold)
                                    Text(product.description).font(.callout).foregroundStyle(.secondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }.frame(maxWidth: .infinity, alignment: .leading)
                                if store.purchasingProductID == product.id { ProgressView().controlSize(.small) }
                                else { Text(product.price).fontWeight(.semibold).fixedSize() }
                            }
                            .padding(14).frame(maxWidth: .infinity, alignment: .leading)
                            .background(.quaternary, in: RoundedRectangle(cornerRadius: 10))
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .disabled(store.isLoading || store.purchasingProductID != nil || !store.canMakePayments)
                        .accessibilityLabel("\(product.name), \(product.description), \(product.price)")
                    }
                    if store.missingProducts {
                        Text("Some tip options are unavailable.").font(.callout)
                        Button("Try Again") { Task { await store.loadProducts() } }
                            .disabled(store.isLoading || store.purchasingProductID != nil)
                    }
                    if let status = store.status { Text(status).fixedSize(horizontal: false, vertical: true) }
                    if let notice = store.deliveryNotice { Text(notice).font(.callout).foregroundStyle(.secondary) }
                }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(minWidth: 400, idealWidth: 470, minHeight: 420, idealHeight: 500)
        .task { await store.loadProducts() }
    }
}
