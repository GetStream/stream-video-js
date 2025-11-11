export type SegmentationParams = {
  width: number;
  height: number;
};

export enum SegmentationLevel {
  LOW = 'low',
  HIGH = 'high',
}

export const getSegmentationParams = (
  level: SegmentationLevel,
): SegmentationParams => {
  if (level === SegmentationLevel.HIGH) {
    return { width: 256, height: 144 };
  }
  return { width: 160, height: 96 };
};
