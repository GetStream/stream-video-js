package io.getstream.rn.callingx

import android.content.Context
import android.content.Intent
import android.telecom.DisconnectCause
import androidx.core.app.NotificationManagerCompat
import io.getstream.rn.callingx.model.Call
import io.getstream.rn.callingx.notifications.CallNotificationManager
import io.getstream.rn.callingx.repo.CallRepositoryFactory
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** Owns shared native call resources until explicitly destroyed. */
internal class CallingxClient private constructor(context: Context) {
    companion object {
        @Volatile private var instance: CallingxClient? = null
        private val terminationMutex = Mutex()

        fun getOrCreate(context: Context): CallingxClient = synchronized(this) {
            instance ?: CallingxClient(context.applicationContext).also { instance = it }
        }

        fun getOrNull(): CallingxClient? = instance

        // Called on Main. Capture the instance before waiting so a duplicate termination
        // cannot release a different client created after the first termination completes.
        suspend fun terminateExisting() {
            val client = synchronized(this) { instance } ?: return
            terminationMutex.withLock {
                if (instance !== client) return@withLock
                client.isTerminating = true
                val callIds = (CallRegistrationStore.getTrackedCallIds() +
                    client.callRepository.calls.value.keys +
                    client.serviceState.registeringCallIds).toSet()
                callIds.forEach { callId ->
                    CallRegistrationStore.reportRegistrationFail(
                        callId, "CLIENT_TERMINATED", "Callingx client is terminating", null,
                    )
                }
                client.attachedService?.terminateClient()
                client.destroy(callIds)
            }
        }
    }

    private val applicationContext = context.applicationContext
    val notificationManager = CallNotificationManager(applicationContext)
    val callRepository = CallRepositoryFactory.getOrCreate(applicationContext)
    val serviceState = CallServiceState()
    val callEndCoordinator = CallEndCoordinator(applicationContext)

    private var attachedService: CallService? = null
    @Volatile var isTerminating = false
        private set

    val repositoryListener = callRepository._listener ?: CallRepositoryListener(
            callRepository = callRepository,
            notificationManager = notificationManager,
            registeringCallIds = serviceState.registeringCallIds,
            actionProcessingLock = serviceState.actionProcessingLock,
            updateCallNotification = ::updateRegisteredCallNotification,
            onCallRemoved = ::onRepositoryCallRemoved,
            sendBroadcastEvent = ::sendBroadcastEvent,
    ).also { callRepository.setListener(it) }

    @Synchronized
    fun attachService(service: CallService) {
        if (!isTerminating) attachedService = service
    }

    @Synchronized
    fun detachService(service: CallService) {
        if (attachedService === service) attachedService = null
    }

    @Synchronized
    private fun updateRegisteredCallNotification(callId: String, call: Call.Registered) {
        val service = attachedService ?: return
        val notificationId = notificationManager.getOrCreateNotificationId(callId)
        if (service.isInForeground) {
            notificationManager.updateCallNotification(callId, call)
        } else {
            notificationManager.resetOptimisticState(callId)
            // Recover the foreground anchor if an earlier promotion failed or was removed.
            val notification = notificationManager.createNotification(callId, call)
            service.startForegroundSafely(callId, notificationId, notification)
        }
    }

    @Synchronized
    private fun onRepositoryCallRemoved(callId: String) {
        val service = attachedService
        service?.repromoteForegroundIfNeeded(callId)
        if (!callRepository.hasRingingCall()) notificationManager.stopRingtone()
        service?.stopServiceIfIdle()
    }

    internal fun sendBroadcastEvent(action: String, applyParams: Intent.() -> Unit = {}) {
        applicationContext.sendBroadcast(Intent(action).apply {
            setPackage(applicationContext.packageName)
            applyParams(this)
        })
    }

    /** Call after service work has stopped; a later getOrCreate creates fresh resources. */
    private fun destroy(callIds: Set<String>) = synchronized(Companion) {
        if (instance !== this) return@synchronized

        synchronized(serviceState.actionProcessingLock) {
            (callIds + callRepository.calls.value.keys + serviceState.registeringCallIds).forEach { callId ->
                CallRegistrationStore.discardCallState(callId)
                AudioEndpointStore.clear(callId)
            }
            CallRepositoryFactory.release(callRepository)
            notificationManager.cancelAllNotifications()
            notificationManager.stopRingtone()
            serviceState.registeringCallIds.clear()
            synchronized(this) { attachedService = null }
            instance = null
        }
    }
}
