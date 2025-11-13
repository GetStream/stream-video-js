package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.util.Log
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
import com.streamio.videofiltersreactnative.common.colouredSegmentInt
import com.streamio.videofiltersreactnative.common.getScalingFactors
import java.util.concurrent.atomic.AtomicBoolean


// Original Sources
// https://github.com/GetStream/stream-video-android/blob/develop/stream-video-android-filters-video/src/main/kotlin/io/getstream/video/android/filters/video/BlurredBackgroundVideoFilter.kt
/**
 * Applies a blur effect to the background of a video call.
 *
 * @param blurIntensity The intensity of the blur effect. See [BlurIntensity] for options. Defaults to [BlurIntensity.MEDIUM].
 * @param foregroundThreshold The confidence threshold for the foreground. Pixels with a confidence value greater than or equal to this threshold are considered to be in the foreground. Value is coerced between 0 and 1, inclusive.
 */
class BackgroundBlurFactory(
    private val blurIntensity: BlurIntensity = BlurIntensity.MEDIUM,
    private val foregroundThreshold: Double = DEFAULT_FOREGROUND_THRESHOLD,
) : VideoFrameProcessorFactoryInterface {
    override fun build(): VideoFrameProcessor {
        return VideoFrameProcessorWithBitmapFilter {
            BlurredBackgroundVideoFilter(blurIntensity, foregroundThreshold)
        }
    }
}

private class BlurredBackgroundVideoFilter(
    private val blurIntensity: BlurIntensity,
    foregroundThreshold: Double,
) : BitmapVideoFilter() {
    private val options =
        SelfieSegmenterOptions.Builder().setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
            .enableRawSizeMask().build()
    private val segmenter = Segmentation.getClient(options)

    @Volatile // volatile as its get and set happen in different threads
    private var segmentationMask: SegmentationMask? = null
    private var processedSegmentationMask: SegmentationMask? = null

    // used for throttling, we dont want to send to ML model when there is an ongoing processing
    // atomic as its get and set happen in different threads
    private val isProcessing = AtomicBoolean(false)
    private var foregroundThreshold: Double = foregroundThreshold.coerceIn(0.0, 1.0)
    private var scaleBetweenSourceAndMask: Pair<Float, Float>? = null
    private var scaleBetweenSourceAndMaskMatrix: Matrix? = null

    // bitmap to hold the background values, 1 for background 0 for foreground, raw mask sized
    private var backgroundMaskBitmap: Bitmap? = null

    // bitmap to hold a downscaled version (0.5) of the actual background, to optimise blur step
    private var downScaledBackgroundBitmap: Bitmap? = null

    private val downScaleMatrix by lazy { Matrix().apply { preScale(0.5f, 0.5f) } }
    private val downScalePaint by lazy {
        Paint().apply {
            // apply bilinear filtering by scaling
            isFilterBitmap = true
        }
    }
    private var maskToDownScaledBackgroundScale: Matrix? = null
    private val maskToDownScalePaint by lazy {
        // destination - downscaled background
        // source - black mask bitmap of person cutout
        // DST_IN - Keeps the destination pixels that are covered by source pixels.
        Paint().apply {
            xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
            // smooth the edges
            isAntiAlias = true
        }
    }

    // scale for downscaled blurred background to videoframe size
    private val upScaleMatrix by lazy { Matrix().apply { preScale(2f, 2f) } }

    private var currentFrameWidth = 0
    private var currentFrameHeight = 0
    private var currentMaskWidth = 0
    private var currentMaskHeight = 0
    private var lineBuffer: FloatArray? = null
    private var sourcePixels: IntArray? = null
    private var destinationPixels: IntArray? = null


    override fun applyFilter(videoFrameBitmap: Bitmap) {
        if (!isProcessing.getAndSet(true)) {
            // Apply segmentation
            val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
            segmenter.process(mlImage).addOnSuccessListener { mask ->
                segmentationMask = mask
            }.addOnFailureListener { e ->
                Log.e("VideoFilters", "Failed to segment image", e)
            }.addOnCompleteListener {
                isProcessing.set(false)
            }
        }

        val mask = segmentationMask ?: return

        maybeInit(videoFrameBitmap, mask)

        if (mask !== processedSegmentationMask) {
            colouredSegmentInt(
                segment = Segment.BACKGROUND,
                destination = backgroundMaskBitmap!!,
                segmentationMask = mask,
                confidenceThreshold = foregroundThreshold,
                maskArray = destinationPixels!!,
                lineBuffer = lineBuffer!!
            )
            processedSegmentationMask = mask
        }

        val scaledBackgroundCanvas = Canvas(downScaledBackgroundBitmap!!)
        scaledBackgroundCanvas.drawBitmap(
            videoFrameBitmap, downScaleMatrix, downScalePaint
        )

        scaledBackgroundCanvas.drawBitmap(
            backgroundMaskBitmap!!,
            maskToDownScaledBackgroundScale!!,
            maskToDownScalePaint
        )

        // Blur the background bitmap
        val blurredBackgroundBitmap =
            Toolkit.blur(downScaledBackgroundBitmap!!, blurIntensity.radius)

        // Draw the blurred background bitmap on the original bitmap
        val canvas = Canvas(videoFrameBitmap)
        canvas.drawBitmap(blurredBackgroundBitmap, upScaleMatrix, null)

        blurredBackgroundBitmap.recycle()
    }

    private fun maybeInit(videoFrameBitmap: Bitmap, mask: SegmentationMask) {
        var createScale = false
        if (currentFrameWidth != videoFrameBitmap.width || currentFrameHeight != videoFrameBitmap.height) {
            currentFrameWidth = videoFrameBitmap.width
            currentFrameHeight = videoFrameBitmap.height
            sourcePixels = IntArray(currentFrameWidth * currentFrameHeight)
            downScaledBackgroundBitmap = Bitmap.createBitmap(
                currentFrameWidth / 2, currentFrameHeight / 2, Bitmap.Config.ARGB_8888
            )
            createScale = true
        }
        if (currentMaskWidth != mask.width || currentMaskHeight != mask.height) {
            currentMaskWidth = mask.width
            currentMaskHeight = mask.height
            backgroundMaskBitmap?.recycle()
            backgroundMaskBitmap =
                Bitmap.createBitmap(currentMaskWidth, currentMaskHeight, Bitmap.Config.ARGB_8888)
            destinationPixels = IntArray(currentMaskWidth * currentMaskHeight)
            lineBuffer = FloatArray(currentMaskWidth)
            createScale = true
        }

        if (createScale || scaleBetweenSourceAndMask == null) {
            scaleBetweenSourceAndMask = getScalingFactors(
                widths = Pair(currentFrameWidth, currentMaskWidth),
                heights = Pair(currentFrameHeight, currentMaskHeight),
            )
            scaleBetweenSourceAndMaskMatrix = Matrix().apply {
                preScale(
                    scaleBetweenSourceAndMask!!.first, scaleBetweenSourceAndMask!!.second
                )
            }
            maskToDownScaledBackgroundScale = Matrix().apply {
                preScale(
                    scaleBetweenSourceAndMask!!.first / 2, scaleBetweenSourceAndMask!!.second / 2
                )
            }
        }
    }
}

/**
 * The intensity of the background blur effect. Used in [BlurredBackgroundVideoFilter].
 * Range is 1 to 25
 */
enum class BlurIntensity(val radius: Int) {
    LIGHT(5), MEDIUM(10), HEAVY(15),
}

private const val DEFAULT_FOREGROUND_THRESHOLD: Double =
    0.8 // 1 is max confidence that pixel is in the foreground
