import { MemoStore } from "@/@types/store-data";
import { getJson } from "@/app/core/utility/Utility";

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
  public abstract createOtherText(): Promise<MemoStore[] | null>;

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
   * @protected
   * @return JSONPの生データ
   */
  protected async getJsonData(url: string = this.url): Promise<any | null> {
    try {
      const matchResult = url.match(this.urlRegExp);
      const key = matchResult ? matchResult[1] : null;
      const jsonUrl = this.jsonpUrlFormat.replace("{key}", key || "");
      return await getJson(jsonUrl);
    } catch (err) {
      return null;
    }
  }

  /**
   * 各種成果物を生成する処理で共通する処理
   * @param url 省略された場合はコンストラクタに引き渡されたURLが利用される
   * @protected
   */
  protected async createResultList<U>(
    url?: string
  ): Promise<{
    data: T | null;
    list: U[];
    json: any;
  }> {
    const json = await this.getJsonData(url);
    const data = this.createData(json, this.url);

    console.log(JSON.stringify(json, null, "  "));
    console.log(JSON.stringify(data, null, "  "));

    return {
      data,
      list: [],
      json
    };
  }
}
