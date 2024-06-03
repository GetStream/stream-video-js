package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Matrix
import com.google.mlkit.vision.segmentation.SegmentationMask

internal fun copySegment(
  segment: Segment,
  source: Bitmap,
  destination: Bitmap,
  segmentationMask: SegmentationMask,
  confidenceThreshold: Double,
) {
  val scaleBetweenSourceAndMask = getScalingFactors(
    widths = Pair(source.width, segmentationMask.width),
    heights = Pair(source.height, segmentationMask.height),
  )

  segmentationMask.buffer.rewind()

  val sourcePixels = IntArray(source.width * source.height)
  source.getPixels(sourcePixels, 0, source.width, 0, 0, source.width, source.height)
  val destinationPixels = IntArray(destination.width * destination.height)

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

private fun getScalingFactors(widths: Pair<Int, Int>, heights: Pair<Int, Int>) =
  Pair(widths.first.toFloat() / widths.second, heights.first.toFloat() / heights.second)

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
