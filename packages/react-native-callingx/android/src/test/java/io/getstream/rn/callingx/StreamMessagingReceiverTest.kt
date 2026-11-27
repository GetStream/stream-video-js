package io.getstream.rn.callingx

import android.content.Context
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import com.google.firebase.messaging.RemoteMessage
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class StreamMessagingReceiverTest {

  private val context: Context = ApplicationProvider.getApplicationContext()
  private val receiver = StreamMessagingReceiver()

  @Before
  fun setUp() {
    // handleMessage is @JvmStatic: Kotlin calls it as a static method, which mockkObject doesn't catch.
    mockkStatic(StreamMessagingHelper::class)
    every { StreamMessagingHelper.handleMessage(any(), any()) } just Runs
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  /** The broadcast Google Play services sends for a push, with the message's fields as extras. */
  private fun pushIntent(vararg extras: Pair<String, String>) =
    Intent("com.google.android.c2dm.intent.RECEIVE").apply {
      extras.forEach { (key, value) -> putExtra(key, value) }
    }

  @Test
  fun `passes a push to handleMessage with its message id and data`() {
    receiver.onReceive(
      context,
      pushIntent(
        "google.message_id" to "0:1",
        "message_type" to "gcm",
        "sender" to "stream.video",
        "type" to "call.ring",
        "call_cid" to "default:abc",
      ),
    )

    val message = slot<RemoteMessage>()
    verify(exactly = 1) { StreamMessagingHelper.handleMessage(any(), capture(message)) }
    assertEquals("0:1", message.captured.messageId)
    assertEquals("call.ring", message.captured.data["type"])
    assertEquals("default:abc", message.captured.data["call_cid"])
  }

  @Test
  fun `passes a push that has no message type`() {
    receiver.onReceive(context, pushIntent("google.message_id" to "0:1", "type" to "call.ring"))

    verify(exactly = 1) { StreamMessagingHelper.handleMessage(any(), any()) }
  }

  @Test
  fun `ignores the notice that Firebase deleted pending messages`() {
    receiver.onReceive(
      context,
      pushIntent("google.message_id" to "0:1", "message_type" to "deleted_messages"),
    )

    verify(exactly = 0) { StreamMessagingHelper.handleMessage(any(), any()) }
  }

  @Test
  fun `ignores the notices about upstream messages the app sent`() {
    receiver.onReceive(
      context,
      pushIntent("google.message_id" to "0:1", "message_type" to "send_event"),
    )
    receiver.onReceive(
      context,
      pushIntent("google.message_id" to "0:2", "message_type" to "send_error"),
    )

    verify(exactly = 0) { StreamMessagingHelper.handleMessage(any(), any()) }
  }

  @Test
  fun `ignores a broadcast that is not a Firebase message`() {
    receiver.onReceive(context, pushIntent("type" to "call.ring"))

    verify(exactly = 0) { StreamMessagingHelper.handleMessage(any(), any()) }
  }

  @Test
  fun `ignores a broadcast with no extras`() {
    receiver.onReceive(context, Intent("com.google.android.c2dm.intent.RECEIVE"))

    verify(exactly = 0) { StreamMessagingHelper.handleMessage(any(), any()) }
  }
}
