<template>
  <div class="character-info-form">
    <!-- 掴む -->
    <div class="object-cell">
      <div
        class="object"
        :class="{ 'type-add': isAdd }"
        ref="object"
        :draggable="isAdd && imageDocId ? 'true' : 'false'"
        @dragstart="dragStart"
        @dragend="dragEnd"
      ></div>
    </div>

    <!-- コマ情報 -->
    <table class="info-table">
      <tr>
        <tr-string-input-component
          labelName="name"
          width="100%"
          v-model="nameVolatile"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="size"
          inputWidth="3em"
          v-model="sizeVolatile"
          :min="1"
        />
      </tr>
      <tr>
        <th>
          <label
            :for="`${key}-background-size`"
            class="label-background-size label-input"
            v-t="'label.background-location'"
          ></label>
        </th>
        <td class="value-cell">
          <background-location-select
            :id="`${key}-background-size`"
            v-model="backgroundSizeVolatile"
          />
        </td>
      </tr>
    </table>

    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 画像タブ -->
      <image-picker-component
        v-if="currentTabInfo.target === 'image'"
        v-model="imageDocIdVolatile"
        :windowKey="key"
        :imageTag.sync="imageTagVolatile"
        :direction.sync="directionVolatile"
        ref="imagePicker"
      />

      <!-- 追加情報タブ -->
      <div
        class="layer-block"
        v-if="currentTabInfo.target === 'additional-info'"
      >
        <table>
          <tr>
            <tr-string-input-component
              labelName="tag"
              width="100%"
              v-model="tagVolatile"
            />
          </tr>
          <tr>
            <th class="label-input">
              <label
                :for="`${key}-layer`"
                class="label-layer"
                v-t="'label.layer'"
              ></label>
            </th>
            <td class="value-cell">
              <scene-layer-select
                v-model="layerIdVolatile"
                :id="`${key}-layer`"
              />
            </td>
          </tr>
          <tr>
            <tr-string-input-component
              labelName="ref-url"
              width="100%"
              v-model="urlVolatile"
            />
          </tr>
          <tr v-if="characterSheetType">
            <th></th>
            <td>
              <ctrl-button @click.stop="readCharacterSheet()">
                <span v-t="'button.read-character-sheet'"></span>
              </ctrl-button>
            </td>
          </tr>
        </table>
      </div>

      <!-- その他欄タブ -->
      <other-text-edit-component
        v-if="currentTabInfo.target === 'other-text'"
        v-model="otherTextVolatile"
      />
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import TaskProcessor from "../../../core/task/TaskProcessor";
import LifeCycle from "../../../core/decorator/LifeCycle";
import ComponentVue from "../../../core/window/ComponentVue";
import { BackgroundSize, Direction } from "@/@types/room";
import GameObjectManager from "../../GameObjectManager";
import { TabInfo } from "@/@types/window";
import VueEvent from "../../../core/decorator/VueEvent";
import TrStringInputComponent from "../../common/components/TrStringInputComponent.vue";
import TrNumberInputComponent from "../../common/components/TrNumberInputComponent.vue";
import BackgroundLocationSelect from "../../common/components/select/BackgroundLocationSelect.vue";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import ImagePickerComponent from "../../../core/component/ImagePickerComponent.vue";
import SceneLayerSelect from "../../common/components/select/SceneLayerSelect.vue";
import OtherTextEditComponent from "@/app/basic/object/character/OtherTextEditComponent.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import jsonp from "jsonp";

