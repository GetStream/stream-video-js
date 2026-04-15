//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import UIKit

/// A view representing a connection quality indicator for Picture-in-Picture.
/// Displays three vertical bars that indicate connection quality levels:
/// - Excellent: All 3 bars green
/// - Good: 2 bars green, 1 bar gray
/// - Poor: 1 bar red, 2 bars gray
/// - Unknown: All bars hidden
/// This aligns with upstream stream-video-swift ConnectionQualityIndicator.
final class PictureInPictureConnectionQualityIndicator: UIView {

    // MARK: - Connection Quality Enum

    /// Connection quality levels matching the stream-video-swift/video-client enum
    enum ConnectionQuality: Int {
        case unspecified = 0  // Unknown
        case poor = 1
        case good = 2
        case excellent = 3
    }

    // MARK: - Properties

    /// The current connection quality level
    var connectionQuality: ConnectionQuality = .unspecified {
        didSet {
            updateIndicator()
        }
    }

    /// Size of the indicator view
    private let indicatorSize: CGFloat = 24

    /// Width of each bar
    private let barWidth: CGFloat = 3

    /// Spacing between bars
    private let barSpacing: CGFloat = 2

    // MARK: - Colors

    private let goodColor = UIColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 1.0) // Green
    private let badColor = UIColor(red: 0.9, green: 0.3, blue: 0.3, alpha: 1.0)  // Red
    private let inactiveColor = UIColor.white.withAlphaComponent(0.5)

    // MARK: - UI Components

    /// Background container with rounded corner
    private lazy var containerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        // Apply rounded corner only to top-left
        view.layer.cornerRadius = 8
        view.layer.maskedCorners = [.layerMinXMinYCorner] // top-left only
        return view
    }()

    /// Stack view containing the three bars
    private lazy var barsStackView: UIStackView = {
        let stack = UIStackView()
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.alignment = .bottom
        stack.spacing = barSpacing
        stack.distribution = .equalSpacing
        return stack
    }()

    /// First (shortest) bar
    private lazy var bar1: UIView = {
        createBar(height: barWidth * 2)
    }()

    /// Second (medium) bar
    private lazy var bar2: UIView = {
        createBar(height: barWidth * 3)
    }()

    /// Third (tallest) bar
    private lazy var bar3: UIView = {
        createBar(height: barWidth * 4)
    }()

    // MARK: - Initialization

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Private Methods

    private func setUp() {
        isUserInteractionEnabled = false
        isHidden = true // Hidden by default (unknown quality)

        addSubview(containerView)
        containerView.addSubview(barsStackView)

        barsStackView.addArrangedSubview(bar1)
        barsStackView.addArrangedSubview(bar2)
        barsStackView.addArrangedSubview(bar3)

        NSLayoutConstraint.activate([
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),
            containerView.widthAnchor.constraint(equalToConstant: indicatorSize),
            containerView.heightAnchor.constraint(equalToConstant: indicatorSize),

            barsStackView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            barsStackView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor)
        ])

        updateIndicator()
    }

    private func createBar(height: CGFloat) -> UIView {
        let bar = UIView()
        bar.translatesAutoresizingMaskIntoConstraints = false
        bar.backgroundColor = inactiveColor
        bar.layer.cornerRadius = 1
        bar.layer.masksToBounds = true

        NSLayoutConstraint.activate([
            bar.widthAnchor.constraint(equalToConstant: barWidth),
            bar.heightAnchor.constraint(equalToConstant: height)
        ])

        return bar
    }

    private func updateIndicator() {
        switch connectionQuality {
        case .excellent:
            isHidden = false
            bar1.backgroundColor = goodColor
            bar2.backgroundColor = goodColor
            bar3.backgroundColor = goodColor
        case .good:
            isHidden = false
            bar1.backgroundColor = goodColor
            bar2.backgroundColor = goodColor
            bar3.backgroundColor = inactiveColor
        case .poor:
            isHidden = false
            bar1.backgroundColor = badColor
            bar2.backgroundColor = inactiveColor
            bar3.backgroundColor = inactiveColor
        case .unspecified:
            isHidden = true
        }
    }
}
