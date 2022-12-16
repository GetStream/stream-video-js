export class Batcher<ItemType> {
  private items: Array<ItemType>;
  private timeoutId: NodeJS.Timeout | undefined;

  constructor(
    private readonly timeoutInterval: number,
    private readonly requestFunction: (data: Array<ItemType>) => void,
  ) {
    this.items = [];
  }

  private scheduleTimeout = () => {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      try {
        if (!this.items.length) return;
        console.log('triggering batch', JSON.stringify(this.items));
        this.requestFunction(this.items);
        this.items = [];
      } catch (error) {
        console.error(error);
      }
    }, this.timeoutInterval);
  };

  private clearTimeout = () => {
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  };

  public clearItems = () => {
    this.items = [];
    this.clearTimeout();
  };

  public pushItem = (item: ItemType) => {
    this.items.push(item);
    this.scheduleTimeout();
  };

  // TODO: probably add <removeItem> in case user leaves the call before batch function triggers
}
