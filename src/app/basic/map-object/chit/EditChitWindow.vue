<template>
  <div class="container" ref="window">
    <div class="chit-cell">
      <div class="chit" ref="chit" :draggable="false"></div>
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
            @input="width = $event.target.valueAsNumber"
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
            @input="height = $event.target.valueAsNumber"
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

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "../../../core/component/CtrlButton.vue";
import WindowVue from "../../../core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../../core/decorator/LifeCycle";
import BaseInput from "../../../core/component/BaseInput.vue";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { DataReference } from "@/@types/data";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import { BackgroundSize, Direction } from "@/@types/room";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import { ChitStore } from "@/@types/gameObject";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";
import BackgroundLocationSelect from "@/app/basic/common/components/select/BackgroundLocationSelect.vue";
import MapLayerSelect from "@/app/basic/common/components/select/MapLayerSelect.vue";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import VueEvent from "@/app/core/decorator/VueEvent";

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
export default class EditChitWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cc: NekostoreCollectionController<ChitStore> | null = null;
  private isProcessed: boolean = false;
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
    this.isMounted = true;
    const type = this.windowInfo.args!.type;
    this.docId = this.windowInfo.args!.docId;
    this.cc = SocketFacade.instance.getCC(type);
    const data = (await this.cc!.getData(this.docId))!;

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    const backgroundInfo = data.data!.textures[data.data!.useBackGround];
    if (backgroundInfo.type === "image") {
      this.imageDocId = backgroundInfo.imageId;
      this.imageTag = backgroundInfo.imageTag;
      this.backgroundSize = backgroundInfo.backgroundSize;
      this.direction = backgroundInfo.direction;
    }
    this.width = data.data!.columns;
    this.height = data.data!.rows;
    this.otherText = data.data!.otherText;
    this.layerId = data.data!.layerId;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify(this.docId);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.getData(this.docId))!;
    const backgroundInfo = data.data!.textures[data.data!.useBackGround];
    if (backgroundInfo.type === "image") {
      backgroundInfo.imageId = this.imageDocId!;
      backgroundInfo.imageTag = this.imageTag!;
      backgroundInfo.backgroundSize = this.backgroundSize;
      backgroundInfo.direction = this.direction;
    }
    data.data!.rows = this.height;
    data.data!.columns = this.width;
    data.data!.otherText = this.otherText;
    data.data!.layerId = this.layerId;
    await this.cc!.update(this.docId, data.data!);
    this.isProcessed = true;
    await this.close();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    try {
      await this.cc!.releaseTouch(this.docId);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
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
}

.value-width,
.value-height {
  width: 3em;
}

.container {
  display: grid;
  grid-template-rows: 12em 1fr calc(2em + 0.5rem);
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

  .button-area {
    grid-row: 3 / 4;
    grid-column: 1 / 3;
  }
}
</style>
