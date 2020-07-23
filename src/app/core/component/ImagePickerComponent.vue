<template>
  <div class="image-picker-container" @contextmenu.prevent ref="elm">
    <input
      type="text"
      class="search-name"
      :value="searchText"
      @input="searchText = $event.target.value"
      :placeholder="$t('label.search-name-box')"
      @keydown.enter.prevent.stop
      @keyup.enter.prevent.stop
      @keydown.229.prevent.stop
      @keyup.229.prevent.stop
      v-if="viewName"
    />
    <!-- 画像選択エリア -->
    <div class="choseImage" :style="{ '--size': imageSize }">
      <div
        class="image"
        v-for="image in useImageList"
        :key="image.id"
        :class="{ active: value === image.id }"
        @click="localValue = image.id"
      >
        <span v-if="viewName">{{ image.data.name }}</span>
        <img :src="image.data.url" alt="" draggable="false" />
      </div>
    </div>

    <!-- 絞り込み情報 -->
    <table>
      <tr>
        <th>
          <label
            :for="`${windowKey}-image-pick-tag`"
            v-t="'label.tag'"
            class="label-input"
          ></label>
        </th>
        <td>
          <div class="flex-space-between">
            <image-tag-select
              :id="`${windowKey}-image-pick-tag`"
              class="tagSelect"
              v-model="selectImageTag"
              ref="input"
            />
            <span>{{ selectedTagIndexText }}</span>
          </div>
        </td>
      </tr>
      <tr v-if="!isSimple">
        <th>
          <label
            :for="`${windowKey}-image-pick-direction`"
            v-t="'label.direction'"
            class="label-input"
          ></label>
        </th>
        <td>
          <div class="flex-space-between">
            <direction-type-select
              :id="`${windowKey}-image-pick-direction`"
              v-model="direction"
            />
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import LifeCycle from "../decorator/LifeCycle";
import { Mixins } from "vue-mixin-decorator";
import { StoreUseData } from "../../../@types/store";
import ComponentVue from "../window/ComponentVue";
import { Direction, MediaInfo } from "../../../@types/room";
import CtrlButton from "./CtrlButton.vue";
import { getSrc } from "../utility/Utility";
import GameObjectManager from "../../basic/GameObjectManager";
import ImageTagSelect from "../../basic/common/components/select/ImageTagSelect.vue";
import DirectionTypeSelect from "../../basic/common/components/select/DirectionTypeSelect.vue";
import VueEvent from "../decorator/VueEvent";

@Component({
  components: {
    CtrlButton,
    ImageTagSelect,
    DirectionTypeSelect
  }
})
export default class ImagePickerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  @Prop({ type: String, default: null })
  private imageTag!: string | null;

  @Prop({ type: String, default: "none" })
  private direction!: Direction;

  @Prop({ type: Boolean, default: false })
  private isSimple!: boolean;

  @Prop({ type: Boolean, default: false })
  private viewName!: boolean;

  @Prop({ type: String, default: "4em" })
  private imageSize!: string;

  private isMounted: boolean = false;
  private selectImageTag: string | null = null;

  private rawImageList: StoreUseData<MediaInfo>[] = [];
  private useImageList: StoreUseData<MediaInfo>[] = [];
  private searchText: string = "";

  @VueEvent
  private getSrc(data: string) {
    return getSrc(data);
  }

  @Watch("isMounted")
  @Watch("selectImageTag")
  @Watch("searchText")
  @Watch("rawImageList", { deep: true })
  private async onChangeImageList() {
    if (!this.isMounted) return;
    const regExp = this.searchText ? new RegExp(this.searchText) : null;
    this.useImageList = this.rawImageList.filter(d => {
      if (!d || !d.data) return false;
      if (regExp && !d.data.name.match(regExp)) return false;
      return d.data.tag === this.selectImageTag;
    });
  }

  @VueEvent
  private get selectedTagIndexText() {
    const index = this.useImageList.findIndex(
      image => image.id === this.localValue
    );
    return `${index + 1}/${this.useImageList.length}`;
  }

  @LifeCycle
  private mounted() {
    this.rawImageList = GameObjectManager.instance.mediaList.filter(
      media => media.data!.type === "image"
    );
    this.isMounted = true;
  }

  private get localValue(): string | null {
    return this.value;
  }

  private set localValue(colorStr: string | null) {
    this.input(colorStr);
  }

  public input(colorStr: string | null) {
    this.$emit("input", colorStr);
  }

  @Watch("imageTag", { immediate: true })
  private onChangeImageTag(value: string) {
    this.selectImageTag = value;
  }

  @Watch("selectImageTag")
  private onChangeSelectImageTag() {
    this.$emit("update:imageTag", this.selectImageTag);
  }

  @Watch("direction")
  private onChangeReverse() {
    this.$emit("update:direction", this.direction);
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }

  public focus() {
    this.elm.focus();
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.flex-space-between {
  width: 100%;
  @include flex-box(row, space-between, center);
}

.search-name {
  @include inline-flex-box(row, flex-start, center);
  font-size: inherit;
  height: 2em;
  min-height: 2em;
}

.image-picker-container {
  @include flex-box(column, flex-start, flex-start);

  table {
    width: 100%;

    th,
    td {
      padding: 0;
    }

    th {
      width: 1px;
      white-space: nowrap;
      text-align: right;
    }
  }

  .choseImage {
    @include flex-box(row, flex-start, flex-start, wrap);
    overflow-y: scroll;
    flex: 1;
    border: solid gray 1px;
    box-sizing: border-box;
    width: 100%;

    .image {
      @include flex-box(column, flex-start, flex-start);
      border: solid rgba(0, 0, 0, 0) 1px;
      box-sizing: border-box;

      &.active {
        border: solid blue 1px;
        background-color: var(--uni-color-cream);
      }

      img {
        width: var(--size);
        height: var(--size);
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
}
</style>
