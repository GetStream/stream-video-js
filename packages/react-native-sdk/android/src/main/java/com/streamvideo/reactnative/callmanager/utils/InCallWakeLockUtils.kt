/*
 * Copyright (c) 2017 Henry Lin @zxcpoiu
 * 
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
package com.streamvideo.reactnative.callmanager.utils

import android.content.Context
import android.os.PowerManager
import android.os.PowerManager.WakeLock
import android.util.Log

class InCallWakeLockUtils(context: Context) {
    private val mPowerManager =
        context.getSystemService(Context.POWER_SERVICE) as PowerManager

    private val wakelogTag = "${context.packageName}:$TAG"

    private var mFullLock: WakeLock = mPowerManager.newWakeLock(
        PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
        wakelogTag
    ).apply {
        setReferenceCounted(false)
    }
    private var mPartialLock: WakeLock = mPowerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, wakelogTag).apply {
        setReferenceCounted(false)
    }
    private var mPokeFullLock: WakeLock = mPowerManager.newWakeLock(
        PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
        wakelogTag
    ).apply {
        setReferenceCounted(false)
    }

    private fun _acquireWakeLock(lock: WakeLock, timeout: Long = 0): Boolean {
        synchronized(lock) {
            if (!lock.isHeld) {
                if (timeout > 0) {
                    lock.acquire(timeout)
                } else {
                    lock.acquire()
                }
                return true
            }
        }
        return false
    }

    private fun _releaseWakeLock(lock: WakeLock): Boolean {
        synchronized(lock) {
            if (lock.isHeld) {
                lock.release()
                return true
            }
        }
        return false
    }

    fun acquireFullWakeLock(): Boolean {
        val sta = _acquireWakeLock(mFullLock)
        Log.d(
            TAG,
            "acquireFullWakeLock(). sta=$sta"
        )
        return sta
    }

    fun releaseFullWakeLock(): Boolean {
        val sta = _releaseWakeLock(mFullLock)
        Log.d(
            TAG,
            "releaseFullWakeLock(). sta=$sta"
        )
        return sta
    }

    fun acquirePokeFullWakeLock(): Boolean {
        val sta = _acquireWakeLock(mPokeFullLock)
        Log.d(
            TAG,
            "acquirePokeFullWakeLock(). sta=$sta"
        )
        return sta
    }

    fun releasePokeFullWakeLock(): Boolean {
        val sta = _releaseWakeLock(mPokeFullLock)
        Log.d(
            TAG,
            "releasePokeFullWakeLock(). sta=$sta"
        )
        return sta
    }

    fun acquirePartialWakeLock(): Boolean {
        val sta = _acquireWakeLock(mPartialLock)
        Log.d(
            TAG,
            "acquirePartialWakeLock(). sta=$sta"
        )
        return sta
    }

    fun releasePartialWakeLock(): Boolean {
        val sta = _releaseWakeLock(mPartialLock)
        Log.d(
            TAG,
            "releasePartialWakeLock(). sta=$sta"
        )
        return sta
    }

    fun acquirePokeFullWakeLockReleaseAfter(timeout: Long): Boolean {
        val sta = _acquireWakeLock(mPokeFullLock, timeout)
        Log.d(
            TAG,
            String.format("acquirePokeFullWakeLockReleaseAfter() timeout=%s, sta=%s", timeout, sta)
        )
        return sta
    }

    companion object {
        private val TAG = InCallWakeLockUtils::class.java.simpleName.toString()
    }
}
