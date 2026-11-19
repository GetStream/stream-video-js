package io.getstream.rn.callingx

import android.content.Context
import io.getstream.rn.callingx.repo.CallRepository
import io.getstream.rn.callingx.repo.CallRepositoryFactory

/**
 * The one [CallRepository] of the process. It holds every call, including the coroutine that holds
 * each call in Telecom, so the calls don't depend on [CallService] being alive.
 *
 * [CallService], [CallingxModuleImpl] and the notification action handlers all reach the calls
 * through it. The repository is never released: the calls end when Telecom ends them or when the
 * app hangs them up, not when a service stops.
 */
internal object CallRepositoryHolder {
    @Volatile private var instance: CallRepository? = null

    fun get(context: Context): CallRepository =
            instance
                    ?: synchronized(this) {
                        instance
                                ?: CallRepositoryFactory.create(context.applicationContext).also {
                                    repository ->
                                    repository.setEventsListener(
                                            CallEventsPublisher(context, repository)
                                    )
                                    instance = repository
                                }
                    }
}
