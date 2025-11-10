package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.os.Build
import androidx.annotation.RequiresApi
import com.google.android.gms.tasks.Tasks
import com.google.android.renderscript.Toolkit
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.SegmentationMask
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.GpuBlurHelper
import com.streamio.videofiltersreactnative.common.Segment
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter
import com.streamio.videofiltersreactnative.common.copySegment
import com.streamio.videofiltersreactnative.common.isGpuBlurSupported
import com.streamio.videofiltersreactnative.common.newSegmentationMaskMatrix


// Original Sources
// https://github.com/GetStream/stream-video-android/blob/develop/stream-video-android-filters-video/src/main/kotlin/io/getstream/video/android/filters/video/BlurredBackgroundVideoFilter.kt
/**
 * Applies a blur effect to the background of a video call.
 * Uses GPU acceleration via RenderEffect on Android 12+ (API 31+), otherwise falls back to CPU.
 *
 * @param blurIntensity The intensity of the blur effect. See [BlurIntensity] for options. Defaults to [BlurIntensity.MEDIUM].
 * @param foregroundThreshold The confidence threshold for the foreground. Pixels with a confidence value greater than or equal to this threshold are considered to be in the foreground. Value is coerced between 0 and 1, inclusive.
 */
class BackgroundBlurFactory(
  private val blurIntensity: BlurIntensity = BlurIntensity.MEDIUM,
  private val foregroundThreshold: Double = DEFAULT_FOREGROUND_THRESHOLD
) : VideoFrameProcessorFactoryInterface {
  override fun build(): VideoFrameProcessor {
    return VideoFrameProcessorWithBitmapFilter {
          BlurredBackgroundVideoFilter(blurIntensity, foregroundThreshold)
   }
  }
}

// Base implementation with shared segmentation logic
private class BlurredBackgroundVideoFilter(
   val blurIntensity: BlurIntensity,
  foregroundThreshold: Double,
) : BitmapVideoFilter() {
  private val options =
    SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
      .enableRawSizeMask()
      .build()
  private val segmenter = Segmentation.getClient(options)
  private lateinit var segmentationMask: SegmentationMask
  private var foregroundThreshold: Double = foregroundThreshold.coerceIn(0.0, 1.0)
  private val backgroundBitmap by lazy {
    Bitmap.createBitmap(
      segmentationMask.width,
      segmentationMask.height,
      Bitmap.Config.ARGB_8888,
    )
  }

    private val gpuBlurHelper by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && isGpuBlurSupported()) {
            GpuBlurHelper(blurIntensity.radius.toFloat())
        } else {
            null
        }
    }

  override fun applyFilter(videoFrameBitmap: Bitmap) {
    // Apply segmentation
    val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
    val task = segmenter.process(mlImage)
    segmentationMask = Tasks.await(task)

    // Copy the background segment to a new bitmap - backgroundBitmap
    copySegment(
      segment = Segment.BACKGROUND,
      source = videoFrameBitmap,
      destination = backgroundBitmap,
      segmentationMask = segmentationMask,
      confidenceThreshold = foregroundThreshold,
    )

    // Blur the background bitmap
    if (gpuBlurHelper != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val canvas = Canvas(videoFrameBitmap)
      val matrix = newSegmentationMaskMatrix(videoFrameBitmap, segmentationMask)
      gpuBlurHelper!!.applyBlurAndDraw(backgroundBitmap, canvas, matrix)
    } else {
      val blurredBackgroundBitmap = Toolkit.blur(backgroundBitmap, blurIntensity.radius)
      val canvas = Canvas(videoFrameBitmap)
      val matrix = newSegmentationMaskMatrix(videoFrameBitmap, segmentationMask)
      // Draw the blurred background bitmap on the original bitmap
      canvas.drawBitmap(blurredBackgroundBitmap, matrix, null)
    }
  }
}

//// CPU-based implementation using RenderScript Toolkit
//private class CpuBlurredBackgroundVideoFilter(
//  private val blurIntensity: BlurIntensity,
//  foregroundThreshold: Double,
//) : BlurredBackgroundVideoFilter(foregroundThreshold) {
//
//  override fun blurBitmap(bitmap: Bitmap): Bitmap {
//    return Toolkit.blur(bitmap, blurIntensity.radius)
//  }
//}
//
//// GPU-accelerated implementation for Android 12+ using RenderEffect
//@RequiresApi(Build.VERSION_CODES.S)
//private class GpuBlurredBackgroundVideoFilter(
//  private val blurIntensity: BlurIntensity,
//  foregroundThreshold: Double,
//) : BlurredBackgroundVideoFilter(foregroundThreshold) {
//
//  private val gpuBlurHelper = GpuBlurHelper(blurIntensity.radius.toFloat())
//
//  override fun blurBitmap(bitmap: Bitmap): Bitmap {
//    return gpuBlurHelper.applyBlur(bitmap)
//  }
//}

/**
 * The intensity of the background blur effect. Used in [BlurredBackgroundVideoFilter].
 * Range is 1 to 25
 */
enum class BlurIntensity(val radius: Int) {
  LIGHT(5),
  MEDIUM(10),
  HEAVY(15),
}

private val DEFAULT_FOREGROUND_THRESHOLD: Double =
  0.999 // 1 is max confidence that pixel is in the foreground
