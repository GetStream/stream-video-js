import UIKit
import WebKit

final class ViewController: UIViewController {
    private let urlBar = UITextField()
    private let loadButton = UIButton(type: .system)
    private let reloadButton = UIButton(type: .system)
    private let webContainer = WebViewContainer()
    private let overlay = DebugOverlayView()

    private lazy var audio = AudioScenarios(eval: { [weak self] s, l in
        self?.webContainer.eval(s, label: l)
    })

    private let lastURLKey = "lastURL"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "IOSWebView"
        setupNavBar()
        setupLayout()
        if let last = UserDefaults.standard.string(forKey: lastURLKey) {
            urlBar.text = last
        }
    }

    private func setupNavBar() {
        let scenariosButton = UIBarButtonItem(
            title: "Scenarios",
            image: nil,
            primaryAction: nil,
            menu: ScenariosMenu(audio: audio).build(),
        )
        navigationItem.rightBarButtonItem = scenariosButton
    }

    private func setupLayout() {
        let topStack = UIStackView()
        topStack.translatesAutoresizingMaskIntoConstraints = false
        topStack.axis = .horizontal
        topStack.spacing = 8

        urlBar.translatesAutoresizingMaskIntoConstraints = false
        urlBar.borderStyle = .roundedRect
        urlBar.keyboardType = .URL
        urlBar.autocorrectionType = .no
        urlBar.autocapitalizationType = .none
        urlBar.placeholder = "https://<slug>.trycloudflare.com"
        urlBar.returnKeyType = .go
        urlBar.delegate = self
        urlBar.setContentHuggingPriority(.defaultLow, for: .horizontal)
        urlBar.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        styleChromeButton(loadButton, title: "Load")
        loadButton.addTarget(self, action: #selector(loadTapped), for: .touchUpInside)
        styleChromeButton(reloadButton, title: "↻")
        reloadButton.addTarget(self, action: #selector(reloadTapped), for: .touchUpInside)

        topStack.addArrangedSubview(urlBar)
        topStack.addArrangedSubview(loadButton)
        topStack.addArrangedSubview(reloadButton)

        NSLayoutConstraint.activate([
            loadButton.widthAnchor.constraint(equalToConstant: 64),
            reloadButton.widthAnchor.constraint(equalToConstant: 44),
        ])

        webContainer.translatesAutoresizingMaskIntoConstraints = false
        overlay.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(topStack)
        view.addSubview(webContainer)
        view.addSubview(overlay)

        NSLayoutConstraint.activate([
            topStack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            topStack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 12),
            topStack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12),

            webContainer.topAnchor.constraint(equalTo: topStack.bottomAnchor, constant: 8),
            webContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webContainer.bottomAnchor.constraint(equalTo: overlay.topAnchor),

            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            overlay.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
        ])
    }

    // MARK: Styling

    private func styleChromeButton(_ button: UIButton, title: String) {
        button.setTitle(title, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 15, weight: .semibold)
        button.backgroundColor = .systemBlue
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 8
        button.setContentHuggingPriority(.required, for: .horizontal)
        button.setContentCompressionResistancePriority(.required, for: .horizontal)
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 34).isActive = true
    }

    // MARK: Actions

    @objc private func loadTapped() {
        guard var text = urlBar.text?.trimmingCharacters(in: .whitespacesAndNewlines),
              !text.isEmpty else { return }
        if !text.contains("://") { text = "https://" + text }
        guard let url = URL(string: text) else {
            AppState.shared.log(.errors, "url", "invalid URL: \(text)"); return
        }
        UserDefaults.standard.set(text, forKey: lastURLKey)
        urlBar.resignFirstResponder()
        webContainer.load(url)
    }

    @objc private func reloadTapped() { webContainer.reload() }
}

extension ViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        loadTapped()
        return true
    }
}

#if DEBUG
@available(iOS 17.0, *)
#Preview("ViewController") {
    let nav = UINavigationController(rootViewController: ViewController())
    return nav
}
#endif