@Component({
  components: {
    CtrlButton,
    OtherTextEditComponent,
    SceneLayerSelect,
    ImagePickerComponent,
    SimpleTabComponent,
    BackgroundLocationSelect,
    TrNumberInputComponent,
    TrStringInputComponent
  }
})
export default class CharacterInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: "image" })
  private initTabTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private mediaList = GameObjectManager.instance.mediaList;
  private isMounted: boolean = false;
  private imageSrc: string = "";

  private characterSheetType: "シノビガミ" | null = null;

  @Prop({ type: String, required: true })
  private name!: string;

  private nameVolatile: string = "";
  @Watch("name", { immediate: true })
  private onChangeName(value: string) {
    this.nameVolatile = value;
  }
  @Watch("nameVolatile")
  private onChangeNameVolatile(value: string) {
    this.$emit("update:name", value);
  }

  @Prop({ type: String, required: true })
  private tag!: string;

  private tagVolatile: string = "";
  @Watch("tag", { immediate: true })
  private onChangeTag(value: string) {
    this.tagVolatile = value;
  }
  @Watch("tagVolatile")
  private onChangeTagVolatile(value: string) {
    this.$emit("update:tag", value);
  }

  @Prop({ type: String, required: true })
  private url!: string;

  private urlVolatile: string = "";
  @Watch("url", { immediate: true })
  private onChangeUrl(value: string) {
    this.urlVolatile = value;
  }
  @Watch("urlVolatile")
  private onChangeUrlVolatile(value: string) {
    this.$emit("update:url", value);
  }

  @Prop({ type: String, required: true })
  private otherText!: string;

  private otherTextVolatile: string = "";
  @Watch("otherText", { immediate: true })
  private onChangeOtherText(value: string) {
    this.otherTextVolatile = value;
  }
  @Watch("otherTextVolatile")
  private onChangeOtherTextVolatile(value: string) {
    this.$emit("update:otherText", value);
  }

  @Prop({ type: Number, required: true })
  private size!: number;

  private sizeVolatile: number = 0;
  @Watch("size", { immediate: true })
  private onChangeSize(value: number) {
    this.sizeVolatile = value;
  }
  @Watch("sizeVolatile")
  private onChangeSizeVolatile(value: number) {
    this.$emit("update:size", value);
  }

  @Prop({ type: String, default: null })
  private imageDocId!: string | null;

  private imageDocIdVolatile: string | null = null;
  @Watch("imageDocId", { immediate: true })
  private onChangeImageDocId(value: string | null) {
    this.imageDocIdVolatile = value;
  }
  @Watch("imageDocIdVolatile")
  private onChangeImageDocIdVolatile(value: string | null) {
    this.$emit("update:imageDocId", value);
  }

  @Prop({ type: String, default: null })
  private imageTag!: string | null;

  private imageTagVolatile: string | null = null;
  @Watch("imageTag", { immediate: true })
  private onChangeImageTag(value: string | null) {
    this.imageTagVolatile = value;
  }
  @Watch("imageTagVolatile")
  private onChangeImageTagVolatile(value: string | null) {
    this.$emit("update:imageTag", value);
  }

  @Prop({ type: String, required: true })
  private direction!: Direction;

  private directionVolatile: Direction = "none";
  @Watch("direction", { immediate: true })
  private onChangeDirection(value: Direction) {
    this.directionVolatile = value;
  }
  @Watch("directionVolatile")
  private onChangeDirectionVolatile(value: Direction) {
    this.$emit("update:direction", value);
  }

  @Prop({ type: String, required: true })
  private backgroundSize!: BackgroundSize;

  private backgroundSizeVolatile: BackgroundSize = "contain";
  @Watch("backgroundSize", { immediate: true })
  private onChangeBackgroundSize(value: BackgroundSize) {
    this.backgroundSizeVolatile = value;
  }
  @Watch("backgroundSizeVolatile")
  private onChangeBackgroundSizeVolatile(value: BackgroundSize) {
    this.$emit("update:backgroundSize", value);
  }

  @Prop({ type: String, required: true })
  private layerId!: string;

  private layerIdVolatile: string = "";
  @Watch("layerId", { immediate: true })
  private onChangeLayerId(value: string) {
    this.layerIdVolatile = value;
  }
  @Watch("layerIdVolatile")
  private onChangeLayerIdVolatile(value: string) {
    this.$emit("update:layerId", value);
  }

  private tabList: TabInfo[] = [
    { target: "image", text: "" },
    { target: "additional-info", text: "" },
    { target: "other-text", text: "" }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.currentTabInfo = this.tabList.filter(
      t => t.target === this.initTabTarget
    )[0];
  }

  @Watch("isMounted")
  @Watch("imageDocId")
  @Watch("direction")
  @Watch("backgroundSize")
  private onChangeImage() {
    if (!this.isMounted) return;
    const imageObj = this.mediaList.filter(
      obj => obj.id === this.imageDocId
    )[0];
    if (!imageObj) return;
    this.imageSrc = imageObj.data!.url;
    this.objectElm.style.setProperty("--imageSrc", `url(${this.imageSrc})`);
    let direction = "";
    if (this.direction === "horizontal") direction = "scale(-1, 1)";
    if (this.direction === "vertical") direction = "scale(1, -1)";
    if (this.direction === "180") direction = "rotate(180deg)";
    this.objectElm.style.setProperty(`--image-direction`, direction);
    this.objectElm.style.setProperty(
      "--isEmpty",
      (this.imageSrc ? 0 : 1).toString()
    );
  }

  private get objectElm(): HTMLElement {
    return this.$refs.object as HTMLElement;
  }

  @VueEvent
  private dragStart(event: DragEvent) {
    this.$emit("drag-start", event);
  }

  @VueEvent
  private dragEnd(event: DragEvent) {
    this.$emit("drag-end", event);
  }

  @Watch("isMounted")
  @Watch("size")
  private onChangeSize2() {
    if (!this.isMounted) return;
    const size: number = this.size > 4 ? 4 : this.size;
    this.objectElm.style.setProperty("--width-ratio", size.toString());
    this.objectElm.style.setProperty("--height-ratio", size.toString());
  }

  @Watch("isMounted")
  @Watch("backgroundSize")
  private onChangeLocation() {
    if (!this.isMounted) return;
    let backgroundSize = "";
    let backgroundPosition = "center";
    if (this.backgroundSize === "contain") backgroundSize = "contain";
    if (this.backgroundSize === "cover-start") {
      backgroundSize = "cover";
      backgroundPosition = "top left";
    }
    if (this.backgroundSize === "cover-center") {
      backgroundSize = "cover";
    }
    if (this.backgroundSize === "cover-end") {
      backgroundSize = "cover";
      backgroundPosition = "bottom right";
    }
    if (this.backgroundSize === "100%") {
      backgroundSize = "100% 100%";
    }
    this.objectElm.style.setProperty("--image-background-size", backgroundSize);
    this.objectElm.style.setProperty(
      "--image-background-position",
      backgroundPosition
    );
  }

  @Watch("urlVolatile", { immediate: true })
  private onChangeUrlVolatile2(value: string) {
    if (
      value.match(
        /https?:\/\/character-sheets\.appspot\.com\/shinobigami\/.+\?key=([^&]+)/
      )
    ) {
      this.characterSheetType = "シノビガミ";
    } else {
      this.characterSheetType = null;
    }
  }

  @VueEvent
  private async readCharacterSheet() {
    if (this.characterSheetType === "シノビガミ") {
      const regExp = /https?:\/\/character-sheets\.appspot\.com\/shinobigami\/.+\?key=([^&]+)/;
      const playerUrl = this.urlVolatile;
      const matchResult = playerUrl.match(regExp);
      if (!matchResult) return;
      const key = matchResult[1];
      // const editUrl = 'https://character-sheets.appspot.com/shinobigami/edit.html?key=' + key;
      const jsonUrl = `https://character-sheets.appspot.com/shinobigami/display?ajax=1&key=${key}&callback=getJson`;
      const json = (await this.getJson(jsonUrl)) as Shinobigami;
      console.log(json);

      const shinobigamiData = this.createShinobigamiData(jsonUrl, json);

      const strList: string[] = [];
      strList.push("## 基本情報");
      strList.push(`PL: ${shinobigamiData.playerName}`);
      strList.push(
        `PC: ${shinobigamiData.characterName}${
          shinobigamiData.characterNameKana
            ? `（${shinobigamiData.characterNameKana}）`
            : ""
        }`
      );
      strList.push(
        `${shinobigamiData.level} ${shinobigamiData.belief} ${shinobigamiData.age} ${shinobigamiData.sex} ${shinobigamiData.cover}`
      );
      strList.push(
        `流派：${shinobigamiData.upperStyle}${
          shinobigamiData.subStyle ? `（${shinobigamiData.subStyle}）` : ""
        }`
      );
      strList.push(`流儀: ${shinobigamiData.stylerule}`);
      strList.push(``);
      strList.push("## 特技");
      strList.push(
        `|[ ]|器術　　　　|[${
          shinobigamiData.tokugi.spaceList.indexOf(0) > -1 ? "x" : " "
        }]|体術　　　　|[${
          shinobigamiData.tokugi.spaceList.indexOf(1) > -1 ? "x" : " "
        }]|忍術　　　　|[${
          shinobigamiData.tokugi.spaceList.indexOf(2) > -1 ? "x" : " "
        }]|謀術　　　　|[${
          shinobigamiData.tokugi.spaceList.indexOf(3) > -1 ? "x" : " "
        }]|戦術　　　　|[${
          shinobigamiData.tokugi.spaceList.indexOf(4) > -1 ? "x" : " "
        }]|妖術　　　　||`
      );
      strList.push(`|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--:|`);
      shinobigamiData.tokugi.table.forEach((tList: string[], rIdx: number) => {
        strList.push(
          tList
            .map(
              (t: string, cIdx: number) =>
                `||[${
                  shinobigamiData.tokugi.tokugiList.some(
                    lt => lt.row === rIdx && lt.column === cIdx
                  )
                    ? "x"
                    : " "
                }]${t}`
            )
            .join("") + `|${rIdx + 2}|`
        );
      });
      strList.push(``);
      strList.push(`## 忍法`);
      strList.push(`|忍法|タイプ|指定特技|間合|コスト|効果|`);
      strList.push(`|:---|:---|:---|---:|---:|:---|`);
      strList.push(
        ...shinobigamiData.ninpouList.map(
          n =>
            `|${n.name}|${n.type}|${n.targetSkill}|${n.range}|${n.cost}|${n.effect}|`
        )
      );
      strList.push(``);
      strList.push(`## 背景`);
      strList.push(`|名称|種別|功績点|効果|`);
      strList.push(`|:---|:---|:---|:---|`);
      strList.push(
        ...shinobigamiData.backgroundList.map(
          n => `|${n.name}|${n.type}|${n.point}|${n.effect}|`
        )
      );
      strList.push(``);
      strList.push(`## 人間関係`);
      strList.push(`|キャラ|居|情|奥|感情|`);
      strList.push(`|:---|:---|:---|:---|:---|`);
      strList.push(
        `|PC1|[ ]|[ ]|[ ]|{感情}[なし|1:共感(+)|1:不信(-)|2:友情(+)|2:怒り(-)|3:愛情(+)|3:妬み(-)|4:忠誠(+)|4:侮蔑(-)|5:憧憬(+)|5:劣等感(-)|6:狂信(+)|6:殺意(-)](なし)|`
      );
      strList.push(
        `|PC2|[ ]|[ ]|[ ]|{感情}[なし|1:共感(+)|1:不信(-)|2:友情(+)|2:怒り(-)|3:愛情(+)|3:妬み(-)|4:忠誠(+)|4:侮蔑(-)|5:憧憬(+)|5:劣等感(-)|6:狂信(+)|6:殺意(-)](なし)|`
      );
      this.otherText = strList.join("\r\n");

      console.log(JSON.stringify(shinobigamiData, null, "  "));
    }
  }

  private createShinobigamiData(jsonUrl: string, json: any): Shinobigami {
    const shinobigamiData: Shinobigami = {
      meta: {
        url: jsonUrl,
        jsonUrl
      },
      playerName: json["base"]["player"] || "",
      characterName: json["base"]["name"] || "",
      characterNameKana: json["base"]["nameKana"] || "",
      upperStyle: "ハグレモノ",
      subStyle: json["base"]["substyle"] || "",
      level: json["base"]["level"] || "",
      age: json["base"]["age"] || "",
      sex: json["base"]["sex"] || "",
      cover: json["base"]["cover"] || "",
      belief: json["base"]["belief"] || "",
      stylerule: json["base"]["stylerule"] || "",
      ninpouList: [],
      backgroundList: [],
      tokugi: {
        table: [
          ["絡繰術", "騎乗術", "生存術", "医術", "兵糧術", "異形化"],
          ["火術", "砲術", "潜伏術", "毒術", "鳥獣術", "召喚術"],
          ["水術", "手裏剣術", "遁走術", "罠術", "野戦術", "死霊術"],
          ["針術", "手練", "盗聴術", "調査術", "地の利", "結界術"],
          ["仕込み", "身体操術", "腹話術", "詐術", "意気", "封術"],
          ["衣装術", "歩法", "隠形術", "対人術", "用兵術", "言霊術"],
          ["縄術", "走法", "変装術", "遊芸", "記憶術", "幻術"],
          ["登術", "飛術", "香術", "九ノ一の術", "見敵術", "瞳術"],
          ["拷問術", "骨法術", "分身の術", "傀儡の術", "暗号術", "千里眼の術"],
          ["壊器術", "刀術", "隠蔽術", "流言の術", "伝達術", "憑依術"],
          ["掘削術", "怪力", "第六感", "経済力", "人脈", "呪術"]
        ],
        tokugiList: [],
        spaceList: []
      }
    };
    switch (json["base"]["upperstyle"]) {
      case "a":
        shinobigamiData.upperStyle = "斜歯忍軍";
        break;
      case "ab":
        shinobigamiData.upperStyle = "鞍馬神流";
        break;
      case "bc":
        shinobigamiData.upperStyle = "ハグレモノ";
        break;
      case "cd":
        shinobigamiData.upperStyle = "比良坂機関";
        break;
      case "de":
        shinobigamiData.upperStyle = "私立御斎学園";
        break;
      case "e":
        shinobigamiData.upperStyle = "隠忍の血統";
        break;
      default:
        shinobigamiData.upperStyle = "";
    }
    shinobigamiData.backgroundList = (json["background"] as any[]).map(b => ({
      name: b["name"] || "",
      type: b["type"] || "",
      point: b["point"] || "0",
      effect: b["effect"] ? b["effect"].replace(/\r?\n/g, "\\n") : ""
    }));
    shinobigamiData.ninpouList = (json["ninpou"] as any[]).map(n => ({
      secret: !!n["secret"],
      name: n["name"] || "",
      type: n["type"] || "",
      targetSkill: n["targetSkill"] || "",
      range: n["range"] || "",
      cost: n["cost"] || "",
      effect: n["effect"] ? n["effect"].replace(/\r?\n/g, "\\n") : "",
      page: n["page"] || ""
    }));
    (json["learned"] as any[]).forEach(learnedJson => {
      // const hiddenSkill = learnedJson["hiddenSkill"];
      const id = learnedJson["id"];
      // const judge = learnedJson["judge"];

      if (!id) return;

      const row = parseInt(id.match(/row([0-9]+)/)[1]);
      const column = parseInt(id.match(/name([0-9]+)/)[1]);
      const name = shinobigamiData.tokugi.table[row][column];

      shinobigamiData.tokugi.tokugiList.push({
        column,
        row,
        name
      });
    });

    for (let i = 0; i < 6; i++) {
      if (json["skills"][String.fromCharCode("a".charCodeAt(0) + i)]) {
        shinobigamiData.tokugi.spaceList.push(i);
      }
    }
    return shinobigamiData;
  }

  private async getJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jsonp(url, { name: "getJson" }, (err: any, result: any) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.character-info-form {
  display: contents;
}

.object {
  @include inline-flex-box(row, center, center);
  width: calc(var(--width-ratio) * 3em);
  height: calc(var(--height-ratio) * 3em);
  background-image: var(--imageSrc);
  transform: var(--image-direction);
  background-size: var(--image-background-size);
  background-repeat: no-repeat;
  background-position: var(--image-background-position);
  border-style: solid;
  border-color: rgb(255, 255, 153);
  border-width: 3px;
  box-sizing: border-box;

  &.type-add {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &[draggable="false"] {
      cursor: not-allowed;

      background-image: linear-gradient(
          -45deg,
          transparent calc(50% - 1px),
          var(--uni-color-red) calc(50% - 1px),
          var(--uni-color-red) calc(50% + 1px),
          transparent calc(50% + 1px)
        ),
        linear-gradient(
          45deg,
          transparent calc(50% - 1px),
          var(--uni-color-red) calc(50% - 1px),
          var(--uni-color-red) calc(50% + 1px),
          transparent calc(50% + 1px)
        );
    }
  }
}

.simple-tab-component {
  grid-row: 1 / 3;
  grid-column: 2 / 3;

  > *:not(:first-child) {
    width: 100%;
    height: calc(100% - 2em);
    flex: 1;
  }

  > div:not(.image-picker-container) {
    border: solid 1px gray;
    box-sizing: border-box;
    padding: 0.2rem;
  }
}

.object-cell {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  @include flex-box(row, center, center);
}

table {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  table-layout: fixed;
  align-self: flex-end;

  th,
  td {
    label {
      @include inline-flex-box(row, flex-start, center);
    }
  }

  th {
    text-align: left;
    width: 1px;
    white-space: nowrap;

    :first-child {
      display: inline-block;
      width: calc(100% - 1em);
    }
  }

  td {
    text-align: left;
    padding: 0;
  }
}
</style>
