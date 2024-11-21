package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.net.Uri
import android.util.Log
import androidx.annotation.Keep
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.google.android.gms.tasks.Tasks
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
import java.io.IOException
import java.net.URL

/**
 * original source: https://github.com/GetStream/stream-video-android/blob/develop/stream-video-android-filters-video/src/main/kotlin/io/getstream/video/android/filters/video/VirtualBackgroundVideoFilter.kt
 *
 * Applies a virtual background (custom image) to a video call.
 *
 * @param backgroundImageUrlString The image url of the custom background image.
 * @param foregroundThreshold The confidence threshold for the foreground. Pixels with a confidence value greater than or equal to this threshold are considered to be in the foreground. Value is coerced between 0 and 1, inclusive.
 */
class VirtualBackgroundFactory(
  private val reactContext: ReactApplicationContext,
  private val backgroundImageUrlString: String,
  private val foregroundThreshold: Double = DEFAULT_FOREGROUND_THRESHOLD,
) : VideoFrameProcessorFactoryInterface {

  override fun build(): VideoFrameProcessor {
    return VideoFrameProcessorWithBitmapFilter {
      VirtualBackgroundVideoFilter(reactContext, backgroundImageUrlString, foregroundThreshold)
    }
  }

  companion object {
    private const val TAG = "VirtualBackgroundFactory"
  }
}

/**
 * Applies a virtual background (custom image) to a video call.
 *
 * @param backgroundImageUrlString The image url of the custom background image.
 * @param foregroundThreshold The confidence threshold for the foreground. Pixels with a confidence value greater than or equal to this threshold are considered to be in the foreground. Value is coerced between 0 and 1, inclusive.
 */
@Keep
private class VirtualBackgroundVideoFilter(
  reactContext: ReactApplicationContext,
  backgroundImageUrlString: String,
  foregroundThreshold: Double = DEFAULT_FOREGROUND_THRESHOLD,
) : BitmapVideoFilter() {
  private val options =
    SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
      .enableRawSizeMask()
      .build()
  private val segmenter = Segmentation.getClient(options)
  private lateinit var segmentationMask: SegmentationMask
  private lateinit var segmentationMatrix: Matrix

  private var foregroundThreshold: Double = foregroundThreshold.coerceIn(0.0, 1.0)
  private val foregroundBitmap by lazy {
    Bitmap.createBitmap(
      segmentationMask.width,
      segmentationMask.height,
      Bitmap.Config.ARGB_8888,
    )
  }

  private val virtualBackgroundBitmap by lazy {
    Log.d(TAG, "getBitmapFromUrl - $backgroundImageUrlString")
    try {
      val uri = Uri.parse(backgroundImageUrlString)
      if (uri.scheme == null) { // this is a local image
        val drawableId = ResourceDrawableIdHelper.getInstance()
          .getResourceDrawableId(reactContext, backgroundImageUrlString)
        BitmapFactory.decodeResource(reactContext.resources, drawableId)
      } else {
        val url = URL(backgroundImageUrlString)
        BitmapFactory.decodeStream(url.openConnection().getInputStream())
      }
    } catch (e: IOException) {
      Log.e(TAG, "cant get bitmap for image url: $backgroundImageUrlString", e)
      null
    }
  }

  private val foregroundPaint by lazy {
    Paint().apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_OUT) }
  }
  private var scaledVirtualBackgroundBitmap: Bitmap? = null
  private var scaledVirtualBackgroundBitmapCopy: Bitmap? = null

  private var latestFrameWidth: Int? = null
  private var latestFrameHeight: Int? = null

  override fun applyFilter(videoFrameBitmap: Bitmap) {
    // Apply segmentation
    val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
    val task = segmenter.process(mlImage)
    segmentationMask = Tasks.await(task)

    // Copy the foreground segment (the person) to a new bitmap - foregroundBitmap
    copySegment(
      segment = Segment.FOREGROUND,
      source = videoFrameBitmap,
      destination = foregroundBitmap,
      segmentationMask = segmentationMask,
      confidenceThreshold = foregroundThreshold,
    )

    virtualBackgroundBitmap?.let { virtualBackgroundBitmap ->
      val videoFrameCanvas = Canvas(videoFrameBitmap)

      // Scale the virtual background bitmap to the height of the video frame, if needed
      if (scaledVirtualBackgroundBitmap == null ||
        videoFrameCanvas.width != latestFrameWidth ||
        videoFrameCanvas.height != latestFrameHeight
      ) {
        scaledVirtualBackgroundBitmap = scaleVirtualBackgroundBitmap(
          bitmap = virtualBackgroundBitmap,
          targetHeight = videoFrameCanvas.height,
        )
        // Make a copy of the scaled virtual background bitmap. Used when processing each frame.
        scaledVirtualBackgroundBitmapCopy = scaledVirtualBackgroundBitmap!!.copy(
          /* config = */
            scaledVirtualBackgroundBitmap!!.config!!,
          /* isMutable = */
          true,
        )

        latestFrameWidth = videoFrameBitmap.width
        latestFrameHeight = videoFrameBitmap.height

        segmentationMatrix = newSegmentationMaskMatrix(videoFrameBitmap, segmentationMask)
      }

      // Restore the virtual background after cutting-out the person in the previous frame
      val backgroundCanvas = Canvas(scaledVirtualBackgroundBitmapCopy!!)
      backgroundCanvas.drawBitmap(scaledVirtualBackgroundBitmap!!, 0f, 0f, null)

      // Cut out the person from the virtual background
      backgroundCanvas.drawBitmap(foregroundBitmap, segmentationMatrix, foregroundPaint)

      // Draw the virtual background (with the cutout) on the video frame bitmap
      videoFrameCanvas.drawBitmap(scaledVirtualBackgroundBitmapCopy!!, 0f, 0f, null)
    }
  }

  private fun scaleVirtualBackgroundBitmap(bitmap: Bitmap, targetHeight: Int): Bitmap {
    val scale = targetHeight.toFloat() / bitmap.height
    return ensureAlpha(
      Bitmap.createScaledBitmap(
        /* src = */
        bitmap,
        /* dstWidth = */
        (bitmap.width * scale).toInt(),
        /* dstHeight = */
        targetHeight,
        /* filter = */
        true,
      ),
    )
  }

  private fun ensureAlpha(original: Bitmap): Bitmap {
    return if (original.hasAlpha()) {
      original
    } else {
      val bitmapWithAlpha = Bitmap.createBitmap(
        original.width,
        original.height,
        Bitmap.Config.ARGB_8888,
      )
      val canvas = Canvas(bitmapWithAlpha)
      canvas.drawBitmap(original, 0f, 0f, null)
      bitmapWithAlpha
    }
  }

  companion object {
    private const val TAG = "VirtualBackgroundVideoFilter"
  }
}

private const val DEFAULT_FOREGROUND_THRESHOLD: Double =
  0.7 // 1 is max confidence that pixel is in the foreground
