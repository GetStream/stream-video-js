package com.streamvideo.reactnative.recorder

import android.content.Context
import android.media.MediaMuxer
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Log
import com.oney.WebRTCModule.WebRTCModule
import java.io.File
import org.webrtc.VideoTrack

/**
 * Orchestrator for the React Native track recorder. Owns the [MediaMuxer], the recording lifecycle,
 * the muxer-start gate, and the terminal-completion barrier. Delegates the encoder + sink + drain
 * work to [VideoPipeline] and [AudioPipeline] respectively (composed via [PipelineHost]).
 *
 * The public surface is wrapped by `StreamVideoReactNativeModule.kt`'s `startTrackRecording` /
 * `stopTrackRecording` / `clearStreamRecordings` / `getStreamRecordings` methods, which in turn are
 * the bridge contract used by the JS `useLoopbackRecording` hook. Knows nothing about loopback or
 * any specific recording use case — it's a generic encode-and-mux orchestrator.
 *
 * Both video and audio are optional. Audio is always requested by the current bridge contract;
 * video is requested whenever the caller passes a `videoTrackId` that resolves to a [VideoTrack].
 * The [MediaMuxer] only starts once **all** active pipelines have reported their track (gated by
 * [maybeStartMuxer] on [pendingPipelines]).
 *
 * Threading: a dedicated [HandlerThread] serialises every state mutation (start, stop, encoder
 * feed, muxer writes) so the rest of the file is lock-free. Pipelines accept buffers on WebRTC
 * delivery threads and post to this handler before touching any state.
 *
 * Completion semantics: `startRecording` is the **lifecycle promise** — it fires once at the
 * recording's terminal moment with the produced file (or an error). `stopRecording` is a void sync
 * point that resolves after native finalisation, so callers can `await stopTrackRecording(); await
 * getStreamRecordings()` without racing the disk flush. Same shape as iOS.
 */
class TracksRecorderManager private constructor() : PipelineHost {

    companion object {
        @JvmField val shared = TracksRecorderManager()

        private const val TAG = "TracksRecorder"
        private const val RECORDINGS_DIR_NAME = "StreamRecordings"
    }

    private val thread = HandlerThread("io.stream.video.tracks-recorder").apply { start() }
    private val timerHandler = Handler(Looper.getMainLooper())

    override val handler = Handler(thread.looper)
    override var muxer: MediaMuxer? = null
        private set
    override var muxerStarted = false
        private set

    private var videoPipeline: VideoPipeline? = null
    private var audioPipeline: AudioPipeline? = null

    private var outputFile: File? = null

    private var recordingCompletion: ((File?, Throwable?) -> Unit)? = null
    private var isCompleted = false
    private var isRecording = false
   
    private var pendingPipelines = 0
    private var recordingStartHostTimeNs: Long? = null
    private var autoStopRunnable: Runnable? = null

