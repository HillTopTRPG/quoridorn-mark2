<template>
  <div class="bgm-picker-component" @contextmenu.prevent ref="elm">
    <div class="operate-box">
      <s-check
        class="view-check"
        v-model="isSimpleVolatile"
        colorStyle="skyblue"
        c-icon=""
        :c-label="$t('label.simple')"
        n-icon=""
        :n-label="$t('label.detail')"
        @hover="onHoverThumbnailView"
      />
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
      />
    </div>

    <!-- 画像選択エリア -->
    <div class="chose-media">
      <bgm-item-component
        v-for="media in useMediaList"
        :key="media.key"
        :media="media"
        :is-selected="localValue === media.key"
        :is-simple="isSimpleVolatile"
        @select="onSelect(media)"
      />
    </div>

    <!-- 絞り込み情報 -->
    <table>
      <tr>
        <tr-media-tag-select-component
          label-name="label.tag"
          v-model="mediaTagVolatile"
          :filter-list="['music', 'youtube']"
          :selected-info-text="selectedTagIndexText"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import LifeCycle from "../decorator/LifeCycle";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../window/ComponentVue";
import { MediaStore } from "@/@types/store-data";
import GameObjectManager from "../../basic/GameObjectManager";
import VueEvent from "../decorator/VueEvent";
import TrMediaTagSelectComponent from "@/app/basic/common/components/table-item/TrMediaTagSelectComponent.vue";
import BgmItemComponent from "@/app/core/component/BgmItemComponent.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";

@Component({
  components: {
    SCheck,
    BgmItemComponent,
    TrMediaTagSelectComponent
  }
})
export default class BgmPickerComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: null })
  private value!: string | null;

  // mediaTag
  @Prop({ type: String, default: null })
  private mediaTag!: string | null;
  private mediaTagVolatile: string | null = null;
  @Watch("mediaTag", { immediate: true })
  private onChangeMediaTag(value: string | null) {
    this.mediaTagVolatile = value;
  }
  @Watch("mediaTagVolatile")
  private onChangeMediaTagVolatile(value: string | null) {
    this.$emit("update:mediaTag", value);
  }

  // isSimple
  @Prop({ type: Boolean, required: true })
  private isSimple!: boolean;
  private isSimpleVolatile: boolean = false;
  @Watch("isSimple", { immediate: true })
  private onChangeIsViewThumbnail(value: boolean) {
    this.isSimpleVolatile = value;
  }
  @Watch("isSimpleVolatile")
  private onChangeIsViewThumbnailVolatile(value: boolean) {
    this.$emit("update:isSimple", value);
  }

  private isMounted: boolean = false;

  private rawMediaList: StoreData<MediaStore>[] = [];
  private useMediaList: StoreData<MediaStore>[] = [];
  private searchText: string = "";

  @Watch("isMounted")
  @Watch("mediaTagVolatile")
  @Watch("searchText")
  @Watch("rawMediaList", { deep: true })
  private async onChangeMediaList() {
    if (!this.isMounted) return;
    const regExp = this.searchText ? new RegExp(this.searchText) : null;
    this.useMediaList = this.rawMediaList.filter(d => {
      if (!d || !d.data) return false;
      if (regExp && !d.data.name.match(regExp)) return false;
      if (this.mediaTagVolatile === null) return d.data.tag === "";
      return d.data.tag === this.mediaTagVolatile;
    });
  }

  @VueEvent
  private onSelect(media: StoreData<MediaStore>) {
    this.localValue = media.key;
  }

  @VueEvent
  private get selectedTagIndexText() {
    const index = this.useMediaList.findIndex(
      image => image.key === this.localValue
    );
    return `${index + 1}/${this.useMediaList.length}`;
  }

  @LifeCycle
  private mounted() {
    this.rawMediaList = GameObjectManager.instance.mediaList.filter(
      media =>
        media.data!.urlType === "youtube" || media.data!.urlType === "music"
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

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }

  public focus() {
    this.elm.focus();
  }

  @VueEvent
  private onHoverThumbnailView(isHover: boolean) {
    this.$emit("hoverThumbnail", isHover);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.search-name {
  @include inline-flex-box(row, flex-start, center);
  font-size: inherit;
  height: 2em;
  min-height: 2em;
}

.operate-box {
  @include flex-box(row, space-between, center);
  border: solid gray 1px;
  border-bottom: none;
  padding: 0.2rem 0.5rem;
}

.bgm-picker-component {
  @include flex-box(column, stretch, flex-start);

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

  .chose-media {
    @include flex-box(column, stretch, flex-start);
    overflow-y: scroll;
    flex: 1;
    border: solid gray 1px;
    box-sizing: border-box;
    width: 100%;
  }
}
</style>
