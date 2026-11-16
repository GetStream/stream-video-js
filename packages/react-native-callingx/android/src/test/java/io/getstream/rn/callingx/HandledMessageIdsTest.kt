package io.getstream.rn.callingx

import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HandledMessageIdsTest {

  @Test
  fun `a message is handled the first time`() {
    val ids = HandledMessageIds(maxSize = 50)

    assertTrue(ids.markHandled("0:1"))
  }

  @Test
  fun `a message handled before is skipped`() {
    val ids = HandledMessageIds(maxSize = 50)
    ids.markHandled("0:1")

    assertFalse(ids.markHandled("0:1"))
  }

  @Test
  fun `different messages are all handled`() {
    val ids = HandledMessageIds(maxSize = 50)

    assertTrue(ids.markHandled("0:1"))
    assertTrue(ids.markHandled("0:2"))
  }

  @Test
  fun `a message without an id is always handled`() {
    val ids = HandledMessageIds(maxSize = 50)

    assertTrue(ids.markHandled(null))
    assertTrue(ids.markHandled(null))
  }

  @Test
  fun `the oldest message is forgotten once more than the maximum are remembered`() {
    val ids = HandledMessageIds(maxSize = 3)
    listOf("0:1", "0:2", "0:3", "0:4").forEach { ids.markHandled(it) }

    // 0:1 was dropped to make room for 0:4, so it counts as new again.
    assertTrue(ids.markHandled("0:1"))
    // 0:3 is still remembered.
    assertFalse(ids.markHandled("0:3"))
  }

  @Test
  fun `the same message passed in from many threads at once is handled once`() {
    val ids = HandledMessageIds(maxSize = 50)
    val threads = 8
    val handled = AtomicInteger()
    val start = CountDownLatch(1)
    val pool = Executors.newFixedThreadPool(threads)

    repeat(threads) {
      pool.execute {
        start.await()
        if (ids.markHandled("0:1")) handled.incrementAndGet()
      }
    }
    start.countDown()
    pool.shutdown()
    assertTrue(pool.awaitTermination(5, TimeUnit.SECONDS))

    assertEquals(1, handled.get())
  }
}
