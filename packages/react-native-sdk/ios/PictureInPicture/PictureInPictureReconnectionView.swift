//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import UIKit

/// A view that displays a reconnection indicator when the call connection is being recovered.
/// Shows a spinner with a "Reconnecting..." message.
final class PictureInPictureReconnectionView: UIView {

    // MARK: - Properties

    /// Whether the view should be visible (when reconnecting)
    var isReconnecting: Bool = false {
        didSet {
            updateVisibility()
        }
    }

    // MARK: - Private Properties

    private let containerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor(red: 0.12, green: 0.13, blue: 0.15, alpha: 0.85) // Semi-transparent dark background
        return view
    }()

    private let contentStackView: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 12
        return stack
    }()

    private let activityIndicator: UIActivityIndicatorView = {
        let indicator: UIActivityIndicatorView
        if #available(iOS 13.0, *) {
            indicator = UIActivityIndicatorView(style: .large)
            indicator.color = .white
        } else {
            indicator = UIActivityIndicatorView(style: .whiteLarge)
        }
        indicator.translatesAutoresizingMaskIntoConstraints = false
        indicator.hidesWhenStopped = false
        return indicator
    }()

    private let messageLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = "Reconnecting..."
        label.textColor = .white
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        label.accessibilityIdentifier = "reconnectingMessage"
        return label
    }()

    // MARK: - Lifecycle

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Private Helpers

    private func setUp() {
        addSubview(containerView)
        containerView.addSubview(contentStackView)
        contentStackView.addArrangedSubview(activityIndicator)
        contentStackView.addArrangedSubview(messageLabel)

        NSLayoutConstraint.activate([
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.topAnchor.constraint(equalTo: topAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),

            contentStackView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            contentStackView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            contentStackView.leadingAnchor.constraint(greaterThanOrEqualTo: containerView.leadingAnchor, constant: 16),
            contentStackView.trailingAnchor.constraint(lessThanOrEqualTo: containerView.trailingAnchor, constant: -16)
        ])

        // Start spinning the activity indicator
        activityIndicator.startAnimating()

        // Initially hidden
        updateVisibility()
    }

    private func updateVisibility() {
        isHidden = !isReconnecting
        if isReconnecting {
            activityIndicator.startAnimating()
        } else {
            activityIndicator.stopAnimating()
        }
    }
}
