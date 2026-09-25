package com.streamvideo.reactnative.callmanager

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.util.Log
import androidx.core.net.toUri

internal class SoundPlayer(private val context: Context) {

    private val lock = Any()
    private var mediaPlayer: MediaPlayer? = null

    /**
     * Starts the ringing sound, replacing any sound that is already playing.
     *
     * @param soundName a `res/raw` resource name (with or without extension), or a content /
     * resource URI.
     * @param playIfMuted whether the sound should play even when the ringer is silenced.
     */
    fun playSound(soundName: String?, playIfMuted: Boolean) {
        synchronized(lock) {
            stopLocked()

            val uri = resolveSoundUri(soundName)
            if (uri == null) {
                Log.e(TAG, "playSound(): no sound found for \"$soundName\"")
                return
            }

            // Held locally until it is actually playing: `setDataSource` and `prepare` throw for
            // an unreadable or unsupported source, and a player that never reaches the field
            // could not be released by `stopLocked()` — it would leak a native player per call.
            val player = MediaPlayer()
            try {
                player.setAudioAttributes(audioAttributes(playIfMuted))
                player.setDataSource(context, uri)
                player.isLooping = true
                player.prepare()
                player.start()
                mediaPlayer = player
                Log.d(TAG, "playSound(): playing $uri")
            } catch (e: Exception) {
                Log.e(TAG, "playSound(): failed to play $uri", e)
                player.release()
            }
        }
    }

    /** Stops the sound, if one is playing. Safe to call when nothing is playing. */
    fun stopSound() {
        synchronized(lock) { stopLocked() }
    }

    private fun stopLocked() {
        val player = mediaPlayer ?: return
        mediaPlayer = null
        try {
            if (player.isPlaying) {
                player.stop()
            }
        } catch (e: Exception) {
            Log.e(TAG, "stopSound(): failed to stop the player", e)
        } finally {
            player.release()
        }
    }

    private fun resolveSoundUri(soundName: String?): Uri? {
        if (soundName.isNullOrEmpty()) {
            return null
        }
        if (soundName.contains("://")) {
            return soundName.toUri()
        }
        val normalized = soundName.lowercase().replace("-", "_")
        val candidates = listOf(normalized, normalized.substringBeforeLast('.'))
        for (candidate in candidates) {
            val id = context.resources.getIdentifier(candidate, "raw", context.packageName)
            if (id != 0) {
                // Build the URI from the resource entry name rather than the id, so it stays
                // stable across builds.
                val entryName = context.resources.getResourceEntryName(id)
                return "android.resource://${context.packageName}/raw/$entryName".toUri()
            }
        }
        return null
    }

    private fun audioAttributes(playIfMuted: Boolean): AudioAttributes =
        AudioAttributes.Builder()
            .apply {
                if (playIfMuted) {
                    // The call stream is not silenced by the ringer.
                    setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                } else {
                    setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                }
            }
            .build()

    companion object {
        private const val TAG = "StreamSoundPlayer"
    }
}
