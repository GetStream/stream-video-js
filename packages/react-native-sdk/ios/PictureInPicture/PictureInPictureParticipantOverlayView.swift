//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import UIKit

/// A view that displays participant information overlay in Picture-in-Picture mode.
/// Shows participant name, pin indicator, sound indicator, and video paused indicator
/// at the bottom-left of the PiP window.
/// This aligns with upstream stream-video-swift ParticipantInfoView.
final class PictureInPictureParticipantOverlayView: UIView {

    // MARK: - Properties

    /// The participant's name to display
    var participantName: String? {
        didSet {
            nameLabel.text = participantName
            updateVisibility()
        }
    }

    /// Whether the participant is pinned
    var isPinned: Bool = false {
        didSet {
            pinIconView.isHidden = !isPinned
        }
    }

    /// Whether the participant has audio enabled (not muted)
    var hasAudio: Bool = true {
        didSet {
            updateSoundIndicator()
        }
    }

    /// Whether the video track is paused/disabled
    var isTrackPaused: Bool = false {
        didSet {
            updateVideoPausedIndicator()
        }
    }

    /// Controls whether the overlay is shown
    var isOverlayEnabled: Bool = true {
        didSet {
            updateVisibility()
        }
    }

    // MARK: - UI Components

    /// Container for the bottom info bar with gradient background
    private lazy var containerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// Gradient layer for the bottom fade effect
    private lazy var gradientLayer: CAGradientLayer = {
        let layer = CAGradientLayer()
        layer.colors = [
            UIColor.clear.cgColor,
            UIColor.black.withAlphaComponent(0.6).cgColor
        ]
        layer.locations = [0.0, 1.0]
        return layer
    }()

    /// Container for the content (name + indicators)
    private lazy var contentStackView: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.spacing = 4
        stack.alignment = .center
        return stack
    }()

    /// Pin indicator icon (shown when participant is pinned)
    private lazy var pinIconView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .white

        // Use SF Symbol for pin
        let config = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        imageView.image = UIImage(systemName: "pin.fill", withConfiguration: config)
        imageView.isHidden = true // Hidden by default
        imageView.setContentHuggingPriority(.required, for: .horizontal)
        imageView.setContentCompressionResistancePriority(.required, for: .horizontal)
        return imageView
    }()

    /// Label showing participant name
    private lazy var nameLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 11, weight: .medium)
        label.textColor = .white
        label.lineBreakMode = .byTruncatingTail
        label.setContentHuggingPriority(.defaultLow, for: .horizontal)
        label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        return label
    }()

    /// Video paused indicator icon (wifi.slash when track is paused)
    private lazy var videoPausedIconView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .white

        // Use SF Symbol for video paused (wifi.slash as in upstream)
        let config = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        imageView.image = UIImage(systemName: "wifi.slash", withConfiguration: config)
        imageView.isHidden = true // Hidden by default
        imageView.setContentHuggingPriority(.required, for: .horizontal)
        imageView.setContentCompressionResistancePriority(.required, for: .horizontal)
        return imageView
    }()

    /// Sound indicator icon (microphone on/off)
    private lazy var soundIndicatorView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .white
        imageView.setContentHuggingPriority(.required, for: .horizontal)
        imageView.setContentCompressionResistancePriority(.required, for: .horizontal)
        return imageView
    }()

    // MARK: - Initialization

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // Update gradient frame when view bounds change
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        gradientLayer.frame = containerView.bounds
        CATransaction.commit()
    }

    // MARK: - Private Methods

    private func setUp() {
        isUserInteractionEnabled = false
        isHidden = true // Hidden by default until participant info is set

        addSubview(containerView)
        containerView.layer.insertSublayer(gradientLayer, at: 0)
        containerView.addSubview(contentStackView)

        contentStackView.addArrangedSubview(pinIconView)
        contentStackView.addArrangedSubview(nameLabel)
        contentStackView.addArrangedSubview(videoPausedIconView)
        contentStackView.addArrangedSubview(soundIndicatorView)

        NSLayoutConstraint.activate([
            // Container positioned at the bottom
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),
            containerView.heightAnchor.constraint(equalToConstant: 28),

            // Content stack with padding
            contentStackView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 8),
            contentStackView.trailingAnchor.constraint(lessThanOrEqualTo: containerView.trailingAnchor, constant: -8),
            contentStackView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -6),

            // Icon sizes
            pinIconView.widthAnchor.constraint(equalToConstant: 12),
            pinIconView.heightAnchor.constraint(equalToConstant: 12),
            videoPausedIconView.widthAnchor.constraint(equalToConstant: 12),
            videoPausedIconView.heightAnchor.constraint(equalToConstant: 12),
            soundIndicatorView.widthAnchor.constraint(equalToConstant: 12),
            soundIndicatorView.heightAnchor.constraint(equalToConstant: 12)
        ])

        // Initialize indicators
        updateSoundIndicator()
        updateVideoPausedIndicator()
    }

    private func updateVisibility() {
        // Show overlay only if enabled and we have a participant name
        let hasName = participantName != nil && !(participantName?.isEmpty ?? true)
        isHidden = !isOverlayEnabled || !hasName
    }

    private func updateSoundIndicator() {
        let config = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        if hasAudio {
            soundIndicatorView.image = UIImage(systemName: "mic.fill", withConfiguration: config)
            soundIndicatorView.tintColor = .white
        } else {
            soundIndicatorView.image = UIImage(systemName: "mic.slash.fill", withConfiguration: config)
            soundIndicatorView.tintColor = UIColor(white: 0.7, alpha: 1.0) // Slightly dimmed when muted
        }
    }

    private func updateVideoPausedIndicator() {
        videoPausedIconView.isHidden = !isTrackPaused
    }
}
