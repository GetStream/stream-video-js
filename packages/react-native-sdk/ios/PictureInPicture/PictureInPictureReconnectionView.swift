//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import UIKit

/// A view that displays a reconnection indicator when the call connection is being recovered.
/// Shows three pulsing dots with a "Reconnecting" message, matching upstream CallingIndicator style.
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
        view.backgroundColor = UIColor(red: 0.12, green: 0.13, blue: 0.15, alpha: 0.85)
        return view
    }()

    private let contentStackView: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 8
        return stack
    }()

    private let messageLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = "Reconnecting"
        label.textColor = .white
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        label.accessibilityIdentifier = "reconnectingMessage"
        return label
    }()

    /// Three dots indicator matching upstream CallingIndicator style
    private let dotsStackView: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 2  // Matches upstream
        stack.accessibilityIdentifier = "callingIndicator"
        return stack
    }()

    private let dotSize: CGFloat = 4  // Matches upstream
    private var dots: [UIView] = []

    // MARK: - Lifecycle

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        stopAnimation()
    }

    // MARK: - Private Helpers

    private func createDot() -> UIView {
        let dot = UIView()
        dot.translatesAutoresizingMaskIntoConstraints = false
        dot.backgroundColor = .white
        dot.layer.cornerRadius = dotSize / 2
        dot.alpha = 0  // Start invisible (matches upstream)
        NSLayoutConstraint.activate([
            dot.widthAnchor.constraint(equalToConstant: dotSize),
            dot.heightAnchor.constraint(equalToConstant: dotSize)
        ])
        return dot
    }

    private func setUp() {
        addSubview(containerView)
        containerView.addSubview(contentStackView)

        // Order matches upstream: text first, then dots indicator
        contentStackView.addArrangedSubview(messageLabel)
        contentStackView.addArrangedSubview(dotsStackView)

        // Add three dots (matches upstream)
        for _ in 0..<3 {
            let dot = createDot()
            dots.append(dot)
            dotsStackView.addArrangedSubview(dot)
        }

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

        // Initially hidden
        updateVisibility()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        // Restart animation when view is added to window (animations are removed when view leaves window)
        if window != nil && isReconnecting && !isHidden {
            startAnimation()
        }
    }

    private func updateVisibility() {
        isHidden = !isReconnecting

        if isReconnecting {
            startAnimation()
        } else {
            stopAnimation()
        }
    }

    // MARK: - Animation (matches upstream CallingIndicator)

    /// Starts the pulsing animation matching upstream exactly:
    /// - All dots animate from alpha 0 → 1
    /// - Same 0.2s delay for all dots
    /// - 1 second duration
    /// - Different easing: easeOut, easeInOut, easeIn
    /// - Repeat forever with autoreverse
    private func startAnimation() {
        // Only animate if we're in a window
        guard window != nil else {
            PictureInPictureLogger.log("ReconnectionView: startAnimation called but not in window yet")
            return
        }

        PictureInPictureLogger.log("ReconnectionView: starting dot animation with CABasicAnimation")

        // Stop any existing animations first
        stopAnimation()

        // Use CABasicAnimation for better compatibility with PiP
        // Matches upstream: easeOut, easeInOut, easeIn timing functions
        let timingFunctions: [CAMediaTimingFunction] = [
            CAMediaTimingFunction(name: .easeOut),
            CAMediaTimingFunction(name: .easeInEaseOut),
            CAMediaTimingFunction(name: .easeIn)
        ]

        for (index, dot) in dots.enumerated() {
            let animation = CABasicAnimation(keyPath: "opacity")
            animation.fromValue = 0.0
            animation.toValue = 1.0
            animation.duration = 1.0
            animation.beginTime = CACurrentMediaTime() + 0.2  // 0.2s delay
            animation.timingFunction = timingFunctions[index]
            animation.autoreverses = true
            animation.repeatCount = .infinity
            animation.fillMode = .forwards
            animation.isRemovedOnCompletion = false

            dot.layer.add(animation, forKey: "pulseAnimation")
            dot.alpha = 0  // Set initial state
        }
    }

    private func stopAnimation() {
        dots.forEach { dot in
            dot.layer.removeAllAnimations()
            dot.alpha = 0
        }
    }
}
