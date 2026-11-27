package io.getstream.rn.callingx

/**
 * The FCM message ids [StreamMessagingHelper.handleMessage] has acted on, so it can skip a push it
 * has already handled. The same push reaches `handleMessage` twice when the app's own messaging
 * service forwards it too: once from [StreamMessagingReceiver], once from the app.
 *
 * Remembers the last [maxSize] ids, oldest dropped first. The two copies of a push arrive well
 * under a second apart, so the last 10 is plenty, even with several pushes in flight at once.
 * Thread-safe: the receiver runs on the main thread and a messaging service on its own thread.
 */
internal class HandledMessageIds(private val maxSize: Int = DEFAULT_MAX_SIZE) {

  private val ids = LinkedHashSet<String>()

  /**
   * Records [messageId] as handled. Returns `false` if it was already recorded. A message without
   * an id is always handled, since it can't be told apart from another one.
   */
  fun markHandled(messageId: String?): Boolean {
    if (messageId == null) return true
    synchronized(ids) {
      if (!ids.add(messageId)) return false
      if (ids.size > maxSize) {
        ids.remove(ids.first())
      }
      return true
    }
  }

  companion object {
    const val DEFAULT_MAX_SIZE = 10
  }
}
