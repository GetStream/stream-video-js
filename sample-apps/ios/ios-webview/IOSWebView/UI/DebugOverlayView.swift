import UIKit

/// A collapsible bottom panel with tabbed log views: Console, Errors,
/// Lifecycle. Mirrors the shared `AppState` log storage.
final class DebugOverlayView: UIView {
    enum Tab: Int, CaseIterable {
        case console, errors, lifecycle
        var title: String {
            switch self {
            case .console: return "Console"
            case .errors: return "Errors"
            case .lifecycle: return "Lifecycle"
            }
        }
        var logTab: LogTab {
            switch self {
            case .console: return .console
            case .errors: return .errors
            case .lifecycle: return .lifecycle
            }
        }
    }

    private let toggleButton = UIButton(type: .system)
    private let segmented = UISegmentedControl(items: Tab.allCases.map(\.title))
    private let clearButton = UIButton(type: .system)
    private let textView = UITextView()
    private var panelHeightConstraint: NSLayoutConstraint!
    private var expandedHeight: CGFloat = 260
    private(set) var isExpanded = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
        AppState.shared.onLogAppended = { [weak self] entry in
            self?.handleNewEntry(entry)
        }
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        backgroundColor = UIColor.black.withAlphaComponent(0.85)
        layer.cornerRadius = 12
        layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        clipsToBounds = true

        toggleButton.translatesAutoresizingMaskIntoConstraints = false
        toggleButton.setTitle("▲ Debug", for: .normal)
        toggleButton.tintColor = .white
        toggleButton.titleLabel?.font = .monospacedSystemFont(ofSize: 13, weight: .medium)
        toggleButton.addTarget(self, action: #selector(toggleTapped), for: .touchUpInside)
        addSubview(toggleButton)

        segmented.translatesAutoresizingMaskIntoConstraints = false
        segmented.selectedSegmentIndex = 0
        segmented.addTarget(self, action: #selector(tabChanged), for: .valueChanged)
        segmented.selectedSegmentTintColor = .systemBlue
        segmented.setTitleTextAttributes([.foregroundColor: UIColor.white], for: .normal)
        addSubview(segmented)

        clearButton.translatesAutoresizingMaskIntoConstraints = false
        clearButton.setTitle("Clear", for: .normal)
        clearButton.tintColor = .white
        clearButton.titleLabel?.font = .systemFont(ofSize: 13)
        clearButton.addTarget(self, action: #selector(clearTapped), for: .touchUpInside)
        addSubview(clearButton)

        textView.translatesAutoresizingMaskIntoConstraints = false
        textView.backgroundColor = .clear
        textView.textColor = .white
        textView.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
        textView.isEditable = false
        textView.dataDetectorTypes = []
        addSubview(textView)

        panelHeightConstraint = heightAnchor.constraint(equalToConstant: 40)
        panelHeightConstraint.isActive = true

        NSLayoutConstraint.activate([
            toggleButton.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            toggleButton.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            toggleButton.heightAnchor.constraint(equalToConstant: 28),

            clearButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12),
            clearButton.topAnchor.constraint(equalTo: topAnchor, constant: 8),

            segmented.leadingAnchor.constraint(equalTo: toggleButton.trailingAnchor, constant: 8),
            segmented.trailingAnchor.constraint(equalTo: clearButton.leadingAnchor, constant: -8),
            segmented.centerYAnchor.constraint(equalTo: toggleButton.centerYAnchor),

            textView.topAnchor.constraint(equalTo: toggleButton.bottomAnchor, constant: 4),
            textView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            textView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            textView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8),
        ])

        renderActiveTab()
    }

    @objc private func toggleTapped() {
        isExpanded.toggle()
        panelHeightConstraint.constant = isExpanded ? expandedHeight : 40
        toggleButton.setTitle(isExpanded ? "▼ Debug" : "▲ Debug", for: .normal)
        UIView.animate(withDuration: 0.2) { self.superview?.layoutIfNeeded() }
    }

    @objc private func tabChanged() { renderActiveTab() }

    @objc private func clearTapped() {
        AppState.shared.clear(tab: activeTab().logTab)
        renderActiveTab()
    }

    private func activeTab() -> Tab {
        Tab(rawValue: segmented.selectedSegmentIndex) ?? .console
    }

    private func handleNewEntry(_ entry: LogEntry) {
        if entry.tab == activeTab().logTab { renderActiveTab() }
    }

    private func renderActiveTab() {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss.SSS"
        let lines = AppState.shared.entries(for: activeTab().logTab).map { e in
            "[\(formatter.string(from: e.timestamp))] \(e.level): \(e.message)"
        }
        textView.text = lines.joined(separator: "\n")
        let end = NSRange(location: (textView.text as NSString).length, length: 0)
        textView.scrollRangeToVisible(end)
    }

    /// Populates the shared log with synthetic entries so previews show content.
    /// Only used by `#Preview`.
    func _seedPreviewData() {
        for tab in [LogTab.console, .errors, .lifecycle, .scenarios] {
            AppState.shared.clear(tab: tab)
        }
        AppState.shared.log(.console, "info", "[tutorial] joining call from ?call_id= regression-repro-42")
        AppState.shared.log(.console, "log", "[tutorial] audioHealth → healthy audio-session-active")
        AppState.shared.log(.errors, "gUM.failure", "NotAllowedError: Permission denied")
        AppState.shared.log(.lifecycle, "app", "UIApplicationDidEnterBackground")
        AppState.shared.log(.lifecycle, "audio", "routeChange reason=newDeviceAvailable prev=[Speaker] → new=[Headphones]")
        isExpanded = true
        panelHeightConstraint.constant = expandedHeight
        renderActiveTab()
    }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("DebugOverlay") {
    let wrapper = UIView()
    wrapper.backgroundColor = .systemBackground
    let overlay = DebugOverlayView()
    overlay.translatesAutoresizingMaskIntoConstraints = false
    wrapper.addSubview(overlay)
    NSLayoutConstraint.activate([
        overlay.leadingAnchor.constraint(equalTo: wrapper.leadingAnchor),
        overlay.trailingAnchor.constraint(equalTo: wrapper.trailingAnchor),
        overlay.bottomAnchor.constraint(equalTo: wrapper.bottomAnchor),
    ])
    overlay._seedPreviewData()
    return wrapper
}
#endif
