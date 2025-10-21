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

    private func tryAttachMixer() {
        guard !isAttached, let mixer = BroadcastManager.shared.mixer else {
            // Schedule retry if mixer not ready yet
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.tryAttachMixer()
            }
            return
        }

        Task { @MainActor in
            guard let hkView = self.hkView else { return }
//            await hkView.attachStream(mixer)
            await mixer.addOutput(hkView)
            self.isAttached = true
            print("[BroadcastVideoView] Mixer attached to view")
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

