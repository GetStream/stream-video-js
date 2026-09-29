//
//  FoldRegionObserver.swift
//  StreamReactNativeVideoSDKSample
//
//  Observes the foldable hinge (iOS 27.1+) for the FoldRegion TurboModule.
//  A UIHingeInteraction on the root view delivers hinge changes; the hinge
//  position comes from the "division" reserved region, which is read again
//  when the window scene's geometry changes (rotation, resize). `onChange` is
//  called only when the reported value changes. Use on the main thread.
//
import UIKit

@objc(FoldRegionObserver)
final class FoldRegionObserver: NSObject {
  private let onChange: (NSDictionary) -> Void

  // UIHingeInteraction is iOS 27.1+, so it is stored untyped
  private var hingeInteraction: UIInteraction?
  private weak var observedView: UIView?
  private var geometryObservation: NSKeyValueObservation?
  private var hingeIsPartiallyOpen = false
  // hinge angle in whole degrees, -1 when unknown
  private var hingeAngleDegrees = -1
  private var hingeStatus = "unknown"
  private var lastPayload: NSDictionary?

  @objc init(onChange: @escaping (NSDictionary) -> Void) {
    self.onChange = onChange
    super.init()
  }

  @objc var isStarted: Bool { hingeInteraction != nil }

  @objc func start() {
    guard #available(iOS 27.1, *), hingeInteraction == nil, let view = Self.rootView() else {
      return
    }
    let interaction = UIHingeInteraction { [weak self] _, update in
      guard let self else { return }
      self.hingeIsPartiallyOpen = update.hinge?.status == .partiallyOpen
      self.hingeAngleDegrees = update.hinge.map { Int(($0.angle * 180 / .pi).rounded()) } ?? -1
      self.hingeStatus = Self.describe(update.hinge?.status)
      self.emitIfChanged()
    }
    view.addInteraction(interaction)
    hingeInteraction = interaction
    observedView = view
    // the hinge state does not change on rotation, but the division moves
    geometryObservation = view.window?.windowScene?.observe(\.effectiveGeometry) { [weak self] _, _ in
      // read the division after the layout pass for the new geometry
      DispatchQueue.main.async { [weak self] in
        self?.emitIfChanged()
      }
    }
  }

  @objc func stop() {
    geometryObservation?.invalidate()
    geometryObservation = nil
    if let interaction = hingeInteraction {
      observedView?.removeInteraction(interaction)
    }
    hingeInteraction = nil
    lastPayload = nil
  }

  /// The hinge in window points; `available` is false when there is none.
  @objc func currentDivision() -> NSDictionary {
    guard #available(iOS 27.1, *),
          let view = observedView ?? Self.rootView(),
          let window = view.window,
          let region = view.reservedRegions(kind: .division, options: .includeInactive).first
    else {
      return Self.unavailable
    }
    // a closed hinge has no usable division, even when the region is retained
    if hingeInteraction != nil && hingeStatus == "closed" {
      return Self.unavailable
    }
    let frame = view.convert(region.frame, to: window)
    return [
      "available": true,
      "active": hingeInteraction == nil ? region.isActive : hingeIsPartiallyOpen,
      "x": frame.origin.x,
      "y": frame.origin.y,
      "width": frame.size.width,
      "height": frame.size.height,
      "marginLeft": region.margins.left,
      "marginRight": region.margins.right,
      "angle": hingeAngleDegrees,
      "status": hingeStatus,
    ]
  }

  private func emitIfChanged() {
    let payload = currentDivision()
    if payload == lastPayload { return }
    lastPayload = payload
    onChange(payload)
  }

  private static let unavailable: NSDictionary = [
    "available": false,
    "active": false,
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "marginLeft": 0,
    "marginRight": 0,
    "angle": -1,
    "status": "unknown",
  ]

  @available(iOS 27.1, *)
  private static func describe(_ status: UIHinge.Status?) -> String {
    switch status {
    case .closed: return "closed"
    case .partiallyOpen: return "partiallyOpen"
    case .fullyOpen: return "fullyOpen"
    default: return "unknown"
    }
  }

  private static func rootView() -> UIView? {
    let windowScenes = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .filter { !$0.windows.isEmpty }
    let scene = windowScenes.first { $0.activationState == .foregroundActive } ?? windowScenes.first
    let window = scene?.windows.first(where: { $0.isKeyWindow }) ?? scene?.windows.first
    return window?.rootViewController?.view ?? window
  }
}
