//
//  GrayScaleVideoFrameProcessor.swift
//  StreamReactNativeVideoSDKSample
//
//  Created by santhosh vaiyapuri on 11/06/2024.
//

import Foundation

final class GrayScaleVideoFrameProcessor: VideoFilter {
    @available(*, unavailable)
    override public init(
        filter: @escaping (Input) -> CIImage
    ) { fatalError() }
    
    init() {
        super.init(
            filter: { input in
                let filter = CIFilter(name: "CIPhotoEffectMono")
                filter?.setValue(input.originalImage, forKey: kCIInputImageKey)
                
                let outputImage: CIImage = filter?.outputImage ?? input.originalImage
                return outputImage
            }
        )
    }
}

