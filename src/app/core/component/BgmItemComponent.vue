<template>
  <div
    class="bgm-item-component"
    :class="{
      'simple-mode': isSimple,
      'detail-mode': !isSimple,
      selected: isSelected
    }"
    @mousedown="$emit('select')"
  >
    <div class="icon" :class="iconClass">
      <img
        class="thumbnail"
        draggable="false"
        v-if="thumbnailSrc && !isSimple"
        :src="thumbnailSrc"
        alt="image"
      />
    </div>
    <span class="type" v-if="!isSimple">{{ typeStr }}</span>
    <div class="name">
      <span class="media-name">{{ media.data.name }}</span>
      <span class="ref-list" v-for="ref in media.refList" :key="ref.key">
        {{ ref.type }}-{{ ref.key }}
      </span>
    </div>
    <span class="owner">{{ ownerStr }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { permissionCheck } from "../../core/api/app-server/SocketFacade";
import ComponentVue from "../../core/window/ComponentVue";
import { MediaStore } from "@/@types/store-data";
import VueEvent from "../../core/decorator/VueEvent";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { getYoutubeThunbnail } from "@/app/basic/cut-in/bgm/YoutubeManager";

@Component
export default class BgmItemComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private media!: StoreData<MediaStore>;

  @Prop({ type: Boolean, required: true })
  private isSimple!: boolean;

  @Prop({ type: Boolean, required: true })
  private isSelected!: boolean;

  @VueEvent
  private get typeStr(): string {
    const urlType = this.media.data!.urlType;
    let target = "label.";
    switch (urlType) {
      case "image":
      case "music":
      case "setting":
      case "youtube":
        target += urlType;
        break;
      default:
        target += "unknown";
    }
    return this.$t(target)!.toString();
  }

  @VueEvent
  private get ownerStr(): string {
    return GameObjectManager.instance.getUserName(this.media.owner);
  }

  @VueEvent
  private get isBgm(): boolean {
    switch (this.media.data!.urlType) {
      case "youtube":
      case "music":
        return true;
      default:
        return false;
    }
  }

  @VueEvent
  private get iconClass(): string | undefined {
    const urlType = this.media.data!.urlType;
    if (!this.isSimple && (urlType === "image" || urlType === "youtube"))
      return undefined;
    return this.media.data!.iconClass;
  }

  @VueEvent
  private get thumbnailSrc(): string {
    const urlType = this.media.data!.urlType;
    const url = this.media.data!.url;
    if (urlType === "youtube") return getYoutubeThunbnail(url);
    if (urlType === "image") return url;
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

.bgm-item-component {
  border: 1px solid rgba(0, 0, 0, 0);
  box-sizing: content-box;
  position: relative;
  padding: 0 0.5rem;

  .name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &.simple-mode {
    @include flex-box(row, flex-start, center);
    height: 2em;

    .icon {
      width: 2.5em;
    }

    .name {
      flex: 1;
    }
  }

  &.detail-mode {
    display: grid;
    grid-template-rows: 2em 2em;
    grid-template-columns: calc(4em + 0.5rem) auto 1fr auto;
    height: 4em;
    align-items: center;

    .icon {
      grid-row: 1 / 3;
      grid-column: 1 / 2;
      font-size: 2em;
    }

    .name {
      grid-row: 1 / 2;
      grid-column: 2 / 5;
      font-size: 120%;
    }

    .type {
      grid-row: 2 / 3;
      grid-column: 2 / 3;
    }

    .owner {
      grid-row: 2 / 3;
      grid-column: 4 / 5;
    }
  }

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }

  &:active {
    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  &.selected {
    background-color: var(--uni-color-skyblue);
    border-color: blue;
  }
}

.icon {
  @include flex-box(column, center, center);
  margin-right: 0.5rem;
}

.type,
.owner {
  display: inline-block;
  border: 1px solid gray;
  border-radius: 0.5em;
  background-color: var(--uni-color-white);
  padding: 0 0.3rem;
  line-height: 1.5em;
  box-sizing: border-box;
}

.owner {
  margin-left: 0.5rem;
}

.thumbnail {
  background-repeat: no-repeat;
  background-size: contain;
  width: 2em;
  height: 2em;
}

.s-button {
  &:not(:first-child) {
    margin-left: 0.3rem;
  }
}
</style>
