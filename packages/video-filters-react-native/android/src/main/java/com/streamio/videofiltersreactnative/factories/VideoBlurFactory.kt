package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.Canvas
import com.google.android.gms.tasks.Tasks
import com.google.android.renderscript.Toolkit
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.SegmentationMask
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.Segment
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter
import com.streamio.videofiltersreactnative.common.copySegment
import com.streamio.videofiltersreactnative.common.newSegmentationMaskMatrix


/**
 * Applies a blur effect to the entire video of a video call.
 *
 * @param blurIntensity The intensity of the blur effect. See [VideoBlurIntensity] for options. Defaults to [BlurIntensity.MEDIUM].
 */
class VideoBlurFactory(
  private val blurIntensity: VideoBlurIntensity = VideoBlurIntensity.MEDIUM
) : VideoFrameProcessorFactoryInterface {
  override fun build(): VideoFrameProcessor {
    return VideoFrameProcessorWithBitmapFilter {
      BlurredVideoFilter(blurIntensity)
    }
  }
}

private class BlurredVideoFilter(
  private val blurIntensity: VideoBlurIntensity
) : BitmapVideoFilter() {

  override fun applyFilter(videoFrameBitmap: Bitmap) {
    val blurred = Toolkit.blur(videoFrameBitmap, blurIntensity.radius)
    val canvas = Canvas(videoFrameBitmap)
    // Draw the blurred bitmap at the top-left corner (0f, 0f) of the original bitmap.
    // 0f, 0f: x and y coordinates (top-left corner)
    // null: use default Paint (no special effects)
    canvas.drawBitmap(blurred, 0f, 0f, null)
  }
}

/**
 * The intensity of the background blur effect. Used in [BlurredBackgroundVideoFilter].
 * Range is 1 to 25
 */
enum class VideoBlurIntensity(val radius: Int) {
  LIGHT(8),
  MEDIUM(17),
  HEAVY(25),
}