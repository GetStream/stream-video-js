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

class HeadlessTaskManager(private val context: Context) : HeadlessJsTaskEventListener {

  private var activeTaskId: Int? = null
  private var isStarting: Boolean = false

  companion object {
    private const val TAG = "[Callingx] HeadlessTaskManager"
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
    debugLog(TAG, "[headless] invokeStartTask: Invoking start task")
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactContext)
    headlessJsTaskContext.addTaskEventListener(this)

    UiThreadUtil.runOnUiThread {
      val taskId = headlessJsTaskContext.startTask(taskConfig)
      activeTaskId = taskId
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
    stopHeadlessTask()
    isStarting = false
    // Defer cleanup to the back of the main-thread queue so any finish callback already
    // posted by finishTask() drains first — otherwise we'd unregister the listener before
    // it fires and lose the finish log.
    UiThreadUtil.runOnUiThread {
      activeTaskId = null
      reactContext?.let { context ->
        val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(context)
        headlessJsTaskContext.removeTaskEventListener(this)
      }
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
    activeTaskId = null
    isStarting = false
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
    if (ReactNativeFeatureFlags.enableBridgelessArchitecture()) {
      val reactHost = checkNotNull(reactHost)
      reactHost.addReactInstanceEventListener(
              object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                  debugLog(TAG, "createReactContextAndScheduleTask: React context initialized")
                  invokeStartTask(context, taskConfig)
                  reactHost.removeReactInstanceEventListener(this)
                }
              }
      )
      reactHost.start()
    } else {
      val reactInstanceManager = reactNativeHost.reactInstanceManager
      reactInstanceManager.addReactInstanceEventListener(
              object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                  debugLog(TAG, "createReactContextAndScheduleTask: React context initialized")
                  invokeStartTask(context, taskConfig)
                  reactInstanceManager.removeReactInstanceEventListener(this)
                }
              }
      )
      if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
        reactInstanceManager.createReactContextInBackground()
      }
    }
  }
}
