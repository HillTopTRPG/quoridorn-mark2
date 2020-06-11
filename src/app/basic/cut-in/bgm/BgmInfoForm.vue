<template>
  <div class="bgm-info-form">
    <table>
      <tr>
        <!-- URL -->
        <tr-string-input-component
          class="url"
          labelName="url"
          v-model="urlVolatile"
          :placeholder="$t('label.url-placeholder')"
          inputWidth="100%"
        />
      </tr>
      <tr>
        <!-- タイトル -->
        <tr-string-input-component
          class="title"
          labelName="title"
          v-model="titleVolatile"
          inputWidth="100%"
        />
      </tr>
      <tr>
        <!-- タグ -->
        <tr-string-input-component
          class="tag"
          labelName="tag"
          v-model="tagVolatile"
          :list="`${key}-tag-values`"
        />
      </tr>
      <tr class="space"></tr>
      <tr>
        <!-- 音量 -->
        <tr-range-input-component
          class="volume"
          labelName="volume"
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
          labelName="play-start"
          v-model="startVolatile"
          :step="0.1"
          :min="-10000"
          :max="10000"
          unitLabel="second"
        />
      </tr>
      <tr>
        <!-- 再生終了 -->
        <tr-number-input-component
          class="end"
          labelName="play-end"
          v-model="endVolatile"
          :step="0.1"
          :min="-10000"
          :max="10000"
          unitLabel="second"
        />
      </tr>
      <tr class="space"></tr>
      <tr>
        <!-- フェードイン -->
        <tr-number-input-component
          class="fade-in"
          labelName="fade-in"
          v-model="fadeInVolatile"
          :step="0.1"
          :min="0"
          :max="200"
          unitLabel="second"
        />
      </tr>
      <tr>
        <!-- フェードアウト -->
        <tr-number-input-component
          class="fade-out"
          labelName="fade-out"
          v-model="fadeOutVolatile"
          :step="0.1"
          :min="0"
          :max="200"
          unitLabel="second"
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
          labelName="chat-linkage-target"
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

    <div class="check-block">
      <!-- 無限ループ -->
      <div
        class="check-box inline repeat"
        :class="{ checked: isRepeatVolatile }"
        @click="isRepeatVolatile = !isRepeat"
        @contextmenu.prevent
      >
        <i class="icon-loop"></i>
        <span v-t="'label.repeat'"></span>
      </div>

      <!-- スタンバイ -->
      <div
        class="check-box inline stand-by"
        :class="{ checked: isStandByVolatile }"
        @click="isStandByVolatile = !isStandBy"
        @contextmenu.prevent
        v-t="'label.stand-by'"
      ></div>
    </div>

    <!-- 多重再生時強制続行 -->
    <div
      class="check-box force-continue"
      :class="{ checked: isForceContinueVolatile }"
      @click="isForceContinueVolatile = !isForceContinue"
      @contextmenu.prevent
      v-t="'label.force-continue'"
    ></div>

    <!-- 強制新規作成 -->
    <div
      class="check-box force-new"
      :class="{ checked: isForceNewVolatile }"
      @click="isForceNewVolatile = !isForceNew"
      @contextmenu.prevent
      v-t="'label.force-new'"
    ></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrRangeInputComponent from "@/app/basic/common/components/TrRangeInputComponent.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import ChatLinkageTypeSelect from "@/app/basic/common/components/select/ChatLinkageTypeSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import TrNumberInputComponent from "@/app/basic/common/components/TrNumberInputComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import TrStringInputComponent from "@/app/basic/common/components/TrStringInputComponent.vue";

@Component({
  components: {
    ChatLinkageTypeSelect,
    TrRangeInputComponent,
    TrNumberInputComponent,
    TrStringInputComponent,
    BaseInput,
    CtrlButton
  }
})
export default class BgmInfoForm extends Mixins<ComponentVue>(ComponentVue) {
  private isMounted: boolean = false;

  private isYoutube: boolean = false;
  private cutInList = GameObjectManager.instance.cutInList;

  private get chatLinkagePlaceholder() {
    if (this.chatLinkageTypeVolatile === "last")
      return LanguageManager.instance.getText("label.last-str");
    if (this.chatLinkageTypeVolatile === "regexp")
      return LanguageManager.instance.getText("label.javascript-regexp");
    return "";
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

  private get tags(): string[] {
    return this.cutInList
      .map(c => c.data!.tag)
      .filter((t, idx: number, list: string[]) => list.indexOf(t) === idx);
  }

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

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
  @include flex-box(row, flex-start, center);

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
</style>
