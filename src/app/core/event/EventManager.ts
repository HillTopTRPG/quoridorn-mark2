type Handler = {
  target: any;
  type: string;
  listener: Function;
};

export default class EventManager {
  // シングルトン
  public static get instance(): EventManager {
    if (!EventManager._instance) EventManager._instance = new EventManager();
    return EventManager._instance;
  }
  private static _instance: EventManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private readonly events: {
    [key in number]: Handler;
  } = {};
  private key: number = 0;

  /**
   * リスナーの登録
   * @param target
   * @param type
   * @param listener
   */
  public addListener(target: any, type: string, listener: Function) {
    target.addEventListener(type, listener);
    this.events[this.key] = {
      target,
      type,
      listener
    };
    return this.key++;
  }

  /**
   * リスナーの削除
   * @param keyOrType
   */
  public removeListener(keyOrType: number | string) {
    if (typeof keyOrType === "number") {
      const key: number = keyOrType;
      if (key in this.events) {
        const e: Handler = this.events[key];
        e.target.removeEventListener(e.type, e.listener);
      }
    } else {
      for (const key in this.events) {
        const type: string = keyOrType;
        if (!this.events.hasOwnProperty(key)) continue;
        const e: Handler = this.events[key];
        if (e.type !== type) continue;
        e.target.removeEventListener(e.type, e.listener);
      }
    }
  }
}
