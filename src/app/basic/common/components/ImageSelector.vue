<template>
  <div class="imageSelector" @contextmenu.prevent>
    <!-- 画像選択エリア -->
    <div class="choseImage">
      <img
        alt=""
        src=""
        v-for="image in useImageList"
        :class="{ active: value && image.key === value.replace(':R', '') }"
        :key="image.key"
        v-img="image.data"
        @click="selectTagImage(image.key)"
        draggable="false"
      />
    </div>

    <!-- 絞り込み情報 -->
    <div class="imageInfo">
      <div class="selectedImage">
        <label>タグ名：</label>
        <image-tag-select
          class="tagSelect"
          v-model="selectImageTag"
          ref="input"
        />
        <span>{{ selectedTagIndexText }}</span>
      </div>
      <ctrl-button @click="onClickHideImage">隠し画像</ctrl-button>
      <ctrl-button @click="doReverse">反</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import ImageTagSelect from "@/app/basic/common/components/select/ImageTagSelect.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";

import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { CtrlButton, ImageTagSelect } })
export default class ImageSelector extends Vue {
  @Getter("getObj") private getObj: any;
  @Getter("imageListFromTagKey") private imageListFromTagKey: any;

  @Prop({ type: String, required: true })
  public value!: string;

  @Prop({ type: String, default: "imgTag-0" })
  private imageTag!: string;

  private selectImageTag: string = "";

  @VueEvent
  public focus(): void {
    const input: ImageTagSelect = this.$refs.input as ImageTagSelect;
    input.focus();
  }

  @Emit("input")
  public input(value: string | null) {}

  @Watch("imageTag", { immediate: true })
  private onChangeImageTag(value: string) {
    this.selectImageTag = value || "imgTag-0";
  }

  @Watch("selectImageTag")
  @Emit("update:imageTag")
  private onChangeSelectImageTag(value: string) {}

  private get localValue(): string | null {
    return this.value;
  }

  private set localValue(value: string | null) {
    this.input(value);
  }

  private get imageKey(): string | null {
    if (this.localValue === null) return null;
    return this.localValue.replace(":R", "");
  }

  private get isReverse(): boolean {
    if (!this.localValue) return false;
    return /:R/.test(this.localValue);
  }

  private set isReverse(isReverse: boolean) {
    const imageKey = this.imageKey;
    if (imageKey === null) this.localValue = null;
    this.localValue = imageKey + (isReverse ? ":R" : "");
  }

  @VueEvent
  private selectTagImage(key: string) {
    this.localValue = key;
  }

  @VueEvent
  private doReverse() {
    this.isReverse = !this.isReverse;
  }

  @VueEvent
  private onClickHideImage() {
    alert("未実装です。");
  }

  @VueEvent
  private get selectedTagIndexText() {
    const index = this.useImageList.findIndex(
      image => image.key === this.imageKey
    );
    return `${index + 1}/${this.useImageList.length}`;
  }

  private get useImageList(): any[] {
    return this.imageListFromTagKey(this.selectImageTag);
  }
}
</script>

<style scoped lang="scss">
.imageSelector {
  display: flex;
  flex-direction: column;
}
.choseImage {
  overflow-y: auto;
  flex: 1;
  border: solid gray 1px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  align-content: flex-start;
  flex-wrap: wrap;

  img {
    width: 50px;
    height: 50px;
    border: solid rgba(0, 0, 0, 0) 1px;

    &.active {
      border: solid blue 1px;
    }
  }
}
.imageInfo {
  display: flex;

  .selectedImage {
    flex: 1;
    display: flex;

    > * {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    select {
      flex: 1;
    }
  }

  button {
    margin-left: 10px;
  }
}
</style>
