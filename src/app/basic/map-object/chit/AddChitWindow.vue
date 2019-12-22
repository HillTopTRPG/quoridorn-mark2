<template>
  <div class="container" ref="window">
    <div class="chit-cell">
      <div
        class="chit"
        ref="chit"
        :draggable="!!imageDocId"
        @dragstart="dragStart"
      ></div>
    </div>
    <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
      <image-picker-component
        v-if="currentTabInfo.target === 'image'"
        v-model="imageDocId"
        :windowKey="key"
        :imageTag.sync="imageTag"
        :reverse.sync="reverse"
      />
      <textarea
        v-if="currentTabInfo.target === 'text'"
        v-model="otherText"
      ></textarea>
    </simple-tab-component>
    <table class="info-table">
      <tr>
        <th>
          <label
            :for="`${key}-width`"
            class="label-width label-input"
            v-t="'label.width'"
          ></label>
        </th>
        <td class="value-cell">
          <base-input
            :id="`${key}-width`"
            class="value-width"
            type="number"
            :value="width"
            @input="width = $event.target.value"
            min="1"
          />
        </td>
      </tr>
      <tr>
        <th>
          <label
            :for="`${key}-height`"
            class="label-height label-input"
            v-t="'label.height'"
          ></label>
        </th>
        <td class="value-cell">
          <base-input
            :id="`${key}-height`"
            class="value-height"
            type="number"
            :value="height"
            @input="height = $event.target.value"
            min="1"
          />
        </td>
      </tr>
      <tr>
        <th>
          <label
            :for="`${key}-background-size`"
            class="label-background-size label-input"
            v-t="'label.background-size'"
          ></label>
        </th>
        <td class="value-cell">
          <background-size-select
            :id="`${key}-background-size`"
            v-model="backgroundSize"
          />
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import WindowVue from "../../../core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../../core/decorator/LifeCycle";
import VueEvent from "../../../core/decorator/VueEvent";
import BaseInput from "../../../core/component/BaseInput.vue";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import { AddObjectInfo } from "@/@types/data";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import { BackgroundSize, Reverse } from "@/@types/room";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { ChitStore } from "@/@types/gameObject";
import BackgroundSizeSelect from "@/app/basic/common/components/select/BackgroundSizeSelect.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";

@Component({
  components: {
    SimpleTabComponent,
    BackgroundSizeSelect,
    ImagePickerComponent,
    BaseInput,
    CtrlButton
  }
})
export default class AddChitWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private imageList = GameObjectManager.instance.imageList;
  private otherText: string = "";
  private height: number = 1;
  private width: number = 1;
  private imageDocId: string | null = null;
  private imageTag: string | null = null;
  private reverse: Reverse = "none";
  private isMounted: boolean = false;
  private imageSrc: string = "";
  private backgroundSize: BackgroundSize = "contain";

  private tabList: TabInfo[] = [
    {
      text: "画像",
      target: "image"
    },
    {
      text: "その他欄",
      target: "text"
    }
  ];
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @LifeCycle
  public async mounted() {
    await this.init();
    this.imageTag = LanguageManager.instance.getText("type.character");
    this.isMounted = true;
  }

  private getImageObj() {
    return this.imageList.filter(obj => obj.id === this.imageDocId)[0];
  }

  @Watch("isMounted")
  @Watch("imageDocId")
  @Watch("reverse")
  @Watch("backgroundSize")
  private onChangeImage() {
    if (!this.isMounted) return;
    const imageObj = this.getImageObj();
    if (!imageObj) return;
    this.imageSrc = imageObj.data.data;
    this.chitElm.style.setProperty("--imageSrc", `url(${this.imageSrc})`);
    let reverse = "";
    if (this.reverse === "horizontal") reverse = "scale(-1, 1)";
    if (this.reverse === "vertical") reverse = "scale(1, -1)";
    if (this.reverse === "180") reverse = "rotate(180deg)";
    this.chitElm.style.setProperty(`--image-reverse`, reverse);
    this.chitElm.style.setProperty(
      "--isEmpty",
      (this.imageSrc ? 0 : 1).toString()
    );
  }

  private get chitElm(): HTMLElement {
    return this.$refs.chit as HTMLElement;
  }

  @VueEvent
  private dragStart(event: DragEvent) {
    event.dataTransfer!.setData("dropType", "chit");
    event.dataTransfer!.setData("dropWindow", this.key);
  }

  @TaskProcessor("added-object-finished")
  private async addedObjectFinished(
    task: Task<AddObjectInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.dropWindow !== this.key) return;
    const point = task.value!.point;

    const owner = GameObjectManager.instance.mySelfId;
    const chitInfo: ChitStore = {
      x: point.x,
      y: point.y,
      owner,
      columns: this.width,
      rows: this.height,
      place: "field",
      isHideBorder: false,
      isHideHighlight: false,
      isLock: false,
      otherText: this.otherText,
      backgroundList: [
        {
          backgroundType: "image",
          imageTag: this.imageTag,
          imageId: this.imageDocId,
          reverse: this.reverse,
          backgroundSize: this.backgroundSize
        }
      ],
      useBackGround: 0,
      angle: 0
    };
    const chitCC = SocketFacade.instance.chitCC();
    const docId = await chitCC.touch();
    await chitCC.add(docId, chitInfo);

    task.resolve();
  }

  @Watch("isMounted")
  @Watch("width")
  @Watch("height")
  private onChangeWidth() {
    if (!this.isMounted) return;
    let ratio: number = Math.min(4 / this.width, 4 / this.height, 1);
    this.chitElm.style.setProperty(
      "--width-ratio",
      (this.width * ratio).toString()
    );
    this.chitElm.style.setProperty(
      "--height-ratio",
      (this.height * ratio).toString()
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chit {
  @include inline-flex-box(row, center, center);
  width: calc(var(--width-ratio) * 3em);
  height: calc(var(--height-ratio) * 3em);
  background-image: var(--imageSrc);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transform: var(--image-reverse);
  border-style: solid;
  border-color: rgb(255, 255, 153);
  border-width: 3px;
  box-sizing: border-box;

  &[draggable="false"] {
    background-image: linear-gradient(
        -45deg,
        transparent calc(50% - 1px),
        var(--uni-color-red) calc(50% - 1px),
        var(--uni-color-red) calc(50% + 1px),
        transparent calc(50% + 1px)
      ),
      linear-gradient(
        45deg,
        transparent calc(50% - 1px),
        var(--uni-color-red) calc(50% - 1px),
        var(--uni-color-red) calc(50% + 1px),
        transparent calc(50% + 1px)
      );
  }
}

.container {
  display: grid;
  grid-template-rows: 12em 1fr;
  grid-template-columns: 12em 1fr;
  width: 100%;
  height: 100%;

  .simple-tab-component {
    grid-row: 1 / 3;
    grid-column: 2 / 3;

    .image-picker-container {
      height: 100%;
    }

    textarea {
      height: 100%;
      width: 100%;
      resize: none;
      padding: 0;
      box-sizing: border-box;
    }
  }

  .chit-cell {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    @include flex-box(row, center, center);
  }

  > table {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
    table-layout: fixed;

    th {
      padding: 0;
      white-space: nowrap;
      width: 1px;

      label {
        @include flex-box(row, flex-end, center);
      }
    }

    td {
      text-align: left;
      padding: 0;

      input {
        margin: 0;

        &.value-width,
        &.value-height {
          width: 3em;
        }
      }
    }
  }
}
</style>
