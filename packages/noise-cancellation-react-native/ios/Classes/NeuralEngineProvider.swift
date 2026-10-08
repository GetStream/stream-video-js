#if canImport(MLCompute)
    import MLCompute
    let neuralEngineExists = MLCDevice.ane() != nil
#else
    let neuralEngineExists = false
#endif
