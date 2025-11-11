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

    // Reusable buffers
    private var backgroundBitmap: Bitmap? = null
    private var currentWidth = 0
    private var currentHeight = 0

    override fun applyFilter(videoFrameBitmap: Bitmap) {

        // Check if buffers need recreation
        if (currentWidth != videoFrameBitmap.width || currentHeight != videoFrameBitmap.height) {
            recreateBuffers(videoFrameBitmap.width, videoFrameBitmap.height)
        }

        val bgBitmap = backgroundBitmap ?: return
        // Apply segmentation
        val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
        val task = segmenter.process(mlImage)

        try {
            segmentationMask = Tasks.await(task, 50, TimeUnit.MILLISECONDS)
        } catch (e: TimeoutException) {
            // Keep using previous mask
        }

        val mask = segmentationMask ?: return

        // Copy the background segment to a new bitmap - backgroundBitmap
        copySegment(
            segment = Segment.BACKGROUND,
            source = videoFrameBitmap,
            destination = bgBitmap,
            segmentationMask = mask,
            confidenceThreshold = foregroundThreshold,
        )

        // Blur the background bitmap
        val blurredBackgroundBitmap = Toolkit.blur(bgBitmap, blurIntensity.radius)

        // Draw the blurred background bitmap on the original bitmap
        val canvas = Canvas(videoFrameBitmap)
        val matrix = newSegmentationMaskMatrix(videoFrameBitmap, mask)
        canvas.drawBitmap(blurredBackgroundBitmap, matrix, null)
    }

    private fun recreateBuffers(width: Int, height: Int) {
        backgroundBitmap?.recycle()
        backgroundBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        currentWidth = width
        currentHeight = height
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
