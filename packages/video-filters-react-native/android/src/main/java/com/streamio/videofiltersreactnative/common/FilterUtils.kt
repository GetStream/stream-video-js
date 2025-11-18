package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Color
import com.google.mlkit.vision.segmentation.SegmentationMask

/**
* Turns the segmentation mask into a bitmap with the specified segment color and transparent for the rest.
* @param segment The segment to color.
* @param destination The bitmap to draw the colored segment onto.
* @param segmentationMask The segmentation mask to use.
* @param confidenceThreshold The confidence threshold to use.
* @param maskArray The array to hold the pixels of our mask. Must be the same size as the destination bitmap.
* @param lineBuffer The array that acts as a line buffer here to optimize reads from the FloatBuffer.
 */
internal fun colouredSegmentInt(
    segment: Segment,
    // ARGB_8888 intended bitmap
    destination: Bitmap,
    segmentationMask: SegmentationMask,
    confidenceThreshold: Double,
    // reusable array to hold the pixels of our mask
    maskArray: IntArray,
    // Reusable array that acts as a line buffer here to optimize reads from the FloatBuffer.
    lineBuffer: FloatArray,
) {
    // 1. Ensure subsequent reads traverse the mask from the beginning.
    // Get foreground probabilities for each pixel. Since ML Kit returns this
    // in a byte buffer with each 4 bytes representing a float, convert it to
    // a FloatBuffer for easier use.
    val maskProbabilities = segmentationMask.buffer.asFloatBuffer()
    maskProbabilities.rewind()

    // 2. Walk every mask pixel, evaluate whether it belongs to the requested segment,
    //    and copy across the corresponding source pixel when it does.
    var index = 0
    if (segment == Segment.FOREGROUND) {
        for (y in 0 until segmentationMask.height) {
            maskProbabilities.get(lineBuffer)
            for (confidence in lineBuffer) {
                maskArray[index] =
                    if (confidence >= confidenceThreshold) {
                        Color.BLACK
                    } else {
                        Color.TRANSPARENT
                    }
                index++
            }
        }
    } else {
        for (y in 0 until segmentationMask.height) {
            maskProbabilities.get(lineBuffer)
            for (confidence in lineBuffer) {
                maskArray[index] =
                    if (confidence < confidenceThreshold) {
                        Color.BLACK
                    } else {
                        Color.TRANSPARENT
                    }
                index++
            }
        }
    }

    // 3. Copy the colored segment to the destination bitmap.
    destination.setPixels(
        maskArray,
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
