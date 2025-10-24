import AVFoundation
import Foundation
import HaishinKit
import UIKit

@objc(BroadcastVideoView)
public class BroadcastVideoView: UIView {

    private var hkView: MTHKView?
    private var isAttached = false

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        backgroundColor = .black

        // Create HKView for displaying HaishinKit video
        let hkView = MTHKView(frame: bounds)
        hkView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        hkView.videoGravity = .resizeAspectFill
        addSubview(hkView)
        self.hkView = hkView

        print("[BroadcastVideoView] View initialized")

        // Try to attach mixer if available
        tryAttachMixer()
    }

    @objc public var instanceId: String? {
        didSet {
            isAttached = false
            tryAttachMixer()
        }
    }

    private func tryAttachMixer() {
        guard let instanceId = instanceId else {
            // wait for instance id to be set
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                [weak self] in
                self?.tryAttachMixer()
            }
            return
        }
        let state = BroadcastRegistry.shared.state(for: instanceId)
        guard !isAttached, let mixer = state.mixer else {
            // Schedule retry if mixer not ready yet or already attached
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                [weak self] in
                self?.tryAttachMixer()
            }
            return
        }

        Task { @MainActor in
            guard let hkView = self.hkView else { return }
            await mixer.addOutput(hkView)
            self.isAttached = true
            print(
                "[BroadcastVideoView] Mixer attached to view for instanceId=\(instanceId)"
            )
        }
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        hkView?.frame = bounds
    }

    deinit {
        print("[BroadcastVideoView] View deinitialized")
    }
}
