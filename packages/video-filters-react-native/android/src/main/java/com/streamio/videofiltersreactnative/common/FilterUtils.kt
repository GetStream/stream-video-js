package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Matrix
import com.google.mlkit.vision.segmentation.SegmentationMask

/**
 * Copies pixels that belong to the requested [segment] from the [source] bitmap into the supplied
 * [destination] bitmap using the provided [segmentationMask].
 *
 * Steps performed:
 * 1. Compute the scale between the ML Kit mask dimensions and the incoming video frame so we can
 *    sample pixels from matching coordinates.
 * 2. Reset the mask's underlying buffer so we can iterate over every confidence value exactly once.
 * 3. Materialize both the source and destination pixel arrays to work with raw integers.
 * 4. Iterate over every position in the segmentation mask, check the confidence value against the
 *    [confidenceThreshold], and copy pixels that belong to the requested [segment].
 * 5. Write the mutated pixel array back into the [destination] bitmap.
 */
internal fun copySegment(
  segment: Segment,
  source: Bitmap,
  destination: Bitmap,
  segmentationMask: SegmentationMask,
  confidenceThreshold: Double,
) {
  // 1. Match each mask coordinate to the corresponding position in the source bitmap.
  val scaleBetweenSourceAndMask = getScalingFactors(
    widths = Pair(source.width, segmentationMask.width),
    heights = Pair(source.height, segmentationMask.height),
  )

  // 2. Ensure subsequent reads traverse the mask from the beginning.
  segmentationMask.buffer.rewind()

  // 3. Read pixel data into arrays so we can mutate it efficiently.
  val sourcePixels = IntArray(source.width * source.height)
  source.getPixels(sourcePixels, 0, source.width, 0, 0, source.width, source.height)
  val destinationPixels = IntArray(destination.width * destination.height)

  // 4. Walk every mask pixel, evaluate whether it belongs to the requested segment,
  //    and copy across the corresponding source pixel when it does.
  for (y in 0 until segmentationMask.height) {
    for (x in 0 until segmentationMask.width) {
      val confidence = segmentationMask.buffer.float

      if (((segment == Segment.BACKGROUND) && confidence < confidenceThreshold) ||
        ((segment == Segment.FOREGROUND) && confidence >= confidenceThreshold)
      ) {
        val scaledX = (x * scaleBetweenSourceAndMask.first).toInt()
        val scaledY = (y * scaleBetweenSourceAndMask.second).toInt()
        destinationPixels[y * destination.width + x] =
          sourcePixels[scaledY * source.width + scaledX]
      }
    }
  }

  // 5. Push the filtered pixels back into the destination bitmap.
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
private fun getScalingFactors(widths: Pair<Int, Int>, heights: Pair<Int, Int>) =
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
