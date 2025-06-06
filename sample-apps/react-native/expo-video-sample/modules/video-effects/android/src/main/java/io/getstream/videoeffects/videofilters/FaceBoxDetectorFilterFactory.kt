package io.getstream.videoeffects.videofilters

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.facemesh.FaceMesh
import com.google.mlkit.vision.facemesh.FaceMeshDetection
import com.google.mlkit.vision.facemesh.FaceMeshDetectorOptions
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import com.streamio.videofiltersreactnative.common.BitmapVideoFilter
import com.streamio.videofiltersreactnative.common.VideoFrameProcessorWithBitmapFilter

class FaceBoxDetectorFilterFactory : VideoFrameProcessorFactoryInterface {
  override fun build(): VideoFrameProcessor {
    return VideoFrameProcessorWithBitmapFilter {
      FaceBoxDetectorFilter()
    }
  }
}
private class FaceBoxDetectorFilter : BitmapVideoFilter() {

    private val faceMeshDetector = FaceMeshDetection.getClient(
        FaceMeshDetectorOptions.Builder()
        .setUseCase(FaceMeshDetectorOptions.BOUNDING_BOX_ONLY)
        .build()
        )

    // Properties to cache the last state
    private var lastBitmapWidth: Int = -1
    private var lastBitmapHeight: Int = -1
    private var cachedCentralBox: RectF? = null

    /**
     * Gets the central box. If the bitmap dimensions are the same as the last run,
     * it returns a cached version. Otherwise, it calculates a new one.
     */
    private fun getOrCreateCentralBox(bitmap: Bitmap): RectF {
        val bitmapWidth = bitmap.width
        val bitmapHeight = bitmap.height

        // 2. Check if dimensions have changed OR if the box has never been created
        if (bitmapWidth != lastBitmapWidth || bitmapHeight != lastBitmapHeight || cachedCentralBox == null) {

            println("Bitmap dimensions changed. Recalculating central box.")

            // Dimensions are new, so we recalculate
            val boxWidth = bitmapWidth * 0.6f
            val boxHeight = bitmapHeight * 0.6f
            val boxLeft = (bitmapWidth - boxWidth) / 2f
            val boxTop = (bitmapHeight - boxHeight) / 2f

            val newCentralBox = RectF(boxLeft, boxTop, boxLeft + boxWidth, boxTop + boxHeight)

            // 3. Update the cache
            this.cachedCentralBox = newCentralBox
            this.lastBitmapWidth = bitmapWidth
            this.lastBitmapHeight = bitmapHeight
        }

        // Return the cached box (it will never be null here)
        return cachedCentralBox!!
    }

    override fun applyFilter(videoFrameBitmap: Bitmap) {
        val mlImage = InputImage.fromBitmap(videoFrameBitmap, 0)
        val task = faceMeshDetector.process(mlImage)
        val faceMeshes = Tasks.await(task)

        val centralBox = getOrCreateCentralBox(videoFrameBitmap)

        if (faceMeshes.isEmpty()) {
            println("No face detected.")
            drawFaceBox(videoFrameBitmap, centralBox)
        } else {
            // take the first face mesh
            // for simplicity, we are not using the face mesh with the highest confidence
            val faceMesh = faceMeshes[0]
            val isFaceInside = checkFaceVisibility(faceMesh, centralBox)
            if (isFaceInside) {
                // The face is mostly inside the box
                println("The face is mostly inside the box")
            } else {
                // The face is considered visible outside the box
                println("Face is visible outside the box!")
                drawFaceBox(videoFrameBitmap, centralBox)
            }
        }
    }

    // draw the face box on the bitmap
    private fun drawFaceBox(videoFrameBitmap: Bitmap, centralBox: RectF) {
        val canvas = Canvas(videoFrameBitmap)

        // Draw the central box on the bitmap
        val paint = Paint().apply {
            color = Color.RED // You can choose any color
            style = Paint.Style.STROKE // Draw an outline
            strokeWidth = 8f // Set the line thickness
        }
        canvas.drawRect(centralBox, paint)
    }

    private fun checkFaceVisibility(faceMesh: FaceMesh, centralBox: RectF): Boolean {
        // Get all the 3D points of the face mesh. We only need the x and y for this 2D check.
        val faceBoundingBox = RectF(faceMesh.boundingBox)
        val faceBoxArea = faceBoundingBox.width() * faceBoundingBox.height()

        // Avoid division by zero if the face area is 0.
        if (faceBoxArea == 0f) {
            return false
        }

        // 2. Now, it's safe to mutate faceBoundingBox to find the intersection.
        val hasIntersection = faceBoundingBox.intersect(centralBox)

        // 3. Calculate the intersection area from the now-mutated rectangle.
        val intersectionArea = if (hasIntersection) {
            faceBoundingBox.width() * faceBoundingBox.height()
        } else {
            0f
        }

        // --- Step 4: Compare the Overlap Percentage to the Threshold ---
        val overlapPercentage = intersectionArea / faceBoxArea

        println("Bounding Box Overlap: ${"%.1f".format(overlapPercentage * 100)}%")

        val threshold = 0.60f // e.g., 60% (just example, change it per the app requirements)

        return overlapPercentage >= threshold
    }
}
