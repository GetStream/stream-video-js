package io.getstream.rn.callingx

import android.content.Context
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.jstasks.HeadlessJsTaskEventListener
import java.lang.ref.WeakReference

/**
 * @param onTaskFinished invoked after the active task finishes, unless the manager is being
 *   released. [CallService] uses it to re-evaluate whether it still has a reason to run: a
 *   call-less service is started by `acquireBackgroundTask` alone, and nothing else would ever
 *   stop it.
 */
class HeadlessTaskManager(
        private val context: Context,
        private val onTaskFinished: () -> Unit = {},
) : HeadlessJsTaskEventListener {

  @Volatile
  private var activeTaskId: Int? = null
  /** The React context [activeTaskId] was started on. See [hasActiveTask]. */
  @Volatile
  private var startedOnContext: WeakReference<ReactContext>? = null
  private var isStarting: Boolean = false
  private var pendingReactInstanceListener: ReactInstanceEventListener? = null
  @Volatile
  private var released: Boolean = false

  companion object {
    private const val TAG = "[Callingx] HeadlessTaskManager"
  }

  /**
   * True while a task we started is still running. The service treats this as a reason to stay
   * alive, so an abandoned task must not pin it forever.
   *
   * React Native drops in-flight headless tasks when a React context is reloaded or destroyed —
   * there is no teardown for them — and these tasks are started with `timeout = 0`, so nothing
   * would ever finish one and clear [activeTaskId]. The context the task was started on is
   * therefore checked against the live one, and a task orphaned by a reload is dropped here.
   */
  fun hasActiveTask(): Boolean {
    val taskId = activeTaskId ?: return false

    val startedOn = startedOnContext?.get()
    if (startedOn != null && startedOn === currentReactContextOrNull()) return true

    debugLog(
            TAG,
            "[headless] hasActiveTask: task $taskId was abandoned with its React context, clearing"
    )
    clearActiveTask()
    return false
  }

  private fun clearActiveTask() {
    activeTaskId = null
    startedOnContext = null
  }

  /**
   * [reactContext] throws when the host is not initialised, and this is read from the service's
   * stop paths, which run off the main thread. If no context can be resolved there is no task
   * either, so the caller treats null as "nothing running".
   */
  private fun currentReactContextOrNull(): ReactContext? =
          try {
            reactContext
          } catch (t: Throwable) {
            debugLog(TAG, "[headless] currentReactContextOrNull: unavailable: ${t.message}")
            null
          }

  private fun hasReactContext(): Boolean = reactContext != null

  // ensures the React context is running by booting it via the headless task if not already present
  fun ensureReactContext() {
    if (hasReactContext()) {
      debugLog(TAG, "[headless] ensureReactContext: React context already running, skipping boot")
      return
    }
    debugLog(
            TAG,
            "[headless] ensureReactContext: booting React context via keep-alive headless task"
    )
    startHeadlessTask(CallingxModuleImpl.HEADLESS_TASK_NAME, Bundle(), 0)
  }

  public fun startHeadlessTask(taskName: String, data: Bundle, timeout: Long) {
    debugLog(
            TAG,
            "[headless] startHeadlessTask entry: activeTaskId=$activeTaskId isStarting=$isStarting"
    )
    if (activeTaskId != null || isStarting) {
      Log.w(
              TAG,
              "[headless] startHeadlessTask: Task already starting or active, ignoring new task request"
      )
      return
    }
    isStarting = true

    if (UiThreadUtil.isOnUiThread()) {
      startTask(HeadlessJsTaskConfig(taskName, Arguments.fromBundle(data), timeout, true))
    } else {
      UiThreadUtil.runOnUiThread(
              Runnable {
                startTask(HeadlessJsTaskConfig(taskName, Arguments.fromBundle(data), timeout, true))
              }
      )
    }
  }

  public fun stopHeadlessTask() {
    debugLog(TAG, "[headless] stopHeadlessTask: Stopping headless task")
    activeTaskId?.let { taskId ->
      if (UiThreadUtil.isOnUiThread()) {
        stopTask(taskId)
      } else {
        UiThreadUtil.runOnUiThread(Runnable { stopTask(taskId) })
      }
    }
  }

  protected fun startTask(taskConfig: HeadlessJsTaskConfig) {
    UiThreadUtil.assertOnUiThread()

    val context = reactContext
    if (context == null) {
      createReactContextAndScheduleTask(taskConfig)
    } else {
      invokeStartTask(context, taskConfig)
    }
  }

  private fun invokeStartTask(reactContext: ReactContext, taskConfig: HeadlessJsTaskConfig) {
    if (released) {
      debugLog(TAG, "[headless] invokeStartTask: released, skipping")
      return
    }
    debugLog(TAG, "[headless] invokeStartTask: Invoking start task")
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactContext)
    headlessJsTaskContext.addTaskEventListener(this)

    UiThreadUtil.runOnUiThread {
      val taskId = headlessJsTaskContext.startTask(taskConfig)
      activeTaskId = taskId
      startedOnContext = WeakReference(reactContext)
      debugLog(TAG, "[headless] invokeStartTask: Task started: $taskId")
      isStarting = false
    }
  }

  private fun stopTask(taskId: Int) {
    reactContext?.let { context ->
      val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(context)
      if (headlessJsTaskContext.isTaskRunning(taskId)) {
        headlessJsTaskContext.finishTask(taskId)
        debugLog(TAG, "[headless] stopTask: Task finished $taskId")
      }
    }
  }

  fun release() {
    released = true
    stopHeadlessTask()
    isStarting = false
    // Proactively unregister the pending React-context init listener. Otherwise the callback
    // would fire after CallService is destroyed, invokeStartTask a stale task on this dead
    // manager, and register `this` as a task listener on the live ReactContext (leak).
    pendingReactInstanceListener?.let { listener ->
      removeReactInstanceEventListener(listener)
      pendingReactInstanceListener = null
    }
    // Defer cleanup to the back of the main-thread queue so any finish callback already
    // posted by finishTask() drains first — otherwise we'd unregister the listener before
    // it fires and lose the finish log.
    UiThreadUtil.runOnUiThread {
      clearActiveTask()
      reactContext?.let { context ->
        val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(context)
        headlessJsTaskContext.removeTaskEventListener(this)
      }
    }
  }

  private fun removeReactInstanceEventListener(listener: ReactInstanceEventListener) {
    try {
      if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
        reactHost?.removeReactInstanceEventListener(listener)
      } else {
        reactNativeHost.reactInstanceManager.removeReactInstanceEventListener(listener)
      }
    } catch (t: Throwable) {
      // Best-effort — RN may be in a torn-down state.
      debugLog(TAG, "[headless] failed to remove react-instance listener: ${t.message}")
    }
  }

  override fun onHeadlessJsTaskStart(taskId: Int) {
  }

  override fun onHeadlessJsTaskFinish(taskId: Int) {
    if (taskId != activeTaskId) {
      debugLog(
              TAG,
              "[headless] onHeadlessJsTaskFinish: IGNORED foreign taskId=$taskId (our=$activeTaskId)"
      )
      return
    }
    debugLog(TAG, "[headless] onHeadlessJsTaskFinish Task finished: $taskId state cleared: activeTaskId=null isStarting=false")
    clearActiveTask()
    isStarting = false

    if (released) {
      // release() runs from CallService.onDestroy and finishes the task itself; the service is
      // already going down, so re-entering its stop logic here would be noise at best.
      debugLog(TAG, "[headless] onHeadlessJsTaskFinish: released, skipping onTaskFinished")
      return
    }
    onTaskFinished()
  }

  /**
   * Get the [ReactNativeHost] used by this app. By default, assumes [getApplication] is an instance
   * of [ReactApplication] and calls [ReactApplication.reactNativeHost].
   *
   * Override this method if your application class does not implement `ReactApplication` or you
   * simply have a different mechanism for storing a `ReactNativeHost`, e.g. as a static field
   * somewhere.
   */
  @Suppress("DEPRECATION")
  protected open val reactNativeHost: ReactNativeHost
    get() = (context.applicationContext as ReactApplication).reactNativeHost

  /**
   * Get the [ReactHost] used by this app. By default, assumes [getApplication] is an instance of
   * [ReactApplication] and calls [ReactApplication.reactHost]. This method assumes it is called in
   * new architecture and returns null if not.
   */
  protected open val reactHost: ReactHost?
    get() = (context.applicationContext as ReactApplication).reactHost

  protected val reactContext: ReactContext?
    get() {
      if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
        val reactHost =
                checkNotNull(reactHost) { "ReactHost is not initialized in New Architecture" }
        return reactHost.currentReactContext
      } else {
        val reactInstanceManager = reactNativeHost.reactInstanceManager
        return reactInstanceManager.currentReactContext
      }
    }

  private fun createReactContextAndScheduleTask(taskConfig: HeadlessJsTaskConfig) {
    val listener = object : ReactInstanceEventListener {
      override fun onReactContextInitialized(context: ReactContext) {
        if (released) {
          debugLog(TAG, "[headless] onReactContextInitialized fired after release, ignoring")
          removeReactInstanceEventListener(this)
          pendingReactInstanceListener = null
          return
        }
        debugLog(TAG, "createReactContextAndScheduleTask: React context initialized")
        invokeStartTask(context, taskConfig)
        removeReactInstanceEventListener(this)
        pendingReactInstanceListener = null
      }
    }
    pendingReactInstanceListener = listener

    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      val reactHost = checkNotNull(reactHost)
      reactHost.addReactInstanceEventListener(listener)
      reactHost.start()
    } else {
      val reactInstanceManager = reactNativeHost.reactInstanceManager
      reactInstanceManager.addReactInstanceEventListener(listener)
      if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
        reactInstanceManager.createReactContextInBackground()
      }
    }
  }
}
