//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import UIKit

/// A view that displays an avatar placeholder when video is disabled in PiP mode.
/// Shows either a loaded image from URL, initials, or a default person icon.
final class PictureInPictureAvatarView: UIView {

    // MARK: - Properties

    /// The participant's name, used to generate initials
    var participantName: String? {
        didSet {
            updateInitials()
        }
    }

    /// The URL string for the participant's profile image
    var imageURL: String? {
        didSet {
            loadImage()
        }
    }

    /// Whether video is enabled - when true, the avatar should be hidden
    var isVideoEnabled: Bool = true {
        didSet {
            updateVisibility()
        }
    }

    // MARK: - Private Properties

    private let containerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor(red: 0.12, green: 0.13, blue: 0.15, alpha: 1.0) // Dark background
        return view
    }()

    private let avatarContainerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor(red: 0.0, green: 0.47, blue: 1.0, alpha: 1.0) // Stream blue
        view.clipsToBounds = true
        return view
    }()

    private let initialsLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.textColor = .white
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: 32, weight: .semibold)
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    private let imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.isHidden = true
        return imageView
    }()

    private let placeholderImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .white
        // Use SF Symbol for person icon
        if let personImage = UIImage(systemName: "person.fill") {
            imageView.image = personImage
        }
        imageView.isHidden = true
        return imageView
    }()

    private var currentImageLoadTask: URLSessionDataTask?
    private var avatarSizeConstraints: [NSLayoutConstraint] = []

    // MARK: - Lifecycle

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // Make avatar circular
        avatarContainerView.layer.cornerRadius = avatarContainerView.bounds.width / 2
        updateAvatarSize()
    }

    // MARK: - Private Helpers

    private func setUp() {
        addSubview(containerView)
        containerView.addSubview(avatarContainerView)
        avatarContainerView.addSubview(initialsLabel)
        avatarContainerView.addSubview(imageView)
        avatarContainerView.addSubview(placeholderImageView)

        NSLayoutConstraint.activate([
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.topAnchor.constraint(equalTo: topAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),

            avatarContainerView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            avatarContainerView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),

            initialsLabel.leadingAnchor.constraint(equalTo: avatarContainerView.leadingAnchor, constant: 4),
            initialsLabel.trailingAnchor.constraint(equalTo: avatarContainerView.trailingAnchor, constant: -4),
            initialsLabel.topAnchor.constraint(equalTo: avatarContainerView.topAnchor, constant: 4),
            initialsLabel.bottomAnchor.constraint(equalTo: avatarContainerView.bottomAnchor, constant: -4),

            imageView.leadingAnchor.constraint(equalTo: avatarContainerView.leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: avatarContainerView.trailingAnchor),
            imageView.topAnchor.constraint(equalTo: avatarContainerView.topAnchor),
            imageView.bottomAnchor.constraint(equalTo: avatarContainerView.bottomAnchor),

            placeholderImageView.centerXAnchor.constraint(equalTo: avatarContainerView.centerXAnchor),
            placeholderImageView.centerYAnchor.constraint(equalTo: avatarContainerView.centerYAnchor),
            placeholderImageView.widthAnchor.constraint(equalTo: avatarContainerView.widthAnchor, multiplier: 0.5),
            placeholderImageView.heightAnchor.constraint(equalTo: avatarContainerView.heightAnchor, multiplier: 0.5)
        ])

        updateAvatarSize()
        updateVisibility()
    }

    private func updateAvatarSize() {
        // Remove old constraints
        NSLayoutConstraint.deactivate(avatarSizeConstraints)

        // Avatar size should be about 40% of the smaller dimension
        let minDimension = min(bounds.width, bounds.height)
        let avatarSize = max(minDimension * 0.4, 60) // Minimum 60pt

        avatarSizeConstraints = [
            avatarContainerView.widthAnchor.constraint(equalToConstant: avatarSize),
            avatarContainerView.heightAnchor.constraint(equalToConstant: avatarSize)
        ]
        NSLayoutConstraint.activate(avatarSizeConstraints)
    }

    private func updateVisibility() {
        // Hide avatar when video is enabled
        isHidden = isVideoEnabled
    }

    private func updateInitials() {
        guard let name = participantName, !name.isEmpty else {
            initialsLabel.text = nil
            initialsLabel.isHidden = true
            placeholderImageView.isHidden = imageView.image == nil
            return
        }

        let initials = generateInitials(from: name)
        initialsLabel.text = initials
        initialsLabel.isHidden = imageView.image != nil
        placeholderImageView.isHidden = true
    }

    private func generateInitials(from name: String) -> String {
        let components = name.split(separator: " ")
        if components.count >= 2 {
            let first = components[0].prefix(1)
            let last = components[1].prefix(1)
            return "\(first)\(last)".uppercased()
        } else if let first = components.first {
            return String(first.prefix(2)).uppercased()
        }
        return ""
    }

    private func loadImage() {
        // Cancel any existing task
        currentImageLoadTask?.cancel()
        currentImageLoadTask = nil

        guard let urlString = imageURL, !urlString.isEmpty, let url = URL(string: urlString) else {
            imageView.image = nil
            imageView.isHidden = true
            updateInitials()
            return
        }

        // Load image asynchronously
        let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self, error == nil, let data = data, let image = UIImage(data: data) else {
                DispatchQueue.main.async { [weak self] in
                    self?.imageView.image = nil
                    self?.imageView.isHidden = true
                    self?.updateInitials()
                }
                return
            }

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.imageView.image = image
                self.imageView.isHidden = false
                self.initialsLabel.isHidden = true
                self.placeholderImageView.isHidden = true
            }
        }
        task.resume()
        currentImageLoadTask = task
    }
}
