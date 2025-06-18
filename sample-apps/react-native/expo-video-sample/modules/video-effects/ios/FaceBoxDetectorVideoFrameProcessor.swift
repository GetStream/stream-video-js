//
//  FaceBoxDetectorVideoFrameProcessor.swift
//
//  Created by santhosh vaiyapuri on 06/06/2025.
//

import Foundation

final class FaceBoxDetectorVideoFrameProcessor: VideoFilter {
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

