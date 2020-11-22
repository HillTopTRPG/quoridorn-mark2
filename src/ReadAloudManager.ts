import { warningDialog } from "@/app/core/utility/Utility";

const synth = window.speechSynthesis;

export default class ReadAloudManager {
  // シングルトン
  public static get instance(): ReadAloudManager {
    if (!ReadAloudManager._instance)
      ReadAloudManager._instance = new ReadAloudManager();
    return ReadAloudManager._instance;
  }

  private static _instance: ReadAloudManager;

  // コンストラクタの隠蔽
  private constructor() {}

  private static voices: SpeechSynthesisVoice[] = [];

  public static init(): Promise<void> {
    return new Promise((resolve: () => void) => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        // Chromeではonvoiceschangedというイベントがあり、onvoiceschangedが呼ばれたタイミングでないと音声を取得できない
        synth.onvoiceschanged = function() {
          ReadAloudManager.voices.push(...synth.getVoices());
          resolve();
        };
      } else {
        // Firefoxではこれで音声が読み込める
        ReadAloudManager.voices.push(...synth.getVoices());
        resolve();
      }
    });
  }

  public static get navigatorValidVoiceList() {
    let voiceList = ReadAloudManager.voices.filter(
      v => v.lang === navigator.language
    );
    if (!voiceList.length) {
      voiceList = ReadAloudManager.voices.filter(v =>
        v.lang.startsWith(navigator.language)
      );
    }
    return voiceList;
  }

  /*
   * 読み上げパラメータ
   */
  public volume: number = 1;
  public rate: number = 1;
  public pitch: number = 1;
  public voice: SpeechSynthesisVoice | null =
    ReadAloudManager.navigatorValidVoiceList[0];

  /**
   * テキストを読み上げる
   * @param text 読み上げるテキスト
   */
  public speakVoice(text: string) {
    // SpeechSynthesisUtteranceインスタンスの作成
    const utterThis = new SpeechSynthesisUtterance();

    // 音声の指定
    if (this.voice) utterThis.voice = this.voice;

    // 音量の指定（0-1.0）
    utterThis.volume = this.volume;
    // 速度の指定（0.1-10.0）
    utterThis.rate = this.rate;
    // 音程の指定（0-2.0）
    utterThis.pitch = this.pitch;
    // 言語の指定
    utterThis.lang = utterThis.voice!.lang;

    utterThis.text = text;

    utterThis.onerror = function(event) {
      // エラーメッセージの出力
      console.log(event.error);
      warningDialog({
        title: "自動音声に問題あり",
        text:
          "自動音声を許可するには\nchrome://settings/content/sound\nでこのページのURLを許可設定してください。"
      }).then();
    };

    // 発言を再生 (発言キューに発言を追加)
    synth.speak(utterThis);
  }
}
