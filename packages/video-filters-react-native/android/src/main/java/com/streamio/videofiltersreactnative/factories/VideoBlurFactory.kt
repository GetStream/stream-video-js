package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import androidx.annotation.RequiresApi
import com.google.android.renderscript.Toolkit
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.GpuBlurHelper
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter

/**
 * Applies a blur effect to the entire video of a video call.
 * Uses GPU acceleration via RenderEffect on Android 12+ (API 31+), otherwise falls back to CPU.
 *
 * @param blurIntensity The intensity of the blur effect. See [VideoBlurIntensity] for options. Defaults to [VideoBlurIntensity.MEDIUM].
 */
class VideoBlurFactory(
    private val blurIntensity: VideoBlurIntensity = VideoBlurIntensity.MEDIUM,
) : VideoFrameProcessorFactoryInterface {
    override fun build(): VideoFrameProcessor {
        return VideoFrameProcessorWithBitmapFilter {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                GpuBlurredVideoFilter(blurIntensity)
            } else {
                CpuBlurredVideoFilter(blurIntensity)
            }
        }
    }
}

// Base implementation with shared drawing logic
private abstract class BlurredVideoFilter : BitmapVideoFilter() {

    protected abstract fun blurBitmap(bitmap: Bitmap): Bitmap

    override fun applyFilter(videoFrameBitmap: Bitmap) {
        // Apply blur (CPU or GPU depending on implementation)
        val blurred = blurBitmap(videoFrameBitmap)
        
        val canvas = Canvas(videoFrameBitmap)
        // Draw the blurred bitmap at the top-left corner (0f, 0f) of the original bitmap.
        // 0f, 0f: x and y coordinates (top-left corner)
        // null: use default Paint (no special effects)
        canvas.drawBitmap(blurred, 0f, 0f, null)
    }
}

// CPU-based implementation using RenderScript Toolkit
private class CpuBlurredVideoFilter(
    private val blurIntensity: VideoBlurIntensity
) : BlurredVideoFilter() {

    override fun blurBitmap(bitmap: Bitmap): Bitmap {
        return Toolkit.blur(bitmap, blurIntensity.radius)
    }
}

// GPU-accelerated implementation for Android 12+ using RenderEffect
@RequiresApi(Build.VERSION_CODES.S)
private class GpuBlurredVideoFilter(
    private val blurIntensity: VideoBlurIntensity
) : BlurredVideoFilter() {
    
    private val gpuBlurHelper = GpuBlurHelper(blurIntensity.radius.toFloat())

    override fun blurBitmap(bitmap: Bitmap): Bitmap {
        return gpuBlurHelper.applyBlur(bitmap)
    }
}

/**
 * The intensity of the background blur effect. Used in [BlurredBackgroundVideoFilter].
 * Range is 1 to 25
 */
enum class VideoBlurIntensity(val radius: Int) {
    LIGHT(8), MEDIUM(17), HEAVY(25),
}