    fun recordingsDirectory(context: Context): File {
        val dir = File(context.cacheDir, RECORDINGS_DIR_NAME)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun startRecording(
            context: Context,
            webRTCModule: WebRTCModule,
            videoTrackId: String?,
            maxDurationMs: Long,
            targetWidth: Int = 0,
            targetHeight: Int = 0,
            completion: (File?, Throwable?) -> Unit,
    ) {
        handler.post {
            if (isRecording) {
                completion(null, RecordingError("recording_in_progress"))
                return@post
            }

            val resolvedVideoTrack =
                    videoTrackId?.let { webRTCModule.getTrackById(it) } as? VideoTrack

            val dir = recordingsDirectory(context)
            val outFile = File(dir, "recording_${System.currentTimeMillis()}.mp4")
            val muxerInstance: MediaMuxer =
                    try {
                        MediaMuxer(
                                outFile.absolutePath,
                                MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
                        )
                    } catch (t: Throwable) {
                        completion(null, t)
                        return@post
                    }

            resetTransientState()

            this.muxer = muxerInstance
            this.outputFile = outFile
            this.recordingCompletion = completion
            this.isRecording = true

            if (resolvedVideoTrack != null) {
                val pipeline = VideoPipeline(
                        host = this,
                        videoTrack = resolvedVideoTrack,
                        targetWidth = targetWidth,
                        targetHeight = targetHeight,
                )
                videoPipeline = pipeline
                pendingPipelines++
                pipeline.start()
            }

            val audio = AudioPipeline(host = this, webRTCModule = webRTCModule)
            audioPipeline = audio
            pendingPipelines++
            audio.start()

            if (maxDurationMs > 0) {
                val runnable = Runnable { stopRecording { /* fire-and-forget */} }
                autoStopRunnable = runnable
                timerHandler.postDelayed(runnable, maxDurationMs)
            }

            Log.i(
                    TAG,
                    "recording started video=${resolvedVideoTrack != null} audio=true → ${outFile.absolutePath}",
            )
        }
    }

    fun stopRecording(completion: () -> Unit) {
        // Detach sinks synchronously off the recorder handler so no
        // new buffers can be enqueued while the backlog drains. The
        // audio pipeline also restores speaker volume here so the
        // mute lifts immediately.
        videoPipeline?.detachSink()
        audioPipeline?.detachSink()
        autoStopRunnable?.let { timerHandler.removeCallbacks(it) }
        autoStopRunnable = null

        handler.post {
            if (!isRecording) {
                completion()
                return@post
            }

            val video = videoPipeline
            val audio = audioPipeline
            val muxerInstance = muxer
            val resolved = outputFile

            if (!muxerStarted || muxerInstance == null) {
                Log.w(TAG, "stopRecording: muxer never started — discarding empty recording")
                video?.logSummary()
                audio?.logSummary()
                video?.stopAndRelease()
                audio?.stopAndRelease()
                try {
                    muxerInstance?.release()
                } catch (_: Throwable) {}
                // Best-effort: delete the empty file so getStreamRecordings()
                // doesn't surface an unplayable 0-byte mp4.
                resolved?.delete()
                fireTerminalCompletion(null, null)
                cleanupAfterStop()
                completion()
                return@post
            }

            // Skip the EOS drain when EOS can't be queued — waiting on
            // a marker that will never arrive would hang the handler.
            if (video != null) {
                try {
                    val queued = video.signalEndOfStream(muxerInstance)
                    if (queued) video.drainAfterEoS(muxerInstance)
                } catch (t: Throwable) {
                    Log.e(TAG, "stopRecording: video drain failed", t)
                }
            }
            if (audio != null) {
                try {
                    val queued = audio.signalEndOfStream(muxerInstance)
                    if (queued) audio.drainAfterEoS(muxerInstance)
                } catch (t: Throwable) {
                    Log.e(TAG, "stopRecording: audio drain failed", t)
                }
            }

            video?.stopAndRelease()
            audio?.stopAndRelease()

            var finalResolved: File? = resolved
            try {
                muxerInstance.stop()
            } catch (t: Throwable) {
                Log.e(TAG, "muxer.stop() threw — likely no usable samples", t)
                finalResolved = null
                resolved?.delete()
            }
            try {
                muxerInstance.release()
            } catch (t: Throwable) {
                Log.w(TAG, "muxer.release() threw", t)
            }

            video?.logSummary()
            audio?.logSummary()
            Log.i(
                    TAG,
                    "recording finalised → ${finalResolved?.absolutePath ?: "(no file produced)"}",
            )

            fireTerminalCompletion(finalResolved, null)
            cleanupAfterStop()
            completion()
        }
    }

    fun clearRecordingsDirectory(context: Context, completion: (Throwable?) -> Unit) {
        handler.post {
            try {
                val dir = recordingsDirectory(context)
                dir.listFiles()?.forEach { it.deleteRecursively() }
                completion(null)
            } catch (t: Throwable) {
                completion(t)
            }
        }
    }

    fun listRecordings(context: Context): List<File> {
        val dir = File(context.cacheDir, RECORDINGS_DIR_NAME)
        if (!dir.isDirectory) return emptyList()
        return dir.listFiles()?.sortedByDescending { it.lastModified() } ?: emptyList()
    }

    override fun seedOriginNs(timestampNs: Long): Long {
        val existing = recordingStartHostTimeNs
        if (existing != null) return existing
        recordingStartHostTimeNs = timestampNs
        return timestampNs
    }

    override fun onTrackAdded() {
        pendingPipelines = (pendingPipelines - 1).coerceAtLeast(0)
        muxer?.let { maybeStartMuxer(it) }
    }

    override fun onFatalError(error: Throwable) {
        fireTerminalCompletion(null, error)
        cleanupAfterFailure()
    }

    /**
     * Starts the muxer once every active pipeline has added its track. Calling `start()` before all
     * `addTrack` calls makes subsequent `addTrack` throw "Muxer is not initialized", so the gate is
     * load-bearing.
     */
    private fun maybeStartMuxer(muxerInstance: MediaMuxer) {
        if (muxerStarted) return
        if (pendingPipelines > 0) return
        
        try {
            muxerInstance.start()
            muxerStarted = true
        } catch (t: Throwable) {
            Log.e(TAG, "muxer.start() threw", t)
            fireTerminalCompletion(null, t)
            cleanupAfterFailure()
        }
    }

    private fun fireTerminalCompletion(file: File?, error: Throwable?) {
        if (isCompleted) return
        isCompleted = true

        val cb = recordingCompletion
        recordingCompletion = null
        cb?.invoke(file, error)
    }

    /**
     * Resets every transient field to its initial value. Single source of truth for "the manager is
     * between recordings". Does NOT release native resources — the caller must stop/release
     * encoders and the muxer before invoking this.
     */
    private fun resetTransientState() {
        muxer = null
        muxerStarted = false
        videoPipeline = null
        audioPipeline = null
        outputFile = null
        recordingCompletion = null
        isCompleted = false
        isRecording = false
        pendingPipelines = 0
        recordingStartHostTimeNs = null
        autoStopRunnable?.let { timerHandler.removeCallbacks(it) }
        autoStopRunnable = null
    }

    private fun cleanupAfterFailure() {
        videoPipeline?.detachSink()
        audioPipeline?.detachSink()
        videoPipeline?.stopAndRelease()
        audioPipeline?.stopAndRelease()
        try {
            muxer?.release()
        } catch (t: Throwable) {
            Log.w(TAG, "failed to release muxer", t)
        }
        resetTransientState()
    }

    private fun cleanupAfterStop() {
        resetTransientState()
    }
}
