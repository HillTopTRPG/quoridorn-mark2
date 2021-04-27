<template>
  <div class="character-info-form">
    <!-- 掴む -->
    <div class="object-cell">
      <div
        class="object"
        :class="{ 'type-add': isAdd }"
        ref="object"
        :draggable="
          !!name && !isDuplicate && isAdd && mediaKey ? 'true' : 'false'
        "
        @dragstart="dragStart"
        @dragend="dragEnd"
      ></div>
    </div>

    <!-- コマ情報 -->
    <table class="info-table">
      <tr>
        <tr-string-input-component
          labelName="label.name"
          width="100%"
          v-model="nameVolatile"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="label.size"
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
            v-t="'selection.background-location.label'"
          ></label>
        </th>
        <td class="value-cell">
          <background-location-select
            :elmId="`${key}-background-size`"
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
        v-model="mediaKeyVolatile"
        :windowKey="key"
        :mediaTag.sync="mediaTagVolatile"
        :direction.sync="directionVolatile"
        ref="imagePicker"
        :is-simple.sync="isSimple"
      />

      <!-- 追加情報タブ -->
      <div
        class="layer-block"
        v-if="currentTabInfo.target === 'additional-info'"
      >
        <table>
          <tr>
            <tr-string-input-component
              labelName="label.tag"
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
                v-model="layerKeyVolatile"
                :elmId="`${key}-layer`"
              />
            </td>
          </tr>
          <tr>
            <tr-string-input-component
              labelName="label.ref-url"
              width="100%"
              v-model="urlVolatile"
            />
          </tr>
          <tr v-if="trpgSystemHelper && trpgSystemHelper.isSupportedOtherText">
            <th></th>
            <td>
              <ctrl-button @click.stop="createOtherText()">
                <span v-t="'button.create-other-text'"></span>
              </ctrl-button>
            </td>
          </tr>
        </table>
      </div>

      <!-- その他欄タブ -->
      <other-text-edit-component
        v-if="currentTabInfo.target === 'other-text'"
        v-model="otherTextListVolatile"
        :windowKey="windowKey"
      />
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { TabInfo } from "@/@types/window";
import OtherTextEditComponent from "@/app/basic/other-text/OtherTextEditComponent.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { MemoStore } from "@/@types/store-data";
import { questionDialog } from "@/app/core/utility/Utility";
import { BackgroundSize, Direction } from "@/@types/store-data-optional";
import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";
import { getTrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemFasade";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import BackgroundLocationSelect from "@/app/basic/common/components/select/BackgroundLocationSelect.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

const uuid = require("uuid");

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
  private actorList = GameObjectManager.instance.actorList;
  private isSimple: boolean = true;

  private trpgSystemHelper: TrpgSystemHelper<any> | null = null;

  @Prop({ type: String, default: null })
  private docKey!: string;

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

  @Prop({ type: Array, required: true })
  private otherTextList!: Partial<StoreData<MemoStore>>[];
  private otherTextListVolatile: Partial<StoreData<MemoStore>>[] = [];
  @Watch("otherTextList", { immediate: true })
  private onChangeOtherTextList(value: Partial<StoreData<MemoStore>>[]) {
    this.otherTextListVolatile = value;
  }
  @Watch("otherTextListVolatile")
  private onChangeOtherTextListVolatile(
    value: Partial<StoreData<MemoStore>>[]
  ) {
    this.$emit("update:otherTextList", value);
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
  private mediaKey!: string | null;
  private mediaKeyVolatile: string | null = null;
  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey(value: string | null) {
    this.mediaKeyVolatile = value;
  }
  @Watch("mediaKeyVolatile")
  private onChangeImageDocKeyVolatile(value: string | null) {
    this.$emit("update:mediaKey", value);
  }

  @Prop({ type: String, default: null })
  private mediaTag!: string | null;
  private mediaTagVolatile: string | null = null;
  @Watch("mediaTag", { immediate: true })
  private onChangeImageTag(value: string | null) {
    this.mediaTagVolatile = value;
  }
  @Watch("mediaTagVolatile")
  private onChangeImageTagVolatile(value: string | null) {
    this.$emit("update:mediaTag", value);
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
  private layerKey!: string;
  private layerKeyVolatile: string = "";
  @Watch("layerKey", { immediate: true })
  private onChangeLayerKey(value: string) {
    this.layerKeyVolatile = value;
  }
  @Watch("layerKeyVolatile")
  private onChangeLayerKeyVolatile(value: string) {
    this.$emit("update:layerKey", value);
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "image", text: "", isDisabled: false },
    { key: "2", target: "additional-info", text: "", isDisabled: false },
    { key: "3", target: "other-text", text: "", isDisabled: false }
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
    this.currentTabInfo = this.tabList.find(
      t => t.target === this.initTabTarget
    )!;
  }

  private get isDuplicate(): boolean {
    return this.actorList.some(
      ct => ct.data!.name === this.name && ct.key !== this.docKey
    );
  }

  @Watch("isMounted")
  @Watch("mediaKey")
  @Watch("direction")
  @Watch("backgroundSize")
  private onChangeImage() {
    if (!this.isMounted) return;
    const imageObj = this.mediaList.find(obj => obj.key === this.mediaKey);
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
  private async onChangeUrlVolatile2(value: string) {
    this.trpgSystemHelper = await getTrpgSystemHelper(value);
  }

  @VueEvent
  private async createOtherText() {
    if (!this.trpgSystemHelper || !this.trpgSystemHelper.isSupportedOtherText)
      return;

    const confirm = await questionDialog({
      title: this.$t("message.load-other-text-character-sheet").toString(),
      text: this.$t("message.load-other-text-character-sheet-text").toString(),
      confirmButtonText: this.$t("button.commit").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;

    const memoList = await this.trpgSystemHelper.createOtherText(
      this.otherTextListVolatile
    );
    if (!memoList) return;

    // 中身が空のタブを削除
    this.otherTextListVolatile
      .filter(v => !v.data!.tab && !v.data!.text)
      .map((v, ind) => ind)
      .reverse()
      .forEach(ind => this.otherTextListVolatile.splice(ind, 1));

    // タブ名が重複するものは上書き、そうでないものは追加
    memoList.forEach(otd => {
      const duplicateList = this.otherTextListVolatile.filter(
        v => v.data!.tab === otd.data!.tab
      );
      if (!duplicateList.length) {
        // 重複が無かったらそのまま追加
        this.otherTextListVolatile.push(otd);
      } else {
        // 重複があったら、タイプがURLだったら更新
        if (otd.data!.type === "url") {
          const duplicate = duplicateList.find(d => d.data!.type === "url");
          if (duplicate) {
            duplicate.data!.text = otd.data!.text;
          } else {
            this.otherTextListVolatile.push(otd);
          }
        }
      }
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
  overflow: hidden;

  > *:not(:first-child) {
    width: 100%;
    height: calc(100% - 2em);
    flex: 1;
  }

  > div:not(.image-picker-component) {
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
