<template>
  <div
    class="media-item-component"
    :class="isViewThumbnail ? 'thumbnail-mode' : 'simple-mode'"
  >
    <div class="icon" :class="iconClass">
      <img
        class="thumbnail"
        draggable="false"
        v-if="thumbnailSrc && isViewThumbnail"
        :src="thumbnailSrc"
        alt="image"
      />
    </div>
    <span class="type" v-if="isViewThumbnail">{{ typeStr }}</span>
    <span class="tag">{{ tagStr }}</span>
    <div class="name">
      <span class="owner">{{ ownerStr }}</span>
      <span class="media-name">{{ media.data.name }}</span>
    </div>
    <div class="operation-box">
      <s-button
        class="s-button"
        icon="pencil"
        colorStyle="pink"
        :disabled="!isEditable"
        @hover="value => $emit('hoverEdit', value)"
        @click="$emit('edit')"
      />
      <s-button
        class="s-button"
        icon="user-tie"
        colorStyle="pink"
        :disabled="!isChmodAble"
        @hover="value => $emit('hoverChmod', value)"
        @click="$emit('chmod')"
      />
      <s-button
        class="s-button"
        icon="bin"
        colorStyle="pink"
        :disabled="!isDeletable"
        @hover="value => $emit('hoverDelete', value)"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { StoreUseData } from "@/@types/store";
import { MediaInfo } from "@/@types/room";
import { getYoutubeThunbnail } from "@/app/basic/cut-in/bgm/YoutubeManager";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SButton from "@/app/basic/common/components/SButton.vue";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: { SButton, BaseInput, CtrlButton }
})
export default class MediaItemComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private media!: StoreUseData<MediaInfo>;

  @Prop({ type: Boolean, required: true })
  private isViewThumbnail!: boolean;

  @VueEvent
  private get typeStr(): string {
    const type = this.media.data!.type;
    let target = "label.";
    switch (type) {
      case "image":
      case "music":
      case "setting":
      case "youtube":
        target += type;
        break;
      default:
        target += "unknown";
    }
    return LanguageManager.instance.getText(target);
  }

  @VueEvent
  private get tagStr(): string {
    const tag = this.media.data!.tag;
    return tag || LanguageManager.instance.getText("label.non-tag");
  }

  @VueEvent
  private get ownerStr(): string {
    return GameObjectManager.instance.getUserName(this.media.owner!);
  }

  @VueEvent
  private get iconClass(): string | undefined {
    const type = this.media.data!.type;
    if (type === "image")
      return this.isViewThumbnail ? undefined : "icon-image";
    if (type === "music") return "icon-music";
    if (type === "setting") return "icon-text";
    if (type === "youtube")
      return this.isViewThumbnail ? undefined : "icon-youtube";
    return "icon-warning";
  }

  @VueEvent
  private get thumbnailSrc(): string {
    const type = this.media.data!.type;
    const url = this.media.data!.url;
    if (type === "youtube") return getYoutubeThunbnail(url);
    if (type === "image") return url;
    return "";
  }

  @VueEvent
  private get isEditable() {
    return permissionCheck(this.media, "edit");
  }

  @VueEvent
  private get isChmodAble() {
    return permissionCheck(this.media, "chmod");
  }

  @VueEvent
  private get isDeletable() {
    return permissionCheck(this.media, "edit");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.media-item-component {
  align-self: stretch;
  border: 1px solid gray;
  border-top: none;
  box-sizing: content-box;

  &.thumbnail-mode {
    display: grid;
    grid-template-rows: 3em 3em;
    grid-template-columns: calc(6em + 0.5rem) auto auto 1fr auto;
    align-items: center;
    height: 6em;
    padding: 0.5rem;

    .icon {
      grid-row: 1 / 3;
      grid-column: 1 / 2;
      font-size: 2em;
    }

    .name {
      grid-row: 1 / 2;
      grid-column: 2 / 6;
      font-size: 120%;
    }

    .type {
      grid-row: 2 / 3;
      grid-column: 2 / 3;
    }

    .tag {
      grid-row: 2 / 3;
      grid-column: 3 / 4;
    }

    .operation-box {
      grid-row: 2 / 3;
      grid-column: 5 / 6;
    }
  }

  &.simple-mode {
    @include flex-box(row, flex-start, center);
    height: 2em;
    padding: 0 0.5rem;

    .operation-box {
      margin-left: auto;
    }
  }

  &:first-child {
    border-top: 1px solid gray;
  }

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }
}

.icon {
  @include flex-box(column, center, center);
  margin-right: 0.5rem;
}

.tag,
.type,
.owner {
  display: inline-block;
  border: 1px solid gray;
  border-radius: 0.5em;
  background-color: var(--uni-color-white);
  margin-right: 0.5rem;
  padding: 0 0.3rem;
  line-height: 1.5em;
  box-sizing: border-box;
}

.thumbnail {
  background-repeat: no-repeat;
  background-size: contain;
  width: 3em;
  height: 3em;
}

.s-button {
  &:not(:first-child) {
    margin-left: 0.3rem;
  }
}
</style>
