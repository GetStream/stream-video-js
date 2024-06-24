package io.getstream.rnvideosample.videofilters

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter

class GrayScaleVideoFilterFactory : VideoFrameProcessorFactoryInterface {
  override fun build(): VideoFrameProcessor {
    return VideoFrameProcessorWithBitmapFilter {
      GrayScaleFilter()
    }
  }
}
private class GrayScaleFilter : BitmapVideoFilter() {
    override fun applyFilter(videoFrameBitmap: Bitmap) {
        val canvas = Canvas(videoFrameBitmap)
        val paint = Paint().apply {
            val colorMatrix = ColorMatrix().apply {
                // map the saturation of the color to gray-scale
                setSaturation(0f)
            }
            colorFilter = ColorMatrixColorFilter(colorMatrix)
        }
        canvas.drawBitmap(videoFrameBitmap, 0f, 0f, paint)
    }
}
