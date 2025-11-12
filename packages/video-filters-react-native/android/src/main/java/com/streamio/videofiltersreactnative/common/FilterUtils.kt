package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Matrix
import com.google.mlkit.vision.segmentation.SegmentationMask

/**
 * Copies pixels that belong to the requested [segment] from the [source] bitmap into the supplied
 * [destination] bitmap using the provided [segmentationMask].
 *
 * Steps performed:
 * 1. Reset the mask's underlying buffer so we can iterate over every confidence value exactly once.
 * 2. Materialize both the source and destination pixel arrays to work with raw integers.
 * 3. Iterate over every position in the segmentation mask, check the confidence value against the
 *    [confidenceThreshold], and copy pixels that belong to the requested [segment].
 * 4. Write the mutated pixel array back into the [destination] bitmap.
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
) {
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
    // We use a line buffer here to optimize reads from the FloatBuffer.
    val lineBuffer = FloatArray(segmentationMask.width)
    for (y in 0 until segmentationMask.height) {
        maskProbabilities.get(lineBuffer)
        for ((x, confidence) in lineBuffer.withIndex()) {
            if (((segment == Segment.BACKGROUND) && confidence < confidenceThreshold) ||
                ((segment == Segment.FOREGROUND) && confidence >= confidenceThreshold)
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
 *
 */
internal fun colouredSegment(
    segment: Segment,
    destination: Bitmap,
    segmentationMask: SegmentationMask,
    confidenceThreshold: Double,
    destinationPixels: IntArray,
) {
    // 1. Ensure subsequent reads traverse the mask from the beginning.
    // Get foreground probabilities for each pixel. Since ML Kit returns this
    // in a byte buffer with each 4 bytes representing a float, convert it to
    // a FloatBuffer for easier use.
    val maskProbabilities = segmentationMask.buffer.asFloatBuffer()
    maskProbabilities.rewind()

    // Pre-fill with transparent pixels (0)
    destinationPixels.fill(0)

    val colorValue = 0xFF000000.toInt() // Opaque black instead of 1

    // 2. Walk every mask pixel, evaluate whether it belongs to the requested segment,
    //    and copy across the corresponding source pixel when it does.
    // We use a line buffer here to optimize reads from the FloatBuffer.
    val lineBuffer = FloatArray(segmentationMask.width)

    // Determine if we're looking for foreground or background
    val isForeground = segment == Segment.FOREGROUND

    var index = 0
    for (y in 0 until segmentationMask.height) {
        maskProbabilities.get(lineBuffer)
        for (confidence in lineBuffer) {
            // Only write non-zero values
            if ((isForeground && confidence >= confidenceThreshold) ||
                (!isForeground && confidence < confidenceThreshold)
            ) {
                destinationPixels[index] = colorValue
            }
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
