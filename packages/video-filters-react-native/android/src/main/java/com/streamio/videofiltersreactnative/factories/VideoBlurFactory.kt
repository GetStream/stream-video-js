package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.google.android.renderscript.Toolkit
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.GpuBlurHelper
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter
import com.streamio.videofiltersreactnative.common.isGpuBlurSupported

private const val TAG = "VideoBlurFactory"

/**
 * Applies a blur effect to the entire video of a video call.
 * Uses GPU acceleration via RenderEffect on Android 12+ with hardware acceleration, otherwise falls back to CPU.
 *
 * @param blurIntensity The intensity of the blur effect. See [VideoBlurIntensity] for options. Defaults to [VideoBlurIntensity.MEDIUM].
 */
class VideoBlurFactory(
  private val blurIntensity: VideoBlurIntensity = VideoBlurIntensity.MEDIUM,
) : VideoFrameProcessorFactoryInterface {
  override fun build(): VideoFrameProcessor {
    Log.i(
      TAG,
      "Building VideoBlurFilter - Android SDK: ${Build.VERSION.SDK_INT}, Blur intensity: $blurIntensity"
    )

    return VideoFrameProcessorWithBitmapFilter {
      // Use GPU blur if Android 12+ AND hardware acceleration is available
      val useGpu = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && isGpuBlurSupported()

      if (useGpu) {
        Log.i(TAG, "Using GPU-accelerated video blur (GpuBlurredVideoFilter)")
        GpuBlurredVideoFilter(blurIntensity)
      } else {
        Log.i(TAG, "Using CPU-based video blur (CpuBlurredVideoFilter)")
        CpuBlurredVideoFilter(blurIntensity)
      }
    }
  }
}

// Base implementation with shared drawing logic
private abstract class BlurredVideoFilter : BitmapVideoFilter() {
  abstract override fun applyFilter(videoFrameBitmap: Bitmap)
}

// CPU-based implementation using RenderScript Toolkit
private class CpuBlurredVideoFilter(
  private val blurIntensity: VideoBlurIntensity
) : BlurredVideoFilter() {

  init {
    Log.d(TAG, "CpuBlurredVideoFilter initialized with radius: ${blurIntensity.radius}")
  }

  override fun applyFilter(videoFrameBitmap: Bitmap) {
    Log.d(TAG, "Applying CPU blur to bitmap ${videoFrameBitmap.width}x${videoFrameBitmap.height}")
    val blurred = Toolkit.blur(videoFrameBitmap, blurIntensity.radius)
    val canvas = Canvas(videoFrameBitmap)
    canvas.drawBitmap(blurred, 0f, 0f, null)
  }
}

// GPU-accelerated implementation for Android 12+ using RenderEffect
@RequiresApi(Build.VERSION_CODES.S)
private class GpuBlurredVideoFilter(
  private val blurIntensity: VideoBlurIntensity
) : BlurredVideoFilter() {

  private val gpuBlurHelper = GpuBlurHelper(blurIntensity.radius.toFloat())

  init {
    Log.d(TAG, "GpuBlurredVideoFilter initialized")
  }

  override fun applyFilter(videoFrameBitmap: Bitmap) {
    var gpuSuccess = false
    try {
      val canvas = Canvas(videoFrameBitmap)
      gpuSuccess = gpuBlurHelper.applyBlurAndDraw(videoFrameBitmap, canvas)
    } catch (e: Exception) {
      Log.w(
        TAG,
        "GPU blur failed, falling back to CPU: ${e.javaClass.simpleName} - ${e.message}"
      )
    }

    if (!gpuSuccess) {
      Log.w(TAG, "GPU blur was not successful, falling back to CPU for this frame.")
      val blurred = Toolkit.blur(videoFrameBitmap, blurIntensity.radius)
      val canvas = Canvas(videoFrameBitmap)
      canvas.drawBitmap(blurred, 0f, 0f, null)
    }
  }

//  override fun release() {
//    gpuBlurHelper.close()
//  }
}

/**
 * The intensity of the background blur effect. Used in [BlurredBackgroundVideoFilter].
 * Range is 1 to 25
 */
enum class VideoBlurIntensity(val radius: Int) {
  LIGHT(8), MEDIUM(17), HEAVY(25),
}
