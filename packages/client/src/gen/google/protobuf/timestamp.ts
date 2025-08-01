/* eslint-disable */
import type {
  JsonReadOptions,
  JsonValue,
  JsonWriteOptions,
} from '@protobuf-ts/runtime';
// @generated by protobuf-ts 2.10.0 with parameter long_type_string,client_generic,server_none,eslint_disable,optimize_code_size
// @generated from protobuf file "google/protobuf/timestamp.proto" (package "google.protobuf", syntax proto3)
// tslint:disable
//
// Protocol Buffers - Google's data interchange format
// Copyright 2008 Google Inc.  All rights reserved.
// https://developers.google.com/protocol-buffers/
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
import { MessageType, PbLong, typeofJsonValue } from '@protobuf-ts/runtime';

/**
 * A Timestamp represents a point in time independent of any time zone or local
 * calendar, encoded as a count of seconds and fractions of seconds at
 * nanosecond resolution. The count is relative to an epoch at UTC midnight on
 * January 1, 1970, in the proleptic Gregorian calendar which extends the
 * Gregorian calendar backwards to year one.
 *
 * All minutes are 60 seconds long. Leap seconds are "smeared" so that no leap
 * second table is needed for interpretation, using a [24-hour linear
 * smear](https://developers.google.com/time/smear).
 *
 * The range is from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59.999999999Z. By
 * restricting to that range, we ensure that we can convert to and from [RFC
 * 3339](https://www.ietf.org/rfc/rfc3339.txt) date strings.
 *
 * # Examples
 *
 * Example 1: Compute Timestamp from POSIX `time()`.
 *
 *     Timestamp timestamp;
 *     timestamp.set_seconds(time(NULL));
 *     timestamp.set_nanos(0);
 *
 * Example 2: Compute Timestamp from POSIX `gettimeofday()`.
 *
 *     struct timeval tv;
 *     gettimeofday(&tv, NULL);
 *
 *     Timestamp timestamp;
 *     timestamp.set_seconds(tv.tv_sec);
 *     timestamp.set_nanos(tv.tv_usec * 1000);
 *
 * Example 3: Compute Timestamp from Win32 `GetSystemTimeAsFileTime()`.
 *
 *     FILETIME ft;
 *     GetSystemTimeAsFileTime(&ft);
 *     UINT64 ticks = (((UINT64)ft.dwHighDateTime) << 32) | ft.dwLowDateTime;
 *
 *     // A Windows tick is 100 nanoseconds. Windows epoch 1601-01-01T00:00:00Z
 *     // is 11644473600 seconds before Unix epoch 1970-01-01T00:00:00Z.
 *     Timestamp timestamp;
 *     timestamp.set_seconds((INT64) ((ticks / 10000000) - 11644473600LL));
 *     timestamp.set_nanos((INT32) ((ticks % 10000000) * 100));
 *
 * Example 4: Compute Timestamp from Java `System.currentTimeMillis()`.
 *
 *     long millis = System.currentTimeMillis();
 *
 *     Timestamp timestamp = Timestamp.newBuilder().setSeconds(millis / 1000)
 *         .setNanos((int) ((millis % 1000) * 1000000)).build();
 *
 *
 * Example 5: Compute Timestamp from Java `Instant.now()`.
 *
 *     Instant now = Instant.now();
 *
 *     Timestamp timestamp =
 *         Timestamp.newBuilder().setSeconds(now.getEpochSecond())
 *             .setNanos(now.getNano()).build();
 *
 *
 * Example 6: Compute Timestamp from current time in Python.
 *
 *     timestamp = Timestamp()
 *     timestamp.GetCurrentTime()
 *
 * # JSON Mapping
 *
 * In JSON format, the Timestamp type is encoded as a string in the
 * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format. That is, the
 * format is "{year}-{month}-{day}T{hour}:{min}:{sec}[.{frac_sec}]Z"
 * where {year} is always expressed using four digits while {month}, {day},
 * {hour}, {min}, and {sec} are zero-padded to two digits each. The fractional
 * seconds, which can go up to 9 digits (i.e. up to 1 nanosecond resolution),
 * are optional. The "Z" suffix indicates the timezone ("UTC"); the timezone
 * is required. A proto3 JSON serializer should always use UTC (as indicated by
 * "Z") when printing the Timestamp type and a proto3 JSON parser should be
 * able to accept both UTC and other timezones (as indicated by an offset).
 *
 * For example, "2017-01-15T01:30:15.01Z" encodes 15.01 seconds past
 * 01:30 UTC on January 15, 2017.
 *
 * In JavaScript, one can convert a Date object to this format using the
 * standard
 * [toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
 * method. In Python, a standard `datetime.datetime` object can be converted
 * to this format using
 * [`strftime`](https://docs.python.org/2/library/time.html#time.strftime) with
 * the time format spec '%Y-%m-%dT%H:%M:%S.%fZ'. Likewise, in Java, one can use
 * the Joda Time's [`ISODateTimeFormat.dateTime()`](
 * http://www.joda.org/joda-time/apidocs/org/joda/time/format/ISODateTimeFormat.html#dateTime%2D%2D
 * ) to obtain a formatter capable of generating timestamps in this format.
 *
 *
 *
 * @generated from protobuf message google.protobuf.Timestamp
 */
