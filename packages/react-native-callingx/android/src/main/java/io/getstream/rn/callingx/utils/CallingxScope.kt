package io.getstream.rn.callingx.utils

import android.util.Log
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlin.coroutines.CoroutineContext

/**
 * Coroutine scope that lives as long as the app process. It is never cancelled.
 *
 * Use it for work that must finish even when the component that started it goes away. For
 * example, [io.getstream.rn.callingx.CallService] uses it to hang up its calls in Telecom after
 * Android has already destroyed the service, so a call is never left ringing with nothing able to
 * end it.
 *
 * It is tied to the process rather than to the JavaScript client on purpose: after a push wakes a
 * killed app, the call is registered natively before any JavaScript runs, and it must still be
 * possible to end it if JavaScript never starts.
 *
 * A failure in one launched job is logged and does not cancel the others.
 */
internal object CallingxScope : CoroutineScope {
    private const val TAG = "[Callingx] CallingxScope"

    private val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
        Log.e(TAG, "Uncaught error in a callingx background job: ${throwable.message}", throwable)
    }

    override val coroutineContext: CoroutineContext =
            SupervisorJob() + Dispatchers.Default + exceptionHandler
}
