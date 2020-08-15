<template>
  <div class="media-upload-item-component">
    <div
      class="icon"
      :class="resultInfo.imageSrc ? undefined : resultInfo.iconClass"
    >
      <img
        class="thumbnail"
        draggable="false"
        v-if="resultInfo.imageSrc"
        :src="resultInfo.imageSrc"
        alt="image"
      />
    </div>
    <div class="name">
      <span v-if="resultInfo.type !== 'youtube'">{{ resultInfo.name }}</span>
      <label v-else>
        <span v-t="'label.title'"></span>
        <base-input
          type="text"
          :value="resultInfo.name"
          @input="resultInfo.name = $event.target.value"
          :placeholder="$t('label.title')"
        />
      </label>
    </div>
    <label class="tag">
      <span v-t="'label.tag'"></span>
      <base-input
        type="text"
        :value="resultInfo.tag"
        @input="resultInfo.tag = $event.target.value"
      />
    </label>
    <ctrl-button class="delete-btn" @click="$emit('delete')">
      <span v-t="'button.delete'"></span>
    </ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "../../core/window/ComponentVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import BaseInput from "../../core/component/BaseInput.vue";
import { UploadMediaInfo } from "@/@types/socket";

@Component({
  components: { BaseInput, CtrlButton }
})
export default class MediaUploadItemComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private resultInfo!: UploadMediaInfo;
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.media-upload-item-component {
  display: grid;
  grid-template-rows: 3em 3em;
  grid-template-columns: calc(6em + 0.5rem) 5em 1fr auto;
  align-items: center;
  align-self: stretch;
  height: 6em;
  border: 1px solid gray;
  border-top: none;
  box-sizing: content-box;
  padding: 0.5rem;

  &:first-child {
    border-top: 1px solid gray;
  }

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }
}

.icon {
  @include flex-box(column, center, center);
  grid-row: 1 / 3;
  grid-column: 1 / 2;
  text-align: center;
  font-size: 2em;
  margin-right: 0.5rem;
}

.name {
  grid-row: 1 / 2;
  grid-column: 2 / 5;
  font-size: 120%;
}

.tag {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
}

.delete-btn {
  grid-row: 2 / 3;
  grid-column: 4 / 5;
}

.thumbnail {
  background-repeat: no-repeat;
  background-size: contain;
  width: 3em;
  height: 3em;
}
</style>
