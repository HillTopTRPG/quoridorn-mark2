<template>
  <div
    class="image-item-component"
    :class="{
      'thumbnail-mode': isSimple,
      'list-mode': !isSimple,
      selected: isSelected
    }"
    @mousedown="$emit('select', media)"
  >
    <img :src="media.data.url" alt="" draggable="false" />
    <template v-if="!isSimple">
      <span class="name">{{ media.data.name }}</span>
      <span class="type">{{ typeStr }}</span>
      <span class="owner">{{ ownerStr }}</span>
    </template>
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
export default class ImageItemComponent extends Mixins<ComponentVue>(
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

.image-item-component {
  border: solid rgba(0, 0, 0, 0) 1px;
  box-sizing: content-box;
  position: relative;

  img {
    width: var(--size);
    height: var(--size);
  }

  &.thumbnail-mode {
    @include flex-box(row, flex-start, center, wrap);
    padding: 0.5rem;
  }

  &.list-mode {
    display: grid;
    grid-template-rows: 2em 2em;
    grid-template-columns: calc(4em + 0.5rem) auto 1fr auto;
    align-items: center;
    height: 4em;
    padding: 0 0.5rem;

    img {
      grid-row: 1 / 3;
      grid-column: 1 / 2;
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

    .name {
      grid-row: 1 / 2;
      grid-column: 2 / 5;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
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
</style>
