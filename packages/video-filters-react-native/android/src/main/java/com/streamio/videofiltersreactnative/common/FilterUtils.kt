package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import androidx.annotation.RequiresApi
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

/**
 * GPU-accelerated blur helper for Android 12+ (API 31+).
 * Uses RenderEffect to apply blur on GPU instead of CPU.
 * 
 * @param radius The blur radius (fixed for the lifetime of this helper)
 */
@RequiresApi(Build.VERSION_CODES.S)
internal class GpuBlurHelper(radius: Float) {
  private val renderNode = RenderNode("GpuBlurRenderNode")
  private val blurEffect = RenderEffect.createBlurEffect(
    radius,
    radius,
    Shader.TileMode.CLAMP
  )
  private var outputBitmap: Bitmap? = null
  
  /**
   * Applies GPU-accelerated blur to a bitmap using RenderEffect.
   * 
   * @param bitmap The input bitmap to blur
   * @return The blurred bitmap
   */
  fun applyBlur(bitmap: Bitmap): Bitmap {
    // Initialize or recreate output bitmap if size changed
    if (outputBitmap == null || 
        outputBitmap!!.width != bitmap.width || 
        outputBitmap!!.height != bitmap.height) {
      outputBitmap = Bitmap.createBitmap(
        bitmap.width,
        bitmap.height,
        Bitmap.Config.ARGB_8888
      )
    }
    
    // Set up RenderNode
    renderNode.setPosition(0, 0, bitmap.width, bitmap.height)
    renderNode.setRenderEffect(blurEffect)
    
    // Draw to RenderNode
    val recordingCanvas = renderNode.beginRecording()
    recordingCanvas.drawBitmap(bitmap, 0f, 0f, null)
    renderNode.endRecording()
    
    // Render to output bitmap
    val canvas = Canvas(outputBitmap!!)
    canvas.drawRenderNode(renderNode)
    
    return outputBitmap!!
  }
}
