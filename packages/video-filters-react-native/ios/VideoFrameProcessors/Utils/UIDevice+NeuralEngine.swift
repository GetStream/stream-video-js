//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

#if canImport(MLCompute)
import MLCompute
let neuralEngineExists = MLCDevice.ane() != nil
#else
let neuralEngineExists = false
#endif
