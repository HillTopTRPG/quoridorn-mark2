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
        :direction.sync="direction"
      />
      <textarea
        v-if="currentTabInfo.target === 'other-text'"
        v-model="otherText"
      ></textarea>
      <div class="layer-block" v-if="currentTabInfo.target === 'layer'">
        <label>
          <span v-t="'label.add-target'" class="label-input"></span>
          <map-layer-select v-model="layerId" />
        </label>
      </div>
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
            v-t="'label.background-location'"
          ></label>
        </th>
        <td class="value-cell">
          <background-location-select
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
import { BackgroundSize, Direction } from "@/@types/room";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { ChitStore } from "@/@types/gameObject";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";
import BackgroundLocationSelect from "@/app/basic/common/components/select/BackgroundLocationSelect.vue";
import MapLayerSelect from "@/app/basic/common/components/select/MapLayerSelect.vue";

@Component({
  components: {
    MapLayerSelect,
    BackgroundLocationSelect,
    SimpleTabComponent,
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
  private direction: Direction = "none";
  private isMounted: boolean = false;
  private imageSrc: string = "";
  private backgroundSize: BackgroundSize = "contain";
  private layerId: string = GameObjectManager.instance.mapLayerList.filter(
    ml => ml.data!.type === "character"
  )[0].id!;

  private tabList: TabInfo[] = [
    { target: "image", text: "" },
    { target: "layer", text: "" },
    { target: "other-text", text: "" }
  ];
  private currentTabInfo: TabInfo | null = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    const getText = LanguageManager.instance.getText.bind(
      LanguageManager.instance
    );
    this.tabList.forEach(t => {
      t.text = getText(`label.${t.target}`);
    });
  }

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
  @Watch("direction")
  @Watch("backgroundSize")
  private onChangeImage() {
    if (!this.isMounted) return;
    const imageObj = this.getImageObj();
    if (!imageObj) return;
    this.imageSrc = imageObj.data!.data;
    this.chitElm.style.setProperty("--imageSrc", `url(${this.imageSrc})`);
    let direction = "";
    if (this.direction === "horizontal") direction = "scale(-1, 1)";
    if (this.direction === "vertical") direction = "scale(1, -1)";
    if (this.direction === "180") direction = "rotate(180deg)";
    this.chitElm.style.setProperty(`--image-direction`, direction);
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
      layerId: this.layerId,
      textures: [
        {
          type: "image",
          imageTag: this.imageTag!,
          imageId: this.imageDocId!,
          direction: this.direction,
          backgroundSize: this.backgroundSize!
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

  @Watch("isMounted")
  @Watch("backgroundSize")
  private onChangeLocation() {
    if (!this.isMounted) return;
    let backgroundSize = "";
    let backgroundPosition = "center";
    if (this.backgroundSize === "contain") backgroundSize = "contain";
    if (this.backgroundSize === "cover-start") {
      backgroundSize = "cover";
      backgroundPosition = "top left";
    }
    if (this.backgroundSize === "cover-center") {
      backgroundSize = "cover";
    }
    if (this.backgroundSize === "cover-end") {
      backgroundSize = "cover";
      backgroundPosition = "bottom right";
    }
    if (this.backgroundSize === "100%") {
      backgroundSize = "100% 100%";
    }
    this.chitElm.style.setProperty("--image-background-size", backgroundSize);
    this.chitElm.style.setProperty(
      "--image-background-position",
      backgroundPosition
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
  transform: var(--image-direction);
  background-size: var(--image-background-size);
  background-repeat: no-repeat;
  background-position: var(--image-background-position);
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

.value-width,
.value-height {
  width: 3em;
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

    > *:not(:first-child) {
      width: 100%;
      flex: 1;
    }

    > div:not(.image-picker-container) {
      border: solid 1px gray;
      box-sizing: border-box;
      padding: 0.2rem;
    }

    textarea {
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

    th,
    td {
      label {
        @include inline-flex-box(row, flex-start, center);
      }
    }

    th {
      text-align: right;
      padding: 0;
      white-space: nowrap;
      width: 1px;
    }

    td {
      text-align: left;
      padding: 0;

      input {
        margin: 0;
      }
    }
  }
}
</style>
