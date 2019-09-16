<template>
  <ctrl-select
    :title="helpMessage"
    v-model="currentSystem"
    :optionInfoList="
      diceSystemList.map(systemObj => ({
        key: systemObj.system,
        value: systemObj.system,
        text: systemObj.system !== 'DiceBot' ? systemObj.name : '指定なし'
      }))
    "
    :maxWidth="19"
    :disabled="disabled"
  />
</template>

<script lang="ts">
import CtrlSelect from "@/components/parts/CtrlSelect.vue";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";

@Component({ components: { CtrlSelect } })
export default class DiceBotSelect extends Vue {
  @Action("loading") private loading: any;
  @Action("getBcdiceSystemInfo") private getBcdiceSystemInfo: any;
  @Getter("diceSystemList") private diceSystemList: any;

  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  /*
   * data
   */
  private helpMessage: string = "";

  /** ダイスボットの説明文の定型部分 */
  private baseHelpMessage: string =
    "【ダイスボット】チャットにダイス用の文字を入力するとダイスロールが可能\n" +
    "入力例）2d6+1 攻撃！\n" +
    "上記のようにダイス文字の後ろに空白を入れて発信することも可能\n" +
    "以下、使用例\n" +
    "　3D6+1>=9 ：3d6+1で目標値9以上かの判定\n" +
    "　1D100<=50 ：D100で50%目標の下方ロールの例\n" +
    "　3U6[5] ：3d6のダイス目が5以上の場合に振り足しして合計する(上方無限)\n" +
    "　3B6 ：3d6のダイス目をバラバラのまま出力する（合計しない）\n" +
    "　10B6>=4 ：10d6を振り4以上のダイス目の個数を数える\n" +
    "　(8/2)D(4+6)<=(5*3) ：個数・ダイス・達成値には四則演算も使用可能\n" +
    "　C(10-4*3/2+2) ：C(計算式)で計算だけの実行も可能\n" +
    "　choice[a,b,c] ：列挙した要素から一つを選択表示。ランダム攻撃対象決定などに\n" +
    "　S3d6 ：各コマンドの先頭に「S」を付けると他人から結果が見えないシークレットロール\n" +
    "　3d6/2 ：ダイス出目を割り算（切り捨て）。切り上げは /2U、四捨五入は /2R。\n" +
    "　D66 ：D66ダイス。順序はゲームに依存。D66N：そのまま、D66S：昇順\n";

  @Emit("input")
  input(currentSystem: string) {}

  @Watch("currentSystem", { immediate: true })
  onChangeCurrentSystem(currentSystem: string) {
    if (currentSystem === "DiceBot") {
      this.helpMessage =
        this.baseHelpMessage +
        `==【ダイスボット(指定なし)専用】====================\n` +
        "ゲーム固有の判定がある場合はこの場所に記載されます。";
    } else {
      if (!currentSystem) return;
      this.getBcdiceSystemInfo(currentSystem)
        .then((info: any) => {
          this.helpMessage =
            this.baseHelpMessage +
            `==【${info.name}専用】====================\n` +
            info.info;
        })
        .catch((err: any) => {
          window.console.error(err);
          this.helpMessage = "ヘルプ文言の取得に失敗しました。";
        });
    }
  }

  public get currentSystem(): string {
    return this.value;
  }
  public set currentSystem(value: string) {
    this.input(value);
  }
}
</script>
