//
//  VideoEffectsModule.swift
//  StreamReactNativeVideoSDKSample
//
//  Created by santhosh vaiyapuri on 11/06/2024.
//
@objc(VideoEffectsModule)
class VideoEffectsModule: NSObject {
  
  @objc(registerVideoFilters:withRejecter:)
  func registerVideoFilters(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    ProcessorProvider.addProcessor(GrayScaleVideoFrameProcessor(), forName: "grayscale")
    resolve(true)
  }
  
}
