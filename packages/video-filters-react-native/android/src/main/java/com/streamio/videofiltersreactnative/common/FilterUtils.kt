package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Matrix
import com.google.mlkit.vision.segmentation.SegmentationMask

/**
 * Copies pixels that belong to the requested [segment] from the [source] bitmap into the supplied
 * [destination] bitmap using the provided [segmentationMask].
 *
 */
internal fun copySegment(
    segment: Segment,
    source: Bitmap,
    destination: Bitmap,
    segmentationMask: SegmentationMask,
    confidenceThreshold: Double,
    sourcePixels: IntArray,
    destinationPixels: IntArray,
    scaleBetweenSourceAndMask: Pair<Float, Float>,
    // We use a line buffer here to optimize reads from the FloatBuffer.
    lineBuffer: FloatArray,
) {
    // Determine if we're looking for foreground or background
    val isForeground = segment == Segment.FOREGROUND

    // 1. Ensure subsequent reads traverse the mask from the beginning.
    // Get foreground probabilities for each pixel. Since ML Kit returns this
    // in a byte buffer with each 4 bytes representing a float, convert it to
    // a FloatBuffer for easier use.
    val maskProbabilities = segmentationMask.buffer.asFloatBuffer()
    maskProbabilities.rewind()

    // 2. Read pixel data into arrays so we can mutate it efficiently.
    source.getPixels(sourcePixels, 0, source.width, 0, 0, source.width, source.height)

    // 3. Walk every mask pixel, evaluate whether it belongs to the requested segment,
    //    and copy across the corresponding source pixel when it does.
    for (y in 0 until segmentationMask.height) {
        maskProbabilities.get(lineBuffer)
        for ((x, confidence) in lineBuffer.withIndex()) {
            if ((isForeground && confidence >= confidenceThreshold) ||
                (!isForeground && confidence < confidenceThreshold)
            ) {
                val scaledX = (x * scaleBetweenSourceAndMask.first).toInt()
                val scaledY = (y * scaleBetweenSourceAndMask.second).toInt()
                destinationPixels[y * destination.width + x] =
                    sourcePixels[scaledY * source.width + scaledX]
            } else {
                // set to transparent
                destinationPixels[y * destination.width + x] = 0
            }
        }
    }

    // 4. Push the filtered pixels back into the destination bitmap.
    destination.setPixels(
        destinationPixels,
        0,
        destination.width,
        0,
        0,
        destination.width,
        destination.height,
    )
}

/**
 * Makes the pixels that belong to the requested [segment] to colored (black) and rest as transparent
 */
internal fun colouredSegment(
    segment: Segment,
    destination: Bitmap,
    segmentationMask: SegmentationMask,
    confidenceThreshold: Double,
    destinationPixels: IntArray,
    // We use a line buffer here to optimize reads from the FloatBuffer.
    lineBuffer: FloatArray,
) {
    // Determine if we're looking for foreground or background
    val isForeground = segment == Segment.FOREGROUND

    // 1. Ensure subsequent reads traverse the mask from the beginning.
    // Get foreground probabilities for each pixel. Since ML Kit returns this
    // in a byte buffer with each 4 bytes representing a float, convert it to
    // a FloatBuffer for easier use.
    val maskProbabilities = segmentationMask.buffer.asFloatBuffer()
    maskProbabilities.rewind()

    val colorValue = 0xFF000000.toInt() // Opaque black
    val transparentValue = 0

    // 2. Walk every mask pixel, evaluate whether it belongs to the requested segment,
    //    and copy across the corresponding source pixel when it does.


    var index = 0
    for (y in 0 until segmentationMask.height) {
        maskProbabilities.get(lineBuffer)
        for (confidence in lineBuffer) {
            // Only write non-zero values
            destinationPixels[index] = if (
                (isForeground && confidence >= confidenceThreshold) ||
                (!isForeground && confidence < confidenceThreshold)
            ) colorValue else transparentValue
            index++
        }
    }

    // 4. Push the filtered pixels back into the destination bitmap.
    destination.setPixels(
        destinationPixels,
        0,
        destination.width,
        0,
        0,
        destination.width,
        destination.height,
    )
}

internal enum class Segment {
    FOREGROUND, BACKGROUND
}

/**
 * Computes the ratio between the bitmap dimensions and the segmentation mask dimensions.
 * This allows us to map mask coordinates back to the original bitmap coordinates.
 */
internal fun getScalingFactors(widths: Pair<Int, Int>, heights: Pair<Int, Int>) =
    Pair(widths.first.toFloat() / widths.second, heights.first.toFloat() / heights.second)

/**
 * Creates a transformation matrix that scales the segmentation mask so it can be drawn on top of
 * the original bitmap. If the mask is already at raw size we return an identity matrix.
 */
internal fun newSegmentationMaskMatrix(bitmap: Bitmap, mask: SegmentationMask): Matrix {
    val isRawSizeMaskEnabled = mask.width != bitmap.width || mask.height != bitmap.height
    return if (!isRawSizeMaskEnabled) {
        Matrix()
    } else {
        val scale =
            getScalingFactors(Pair(bitmap.width, mask.width), Pair(bitmap.height, mask.height))
        Matrix().apply { preScale(scale.first, scale.second) }
    }
}
