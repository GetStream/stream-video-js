package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorMatrixColorFilter
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
import com.streamio.videofiltersreactnative.common.colouredSegment
import com.streamio.videofiltersreactnative.common.getScalingFactors
import java.io.IOException
import java.net.URL
import java.nio.ByteBuffer

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
            VirtualBackgroundVideoFilter(
                reactContext,
                backgroundImageUrlString,
                foregroundThreshold
            )
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
        SelfieSegmenterOptions.Builder().setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
            .enableRawSizeMask().build()
    private val segmenter = Segmentation.getClient(options)
    private var segmentationMask: SegmentationMask? = null
    private var segmentationMatrix: Matrix? = null

    private var foregroundThreshold: Double = foregroundThreshold.coerceIn(0.0, 1.0)
    private var foregroundBitmap: Bitmap? = null

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
        // destination - video frame
        // source - black mask bitmap of person cutout
        // DST_IN - Keeps the destination pixels that are covered by source pixels.
        Paint().apply {
            xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
            // This matrix copies the alpha channel to all RGBA channels
            // Useful when drawing ALPHA_8 bitmaps
            colorFilter = ColorMatrixColorFilter(
                floatArrayOf(
                    0f, 0f, 0f, 1f, 0f,  // R = A
                    0f, 0f, 0f, 1f, 0f,  // G = A
                    0f, 0f, 0f, 1f, 0f,  // B = A
                    0f, 0f, 0f, 1f, 0f,  // A = A
                ),
            )
        }
    }
    private val backgroundPaint by lazy {
        // destination - video frame
        // source - scaled video background frame
        // DST_OVER - Source pixels are drawn behind the destination pixels
        Paint().apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_OVER) }
    }
    private var scaledVirtualBackgroundBitmap: Bitmap? = null
    private var scaleBetweenSourceAndMask: Pair<Float, Float>? = null
    private var maskBuffer: ByteBuffer? = null
    private var lineBuffer: FloatArray? = null

    private var latestFrameWidth: Int? = null
    private var latestFrameHeight: Int? = null

    private var latestMaskWidth = 0
    private var latestMaskHeight = 0

    override fun applyFilter(videoFrameBitmap: Bitmap) {
        val backgroundImageBitmap = virtualBackgroundBitmap ?: return

        // Apply segmentation
        val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
        val task = segmenter.process(mlImage)
        try {
            segmentationMask = Tasks.await(task, 33, java.util.concurrent.TimeUnit.MILLISECONDS)
        } catch (e: java.util.concurrent.TimeoutException) {
            // Keep using previous mask
        }

        val mask = segmentationMask ?: return

        createBuffers(videoFrameBitmap, backgroundImageBitmap, mask)

        // Color the foreground segment (the person) to a bitmap - foregroundBitmap
        colouredSegment(
            segment = Segment.FOREGROUND,
            destination = foregroundBitmap!!,
            segmentationMask = mask,
            confidenceThreshold = foregroundThreshold,
            maskBuffer = maskBuffer!!,
            lineBuffer = lineBuffer!!
        )

        val canvas = Canvas(videoFrameBitmap)
        // 1. Punch a hole in the video frame so that only the person is left
        canvas.drawBitmap(foregroundBitmap!!, segmentationMatrix!!, foregroundPaint)

        // 2. Draw the virtual background behind the person
        canvas.drawBitmap(scaledVirtualBackgroundBitmap!!, 0f, 0f, backgroundPaint)
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

    private fun createBuffers(
        videoFrameBitmap: Bitmap,
        backgroundImageBitmap: Bitmap,
        mask: SegmentationMask
    ) {
        var createScale = false
        if (scaledVirtualBackgroundBitmap == null || videoFrameBitmap.width != latestFrameWidth || videoFrameBitmap.height != latestFrameHeight) {
            scaledVirtualBackgroundBitmap?.recycle()
            scaledVirtualBackgroundBitmap = scaleVirtualBackgroundBitmap(
                bitmap = backgroundImageBitmap,
                targetHeight = videoFrameBitmap.height,
            )

            latestFrameWidth = videoFrameBitmap.width
            latestFrameHeight = videoFrameBitmap.height
            createScale = true
        }
        if (latestMaskWidth != mask.width || latestMaskHeight != mask.height) {
            latestMaskWidth = mask.width
            latestMaskHeight = mask.height
            foregroundBitmap?.recycle()
            foregroundBitmap =
                Bitmap.createBitmap(latestMaskWidth, latestMaskHeight, Bitmap.Config.ALPHA_8)
            maskBuffer = ByteBuffer.allocateDirect(
                foregroundBitmap!!.allocationByteCount,
            )
            lineBuffer = FloatArray(latestMaskWidth)
            createScale = true
        }

        if (createScale || scaleBetweenSourceAndMask == null) {
            scaleBetweenSourceAndMask = getScalingFactors(
                widths = Pair(videoFrameBitmap.width, mask.width),
                heights = Pair(videoFrameBitmap.height, mask.height),
            )

            segmentationMatrix = Matrix().apply {
                preScale(
                    scaleBetweenSourceAndMask!!.first,
                    scaleBetweenSourceAndMask!!.second
                )
            }
        }
    }

    companion object {
        private const val TAG = "VirtualBackgroundVideoFilter"
    }
}

private const val DEFAULT_FOREGROUND_THRESHOLD: Double =
    0.8 // 1 is max confidence that pixel is in the foreground
