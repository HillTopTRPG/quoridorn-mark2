import { MemoStore } from "@/@types/store-data";
import { getJsonByGet, getJsonByJsonp } from "@/app/core/utility/Utility";

/**
 * キャラシのデータを読み込んでQuoridorn用のデータを生成するクラス
 */
export abstract class TrpgSystemHelper<T> {
  protected readonly url: string;
  protected readonly urlRegExp: RegExp;
  protected readonly jsonpUrlFormat: string;
  public abstract readonly isSupportedOtherText: boolean;
  public abstract readonly isSupportedChatPalette: boolean;

  /**
   * コンストラクタ
   * @param url キャラシのURL
   * @param urlRegExp このシステムに対応しているキャラシのURLかどうかを判別するための正規表現
   * @param jsonpUrlFormat JSONP取得用のURLのフォーマット
   * @protected
   */
  protected constructor(
    url: string,
    urlRegExp: RegExp,
    jsonpUrlFormat: string
  ) {
    this.url = url;
    this.urlRegExp = urlRegExp;
    this.jsonpUrlFormat = jsonpUrlFormat;
  }

  /**
   * このシステムに対応しているキャラシのURLかどうかを判定する
   * @return true: 対応したキャラシである, false: 対応したキャラシではない
   */
  public abstract isThis(): Promise<boolean>;

  /**
   * その他欄の情報を生成する
   */
  public abstract createOtherText(
    memoList: Partial<StoreData<MemoStore>>[],
    updateInfo?: string | undefined
  ): Promise<Partial<StoreData<MemoStore>>[] | null>;

  /**
   * チャットパレットの情報を生成する
   */
  public abstract createChatPalette(): Promise<
    {
      name: string;
      paletteText: string;
    }[]
  >;

  /**
   * JSONPから取得した生データから処理用のデータを生成する
   * @param json JSONPから取得した生データ
   * @param url 元となったキャラクターシートのURL
   * @protected
   */
  protected abstract createData(json: any | null, url: string): T | null;

  /**
   * JSONPで対象のURLのデータを取得する
   * @param url 省略された場合はコンストラクタに引き渡されたURLが利用される
   * @param type jsonp or get 省略された場合は jsonp
   * @protected
   * @return JSONPの生データ
   */
  protected async getJsonData(
    type: "jsonp" | "get" = "jsonp",
    url: string = this.url
  ): Promise<any | null> {
    try {
      const matchResult = url.match(this.urlRegExp);
      const key = matchResult ? matchResult[1] : null;
      const jsonUrl = this.jsonpUrlFormat.replace("{key}", key || "");
      if (type === "jsonp") return await getJsonByJsonp(jsonUrl);
      return await getJsonByGet(jsonUrl);
    } catch (err) {
      return null;
    }
  }

  /**
   * 各種成果物を生成する処理で共通する処理
   * @param payload
   * url 省略された場合はコンストラクタに引き渡されたURLが利用される
   * type jsonp or get 省略された場合は jsonp
   * @protected
   */
  protected async createResultList<U>(payload?: {
    type?: "jsonp" | "get";
    url?: string;
  }): Promise<{
    data: T | null;
    list: Partial<StoreData<U>>[];
    json: any;
  }> {
    const type: "jsonp" | "get" = !payload?.type ? "jsonp" : payload.type;
    const url = payload?.url;

    const json = await this.getJsonData(type, url);
    const data = this.createData(json, this.url);

    // console.log(JSON.stringify(json, null, "  "));
    // console.log(JSON.stringify(data, null, "  "));
    // console.log(json);
    // console.log(data);

    return {
      data,
      list: [],
      json
    };
  }

  protected addMemo(
    resultList: Partial<StoreData<MemoStore>>[],
    textList: string[] = []
  ) {
    resultList.push({
      data: {
        tab: "メモ",
        type: "normal",
        text: [
          ...textList,
          "### メモ",
          ":::200px:100px",
          this.isSupportedChatPalette
            ? [
                "チャットパレット生成に対応しています。",
                "コマを右クリックして「チャットパレットを生成」を押してみましょう"
              ].join("\r\n")
            : "",
          ":::END;;;"
        ].join("\r\n")
      }
    });
  }
}
