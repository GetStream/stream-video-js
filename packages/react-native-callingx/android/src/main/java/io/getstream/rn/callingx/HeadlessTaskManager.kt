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
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.jstasks.HeadlessJsTaskEventListener

class HeadlessTaskManager(private val context: Context) : HeadlessJsTaskEventListener {

  private var activeTaskId: Int? = null

  companion object {
    private const val TAG = "TelecomHeadlessJSHelper"
  }

  public fun startHeadlessTask(taskName: String, data: Bundle, timeout: Long) {
    Log.d(TAG, "[headless] startHeadlessTask: Starting headless task: $taskName, $data, $timeout")
    if (activeTaskId != null) {
      Log.w(TAG, "[headless] startHeadlessTask: Task already starting or active, ignoring new task request")
      return
    }

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
    Log.d(TAG, "[headless] stopHeadlessTask: Stopping headless task")
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
    // acquireWakeLockNow(this)

    val context = reactContext
    if (context == null) {
      createReactContextAndScheduleTask(taskConfig)
    } else {
      invokeStartTask(context, taskConfig)
    }
  }

  private fun invokeStartTask(reactContext: ReactContext, taskConfig: HeadlessJsTaskConfig) {
    Log.d(TAG, "[headless] invokeStartTask: Invoking start task")
    val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(reactContext)
    headlessJsTaskContext.addTaskEventListener(this)

    UiThreadUtil.runOnUiThread {
      val taskId = headlessJsTaskContext.startTask(taskConfig)
      activeTaskId = taskId
    }
  }

  private fun stopTask(taskId: Int) {
    reactContext?.let { context ->
      val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(context)
      if (headlessJsTaskContext.isTaskRunning(taskId)) {
        headlessJsTaskContext.finishTask(taskId)
        Log.d(TAG, "Stopped task: $taskId")
      }
    }
  }

  fun release() {
    stopHeadlessTask()

    reactContext?.let { context ->
      val headlessJsTaskContext = HeadlessJsTaskContext.getInstance(context)
      headlessJsTaskContext.removeTaskEventListener(this)
    }
    // wakeLock?.release()
  }

  override fun onHeadlessJsTaskStart(taskId: Int) {
    Log.d(TAG, "[headless] onHeadlessJsTaskStart: Task started: $taskId")
  }

  override fun onHeadlessJsTaskFinish(taskId: Int) {
    Log.d(TAG, "[headless] onHeadlessJsTaskFinish: Task finished: $taskId")
    activeTaskId = null
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
      if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
        val reactHost =
                checkNotNull(reactHost) { "ReactHost is not initialized in New Architecture" }
        return reactHost.currentReactContext
      } else {
        val reactInstanceManager = reactNativeHost.reactInstanceManager
        return reactInstanceManager.currentReactContext
      }
    }

  private fun createReactContextAndScheduleTask(taskConfig: HeadlessJsTaskConfig) {
    if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
      val reactHost = checkNotNull(reactHost)
      reactHost.addReactInstanceEventListener(
              object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                  Log.d(TAG, "createReactContextAndScheduleTask: React context initialized")
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
                  Log.d(TAG, "createReactContextAndScheduleTask: React context initialized")
                  invokeStartTask(context, taskConfig)
                  reactInstanceManager.removeReactInstanceEventListener(this)
                }
              }
      )
      reactInstanceManager.createReactContextInBackground()
    }
  }
}
