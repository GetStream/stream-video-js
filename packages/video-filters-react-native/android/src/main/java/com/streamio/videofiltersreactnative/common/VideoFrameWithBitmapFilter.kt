package com.streamio.videofiltersreactnative.common

import android.graphics.Bitmap
import android.graphics.Matrix
import android.opengl.GLES20
import android.opengl.GLUtils
import android.util.Log
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import org.webrtc.SurfaceTextureHelper
import org.webrtc.TextureBufferImpl
import org.webrtc.VideoFrame
import org.webrtc.YuvConverter

// Original Sources
// https://github.com/GetStream/stream-video-android/blob/9a3b8e92b74bc4408781b5274fc602034d616983/stream-video-android-core/src/main/kotlin/io/getstream/video/android/core/call/video/FilterVideoProcessor.kt
// https://github.com/SHIVAJIKUMAR007/real-time-VideoProcessing/blob/5bb96a8b0c3c602a458ece1774f68ea913336f9f/android/app/src/main/java/com/vchat/backgroundEffect/BackgroundBlurFactory.java

class VideoFrameProcessorWithBitmapFilter(bitmapVideoFilterFunc: () -> BitmapVideoFilter) :
  VideoFrameProcessor {
  private val yuvConverter = YuvConverter()
  private var inputWidth = 0
  private var inputHeight = 0
  private var inputBuffer: VideoFrame.TextureBuffer? = null
  private var yuvBuffer: VideoFrame.I420Buffer? = null
  private val textures = IntArray(1)
  private var inputFrameBitmap: Bitmap? = null

  private val bitmapVideoFilter by lazy {
    bitmapVideoFilterFunc.invoke()
  }

  init {
    GLES20.glGenTextures(1, textures, 0)
  }

  override fun process(frame: VideoFrame, surfaceTextureHelper: SurfaceTextureHelper): VideoFrame {
    // Step 1: Video Frame to Bitmap
    val inputFrameBitmap = YuvFrame.bitmapFromVideoFrame(frame) ?: return frame

    // Prepare helpers (runs only once or if the dimensions change)
    initialize(
      inputFrameBitmap.width,
      inputFrameBitmap.height,
      surfaceTextureHelper,
    )

    // Step 2: Apply filter
    bitmapVideoFilter.applyFilter(inputFrameBitmap)

    // Step 3: Bitmap to Video Frame
    // feed back the modified bitmap
    GLES20.glTexParameteri(
      GLES20.GL_TEXTURE_2D,
      GLES20.GL_TEXTURE_MIN_FILTER,
      GLES20.GL_NEAREST,
    )
    GLES20.glTexParameteri(
      GLES20.GL_TEXTURE_2D,
      GLES20.GL_TEXTURE_MAG_FILTER,
      GLES20.GL_NEAREST,
    )
    GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, inputFrameBitmap, 0)
    // Convert the buffer back to YUV (VideoFrame needs YUV)
    yuvBuffer = yuvConverter.convert(inputBuffer)
    return VideoFrame(yuvBuffer, 0, frame.timestampNs)
  }

  private fun initialize(width: Int, height: Int, textureHelper: SurfaceTextureHelper) {
    // TODO: temporarily disabled due to crash: java.lang.IllegalStateException: release() called on an object with refcount < 1
//     yuvBuffer?.release()

    if (this.inputWidth != width || this.inputHeight != height) {
      Log.d(TAG, "initialize - width: $width height: $height")
      this.inputWidth = width
      this.inputHeight = height
      inputFrameBitmap?.recycle()
      inputBuffer?.release()

      val type = VideoFrame.TextureBuffer.Type.RGB

      val matrix = Matrix()
      // This is vertical flip - we need to investigate why the image is flipped vertically and
      // why we need to correct it here.
      matrix.preScale(1.0f, -1.0f)
      val surfaceTextureHelper: SurfaceTextureHelper = textureHelper
      this.inputBuffer = TextureBufferImpl(
        inputWidth, inputHeight, type, textures[0], matrix, surfaceTextureHelper.handler,
        yuvConverter, null as Runnable?,
      )
      this.inputFrameBitmap =
        Bitmap.createBitmap(this.inputWidth, this.inputHeight, Bitmap.Config.ARGB_8888)
    }
  }

  companion object {
    private const val TAG = "VideoFrameProcessorWithBitmapFilter"
  }
}