export interface Timestamp {
  /**
   * Represents seconds of UTC time since Unix epoch
   * 1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
   * 9999-12-31T23:59:59Z inclusive.
   *
   * @generated from protobuf field: int64 seconds = 1;
   */
  seconds: string;
  /**
   * Non-negative fractions of a second at nanosecond resolution. Negative
   * second values with fractions must still have non-negative nanos values
   * that count forward in time. Must be from 0 to 999,999,999
   * inclusive.
   *
   * @generated from protobuf field: int32 nanos = 2;
   */
  nanos: number;
}
// @generated message type with reflection information, may provide speed optimized methods
class Timestamp$Type extends MessageType<Timestamp> {
  constructor() {
    super('google.protobuf.Timestamp', [
      { no: 1, name: 'seconds', kind: 'scalar', T: 3 /*ScalarType.INT64*/ },
      { no: 2, name: 'nanos', kind: 'scalar', T: 5 /*ScalarType.INT32*/ },
    ]);
  }
  /**
   * Creates a new `Timestamp` for the current time.
   */
  now(): Timestamp {
    const msg = this.create();
    const ms = Date.now();
    msg.seconds = PbLong.from(Math.floor(ms / 1000)).toString();
    msg.nanos = (ms % 1000) * 1000000;
    return msg;
  }
  /**
   * Converts a `Timestamp` to a JavaScript Date.
   */
  toDate(message: Timestamp): Date {
    return new Date(
      PbLong.from(message.seconds).toNumber() * 1000 +
        Math.ceil(message.nanos / 1000000),
    );
  }
  /**
   * Converts a JavaScript Date to a `Timestamp`.
   */
  fromDate(date: Date): Timestamp {
    const msg = this.create();
    const ms = date.getTime();
    msg.seconds = PbLong.from(Math.floor(ms / 1000)).toString();
    msg.nanos =
      ((ms % 1000) + (ms < 0 && ms % 1000 !== 0 ? 1000 : 0)) * 1000000;
    return msg;
  }
  /**
   * In JSON format, the `Timestamp` type is encoded as a string
   * in the RFC 3339 format.
   */
  internalJsonWrite(message: Timestamp, options: JsonWriteOptions): JsonValue {
    let ms = PbLong.from(message.seconds).toNumber() * 1000;
    if (
      ms < Date.parse('0001-01-01T00:00:00Z') ||
      ms > Date.parse('9999-12-31T23:59:59Z')
    )
      throw new Error(
        'Unable to encode Timestamp to JSON. Must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive.',
      );
    if (message.nanos < 0)
      throw new Error(
        'Unable to encode invalid Timestamp to JSON. Nanos must not be negative.',
      );
    let z = 'Z';
    if (message.nanos > 0) {
      let nanosStr = (message.nanos + 1000000000).toString().substring(1);
      if (nanosStr.substring(3) === '000000')
        z = '.' + nanosStr.substring(0, 3) + 'Z';
      else if (nanosStr.substring(6) === '000')
        z = '.' + nanosStr.substring(0, 6) + 'Z';
      else z = '.' + nanosStr + 'Z';
    }
    return new Date(ms).toISOString().replace('.000Z', z);
  }
  /**
   * In JSON format, the `Timestamp` type is encoded as a string
   * in the RFC 3339 format.
   */
  internalJsonRead(
    json: JsonValue,
    options: JsonReadOptions,
    target?: Timestamp,
  ): Timestamp {
    if (typeof json !== 'string')
      throw new Error(
        'Unable to parse Timestamp from JSON ' + typeofJsonValue(json) + '.',
      );
    let matches = json.match(
      /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:Z|\.([0-9]{3,9})Z|([+-][0-9][0-9]:[0-9][0-9]))$/,
    );
    if (!matches)
      throw new Error('Unable to parse Timestamp from JSON. Invalid format.');
    let ms = Date.parse(
      matches[1] +
        '-' +
        matches[2] +
        '-' +
        matches[3] +
        'T' +
        matches[4] +
        ':' +
        matches[5] +
        ':' +
        matches[6] +
        (matches[8] ? matches[8] : 'Z'),
    );
    if (Number.isNaN(ms))
      throw new Error('Unable to parse Timestamp from JSON. Invalid value.');
    if (
      ms < Date.parse('0001-01-01T00:00:00Z') ||
      ms > Date.parse('9999-12-31T23:59:59Z')
    )
      throw new globalThis.Error(
        'Unable to parse Timestamp from JSON. Must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive.',
      );
    if (!target) target = this.create();
    target.seconds = PbLong.from(ms / 1000).toString();
    target.nanos = 0;
    if (matches[7])
      target.nanos =
        parseInt('1' + matches[7] + '0'.repeat(9 - matches[7].length)) -
        1000000000;
    return target;
  }
}
/**
 * @generated MessageType for protobuf message google.protobuf.Timestamp
 */
export const Timestamp = new Timestamp$Type();
