package com.streamvideo.reactnative.callmanager

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.PowerManager
import android.util.Log
import com.streamvideo.reactnative.audio.AudioDeviceManager

/**
 * Encapsulates Android proximity sensor handling for in-call UX.
 *
 * Responsibilities:
 * - Initialize proximity sensor + PowerManager wake lock lazily
 * - Register/unregister sensor listener
 * - Acquire/release PROXIMITY_SCREEN_OFF_WAKE_LOCK when near/away
 * - Provide a simple API: start(), stop(), update()
 */
class ProximityManager(
    private val context: Context,
    private val audioDeviceManager: AudioDeviceManager,
) {

    companion object {
        const val TAG = "ProximityManager"
    }

    private var sensorManager: SensorManager? = null
    private var proximitySensor: Sensor? = null
    private var proximityListener: SensorEventListener? = null

    private var powerManager: PowerManager? = null
    private var proximityWakeLock: PowerManager.WakeLock? = null

    private var proximityRegistered = false
    private var initialized = false

    fun start() {
        this.update()
    }

    fun stop() {
        // Unregister listener and release wakelock
        disableProximity()
    }

    fun onDestroy() {
        stop()
    }

    /**
     * Toggle monitoring state based on higher-level decision.
     */
    fun update() {
        if (!initialized) init()
        if (isOnEarpiece()) enableProximity() else disableProximity()
    }

    private fun init() {
        if (initialized) return
        try {
            sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            proximitySensor = sensorManager?.getDefaultSensor(Sensor.TYPE_PROXIMITY)
        } catch (t: Throwable) {
            Log.w(TAG, "Proximity sensor init failed", t)
        }
        try {
            powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            proximityWakeLock = powerManager?.newWakeLock(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "$TAG:Proximity")
        } catch (t: Throwable) {
            Log.w(TAG, "Proximity wakelock init failed (may be unsupported on this device)", t)
            proximityWakeLock = null
        }
        initialized = true
    }

    private fun enableProximity() {
        val sensor = proximitySensor
        if (sensor == null) {
            Log.d(TAG, "No proximity sensor available; skipping enable")
            return
        }
        if (proximityRegistered) return
        if (proximityListener == null) {
            proximityListener = object : SensorEventListener {
                override fun onSensorChanged(event: android.hardware.SensorEvent) {
                    val max = sensor.maximumRange
                    val value = event.values.firstOrNull() ?: max
                    val near = value < max
                    onProximityChanged(near)
                }

                override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
            }
        }
        try {
            sensorManager?.registerListener(
                proximityListener,
                sensor,
                SensorManager.SENSOR_DELAY_NORMAL
            )
            proximityRegistered = true
            Log.d(TAG, "Proximity monitoring ENABLED")
        } catch (t: Throwable) {
            Log.w(TAG, "Failed to register proximity listener", t)
        }
    }

    private fun disableProximity() {
        if (proximityRegistered && proximityListener != null) {
            try {
                sensorManager?.unregisterListener(proximityListener)
            } catch (t: Throwable) {
                Log.w(TAG, "Failed to unregister proximity listener", t)
            }
        }
        proximityRegistered = false
        releaseProximityWakeLock()
        Log.d(TAG, "Proximity monitoring DISABLED")
    }

    private fun onProximityChanged(near: Boolean) {
        if (near) {
            acquireProximityWakeLock()
        } else {
            releaseProximityWakeLock()
        }
    }

    private fun acquireProximityWakeLock() {
        try {
            val wl = proximityWakeLock
            if (wl != null && !wl.isHeld) {
                wl.acquire()
                Log.d(TAG, "Proximity wakelock ACQUIRED (screen off near ear)")
            }
        } catch (t: Throwable) {
            Log.w(TAG, "Failed to acquire proximity wakelock", t)
        }
    }

    private fun releaseProximityWakeLock() {
        try {
            val wl = proximityWakeLock
            if (wl != null && wl.isHeld) {
                wl.release()
                Log.d(TAG, "Proximity wakelock RELEASED (screen on)")
            }
        } catch (t: Throwable) {
            Log.w(TAG, "Failed to release proximity wakelock", t)
        }
    }

    private fun isOnEarpiece(): Boolean {
        return audioDeviceManager.selectedAudioDeviceEndpoint?.isEarpieceType() ?: false
    }
}
