package com.streamio.videofiltersreactnative.factories

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
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
import com.streamio.videofiltersreactnative.common.getScalingFactors
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException


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
    private var segmentationMask: SegmentationMask? = null
    private var foregroundThreshold: Double = foregroundThreshold.coerceIn(0.0, 1.0)
    private var scaleBetweenSourceAndMask: Pair<Float, Float>? = null
    private var scaleMatrix: Matrix? = null

    // Reusable buffers
    private var backgroundBitmap: Bitmap? = null
    private var currentFrameWidth = 0
    private var currentFrameHeight = 0
    private var currentMaskWidth = 0
    private var currentMaskHeight = 0
    private var lineBuffer: FloatArray? = null
    private var sourcePixels: IntArray? = null
    private var destinationPixels: IntArray? = null


    override fun applyFilter(videoFrameBitmap: Bitmap) {
        // Apply segmentation
        val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
        val task = segmenter.process(mlImage)

        try {
            segmentationMask = Tasks.await(task, 33, TimeUnit.MILLISECONDS)
        } catch (_: TimeoutException) {
            // Keep using previous mask
        }

        val mask = segmentationMask ?: return

        createBuffers(videoFrameBitmap, mask)

        // Copy the background segment to a new bitmap - backgroundBitmap
        copySegment(
            segment = Segment.BACKGROUND,
            source = videoFrameBitmap,
            destination = backgroundBitmap!!,
            segmentationMask = mask,
            confidenceThreshold = foregroundThreshold,
            sourcePixels = sourcePixels!!,
            destinationPixels = destinationPixels!!,
            scaleBetweenSourceAndMask = scaleBetweenSourceAndMask!!,
            lineBuffer = lineBuffer!!
        )

        // Blur the background bitmap
        val blurredBackgroundBitmap = Toolkit.blur(backgroundBitmap!!, blurIntensity.radius)

        // Draw the blurred background bitmap on the original bitmap
        val canvas = Canvas(videoFrameBitmap)
        canvas.drawBitmap(blurredBackgroundBitmap, scaleMatrix!!, null)

        blurredBackgroundBitmap.recycle()
    }

    private fun createBuffers(videoFrameBitmap: Bitmap, mask: SegmentationMask) {
        var createScale = false
        if (currentFrameWidth != videoFrameBitmap.width || currentFrameHeight != videoFrameBitmap.height) {
            currentFrameWidth = videoFrameBitmap.width
            currentFrameHeight = videoFrameBitmap.height
            sourcePixels = IntArray(currentFrameWidth * currentFrameHeight)
            createScale = true
        }
        if (currentMaskWidth != mask.width || currentMaskHeight != mask.height) {
            currentMaskWidth = mask.width
            currentMaskHeight = mask.height
            backgroundBitmap?.recycle()
            backgroundBitmap =
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
            scaleMatrix = Matrix().apply { preScale(scaleBetweenSourceAndMask!!.first, scaleBetweenSourceAndMask!!.second) }
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
    0.999 // 1 is max confidence that pixel is in the foreground
