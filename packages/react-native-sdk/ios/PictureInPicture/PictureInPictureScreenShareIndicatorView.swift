//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import UIKit

/// A view that displays an indicator when screen sharing is active in Picture-in-Picture mode.
/// Shows a small icon and label in the top corner to indicate screen share content.
final class PictureInPictureScreenShareIndicatorView: UIView {

    // MARK: - Properties

    /// Controls visibility of the indicator based on screen sharing state
    var isScreenSharing: Bool = false {
        didSet {
            isHidden = !isScreenSharing
        }
    }

    // MARK: - UI Components

    private lazy var containerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        view.layer.cornerRadius = 4
        view.clipsToBounds = true
        return view
    }()

    private lazy var iconImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .white

        // Use SF Symbol for screen share icon (available iOS 13+)
        if #available(iOS 13.0, *) {
            let config = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
            imageView.image = UIImage(systemName: "rectangle.on.rectangle", withConfiguration: config)
        }
        return imageView
    }()

    private lazy var label: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = "Screen"
        label.font = .systemFont(ofSize: 9, weight: .medium)
        label.textColor = .white
        return label
    }()

    private lazy var stackView: UIStackView = {
        let stack = UIStackView(arrangedSubviews: [iconImageView, label])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .horizontal
        stack.spacing = 3
        stack.alignment = .center
        return stack
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
        isHidden = true // Hidden by default until screen sharing is active

        addSubview(containerView)
        containerView.addSubview(stackView)

        NSLayoutConstraint.activate([
            // Container positioned in top-left corner with padding
            containerView.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),

            // Stack view inside container with padding
            stackView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 4),
            stackView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -4),
            stackView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 6),
            stackView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -6),

            // Icon size
            iconImageView.widthAnchor.constraint(equalToConstant: 12),
            iconImageView.heightAnchor.constraint(equalToConstant: 12)
        ])
    }
}
