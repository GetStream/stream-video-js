export class Batcher<BatchItemType> {
  private batch: Array<BatchItemType>;
  private timeoutId: NodeJS.Timeout | undefined;

  constructor(
    private readonly timeoutInterval: number,
    private readonly requestFunction: (data: Array<BatchItemType>) => void,
  ) {
    this.batch = [];
  }

  private scheduleTimeout = () => {
    this.timeoutId = setTimeout(() => {
      try {
        if (!this.batch.length) return;
        this.requestFunction(this.batch);
        this.clearBatch();
      } catch (error) {
        console.error(error);
      }
    }, this.timeoutInterval);
  };

  private clearTimeout = () => {
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  };

  public clearBatch = () => {
    this.batch = [];
    this.clearTimeout();
  };

  public addToBatch = (item: BatchItemType) => {
    this.batch.push(item);
    if (!this.timeoutId) this.scheduleTimeout();
  };

  public removeFromBatch = (item: BatchItemType) => {
    const itemIndex = this.batch.indexOf(item);
    if (itemIndex > -1) this.batch.splice(itemIndex, 1);
  };
}
