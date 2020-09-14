<template>
  <div class="container" ref="window-container">
    <div class="button-area space-between margin-bottom">
      <ctrl-button @click="send()" :disabled="!selectedSceneId">
        <span v-t="'button.send'"></span>
      </ctrl-button>
      <ctrl-button @click="preview" :disabled="!selectedSceneId">
        <span v-t="'button.preview'"></span>
      </ctrl-button>
    </div>
    <div class="area-map-container">
      <div
        class="area-map"
        :class="{
          selected: selectedSceneId === scene.id,
          'lock-info': scene.exclusionOwner
        }"
        v-for="(scene, idx) in useSceneList"
        :key="idx"
        @click="selectAreaMap(scene)"
        @dblclick="send()"
        ref="scene"
      >
        <div class="title">{{ scene.data.name }}</div>
      </div>
      <div class="area-map add" @click="createMap()">
        <span>＋</span>
      </div>
    </div>
    <div class="button-area">
      <ctrl-button @click="editMap()" :disabled="!selectedSceneId">
        <span v-t="'button.edit'"></span>
      </ctrl-button>
      <ctrl-button @click="chmodMap()" :disabled="!selectedSceneId">
        <span v-t="'button.chmod'"></span>
      </ctrl-button>
      <ctrl-button
        @click="deleteMap()"
        :disabled="!selectedSceneId || useSceneList.length <= 1"
      >
        <span v-t="'button.delete'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import SeekBarComponent from "../cut-in/bgm/SeekBarComponent.vue";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import ColorPickerComponent from "../../core/component/ColorPickerComponent.vue";
import BaseInput from "../../core/component/BaseInput.vue";
import { Scene } from "@/@types/room";
import VueEvent from "../../core/decorator/VueEvent";
import { StoreUseData } from "@/@types/store";
import TaskManager from "../../core/task/TaskManager";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import GameObjectManager from "../GameObjectManager";
import LanguageManager from "../../../LanguageManager";
import { WindowOpenInfo } from "@/@types/window";
import SceneLayerSelect from "../common/components/select/SceneLayerSelect.vue";
import { DataReference } from "@/@types/data";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";

