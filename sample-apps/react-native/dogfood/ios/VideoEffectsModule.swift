//
//  VideoEffectsModule.swift
//  StreamReactNativeVideoSDKSample
//
//  Created by santhosh vaiyapuri on 11/06/2024.
//
import Foundation

@objcMembers public class VideoEffectsModuleImpl: NSObject {
  public func registerVideoFilters() {
    ProcessorProvider.addProcessor(GrayScaleVideoFrameProcessor(), forName: "grayscale")
  }
}
