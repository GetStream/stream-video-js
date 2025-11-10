package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.PixelFormat
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.S)
internal class GpuBlurHelper(private val radius: Float): AutoCloseable {
  private var imageReader: ImageReader? = null
  private var hardwareRenderer: android.graphics.HardwareRenderer? = null
  private var renderNode: RenderNode? = null

  private var bitmapWidth = 0
  private var bitmapHeight = 0

  private fun isInitialized() =
    imageReader != null && hardwareRenderer != null && renderNode != null

  private fun maybeInit(width: Int, height: Int) {
    if (width == bitmapWidth && height == bitmapHeight && isInitialized()) {
      return
    }
    release()
    bitmapWidth = width
    bitmapHeight = height

    try {
      imageReader = ImageReader.newInstance(
        width,
        height,
        PixelFormat.RGBA_8888,
        1,
        HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE or HardwareBuffer.USAGE_GPU_COLOR_OUTPUT
      )
      hardwareRenderer = android.graphics.HardwareRenderer().apply {
        setSurface(imageReader!!.surface)
      }
      renderNode = RenderNode("BlurEffect").apply {
        setPosition(0, 0, width, height)
        setRenderEffect(
          RenderEffect.createBlurEffect(
            radius,
            radius,
            Shader.TileMode.MIRROR
          )
        )
      }
      hardwareRenderer!!.setContentRoot(renderNode)
    } catch (e: Exception) {
      Log.e("GpuBlurHelper", "Failed to initialize", e)
      release()
    }
  }

  fun applyBlurAndDraw(bitmap: Bitmap, destinationCanvas: Canvas, matrix: Matrix? = null): Boolean {
    if (bitmap.isRecycled) {
      return false
    }
    maybeInit(bitmap.width, bitmap.height)
    if (!isInitialized()) {
      return false
    }

    var hardwareBuffer: HardwareBuffer? = null
    var image: android.media.Image? = null

    try {
      val canvas = renderNode!!.beginRecording()
      canvas.drawBitmap(bitmap, 0f, 0f, null)
      renderNode!!.endRecording()

      hardwareRenderer!!.createRenderRequest().syncAndDraw()

      image = imageReader!!.acquireNextImage() ?: return false
      hardwareBuffer = image.hardwareBuffer ?: return false
      val tempBitmap = Bitmap.wrapHardwareBuffer(hardwareBuffer, null)
      if (tempBitmap != null) {
        if (matrix != null) {
          destinationCanvas.drawBitmap(tempBitmap, matrix, null)
        } else {
          destinationCanvas.drawBitmap(tempBitmap, 0f, 0f, null)
        }
      } else {
        return false
      }
    } catch (e: Exception) {
      Log.e("GpuBlurHelper", "Failed to apply blur", e)
      return false
    } finally {
      hardwareBuffer?.close()
      image?.close()
    }
    return true
  }

  override fun close() {
    release()
  }

  fun release() {
    imageReader?.close()
    imageReader = null
    hardwareRenderer?.destroy()
    hardwareRenderer = null
    renderNode?.discardDisplayList()
    renderNode = null
  }
}