@Component({
  components: {
    SceneLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class SceneListWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private cc = SocketFacade.instance.sceneListCC();
  private mediaList = GameObjectManager.instance.mediaList;
  private sceneList = GameObjectManager.instance.sceneList;
  private selectedSceneId: string | null = null;

  @LifeCycle
  private async mounted() {
    await this.init();
    this.isMounted = true;
  }

  private get useSceneList() {
    return this.sceneList.filter(s => permissionCheck(s, "view"));
  }

  @Watch("isMounted")
  @Watch("useSceneList")
  private onChangeSceneList() {
    const elmList: HTMLElement[] = this.$refs.scene as HTMLElement[];
    if (this.useSceneList.findIndex(s => !s.data) > -1) return;
    // console.log(this.mapList[0].data.texture);
    setTimeout(() => {
      this.useSceneList.forEach(async (s, index) => {
        // console.log(map.texture);
        const elm = elmList[index];
        let direction: string = "";
        let backgroundColor: string = "transparent";
        let backgroundImage: string = "none";

        const texture = s.data!.texture;
        if (texture.type === "color") {
          backgroundColor = texture.backgroundColor;
        } else {
          const imageData = await SocketFacade.instance
            .mediaCC()
            .getData(texture.imageId);
          if (imageData && imageData.data) {
            backgroundImage = `url('${imageData.data.url}')`;
          }
          if (texture.direction === "horizontal") direction = "scale(-1, 1)";
          if (texture.direction === "vertical") direction = "scale(1, -1)";
          if (texture.direction === "180") direction = "rotate(180deg)";
        }
        elm.style.setProperty("--background-color", backgroundColor);
        elm.style.setProperty("--background-image", backgroundImage);
        elm.style.setProperty("--image-direction", direction);

        let name = "";
        if (s.exclusionOwner) {
          name = GameObjectManager.instance.getExclusionOwnerName(
            s.exclusionOwner
          );
          elm.style.setProperty(
            "--msg-locked",
            `'${this.$t("label.editing")!.toString()}(${name})'`
          );
        }
      });
    });
  }

  @VueEvent
  private selectAreaMap(scene: StoreUseData<Scene>) {
    this.selectedSceneId = scene.id;
  }

  @VueEvent
  private async send() {
    if (!this.selectedSceneId) return;
    await GameObjectManager.instance.updateRoomData({
      sceneId: this.selectedSceneId
    });
  }

  @VueEvent
  private preview() {
    if (!this.selectedSceneId) return;
    GameObjectManager.instance.roomData.sceneId = this.selectedSceneId;
  }

  @VueEvent
  private async editMap() {
    if (!this.selectedSceneId) return;
    await this.close();
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "edit-scene-window",
        args: this.selectedSceneId
      }
    });
  }

  @VueEvent
  private async chmodMap() {
    if (!this.selectedSceneId) return;
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: "scene",
          docId: this.selectedSceneId
        }
      }
    });
  }

  @VueEvent
  private async deleteMap() {
    if (!this.selectedSceneId) return;
    const result = window.confirm(this.$t("message.really-delete")!.toString());
    if (!result) return;
    await this.cc.deletePackage([this.selectedSceneId]);
  }

  @VueEvent
  private async createMap() {
    const firstImage = this.mediaList[0].data!;
    const firstImageId = this.mediaList[0].id!;

    const scene: Scene = {
      name: "New map",
      columns: 20,
      rows: 15,
      gridSize: 50,
      gridColor: "#000000",
      fontColor: "#000000",
      portTileMapping: "",
      switchBefore: {
        priority: 1,
        direction: "normal"
      },
      switchAfter: {
        priority: 1,
        direction: "normal"
      },
      shapeType: "square",
      texture: {
        type: "image",
        imageTag: firstImage.tag,
        imageId: firstImageId,
        direction: "none",
        backgroundSize: "100%"
      },
      background: {
        texture: {
          type: "image",
          imageTag: firstImage.tag,
          imageId: firstImageId,
          direction: "none",
          backgroundSize: "100%"
        },
        maskBlur: 3
      },
      margin: {
        useTexture: "original",
        texture: {
          type: "image",
          imageTag: firstImage.tag,
          imageId: firstImageId,
          direction: "none",
          backgroundSize: "100%"
        },
        columns: 5,
        rows: 5,
        isUseGrid: true,
        gridColorBold: "rgba(255, 255, 255, 0.3)",
        gridColorThin: "rgba(255, 255, 255, 0.1)",
        maskColor: "rgba(20, 80, 20, 0.1)",
        maskBlur: 3,
        border: {
          width: 10,
          color: "gray",
          style: "ridge"
        }
      },
      chatLinkage: 0,
      chatLinkageSearch: ""
    };
    await SocketFacade.instance.sceneListCC().addDirect([scene]);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  width: 100%;
  height: 100%;
}

.lock-info {
  @include lock-view();
}

.lock-info:after {
  content: var(--msg-locked, "ロック中");
}

.title {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-block;
  background-color: white;
  border: 1px solid gray;
  border-top-width: 0;
  border-left-width: 0;
  padding: 0 0.2rem;
}

.area-map-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  padding-top: 0.5rem;
  padding-left: 0.5rem;
  border: 1px solid black;
  box-sizing: border-box;
  overflow-y: scroll;
  flex: 1;

  .area-map {
    position: relative;
    width: 10em;
    height: 10em;
    border: 2px solid gray;
    background-image: var(--background-image);
    background-color: var(--background-color);
    background-size: cover;
    background-position: center;
    transform: var(--image-direction);
    box-sizing: border-box;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    overflow-x: hidden;

    &.selected {
      border-color: red;
    }

    &.add {
      @include flex-box(row, center, center);
      border-style: dashed;

      span {
        @include flex-box(row, center, center);
        border-radius: 50%;
        border: 1px solid black;
        width: 2em;
        height: 2em;
        padding: 0.3rem;
        box-sizing: border-box;
        font-weight: bold;
        font-size: 2rem;
      }
    }
  }
}
</style>
