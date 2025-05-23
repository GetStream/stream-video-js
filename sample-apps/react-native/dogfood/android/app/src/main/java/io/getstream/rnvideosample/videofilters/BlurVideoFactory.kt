package io.getstream.rnvideosample.videofilters

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter

class BlurVideoFilterFactory : VideoFrameProcessorFactoryInterface {
    override fun build(): VideoFrameProcessor {
        return VideoFrameProcessorWithBitmapFilter {
            BlurFilter()
        }
    }
}
private class BlurFilter : BitmapVideoFilter() {
    override fun applyFilter(videoFrameBitmap: Bitmap) {
        val canvas = Canvas(videoFrameBitmap)
        val paint = Paint().apply {
            // Create a blur effect
            // For simplicity, we'll just draw a scaled-down version of the bitmap
            // and then scale it back up, which creates a pixelated/blurred effect.
            // For a more sophisticated blur, you'd use RenderScript or a custom shader.
            alpha = 255 // Make it semi-transparent to see the original behind if needed
        }

        val scaledWidth = videoFrameBitmap.width / 16
        val scaledHeight = videoFrameBitmap.height / 16

        // Create a small, scaled-down bitmap
        val smallBitmap = Bitmap.createScaledBitmap(videoFrameBitmap, scaledWidth, scaledHeight, true)
        // Create a scaled-up version of the small bitmap, which will appear blurred/pixelated
        val blurredBitmap = Bitmap.createScaledBitmap(smallBitmap, videoFrameBitmap.width, videoFrameBitmap.height, true)
        canvas.drawBitmap(blurredBitmap, 0f, 0f, paint)
    }
}
