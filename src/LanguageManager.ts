import { loadYaml } from "@/app/core/utility/FileUtility";
import VueI18n from "vue-i18n";
import TaskManager from "@/app/core/task/TaskManager";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";

type LangInfo = {
  lang: string;
  path: string;
};

type Message = {
  [lang: string]: any;
};

export type SupportLangInfo = {
  lang: string;
  title: string;
  isDefault?: boolean;
};

export const supportLangList: SupportLangInfo[] = [];

export default class LanguageManager {
  // シングルトン
  public static get instance(): LanguageManager {
    if (!LanguageManager._instance)
      LanguageManager._instance = new LanguageManager();
    return LanguageManager._instance;
  }

  private static _instance: LanguageManager;
  private messages: Message = {};
  private i18n: any = null;

  // コンストラクタの隠蔽
  private constructor() {}

  private async loadLanguage(langInfo: LangInfo) {
    try {
      this.messages[langInfo.lang] = await loadYaml<any>(langInfo.path);
    } catch (err) {
      window.console.error(err.toString());
    }
  }

  public set language(locale: string) {
    this.i18n.locale = locale;
    TaskManager.instance
      .ignition<never, never>({
        type: "language-change",
        owner: "Quoridorn",
        value: null
      })
      .then();
  }

  public getText(target: string): string {
    return this.i18n.t(target);
  }

  public static get defaultLanguage() {
    const langInfo = supportLangList.find(l => l.isDefault);
    return langInfo ? langInfo.lang : navigator.language;
  }

  public async init(): Promise<VueI18n> {
    const loadLanguages = async () => {
      // 読み込み必須のためthrowは伝搬させる
      const supportLangInfo = await loadYaml<SupportLangInfo[]>(
        "/static/lang/support-lang-list.yaml"
      );
      listToEmpty(supportLangList);
      supportLangList.push(...supportLangInfo);

      // loadLanguageを直列の非同期で全部実行する
      await supportLangList
        .map((langInfo: SupportLangInfo) => () =>
          this.loadLanguage({
            lang: langInfo.lang,
            path: `/static/lang/${langInfo.lang}.yaml`
          })
        )
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());
    };

    await loadLanguages();

    this.i18n = new VueI18n({
      locale: navigator.language,
      fallbackLocale: "en",
      messages: this.messages
    });

    return this.i18n;
  }
}
