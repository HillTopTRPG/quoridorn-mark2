<template>
  <div class="image-picker-container" @contextmenu.prevent ref="elm">
    <!-- 画像選択エリア -->
    <div class="choseImage">
      <img
        v-for="image in useImageList"
        :class="{ active: value === image.id }"
        :key="image.id"
        :src="getSrc(image.data.data)"
        alt=""
        @click="localValue = image.id"
        draggable="false"
      />
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
      <tr>
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
            <ctrl-button @click="inputPassword">
              <span v-t="'label.image-password'"></span>
            </ctrl-button>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import LifeCycle from "../decorator/LifeCycle";
import { StoreUseData } from "@/@types/store";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { Direction, ImageInfo } from "@/@types/room";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import DirectionTypeSelect from "@/app/basic/common/components/select/DirectionTypeSelect.vue";
import ImageTagSelect from "@/app/basic/common/components/select/ImageTagSelect.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { getSrc } from "@/app/core/utility/Utility";
import VueEvent from "@/app/core/decorator/VueEvent";

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

  private isMounted: boolean = false;
  private selectImageTag: string | null = null;
  private password: string = "";
  private direction: Direction = "none";

  private rowImageList: StoreUseData<ImageInfo>[] = [];
  private useImageList: StoreUseData<ImageInfo>[] = [];

  @VueEvent
  private getSrc(data: string) {
    return getSrc(data);
  }

  @Watch("isMounted")
  @Watch("selectImageTag")
  @Watch("password")
  @Watch("rowImageList", { deep: true })
  private async onChangeImageList() {
    if (!this.isMounted) return;
    this.useImageList = this.rowImageList.filter(d => {
      if (!d || !d.data) return false;
      if (d.data.tag !== this.selectImageTag) return false;
      return d.data.password === this.password;
    });
  }

  private get selectedTagIndexText() {
    const index = this.useImageList.findIndex(
      image => image.id === this.localValue
    );
    return `${index + 1}/${this.useImageList.length}`;
  }

  private async inputPassword() {
    const imagePasswordList = await TaskManager.instance.ignition<
      WindowOpenInfo<string>,
      string
    >({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "input-image-password-window",
        args: this.password
      }
    });
    if (imagePasswordList.length) this.password = imagePasswordList[0];
  }

  @LifeCycle
  private mounted() {
    this.rowImageList = GameObjectManager.instance.imageList;
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

    img {
      width: 4em;
      height: 4em;
      border: solid rgba(0, 0, 0, 0) 1px;
      box-sizing: border-box;

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
}
</style>
