import { Component, OnDestroy, OnInit } from '@angular/core';
import { pairwise, Subscription } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-call-statistics',
  templateUrl: './call-statistics.component.html',
  styles: [],
})
export class CallStatisticsComponent implements OnInit, OnDestroy {
  datacenter?: string;
  latencyInMs?: string;
  jitter?: string;
  qualityLimit?: string;
  publishResolution?: string;
  subscriberResolution?: string;
  publishBitrate?: string;
  subscribeBitrate?: string;
  private subscriptions: Subscription[] = [];

  constructor(private streamVideoService: StreamVideoService) {
    this.subscriptions.push(
      this.streamVideoService.callStatsReport$
        .pipe(pairwise())
        .subscribe(([prevReport, report]) => {
          this.datacenter = report?.datacenter;
          this.latencyInMs = this.toStringWithUnit(report?.latencyInMs, 'ms');
          this.jitter = this.toStringWithUnit(
            report?.subscriberStats?.averageJitterInMs,
            'ms',
          );
          this.qualityLimit = report?.publisherStats?.qualityLimitationReasons;
          this.publishResolution = this.toFrameSizeString(
            report?.publisherStats?.highestFrameWidth,
            report?.publisherStats?.highestFrameHeight,
            report?.publisherStats?.highestFramesPerSecond,
          );
          this.subscriberResolution = this.toFrameSizeString(
            report?.subscriberStats?.highestFrameWidth,
            report?.subscriberStats?.highestFrameHeight,
            report?.subscriberStats?.highestFramesPerSecond,
          );
          this.publishBitrate = this.calculateBitrate(
            report?.publisherStats?.totalBytesSent,
            prevReport?.publisherStats?.totalBytesSent,
            report?.timestamp,
            prevReport?.timestamp,
          );
          this.subscribeBitrate = this.calculateBitrate(
            report?.subscriberStats?.totalBytesReceived,
            prevReport?.subscriberStats?.totalBytesReceived,
            report?.timestamp,
            prevReport?.timestamp,
          );
        }),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private toStringWithUnit(value: number | undefined, unit: string) {
    if (value === undefined) {
      return '-';
    } else {
      return `${value} ${unit}`;
    }
  }

  private toFrameSizeString(width?: number, height?: number, fps?: number) {
    let size = `-`;
    if (width && height) {
      size = `${width}x${height}`;
      if (fps) {
        size += `@${fps}fps`;
      }
    }
    return size;
  }

  calculateBitrate(
    totalBytesSent?: number,
    previousTotalBytesSent?: number,
    timestamp?: number,
    previousTimestamp?: number,
  ) {
    if (
      totalBytesSent === undefined ||
      previousTotalBytesSent === undefined ||
      timestamp === undefined ||
      previousTimestamp === undefined
    ) {
      return '-';
    }
    const bytesSent = totalBytesSent - previousTotalBytesSent;
    const timeElapsed = timestamp - previousTimestamp;
    return `${((bytesSent * 8) / timeElapsed).toFixed(2)} kbps`;
  }
}
