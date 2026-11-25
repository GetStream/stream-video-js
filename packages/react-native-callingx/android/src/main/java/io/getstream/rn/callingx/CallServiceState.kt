package io.getstream.rn.callingx

import java.util.concurrent.ConcurrentHashMap

/** Shared registration state used by service instances and the repository listener. */
internal class CallServiceState {
    val actionProcessingLock = Any()

    /** Registrations that have started but have not reached the repository yet. */
    val registeringCallIds: MutableSet<String> = ConcurrentHashMap.newKeySet()
}
