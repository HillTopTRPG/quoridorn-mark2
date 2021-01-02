<template>
  <div class="bgm-info-form">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 基本タブ -->
      <div class="layer-block" v-if="currentTabInfo.target === 'basic'">
        <table>
          <tr>
            <!-- 画像を使う -->
            <tr-checkbox-component
              labelName="label.image"
              :cLabel="$t('label.use')"
              :nLabel="$t('label.un-use')"
              v-model="isUseImageVolatile"
            />
          </tr>
          <tr>
            <!-- BGMを使う -->
            <tr-checkbox-component
              labelName="label.bgm"
              :cLabel="$t('label.use')"
              :nLabel="$t('label.un-use')"
              v-model="isUseBgmVolatile"
            />
          </tr>
          <tr class="space"></tr>
          <tr>
            <!-- タイトル -->
            <tr-string-input-component
              class="title"
              labelName="label.title"
              v-model="titleVolatile"
              inputWidth="100%"
            />
          </tr>
          <tr>
            <!-- タグ -->
            <tr-string-input-component
              class="tag"
              labelName="label.tag"
              v-model="tagVolatile"
              :list="`${key}-tag-values`"
            />
          </tr>
          <tr class="space"></tr>

          <tr>
            <!-- チャット連動オプション -->
            <th>
              <label
                class="label-input"
                :for="`${key}-chat-linkage`"
                v-t="'label.chat-linkage'"
              ></label>
            </th>
            <td>
              <chat-linkage-type-select
                :id="`${key}-chat-linkage`"
                v-model="chatLinkageTypeVolatile"
              />
            </td>
          </tr>
          <tr>
            <!-- チャット連動対象 -->
            <tr-string-input-component
              class="chat-linkage-target"
              labelName="label.chat-linkage-target"
              v-model="chatLinkageTargetVolatile"
              :disabled="chatLinkageTypeVolatile === 'none'"
              :placeholder="chatLinkagePlaceholder"
            />
          </tr>
        </table>

        <datalist :id="`${key}-tag-values`">
          <option v-for="tag in tags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </datalist>
      </div>

      <!-- 画像タブ -->
      <image-picker-component
        v-if="currentTabInfo.target === 'image'"
        v-model="imageKeyVolatile"
        :windowKey="key"
        :mediaTag.sync="imageTagVolatile"
        :direction.sync="directionVolatile"
        ref="imagePicker"
        :is-simple.sync="isViewImageThumbnail"
      />

      <!-- 画像設定タブ -->
      <div class="layer-block" v-if="currentTabInfo.target === 'image-setting'">
        <table>
          <tr>
            <tr-string-input-component
              labelName="label.tag"
              width="100%"
              v-model="tagVolatile"
            />
          </tr>
        </table>
      </div>

      <!-- BGMタブ -->
      <bgm-picker-component
        v-if="currentTabInfo.target === 'bgm'"
        v-model="bgmKeyVolatile"
        :windowKey="key"
        :mediaTag.sync="bgmTagVolatile"
        :direction.sync="directionVolatile"
        :is-simple.sync="isViewBgmThumbnail"
        ref="bgmPicker"
      />

      <!-- BGM設定タブ -->
      <div class="layer-block" v-if="currentTabInfo.target === 'bgm-setting'">
        <table>
          <tr>
            <!-- 音量 -->
            <tr-range-input-component
              class="volume"
              labelName="bgm-info-form.label.volume"
              v-model="volumeVolatile"
              :step="1"
              :min="0"
              :max="100"
            />
          </tr>
          <tr>
            <!-- 再生開始 -->
            <tr-number-input-component
              class="start"
              labelName="bgm-info-form.label.play-start"
              v-model="startVolatile"
              :step="0.1"
              :min="-10000"
              :max="10000"
              unitLabel="bgm-info-form.label.second"
            />
          </tr>
          <tr>
            <!-- 再生終了 -->
            <tr-number-input-component
              class="end"
              labelName="bgm-info-form.label.play-end"
              v-model="endVolatile"
              :step="0.1"
              :min="-10000"
              :max="10000"
              unitLabel="bgm-info-form.label.second"
            />
          </tr>
          <tr class="space"></tr>
          <tr>
            <!-- フェードイン -->
            <tr-number-input-component
              class="fade-in"
              labelName="bgm-info-form.label.fade-in"
              v-model="fadeInVolatile"
              :step="0.1"
              :min="0"
              :max="200"
              unitLabel="bgm-info-form.label.second"
            />
          </tr>
          <tr>
            <!-- フェードアウト -->
            <tr-number-input-component
              class="fade-out"
              labelName="bgm-info-form.label.fade-out"
              v-model="fadeOutVolatile"
              :step="0.1"
              :min="0"
              :max="200"
              unitLabel="bgm-info-form.label.second"
            />
          </tr>
        </table>

        <div class="check-block">
          <!-- 無限ループ -->
          <div
            class="check-box repeat"
            :class="{ checked: isRepeatVolatile }"
            @click="isRepeatVolatile = !isRepeat"
            @contextmenu.prevent
          >
            <i class="icon-loop"></i>
            <span v-t="'bgm-info-form.label.repeat'"></span>
          </div>

          <!-- スタンバイ -->
          <div
            class="check-box stand-by"
            :class="{ checked: isStandByVolatile }"
            @click="isStandByVolatile = !isStandBy"
            @contextmenu.prevent
            v-t="'bgm-info-form.label.stand-by'"
          ></div>
        </div>

        <div class="check-block">
          <!-- 多重再生時強制続行 -->
          <div
            class="check-box force-continue"
            :class="{ checked: isForceContinueVolatile }"
            @click="isForceContinueVolatile = !isForceContinue"
            @contextmenu.prevent
            v-t="'bgm-info-form.label.force-continue'"
          ></div>
        </div>

        <div class="check-block">
          <!-- 強制新規作成 -->
          <div
            class="check-box force-new"
            :class="{ checked: isForceNewVolatile }"
            @click="isForceNewVolatile = !isForceNew"
            @contextmenu.prevent
            v-t="'bgm-info-form.label.force-new'"
          ></div>
        </div>
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import ComponentVue from "../../core/window/ComponentVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import ChatLinkageTypeSelect from "../common/components/select/ChatLinkageTypeSelect.vue";
import TrStringInputComponent from "../common/components/TrStringInputComponent.vue";
import GameObjectManager from "../GameObjectManager";
import BaseInput from "../../core/component/BaseInput.vue";
import TrRangeInputComponent from "../common/components/TrRangeInputComponent.vue";
import TrNumberInputComponent from "../common/components/TrNumberInputComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { Direction } from "@/@types/store-data-optional";
import TrCheckboxComponent from "@/app/basic/common/components/TrCheckboxComponent.vue";
import BgmPickerComponent from "@/app/core/component/BgmPickerComponent.vue";

