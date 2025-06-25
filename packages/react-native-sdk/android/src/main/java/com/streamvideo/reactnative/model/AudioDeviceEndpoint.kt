/*
 * Copyright 2023 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.streamvideo.reactnative.model

import android.media.AudioDeviceInfo
import androidx.annotation.IntDef
import androidx.annotation.RestrictTo
import com.streamvideo.reactnative.audio.utils.AudioDeviceEndpointUtils
import java.util.Objects


public class AudioDeviceEndpoint(
    public val name: String,
    @EndpointType public val type: Int,
    public val deviceInfo: AudioDeviceInfo,
) : Comparable<AudioDeviceEndpoint> {

    val deviceId = deviceInfo.id

    override fun toString(): String {
        return "CallEndpoint(" +
            "name=[$name]," +
            "type=[${
                AudioDeviceEndpointUtils.endpointTypeToString(type)}]," +
            "deviceId=[${deviceId}])"
    }

    /**
     * Compares this [AudioDeviceEndpoint] to the other [AudioDeviceEndpoint] for order. Returns a
     * positive number if this type rank is greater than the other value. Returns a negative number
     * if this type rank is less than the other value. Sort the CallEndpoint by type. Ranking them
     * by:
     * 1. TYPE_WIRED_HEADSET
     * 2. TYPE_BLUETOOTH
     * 3. TYPE_SPEAKER
     * 4. TYPE_EARPIECE
     * 5. TYPE_UNKNOWN If two endpoints have the same type, the name is compared to determine the
     *    value.
     */
    override fun compareTo(other: AudioDeviceEndpoint): Int {
        // sort by type
        val res = this.getTypeRank().compareTo(other.getTypeRank())
        if (res != 0) {
            return res
        }
        // break ties using alphabetic order
        return this.name.toString().compareTo(other.name.toString())
    }

    override fun equals(other: Any?): Boolean {
        return other is AudioDeviceEndpoint &&
            name == other.name &&
            type == other.type && deviceId == other.deviceId
    }

    override fun hashCode(): Int {
        return Objects.hash(name, type, deviceId)
    }

    public companion object {
        @RestrictTo(RestrictTo.Scope.LIBRARY)
        @Retention(AnnotationRetention.SOURCE)
        @IntDef(
            TYPE_UNKNOWN,
            TYPE_EARPIECE,
            TYPE_BLUETOOTH,
            TYPE_WIRED_HEADSET,
            TYPE_SPEAKER,
        )
        @Target(AnnotationTarget.TYPE, AnnotationTarget.PROPERTY, AnnotationTarget.VALUE_PARAMETER)
        public annotation class EndpointType

        /** Indicates that the type of endpoint through which call media flows is unknown type. */
        public const val TYPE_UNKNOWN: Int = -1

        /** Indicates that the type of endpoint through which call media flows is an earpiece. */
        public const val TYPE_EARPIECE: Int = 1

        /** Indicates that the type of endpoint through which call media flows is a Bluetooth. */
        public const val TYPE_BLUETOOTH: Int = 2

        /**
         * Indicates that the type of endpoint through which call media flows is a wired headset.
         */
        public const val TYPE_WIRED_HEADSET: Int = 3

        /** Indicates that the type of endpoint through which call media flows is a speakerphone. */
        public const val TYPE_SPEAKER: Int = 4

    }

    internal fun isBluetoothType(): Boolean {
        return type == TYPE_BLUETOOTH
    }

    private fun getTypeRank(): Int {
        return when (this.type) {
            TYPE_WIRED_HEADSET -> return 0
            TYPE_BLUETOOTH -> return 1
            TYPE_SPEAKER -> return 2
            TYPE_EARPIECE -> return 3
            else -> 4
        }
    }
}
