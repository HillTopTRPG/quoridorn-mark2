import { unicodeEscape } from "@/app/core/utility/FileUtility";

export default class DropBoxManager {
  // シングルトン
  public static get instance(): DropBoxManager {
    if (!DropBoxManager._instance)
      DropBoxManager._instance = new DropBoxManager();
    return DropBoxManager._instance;
  }
  private static _instance: DropBoxManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private accessToken: string | null = null;

  public get ready(): boolean {
    return this.accessToken !== null;
  }

  public init(accessToken: string): void {
    this.accessToken = accessToken;
  }

  private static async postFetch(url: string, headers: any, body?: any) {
    return await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, same-origin, *omit
      headers,
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body
    });
  }

  private async postJsonFetch(url: string, body: string) {
    const headers: any = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json"
    };
    const response = await DropBoxManager.postFetch(url, headers, body);
    return await response.json();
  }

  public async upload(file: File, path: string = file.name): Promise<string> {
    path = unicodeEscape("/" + path);
    await this.uploadFile(file, path);
    return await this.createSharedLink(path);
  }

  private async uploadFile(file: File, path: string = file.name) {
    const url = "https://content.dropboxapi.com/2/files/upload";
    const headers: any = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/octet-stream",
      Accept: "application/json",
      "Dropbox-API-Arg": JSON.stringify({
        path: path,
        mode: "add",
        autorename: false,
        mute: false,
        strict_conflict: false
      })
    };
    headers["Dropbox-API-Arg"] = headers["Dropbox-API-Arg"].replace(
      /\\\\/g,
      "\\"
    );

    await DropBoxManager.postFetch(url, headers, file);
  }

  /**
   * ファイルの一覧を取得する
   * Quoridorn的には共有リンクが設定されていないファイルには興味がないので、この関数は非推奨
   *
   * @param path DropBox上の検索パス(階層を深く掘り下げて検索していく)
   * @param cursor 1回のAPI呼び出しで全て取得できなかった場合はcursorを目印に続きを読んでいく（再帰的に呼び出される際にのみ利用）
   */
  public async getListFolder(path: string, cursor?: string): Promise<string[]> {
    const url = "https://api.dropboxapi.com/2/files/list_folder";
    const option = {
      path,
      recursive: true,
      include_media_info: true,
      include_has_explicit_shared_members: false,
      include_deleted: false,
      include_mounted_folders: false
    };
    const json = await this.postJsonFetch(url, JSON.stringify(option));

    const jsonCursor: string = json.cursor;
    const hasMore: boolean = json["has_more"];

    const resultList = json.entries.map((e: any) => e["path_display"]);

    if (hasMore) {
      const continueResultList = await this.getListFolder(path, jsonCursor);
      resultList.push(...continueResultList);
    }
    return resultList;
  }

  /**
   * 共有リンクが設定されているファイルの一覧を取得する
   *
   * @param path DropBox上の検索パス(階層を深く掘り下げて検索していく)
   * @param cursor 1回のAPI呼び出しで全て取得できなかった場合はcursorを目印に続きを読んでいく（再帰的に呼び出される際にのみ利用）
   */
  public async getListSharedLinks(
    path: string,
    cursor?: string
  ): Promise<string[]> {
    const url = "https://api.dropboxapi.com/2/sharing/list_shared_links";

    const json = await this.postJsonFetch(
      url,
      JSON.stringify({
        path: path || undefined,
        direct_only: true,
        cursor: cursor
      })
    );

    const jsonCursor: string = json.cursor;
    const hasMore: boolean = json["has_more"];

    const resultList = json.links
      .map((l: any) => l.url)
      .filter((url: string) => url);

    if (hasMore) {
      const continueResultList = await this.getListSharedLinks(
        path,
        jsonCursor
      );
      resultList.push(...continueResultList);
    }
    return resultList;
  }

  /**
   * 共有リンクを作成する
   *
   * @param path DropBox上のパス
   */
  private async createSharedLink(path: string): Promise<string> {
    const url =
      "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings";
    return (await this.postJsonFetch(url, `{"path":"${path}"}`)).url;
  }

  /**
   * 一時リンクを取得する
   *
   * @param path DropBox上のパス
   */
  public async getTemporaryLink(path: string): Promise<string> {
    const url = "https://api.dropboxapi.com/2/files/get_temporary_link";
    return (await this.postJsonFetch(url, `{"path":"${path}"}`)).link;
  }

  /**
   * ダウンロード処理
   *
   * @param path DropBox上のパス
   */
  public async download(path: string): Promise<string> {
    const url = "https://content.dropboxapi.com/2/files/download";
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Dropbox-API-Arg": `{"path":"${path}"}`
    };
    const response = await DropBoxManager.postFetch(url, headers);
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  }
}