@Component({
  components: {
    BgmPickerComponent,
    TrCheckboxComponent,
    SimpleTabComponent,
    ImagePickerComponent,
    ChatLinkageTypeSelect,
    TrRangeInputComponent,
    TrNumberInputComponent,
    TrStringInputComponent,
    BaseInput,
    CtrlButton
  }
})
export default class CutInInfoForm extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  private tabList: TabInfo[] = [
    { key: "1", target: "basic", text: "", isDisabled: false },
    { key: "2", target: "image", text: "", isDisabled: false },
    { key: "3", target: "image-setting", text: "", isDisabled: false },
    { key: "4", target: "bgm", text: "", isDisabled: false },
    { key: "5", target: "bgm-setting", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  private isViewImageThumbnail: boolean = true;
  private isViewBgmThumbnail: boolean = true;

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @Watch("isUseImageVolatile", { immediate: true })
  private onChangeIsUseImageVolatile2(value: boolean) {
    this.tabList
      .filter(tab => tab.target.toString().startsWith("image"))
      .forEach(tab => (tab.isDisabled = !value));
  }

  @Watch("isUseBgmVolatile", { immediate: true })
  private onChangeIsUseBgmVolatile2(value: boolean) {
    this.tabList
      .filter(tab => tab.target.toString().startsWith("bgm"))
      .forEach(tab => (tab.isDisabled = !value));
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

  private isMounted: boolean = false;

  private isYoutube: boolean = false;
  private cutInList = GameObjectManager.instance.cutInList;

  @VueEvent
  private get chatLinkagePlaceholder() {
    if (this.chatLinkageTypeVolatile === "last")
      return this.$t("label.last-str")!.toString();
    if (this.chatLinkageTypeVolatile === "regexp")
      return this.$t("label.javascript-regexp")!.toString();
    return "";
  }

  // isUseImage
  @Prop({ type: Boolean, required: true })
  private isUseImage!: boolean;
  private isUseImageVolatile: boolean = true;
  @Watch("isUseImage", { immediate: true })
  private onChangeIsUseImage(value: boolean) {
    this.isUseImageVolatile = value;
  }
  @Watch("isUseImageVolatile")
  private onChangeIsUseImageVolatile(value: boolean) {
    this.$emit("update:isUseImage", value);
  }

  // isUseBgm
  @Prop({ type: Boolean, required: true })
  private isUseBgm!: boolean;
  private isUseBgmVolatile: boolean = true;
  @Watch("isUseBgm", { immediate: true })
  private onChangeIsUseBgm(value: boolean) {
    this.isUseBgmVolatile = value;
  }
  @Watch("isUseBgmVolatile")
  private onChangeIsUseBgmVolatile(value: boolean) {
    this.$emit("update:isUseBgm", value);
  }

  // url
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

  // title
  @Prop({ type: String, required: true })
  private title!: string;
  private titleVolatile: string = "";
  @Watch("title", { immediate: true })
  private onChangeTitle(value: string) {
    this.titleVolatile = value;
  }
  @Watch("titleVolatile")
  private onChangeTitleVolatile(value: string) {
    this.$emit("update:title", value);
  }

  // tag
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

  // isRepeat
  @Prop({ type: Boolean, required: true })
  private isRepeat!: boolean;
  private isRepeatVolatile: boolean = false;
  @Watch("isRepeat", { immediate: true })
  private onChangeIsLoop(value: boolean) {
    this.isRepeatVolatile = value;
  }
  @Watch("isRepeatVolatile")
  private onChangeIsLoopVolatile(value: boolean) {
    this.$emit("update:isRepeat", value);
  }

  // fadeIn
  @Prop({ type: Number, required: true })
  private fadeIn!: number;
  private fadeInVolatile: number = 0;
  @Watch("fadeIn", { immediate: true })
  private onChangeFadeIn(value: number) {
    this.fadeInVolatile = value;
  }
  @Watch("fadeInVolatile")
  private onChangeFadeInVolatile(value: number) {
    this.$emit("update:fadeIn", value);
  }

  // fadeOut
  @Prop({ type: Number, required: true })
  private fadeOut!: number;
  private fadeOutVolatile: number = 0;
  @Watch("fadeOut", { immediate: true })
  private onChangeFadeOut(value: number) {
    this.fadeOutVolatile = value;
  }
  @Watch("fadeOutVolatile")
  private onChangeFadeOutVolatile(value: number) {
    this.$emit("update:fadeOut", value);
  }

  // start
  @Prop({ type: Number, required: true })
  private start!: number;
  private startVolatile: number = 0;
  @Watch("start", { immediate: true })
  private onChangeStart(value: number) {
    this.startVolatile = value;
  }
  @Watch("startVolatile")
  private onChangeStartVolatile(value: number) {
    this.$emit("update:start", value);
  }

  // end
  @Prop({ type: Number, required: true })
  private end!: number;
  private endVolatile: number = 0;
  @Watch("end", { immediate: true })
  private onChangeEnd(value: number) {
    this.endVolatile = value;
  }
  @Watch("endVolatile")
  private onChangeEndVolatile(value: number) {
    this.$emit("update:end", value);
  }

  // volume
  @Prop({ type: Number, required: true })
  private volume!: number;
  private volumeVolatile: number = 0.8;
  @Watch("volume", { immediate: true })
  private onChangeVolume(value: number) {
    this.volumeVolatile = value;
  }
  @Watch("volumeVolatile")
  private onChangeVolumeVolatile(value: number) {
    this.$emit("update:volume", value);
  }

  // chatLinkageType
  @Prop({ type: String, required: true })
  private chatLinkageType!: string;
  private chatLinkageTypeVolatile: string = "none";
  @Watch("chatLinkageType", { immediate: true })
  private onChangeChatLinkageType(value: string) {
    this.chatLinkageTypeVolatile = value;
  }
  @Watch("chatLinkageTypeVolatile")
  private onChangeChatLinkageTypeVolatile(value: string) {
    this.$emit("update:chatLinkageType", value);
  }

  // chatLinkageTarget
  @Prop({ type: String, required: true })
  private chatLinkageTarget!: string;
  private chatLinkageTargetVolatile: string = "";
  @Watch("chatLinkageTarget", { immediate: true })
  private onChangeChatLinkageTarget(value: string) {
    this.chatLinkageTargetVolatile = value;
  }
  @Watch("chatLinkageTargetVolatile")
  private onChangeChatLinkageTargetVolatile(value: string) {
    this.$emit("update:chatLinkageTarget", value);
  }

  // isStandBy
  @Prop({ type: Boolean, required: true })
  private isStandBy!: boolean;
  private isStandByVolatile: boolean = false;
  @Watch("isStandBy", { immediate: true })
  private onChangeIsStandBy(value: boolean) {
    this.isStandByVolatile = value;
  }
  @Watch("isStandByVolatile")
  private onChangeIsStandByVolatile(value: boolean) {
    this.$emit("update:isStandBy", value);
  }

  // isForceContinue
  @Prop({ type: Boolean, required: true })
  private isForceContinue!: boolean;
  private isForceContinueVolatile: boolean = false;
  @Watch("isForceContinue", { immediate: true })
  private onChangeIsForceReset(value: boolean) {
    this.isForceContinueVolatile = value;
  }
  @Watch("isForceContinueVolatile")
  private onChangeIsForceResetVolatile(value: boolean) {
    this.$emit("update:isForceContinue", value);
  }

  // isForceNew
  @Prop({ type: Boolean, required: true })
  private isForceNew!: boolean;
  private isForceNewVolatile: boolean = false;
  @Watch("isForceNew", { immediate: true })
  private onChangeIsForceNew(value: boolean) {
    this.isForceNewVolatile = value;
  }
  @Watch("isForceNewVolatile")
  private onChangeIsForceNewVolatile(value: boolean) {
    this.$emit("update:isForceNew", value);
  }

  @Prop({ type: String, default: null })
  private imageKey!: string | null;
  private imageKeyVolatile: string | null = null;
  @Watch("imageKey", { immediate: true })
  private onChangeImageKey(value: string | null) {
    this.imageKeyVolatile = value;
  }
  @Watch("imageKeyVolatile")
  private onChangeImageKeyVolatile(value: string | null) {
    this.$emit("update:imageKey", value);
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

  @Prop({ type: String, default: null })
  private bgmKey!: string | null;
  private bgmKeyVolatile: string | null = null;
  @Watch("bgmKey", { immediate: true })
  private onChangeBgmKey(value: string | null) {
    this.bgmKeyVolatile = value;
  }
  @Watch("bgmKeyVolatile")
  private onChangeBgmKeyVolatile(value: string | null) {
    this.$emit("update:bgmKey", value);
  }

  @Prop({ type: String, default: null })
  private bgmTag!: string | null;

  private bgmTagVolatile: string | null = null;
  @Watch("bgmTag", { immediate: true })
  private onChangeBgmTag(value: string | null) {
    this.bgmTagVolatile = value;
  }
  @Watch("bgmTagVolatile")
  private onChangeBgmTagVolatile(value: string | null) {
    this.$emit("update:bgmTag", value);
  }

  private get tags(): string[] {
    return this.cutInList
      .map(c => c.data!.tag)
      .filter((t, index: number, list: string[]) => list.indexOf(t) === index);
  }

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.bgm-info-form {
  display: contents;
}

.space {
  height: 0.5rem;
}

.force-continue {
  @include flex-box(row, flex-start, center);
}

table {
  width: 100%;
}

th,
td {
  padding: 0;
}

th {
  text-align: left;
  width: 1px;
}

.check-block {
  @include flex-box(row, flex-start, center);
}

.check-box {
  @include inline-flex-box(row, flex-start, center);

  &.inline {
    @include inline-flex-box(row, flex-start, center);
  }

  border: 1px solid gray;
  border-radius: 0.5em;
  height: 2em;
  padding: 0 0.5em;
  background-color: white;
  box-sizing: border-box;
  cursor: pointer;
  margin-right: 0.5rem;

  &:after {
    content: "✔︎";
    visibility: hidden;
  }

  &:hover {
    background-color: lightyellow;
  }

  &.checked {
    background-color: orange;

    &:after {
      visibility: visible;
    }
  }
}

.simple-tab-component {
  align-self: stretch;
  height: calc(100% - 2em - 0.5rem);

  > *:not(:first-child) {
    width: 100%;
    height: calc(100% - 2em);
    flex: 1;
  }

  > div:not(.image-picker-component):not(.bgm-picker-component) {
    border: solid 1px gray;
    box-sizing: border-box;
    padding: 0.2rem;
  }

  textarea {
    resize: none;
    padding: 0;
    box-sizing: border-box;
  }
}
</style>
