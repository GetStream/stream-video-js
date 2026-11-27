package io.getstream.rn.callingx

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.google.firebase.messaging.RemoteMessage
import io.getstream.rn.callingx.notifications.NotificationsConfig
import io.getstream.rn.callingx.utils.LifecycleListener
import io.getstream.rn.callingx.utils.SettingsStore
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import java.util.UUID
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class StreamMessagingHelperTest {

  private val context: Context = ApplicationProvider.getApplicationContext()

  @Before
  fun setUp() {
    mockkObject(
      NotificationsConfig,
      SettingsStore,
      LifecycleListener,
      CallEventBus,
      CallService.Companion,
    )
    // publish is @JvmStatic: Kotlin calls it as a static method, which mockkObject doesn't catch.
    mockkStatic(CallEventBus::class)
    every { NotificationsConfig.isSaved(any()) } returns true
    every { SettingsStore.shouldSkipIncomingPushInForeground(any()) } returns false
    every { LifecycleListener.isInForeground } returns false
    every { CallEventBus.publish(any()) } just Runs
    every { CallService.startIncomingCallFromPush(any(), any()) } just Runs
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  /**
   * A Stream `call.ring` push. Each test uses new message ids: [StreamMessagingHelper] remembers
   * the ids it handled for the life of the process, across tests.
   */
  private fun ringPush(
    messageId: String? = newMessageId(),
    data: Map<String, String> = mapOf(
      "sender" to "stream.video",
      "type" to "call.ring",
      "call_cid" to "default:abc",
    ),
  ): RemoteMessage =
    RemoteMessage.Builder("test@fcm.googleapis.com")
      .apply { if (messageId != null) setMessageId(messageId) }
      .setData(data)
      .build()

  private fun newMessageId() = "0:${UUID.randomUUID()}"

  private fun verifyIncomingCallsStarted(count: Int) {
    verify(exactly = count) { CallService.startIncomingCallFromPush(any(), any()) }
  }

  private fun verifyRingPushesSentToJs(count: Int) {
    verify(exactly = count) {
      CallEventBus.publish(match { it.action == CallingxModuleImpl.CALL_RING_PUSH_ACTION })
    }
  }

  @Test
  fun `starts the incoming call for a ring push and tells JS about it`() {
    StreamMessagingHelper.handleMessage(context, ringPush())

    verifyIncomingCallsStarted(1)
    verifyRingPushesSentToJs(1)
  }

  @Test
  fun `starts the incoming call once when the same push arrives twice`() {
    val push = ringPush()

    // Once from StreamMessagingReceiver, once from an app service that forwards it.
    StreamMessagingHelper.handleMessage(context, push)
    StreamMessagingHelper.handleMessage(context, push)

    verifyIncomingCallsStarted(1)
    verifyRingPushesSentToJs(1)
  }

  @Test
  fun `starts an incoming call for each of two different pushes`() {
    StreamMessagingHelper.handleMessage(context, ringPush())
    StreamMessagingHelper.handleMessage(context, ringPush())

    verifyIncomingCallsStarted(2)
  }

  @Test
  fun `handles a push without a message id every time`() {
    val push = ringPush(messageId = null)

    StreamMessagingHelper.handleMessage(context, push)
    StreamMessagingHelper.handleMessage(context, push)

    verifyIncomingCallsStarted(2)
  }

  @Test
  fun `ignores a push that is not a Stream ring`() {
    StreamMessagingHelper.handleMessage(
      context,
      ringPush(data = mapOf("sender" to "stream.video", "type" to "call.missed", "call_cid" to "default:abc")),
    )
    StreamMessagingHelper.handleMessage(
      context,
      ringPush(data = mapOf("sender" to "someone.else", "type" to "call.ring", "call_cid" to "default:abc")),
    )

    verifyIncomingCallsStarted(0)
    verifyRingPushesSentToJs(0)
  }

  @Test
  fun `ignores a ring push without a call cid`() {
    StreamMessagingHelper.handleMessage(
      context,
      ringPush(data = mapOf("sender" to "stream.video", "type" to "call.ring")),
    )

    verifyIncomingCallsStarted(0)
  }

  @Test
  fun `ignores a ring push until setPushConfig has run, and handles it once it has`() {
    val push = ringPush()
    every { NotificationsConfig.isSaved(any()) } returns false

    StreamMessagingHelper.handleMessage(context, push)
    verifyIncomingCallsStarted(0)

    // A push skipped before setup is not remembered as handled.
    every { NotificationsConfig.isSaved(any()) } returns true
    StreamMessagingHelper.handleMessage(context, push)
    verifyIncomingCallsStarted(1)
  }

  @Test
  fun `leaves a ring push to JS while the app is open, when the app asks for that`() {
    every { SettingsStore.shouldSkipIncomingPushInForeground(any()) } returns true
    every { LifecycleListener.isInForeground } returns true

    StreamMessagingHelper.handleMessage(context, ringPush())

    verifyRingPushesSentToJs(1)
    verifyIncomingCallsStarted(0)
  }
}
