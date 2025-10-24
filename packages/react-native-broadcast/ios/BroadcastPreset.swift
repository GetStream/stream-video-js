//
//  BroadcastPreset.swift
//
//  Created by Oliver Lazoroski on 23.10.25.
//

@objcMembers
public class BroadcastPreset: NSObject {
    var width: Int = 720
    var height: Int = 1280
    var frameRate: Double = 30
    var videoBitrate: Int = 3_000_000
    var audioBitrate: Int = 128_000

    override init() { super.init() }

    @objc public init(
        width: Int,
        height: Int,
        frameRate: Double,
        videoBitrate: Int,
        audioBitrate: Int
    ) {
        self.width = width
        self.height = height
        self.frameRate = frameRate
        self.videoBitrate = videoBitrate
        self.audioBitrate = audioBitrate
        super.init()
    }
}
