package io.getstream.rn.noisecancellation

import android.content.Context
import com.oney.WebRTCModule.audio.AudioProcessingFactoryProvider
import org.webrtc.AudioProcessingFactory
import io.getstream.video.android.noise.cancellation.NoiseCancellation

class NoiseCancellationAudioProcessingController(context: Context) :
    AudioProcessingFactoryProvider {
    val noiseCancellation: NoiseCancellation = NoiseCancellation(context)

    override fun getFactory(): AudioProcessingFactory {
        return noiseCancellation
    }
}
