#if canImport(MLCompute)
    import MLCompute
    let neuralEngineExists = {
        if #available(iOS 15.0, *) {
            return MLCDevice.ane() != nil
        } else {
            return false
        }
    }()
#else
    let neuralEngineExists = false
#endif
