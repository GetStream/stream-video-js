import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.streamvideo.reactnative.audio.utils.AudioDeviceEndpointUtils
import com.streamvideo.reactnative.audio.utils.AudioSetupStoreUtil
import com.streamvideo.reactnative.audio.utils.CallAudioRole
import com.streamvideo.reactnative.callmanager.ProximityManager
import com.streamvideo.reactnative.callmanager.StreamInCallManagerModule
import com.streamvideo.reactnative.model.AudioDeviceEndpoint
import com.streamvideo.reactnative.model.AudioDeviceEndpoint.Companion.EndpointType

class AudioDeviceManager(
    private val mReactContext: ReactApplicationContext
) : AutoCloseable, AudioDeviceCallback(), AudioManager.OnAudioFocusChangeListener {

    private val mEndpointMaps by lazy {
        // This map will store the audio device endpoints for each endpoint type
        // For example, a map like: { EndpointType.Speakerphone: [device1, device2], EndpointType.Bluetooth: [device3, device4] }
        // This is a simplified representation; in a real app, you'd have a more complex structure
        // to manage multiple audio devices of the same type.
        mutableMapOf<EndpointType, MutableList<AudioDeviceEndpoint>>()
    }

    /** Returns the currently selected audio device. */
    private var _selectedAudioDeviceEndpoint: AudioDeviceEndpoint? = null
    var selectedAudioDeviceEndpoint: AudioDeviceEndpoint?
        get() = _selectedAudioDeviceEndpoint
        set(value) {
            _selectedAudioDeviceEndpoint = value
            // send an event to the frontend everytime this endpoint changes
            sendAudioStatusEvent()
            if (callAudioRole == CallAudioRole.Communicator) {
                proximityManager.update()
            }
        }

    // Default audio device; speaker phone for video calls or earpiece for audio only phone calls
    private var userSelectedAudioDevice: AudioDeviceEndpoint? = null

    private var audioSetupStoreUtil = AudioSetupStoreUtil(mReactContext, mAudioManager, this)

    var callAudioRole: CallAudioRole = CallAudioRole.Communicator

    val bluetoothManager = BluetoothManager(mReactContext, this)

    private val proximityManager by lazy { ProximityManager(mReactContext, this) }

    init {
        // Note that we will immediately receive a call to onDevicesAdded with the list of
        // available audio devices. We need to populate our mEndpointMaps.
        // This is a placeholder; in a real app, you'd iterate through the addedDevices
        // and categorize them into mEndpointMaps.
        // For now, we'll just ensure mEndpointMaps is initialized.
    }

    fun start(activity: Activity) {
        runInAudioThread {
            userSelectedAudioDevice = null
            selectedAudioDeviceEndpoint = null
            audioSetupStoreUtil.storeOriginalAudioSetup()
            if (callAudioRole == CallAudioRole.Communicator) {
                // Audio routing is manually controlled by the SDK in communication media mode
                // and local microphone can be published
                mAudioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                activity.volumeControlStream = AudioManager.STREAM_VOICE_CALL
                bluetoothManager.start()
                mAudioManager.registerAudioDeviceCallback(this, null)
                updateAudioDeviceState()
                proximityManager.start()
            } else {
                // Audio routing is handled automatically by the system in normal media mode
                // and bluetooth microphones may not work on some devices.
                // In this case, we might not need to register for audio device changes
                // or manage proximity if it's not a communication role.
                // For now, we'll just ensure the default audio device is set.
                mAudioManager.setSpeakerphoneOn(true) // Default to speakerphone for non-communicator roles
            }
        }
    }

    fun stop() {
        runInAudioThread {
            if (callAudioRole == CallAudioRole.Communicator) {
                if (Build.VERSION.SDK_INT >= 31) {
                    mAudioManager.clearCommunicationDevice()
                } else {
                    mAudioManager.setSpeakerphoneOn(false)
                }
                bluetoothManager.stop()
                proximityManager.stop()
            }
            audioSetupStoreUtil.restoreOriginalAudioSetup()
            audioFocusUtil.abandonFocus()
        }
    }

    override fun close() {
        mAudioManager.unregisterAudioDeviceCallback(this)
        proximityManager.onDestroy()
    }

    override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        if (addedDevices != null) {
            // This is a placeholder. In a real app, you'd iterate through addedDevices
            // and categorize them into mEndpointMaps.
            // For now, we'll just log that devices were added.
            Log.d("AudioDeviceManager", "Devices added: ${addedDevices.size}")
        }
    }

    override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
        if (removedDevices != null) {
            // This is a placeholder. In a real app, you'd update mEndpointMaps
            // to remove the removed devices.
            // For now, we'll just log that devices were removed.
            Log.d("AudioDeviceManager", "Devices removed: ${removedDevices.size}")
        }
    }

    override fun onAudioFocusChange(focusChange: Int) {
        // This is a placeholder. In a real app, you'd handle audio focus changes
        // to ensure the correct audio device is selected.
        Log.d("AudioDeviceManager", "Audio focus changed: $focusChange")
    }

    private fun sendAudioStatusEvent() {
        val eventEmitter = mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        val event = WritableMap()
        event.putString("eventType", "audioStatus")
        event.putString("selectedAudioDevice", selectedAudioDeviceEndpoint?.name)
        eventEmitter.emit("audioStatus", event)
    }

    private fun runInAudioThread(action: () -> Unit) {
        // This is a placeholder. In a real app, you'd have a proper audio thread
        // to perform audio-related operations.
        // For now, we'll just execute the action directly.
        action()
    }

    private fun updateAudioDeviceState() {
        // This is a placeholder. In a real app, you'd update the UI or send events
        // to the frontend to reflect the current audio device state.
        Log.d("AudioDeviceManager", "Updating audio device state. Current selected: ${selectedAudioDeviceEndpoint?.name}")
    }
}
