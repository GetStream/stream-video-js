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
import com.streamio.videofiltersreactnative.common.colouredSegmentInt
import com.streamio.videofiltersreactnative.common.getScalingFactors
import java.io.IOException
import java.net.URL
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

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
    private var processedSegmentationMask: SegmentationMask? = null
    private var segmentationMatrix: Matrix? = null
    private val isProcessing = AtomicBoolean(false)
    private val isProcessingSync = false

    private var foregroundThreshold: Double = foregroundThreshold.coerceIn(0.0, 1.0)
    private var foregroundBitmap: Bitmap? = null
    private var scaledForegroundBitmap: Bitmap? = null

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
    private var maskArray: IntArray? = null
    private var maskBuffer: ByteBuffer? = null
    private var lineBuffer: FloatArray? = null

    private var latestFrameWidth: Int? = null
    private var latestFrameHeight: Int? = null

    private var latestMaskWidth = 0
    private var latestMaskHeight = 0

    override fun applyFilter(videoFrameBitmap: Bitmap) {
        val backgroundImageBitmap = virtualBackgroundBitmap ?: return

        val timeBeforeSegment = System.currentTimeMillis()
        Log.d(TAG, "applyFilter thread: ${Thread.currentThread().name}")

        if (!isProcessing.getAndSet(true)) {
            // Apply segmentation
            val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
            segmenter.process(mlImage)
                .addOnSuccessListener { mask ->
                    Log.d(TAG, "Callback thread: ${Thread.currentThread().name}")
                    segmentationMask = mask
                    Log.d(TAG, "Time taken to segment image : ${System.currentTimeMillis() - timeBeforeSegment}")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to segment image", e)
                }
                .addOnCompleteListener {
                    isProcessing.set(false)
                }
        } else {
            Log.d(TAG, "Skipping frame, segmenter busy.")
        }

        val mask = segmentationMask ?: return
        
        // Only create mask bitmap if we have a new mask that hasn't been processed yet
        val createMaskBitmap = mask !== processedSegmentationMask
        if (!createMaskBitmap) {
            Log.d(TAG, "Reusing existing mask bitmap, no need to recreate.")
        }

        createBuffers(videoFrameBitmap, backgroundImageBitmap, mask)

        if (createMaskBitmap) {
            val timeBeforeColouredSegment = System.currentTimeMillis()
            // Color the foreground segment (the person) to a bitmap - foregroundBitmap
            colouredSegmentInt(
                segment = Segment.FOREGROUND,
                destination = foregroundBitmap!!,
                segmentationMask = mask,
                confidenceThreshold = foregroundThreshold,
                maskArray = maskArray!!,
                lineBuffer = lineBuffer!!
            )
            Log.d(TAG, "Time taken to create mask bitmap : ${System.currentTimeMillis() - timeBeforeColouredSegment}")
            val timeBeforeProcess = System.currentTimeMillis()
            val canvas = Canvas(scaledForegroundBitmap!!)
            // Clear the bitmap before drawing (important to avoid artifacts!)
            canvas.drawColor(0, PorterDuff.Mode.CLEAR)
            // scale the masked bitmap to the video frame size
            canvas.drawBitmap(foregroundBitmap!!, segmentationMatrix!!, null)
            Log.d(TAG, "Time taken to for scaledForegroundBitmap: ${System.currentTimeMillis() - timeBeforeProcess}")
            
            // Mark this mask as processed
            processedSegmentationMask = mask
        }
        val timeBeforeProcess = System.currentTimeMillis()
        val canvas = Canvas(videoFrameBitmap)
        val timeBeforeDrawing1 = System.currentTimeMillis()
        // 1. Punch a hole in the video frame so that only the person is left
        canvas.drawBitmap(scaledForegroundBitmap!!,  0f, 0f, foregroundPaint)
        Log.d(TAG, "Time taken to for drawing hole : ${System.currentTimeMillis() - timeBeforeDrawing1}")

        val timeBeforeDrawing2 = System.currentTimeMillis()
        if (scaledVirtualBackgroundBitmap!!.isRecycled) return
        // 2. Draw the virtual background behind the person
        canvas.drawBitmap(scaledVirtualBackgroundBitmap!!, 0f, 0f, backgroundPaint)
        Log.d(TAG, "Time taken to for drawing virtual background: ${System.currentTimeMillis() - timeBeforeDrawing2}")
        Log.d(TAG, "Time taken to process image : ${System.currentTimeMillis() - timeBeforeProcess}" )
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
        if (scaledVirtualBackgroundBitmap == null || scaledForegroundBitmap == null || videoFrameBitmap.width != latestFrameWidth || videoFrameBitmap.height != latestFrameHeight) {
            scaledVirtualBackgroundBitmap?.recycle()
            scaledForegroundBitmap?.recycle()
            scaledVirtualBackgroundBitmap = scaleVirtualBackgroundBitmap(
                bitmap = backgroundImageBitmap,
                targetHeight = videoFrameBitmap.height,
            )
            scaledForegroundBitmap = Bitmap.createBitmap(videoFrameBitmap.width, videoFrameBitmap.height, Bitmap.Config.ARGB_8888)
            latestFrameWidth = videoFrameBitmap.width
            latestFrameHeight = videoFrameBitmap.height
            createScale = true
        }
        if (latestMaskWidth != mask.width || latestMaskHeight != mask.height) {
            latestMaskWidth = mask.width
            latestMaskHeight = mask.height
            foregroundBitmap?.recycle()
            foregroundBitmap =
                Bitmap.createBitmap(latestMaskWidth, latestMaskHeight, Bitmap.Config.ARGB_8888)
            maskBuffer = ByteBuffer.allocateDirect(
                foregroundBitmap!!.allocationByteCount,
            )
            maskArray = IntArray(latestMaskWidth * latestMaskHeight)
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
