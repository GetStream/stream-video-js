/*
 *  Copyright 2016 The WebRTC Project Authors. All rights reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. An additional intellectual property rights grant can be found
 *  in the file PATENTS.  All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */
package com.streamvideo.reactnative.callmanager

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothHeadset
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.streamvideo.reactnative.audio.utils.AudioDeviceEndpointUtils
import com.streamvideo.reactnative.callmanager.InCallManagerModule.Companion.runInAudioThread
import com.streamvideo.reactnative.model.AudioDeviceEndpoint

class AppRTCBluetoothManager(
    private val mReactContext: ReactApplicationContext,
    private val apprtcAudioManager: InCallManagerModule,
) {
    // Bluetooth connection state.
    enum class State {
        // Bluetooth is not available; no adapter or Bluetooth is off.
        UNINITIALIZED,

        // Bluetooth error happened when trying to start Bluetooth.
        ERROR,

        // Bluetooth proxy object for the Headset profile exists, but no connected headset devices,
        // SCO is not started or disconnected.
        HEADSET_UNAVAILABLE,

        // Bluetooth proxy object for the Headset profile connected, connected Bluetooth headset
        // present, but SCO is not started or disconnected.
        HEADSET_AVAILABLE,

        // Bluetooth audio SCO connection with remote device is closing.
        SCO_DISCONNECTING,

        // Bluetooth audio SCO connection with remote device is initiated.
        SCO_CONNECTING,

        // Bluetooth audio SCO connection with remote device is established.
        SCO_CONNECTED
    }

    init {
        Log.d(TAG, "constructor")
    }

    private val mAudioManager =
        mReactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    var bluetoothState: State = State.UNINITIALIZED

    private val btManagerPlatform: BluetoothManagerPlatform =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) BluetoothManager31PlusImpl() else BluetoothManager23PlusImpl()

    private fun updateAudioDeviceState() {
        Log.d(TAG, "updateAudioDeviceState")
        apprtcAudioManager.updateAudioDeviceState()
    }

    /** Start the listeners */
    fun start() = btManagerPlatform.start()

    /** Stop the listeners */
    fun stop() = btManagerPlatform.stop()

    /** is audio flowing through BT communication device? */
    fun isScoOn() = btManagerPlatform.isScoOn()

    /** Start audio flowing through BT communication device. */
    fun startScoAudio() = btManagerPlatform.startScoAudio()

    /** Stop audio flowing through BT communication device. */
    fun stopScoAudio() = btManagerPlatform.stopScoAudio()

    /** Check if there is a BT headset connected and update the state. */
    fun updateDevice() = btManagerPlatform.updateDevice()

    fun getDeviceName() = btManagerPlatform.getDeviceName()

    abstract inner class BluetoothManagerPlatform {

        abstract fun hasPermission(): Boolean

        /** is audio flowing through BT communication device? */
        abstract fun isScoOn(): Boolean

        /** Start audio flowing through BT communication device. */
        abstract fun startScoAudio(): Boolean

        /** Check if there is a BT headset connected and update the state. */
        abstract fun updateDevice()

        /** Get the name of the connected BT device if present, otherwise null. */
        abstract fun getDeviceName(): String?

        /** Stop audio flowing through BT communication device. */
        open fun stopScoAudio(): Boolean {
            Log.d(
                TAG, ("stopScoAudio: BT state=" + bluetoothState + ", " + "SCO is on: " + isScoOn())
            )
            return !(bluetoothState != State.SCO_CONNECTING && bluetoothState != State.SCO_CONNECTED)
        }

        /** Start the listeners */
        open fun start(): Boolean {
            Log.d(TAG, "start")
            if (!hasPermission()) {
                Log.w(
                    TAG, "App lacks BLUETOOTH permission"
                )
                return false
            }

            // Ensure that the device supports use of BT SCO audio for off call use cases.
            if (!mAudioManager.isBluetoothScoAvailableOffCall) {
                Log.e(TAG, "Bluetooth SCO audio is not available off call")
                return false
            }

            return true
        }

        /* Stop the listeners */
        open fun stop(): Boolean {
            Log.d(
                TAG, "stop: BT state=$bluetoothState"
            )
            // Close down remaining BT resources.
            return bluetoothState != State.UNINITIALIZED
        }
    }

    @RequiresApi(31)
    inner class BluetoothManager31PlusImpl : BluetoothManagerPlatform() {

        private var bluetoothAudioDevice: AudioDeviceInfo? = null

        /** Get the connected BT device if present, otherwise null.
        Note: this doesn't mean that the device is streaming the audio now. It is only connected.
         */
        private fun getAvailableBtDevice(): AudioDeviceInfo? {
            val devices = mAudioManager.availableCommunicationDevices
            for (device in devices) {
                val isBtDevice =
                    AudioDeviceEndpoint.TYPE_BLUETOOTH == AudioDeviceEndpointUtils.remapAudioDeviceTypeToCallEndpointType(
                        device.type
                    )
                if (isBtDevice) {
                    return device
                }
            }
            return null
        }

        private var bluetoothAudioDeviceCallback: AudioDeviceCallback =
            object : AudioDeviceCallback() {

                override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
                    if (addedDevices != null) {
                        runInAudioThread {
                            updateDeviceList()
                        }
                    }
                }

                override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
                    if (removedDevices != null) {
                        runInAudioThread {
                            updateDeviceList()
                        }
                    }
                }

                fun updateDeviceList() {
                    val currentBtDevice = bluetoothAudioDevice
                    val newBtDevice: AudioDeviceInfo? = getAvailableBtDevice()
                    if (currentBtDevice != null && newBtDevice == null) {
                        bluetoothState = State.HEADSET_UNAVAILABLE
                    } else if (currentBtDevice == null && newBtDevice != null) {
                        bluetoothState = State.HEADSET_AVAILABLE
                    } else if (currentBtDevice != null && newBtDevice != null && currentBtDevice.id != newBtDevice.id) {
                        updateDevice()
                    }
                }
            }

        override fun hasPermission(): Boolean {
            return mReactContext.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        }

        override fun start(): Boolean {
            if (!super.start()) {
                return false
            }
            mAudioManager.registerAudioDeviceCallback(bluetoothAudioDeviceCallback, null)
            bluetoothAudioDevice = getAvailableBtDevice()
            bluetoothState =
                if (bluetoothAudioDevice != null) State.HEADSET_AVAILABLE else State.HEADSET_UNAVAILABLE
            Log.d(
                TAG, "start done: BT state=$bluetoothState"
            )
            return true
        }

        override fun stop(): Boolean {
            if (!super.start()) {
                return false
            }
            // Stop BT SCO connection with remote device if needed.
            stopScoAudio()
            mAudioManager.unregisterAudioDeviceCallback(bluetoothAudioDeviceCallback)
            bluetoothState = State.UNINITIALIZED
            Log.d(
                TAG, "stop done: BT state=$bluetoothState"
            )
            return true
        }

        override fun isScoOn(): Boolean {
            val communicationDevice: AudioDeviceInfo? = mAudioManager.communicationDevice
            if (communicationDevice !== null) {
                val isOn =
                    AudioDeviceEndpoint.TYPE_BLUETOOTH == AudioDeviceEndpointUtils.remapAudioDeviceTypeToCallEndpointType(
                        communicationDevice.type
                    )
                if (isOn) {
                    bluetoothAudioDevice = communicationDevice
                    return true
                }
            }
            return false
        }

        override fun startScoAudio(): Boolean {
            Log.d(
                TAG, ("startSco: BT state=" + bluetoothState + ", SCO is on: " + isScoOn())
            )
            val currentBtDevice = bluetoothAudioDevice
            if (currentBtDevice != null) {
                mAudioManager.setCommunicationDevice(currentBtDevice)
                bluetoothState = State.SCO_CONNECTED
                Log.d(
                    TAG,
                    "Set bluetooth audio device as communication device: id=${currentBtDevice.id} name=${currentBtDevice.productName}"
                )
                return true
            }
            bluetoothState = State.HEADSET_UNAVAILABLE
            Log.e(
                TAG, "Cannot find any bluetooth SCO device to set as communication device"
            )
            return false
        }

        override fun updateDevice() {
            if (bluetoothState == State.UNINITIALIZED) {
                return
            }
            if (bluetoothState == State.SCO_CONNECTED) {
                if (isScoOn()) {
                    return
                }
            }
            bluetoothAudioDevice = getAvailableBtDevice()
            val currentBtDevice = bluetoothAudioDevice
            if (currentBtDevice != null) {
                bluetoothState = State.HEADSET_AVAILABLE
                Log.d(
                    TAG, ("Connected bluetooth headset: " + "name=" + currentBtDevice.productName)
                )
            } else {
                bluetoothState = State.HEADSET_UNAVAILABLE
            }
            Log.d(
                TAG, "updateDevice done: BT state=$bluetoothState"
            )
        }

        override fun getDeviceName(): String? {
            return bluetoothAudioDevice?.productName?.toString()
        }

        override fun stopScoAudio(): Boolean {
            if (!super.stopScoAudio()) {
                return false
            }
            mAudioManager.clearCommunicationDevice()
            bluetoothState = State.SCO_DISCONNECTING
            Log.d(TAG, "stopScoAudio done: BT state=$bluetoothState + SCO is on: ${isScoOn()}")
            return true
        }
    }

    @Suppress("DEPRECATION")
    inner class BluetoothManager23PlusImpl : BluetoothManagerPlatform() {
        private var scoConnectionAttempts: Int = 0
        private var mBluetoothAdapter: BluetoothAdapter? = null
        private var bluetoothHeadset: BluetoothHeadset? = null
        private var bluetoothDevice: BluetoothDevice? = null
        private val handler = Handler(Looper.getMainLooper())

        private val bluetoothTimeoutRunnable = Runnable { bluetoothTimeout() }

        private val bluetoothServiceListener: BluetoothProfile.ServiceListener =
            object : BluetoothProfile.ServiceListener {
                override fun onServiceConnected(profile: Int, proxy: BluetoothProfile?) {
                    if (profile != BluetoothProfile.HEADSET || bluetoothState == State.UNINITIALIZED) {
                        return
                    }
                    Log.d(
                        TAG, "BluetoothServiceListener.onServiceConnected: BT state=$bluetoothState"
                    )
                    // Android only supports one connected Bluetooth Headset at a time.
                    bluetoothHeadset = proxy as BluetoothHeadset
                    updateAudioDeviceState()
                    Log.d(
                        TAG, "onServiceConnected done: BT state=$bluetoothState"
                    )
                }

                override fun onServiceDisconnected(profile: Int) {
                    if (profile != BluetoothProfile.HEADSET || bluetoothState == State.UNINITIALIZED) {
                        return
                    }
                    Log.d(
                        TAG,
                        "BluetoothServiceListener.onServiceDisconnected: BT state=$bluetoothState"
                    )
                    stopScoAudio()
                    bluetoothHeadset = null
                    bluetoothDevice = null
                    bluetoothState = State.HEADSET_UNAVAILABLE
                    updateAudioDeviceState()
                    Log.d(
                        TAG, "onServiceDisconnected done: BT state=$bluetoothState"
                    )
                }

            }

        private val bluetoothHeadsetReceiver: BroadcastReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent) {
                if (bluetoothState == State.UNINITIALIZED) {
                    return
                }
                val action = intent.action
                // Change in connection state of the Headset profile. Note that the
                // change does not tell us anything about whether we're streaming
                // audio to BT over SCO. Typically received when user turns on a BT
                // headset while audio is active using another audio device.
                if (action == BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED) {
                    val state = intent.getIntExtra(
                        BluetoothHeadset.EXTRA_STATE, BluetoothHeadset.STATE_DISCONNECTED
                    )
                    Log.d(
                        TAG,
                        ("BluetoothHeadsetBroadcastReceiver.onReceive: " + "a=ACTION_CONNECTION_STATE_CHANGED, " + "s=" + stateToString(
                            state
                        ) + ", " + "sb=" + isInitialStickyBroadcast + ", " + "BT state: " + bluetoothState)
                    )
                    if (state == BluetoothHeadset.STATE_CONNECTED) {
                        scoConnectionAttempts = 0
                        updateAudioDeviceState()
                    } else if (state == BluetoothHeadset.STATE_CONNECTING) {
                        // No action needed.
                    } else if (state == BluetoothHeadset.STATE_DISCONNECTING) {
                        // No action needed.
                    } else if (state == BluetoothHeadset.STATE_DISCONNECTED) {
                        // Bluetooth is probably powered off during the call.
                        stopScoAudio()
                        updateAudioDeviceState()
                    }
                    // Change in the audio (SCO) connection state of the Headset profile.
                    // Typically received after call to startScoAudio() has finalized.
                } else if (action == BluetoothHeadset.ACTION_AUDIO_STATE_CHANGED) {
                    val state = intent.getIntExtra(
                        BluetoothHeadset.EXTRA_STATE, BluetoothHeadset.STATE_AUDIO_DISCONNECTED
                    )
                    Log.d(
                        TAG,
                        ("BluetoothHeadsetBroadcastReceiver.onReceive: " + "a=ACTION_AUDIO_STATE_CHANGED, " + "s=" + stateToString(
                            state
                        ) + ", " + "sb=" + isInitialStickyBroadcast + ", " + "BT state: " + bluetoothState)
                    )
                    if (state == BluetoothHeadset.STATE_AUDIO_CONNECTED) {
                        cancelTimer()
                        if (bluetoothState == State.SCO_CONNECTING) {
                            Log.d(
                                TAG, "+++ Bluetooth audio SCO is now connected"
                            )
                            bluetoothState = State.SCO_CONNECTED
                            scoConnectionAttempts = 0
                            updateAudioDeviceState()
                        } else {
                            Log.w(
                                TAG, "Unexpected state BluetoothHeadset.STATE_AUDIO_CONNECTED"
                            )
                        }
                    } else if (state == BluetoothHeadset.STATE_AUDIO_CONNECTING) {
                        Log.d(
                            TAG, "+++ Bluetooth audio SCO is now connecting..."
                        )
                    } else if (state == BluetoothHeadset.STATE_AUDIO_DISCONNECTED) {
                        Log.d(
                            TAG, "+++ Bluetooth audio SCO is now disconnected"
                        )
                        if (isInitialStickyBroadcast) {
                            Log.d(
                                TAG, "Ignore STATE_AUDIO_DISCONNECTED initial sticky broadcast."
                            )
                            return
                        }
                        updateAudioDeviceState()
                    }
                }
                Log.d(
                    TAG, "onReceive done: BT state=$bluetoothState"
                )
            }

        }

        override fun hasPermission(): Boolean {
            return mReactContext.checkSelfPermission(Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED
        }

        override fun isScoOn(): Boolean = mAudioManager.isBluetoothScoOn()

        override fun startScoAudio(): Boolean {
            Log.d(
                TAG,
                ("startSco: BT state=" + bluetoothState + ", " + "attempts: " + scoConnectionAttempts + ", " + "SCO is on: " + isScoOn())
            )
            if (scoConnectionAttempts >= MAX_SCO_CONNECTION_ATTEMPTS) {
                Log.e(TAG, "BT SCO connection fails - no more attempts")
                return false
            }
            if (bluetoothState == State.HEADSET_UNAVAILABLE) {
                Log.e(TAG, "BT SCO connection fails - no headset available")
                return false
            }

            // The SCO connection establishment can take several seconds, hence we cannot rely on the
            // connection to be available when the method returns but instead register to receive the
            // intent ACTION_SCO_AUDIO_STATE_UPDATED and wait for the state to be SCO_AUDIO_STATE_CONNECTED.
            // Start BT SCO channel and wait for ACTION_AUDIO_STATE_CHANGED.
            Log.d(
                TAG, "Starting Bluetooth SCO and waits for ACTION_AUDIO_STATE_CHANGED..."
            )
            bluetoothState = State.SCO_CONNECTING
            startTimer()
            mAudioManager.startBluetoothSco()
            mAudioManager.setBluetoothScoOn(true)
            scoConnectionAttempts++
            Log.d(
                TAG,
                ("startScoAudio done: BT state=" + bluetoothState + ", " + "SCO is on: " + isScoOn())
            )
            return true
        }

        @SuppressLint("MissingPermission")
        override fun updateDevice() {
            val currBtHeadset = bluetoothHeadset
            if (bluetoothState == State.UNINITIALIZED || currBtHeadset == null) {
                return
            }
            // Get connected devices for the headset profile. Returns the set of
            // devices which are in state STATE_CONNECTED. The BluetoothDevice class
            // is just a thin wrapper for a Bluetooth hardware address.
            val devices = getFinalConnectedDevices()
            for (device in devices) {
                Log.d(
                    TAG,
                    ("Connected bluetooth headset: " + "name=" + device.name + ", " + "state=" + stateToString(
                        currBtHeadset.getConnectionState(device)
                    ))
                )
            }
            if (devices.isEmpty()) {
                bluetoothDevice = null
                bluetoothState = State.HEADSET_UNAVAILABLE
                Log.d(TAG, "No connected bluetooth headset")
            } else {
                // Always use first device in list. Android only supports one device.
                val firstBtDevice = devices[0]
                bluetoothDevice = firstBtDevice
                bluetoothState = State.HEADSET_AVAILABLE
                Log.d(
                    TAG,
                    ("Connected bluetooth headset: " + "name=" + firstBtDevice.name + ", " + "state=" + stateToString(
                        currBtHeadset.getConnectionState(
                            bluetoothDevice
                        )
                    ) + ", SCO audio=" + currBtHeadset.isAudioConnected(
                        bluetoothDevice
                    ))
                )
            }

            Log.d(
                TAG, "updateDevice done: BT state=$bluetoothState"
            )
        }

        @SuppressLint("MissingPermission")
        override fun getDeviceName(): String? {
            return bluetoothDevice?.name
        }

        @SuppressLint("MissingPermission")
        override fun start(): Boolean {
            if (!super.start()) {
                return false
            }
            val bluetoothManager: BluetoothManager =
                mReactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            mBluetoothAdapter = bluetoothManager.adapter
            bluetoothHeadset = null
            bluetoothDevice = null
            scoConnectionAttempts = 0

            // Establish a connection to the HEADSET profile (includes both Bluetooth Headset and
            // Hands-Free) proxy object and install a listener.
            if (!getBluetoothProfileProxy(
                    mReactContext, bluetoothServiceListener
                )
            ) {
                Log.e(
                    TAG, "BluetoothAdapter.getProfileProxy(HEADSET) failed"
                )
                return false
            }

            // Register receivers for BluetoothHeadset change notifications.
            val bluetoothHeadsetFilter = IntentFilter()
            // Register receiver for change in connection state of the Headset profile.
            bluetoothHeadsetFilter.addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED)
            // Register receiver for change in audio connection state of the Headset profile.
            bluetoothHeadsetFilter.addAction(BluetoothHeadset.ACTION_AUDIO_STATE_CHANGED)
            ContextCompat.registerReceiver(
                mReactContext,
                bluetoothHeadsetReceiver,
                bluetoothHeadsetFilter,
                ContextCompat.RECEIVER_NOT_EXPORTED
            )
            bluetoothState = State.HEADSET_UNAVAILABLE
            Log.d(
                TAG, "HEADSET profile state: " + stateToString(
                    mBluetoothAdapter?.getProfileConnectionState(
                        BluetoothProfile.HEADSET
                    ) ?: -1
                )
            )

            Log.d(TAG, "Bluetooth proxy for headset profile has started")
            Log.d(
                TAG, "start done: BT state=$bluetoothState"
            )
            return true
        }

        override fun stop(): Boolean {
            if (!super.stop()) {
                return false
            }
            if (mBluetoothAdapter == null) {
                return false
            }
            // Stop BT SCO connection with remote device if needed.
            stopScoAudio()
            try {
                mReactContext.unregisterReceiver(bluetoothHeadsetReceiver)
                bluetoothHeadset?.also {
                    mBluetoothAdapter!!.closeProfileProxy(BluetoothProfile.HEADSET, it)
                }

            } catch (exception: Exception) {
                // The receiver was not registered.
                // There is nothing to do in that case.
                // Everything is fine.
            }
            cancelTimer()
            return true
        }

        override fun stopScoAudio(): Boolean {
            if (!super.stopScoAudio()) {
                return false
            }
            cancelTimer()
            mAudioManager.stopBluetoothSco()
            mAudioManager.setBluetoothScoOn(false)

            bluetoothState = State.SCO_DISCONNECTING
            Log.d(
                TAG,
                ("stopScoAudio done: BT state=" + bluetoothState + ", " + "SCO is on: " + isScoOn())
            )
            return true
        }

        /**
         * Called when start of the BT SCO channel takes too long time. Usually
         * happens when the BT device has been turned on during an ongoing call.
         */
        @SuppressLint("MissingPermission")
        private fun bluetoothTimeout() {
            val btHeadset = bluetoothHeadset
            if (bluetoothState == State.UNINITIALIZED || btHeadset == null) {
                return
            }

            Log.d(
                TAG,
                ("bluetoothTimeout: BT state=" + bluetoothState + ", " + "attempts: " + scoConnectionAttempts + ", " + "SCO is on: " + isScoOn())
            )
            if (bluetoothState != State.SCO_CONNECTING) {
                return
            }
            // Bluetooth SCO should be connecting; check the latest result.
            var scoConnected = false
            val devices: List<BluetoothDevice> = getFinalConnectedDevices()
            if (devices.isNotEmpty()) {
                bluetoothDevice = devices[0]
                val currBtDevice = bluetoothDevice!!
                if (btHeadset.isAudioConnected(currBtDevice)) {
                    Log.d(
                        TAG, "SCO connected with " + currBtDevice.name
                    )
                    scoConnected = true
                } else {
                    Log.d(
                        TAG, "SCO is not connected with " + currBtDevice.name
                    )
                }

                if (scoConnected) {
                    // We thought BT had timed out, but it's actually on; updating state.
                    bluetoothState = State.SCO_CONNECTED
                    scoConnectionAttempts = 0
                } else {
                    // Give up and "cancel" our request by calling stopBluetoothSco().
                    Log.w(TAG, "BT failed to connect after timeout")
                    stopScoAudio()
                }
            }
            updateAudioDeviceState()
            Log.d(
                TAG, "bluetoothTimeout done: BT state=$bluetoothState"
            )
        }

        @SuppressLint("MissingPermission")
        private fun getFinalConnectedDevices(): List<BluetoothDevice> {
            val connectedDevices = bluetoothHeadset?.connectedDevices ?: emptyList()
            val finalDevices: MutableList<BluetoothDevice> = ArrayList()

            Log.d(TAG, "getFinalConnectedDevices: connectedDevices=$connectedDevices")

            for (device in connectedDevices) {
                val majorClass = device.bluetoothClass.majorDeviceClass

                if (majorClass == BluetoothClass.Device.Major.AUDIO_VIDEO) {
                    Log.d(TAG, "getFinalConnectedDevices: device=${device.name}")
                    finalDevices.add(device)
                }
            }
            return finalDevices
        }

        private fun getBluetoothProfileProxy(
            context: Context?, listener: BluetoothProfile.ServiceListener?
        ): Boolean {
            try {
                return mBluetoothAdapter?.getProfileProxy(
                    context,
                    listener,
                    BluetoothProfile.HEADSET
                ) ?: false
            } catch (e: Exception) {
                Log.e(TAG, "gBPP: hit exception while getting bluetooth profile", e)
                return false
            }
        }

        /** Starts timer which times out after BLUETOOTH_SCO_TIMEOUT_MS milliseconds.  */
        private fun startTimer() {
            Log.d(TAG, "startTimer")
            handler.postDelayed(
                bluetoothTimeoutRunnable, BLUETOOTH_SCO_TIMEOUT_MS.toLong()
            )
        }

        /** Cancels any outstanding timer tasks.  */
        private fun cancelTimer() {
            Log.d(TAG, "cancelTimer")
            handler.removeCallbacks(bluetoothTimeoutRunnable)
        }
    }

    companion object {
        private val TAG: String =
            InCallManagerModule.TAG + ":" + AppRTCBluetoothManager::class.java.simpleName.toString()

        // Timeout interval for starting or stopping audio to a Bluetooth SCO device.
        private const val BLUETOOTH_SCO_TIMEOUT_MS: Int = 6000

        // Maximum number of SCO connection attempts.
        private const val MAX_SCO_CONNECTION_ATTEMPTS: Int = 10

        private fun stateToString(state: Int): String {
            return when (state) {
                BluetoothAdapter.STATE_DISCONNECTED -> "DISCONNECTED"
                BluetoothAdapter.STATE_CONNECTED -> "CONNECTED"
                BluetoothAdapter.STATE_CONNECTING -> "CONNECTING"
                BluetoothAdapter.STATE_DISCONNECTING -> "DISCONNECTING"
                BluetoothAdapter.STATE_OFF -> "OFF"
                BluetoothAdapter.STATE_ON -> "ON"
                BluetoothAdapter.STATE_TURNING_OFF ->         // Indicates the local Bluetooth adapter is turning off. Local clients should immediately
                    // attempt graceful disconnection of any remote links.
                    "TURNING_OFF"

                BluetoothAdapter.STATE_TURNING_ON ->         // Indicates the local Bluetooth adapter is turning on. However local clients should wait
                    // for STATE_ON before attempting to use the adapter.
                    "TURNING_ON"

                else -> "INVALID"
            }
        }
    }
}
