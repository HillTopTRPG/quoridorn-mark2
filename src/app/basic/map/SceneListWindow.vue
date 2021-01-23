<template>
  <div class="container" ref="window-container">
    <div class="button-area space-between margin-bottom">
      <ctrl-button @click="send()" :disabled="!selectedSceneKey">
        <span v-t="'button.send'"></span>
      </ctrl-button>
      <ctrl-button @click="preview" :disabled="!selectedSceneKey">
        <span v-t="'button.preview'"></span>
      </ctrl-button>
    </div>
    <div class="area-map-container">
      <div
        class="area-map"
        :class="{
          selected: selectedSceneKey === scene.key,
          'lock-info': scene.exclusionOwner
        }"
        v-for="(scene, index) in useSceneList"
        :key="index"
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
      <ctrl-button @click="editMap()" :disabled="!selectedSceneKey">
        <span v-t="'button.edit'"></span>
      </ctrl-button>
      <ctrl-button @click="chmodMap()" :disabled="!selectedSceneKey">
        <span v-t="'button.chmod'"></span>
      </ctrl-button>
      <ctrl-button
        @click="deleteMap()"
        :disabled="!selectedSceneKey || useSceneList.length <= 1"
      >
        <span v-t="'button.delete'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { SceneStore } from "@/@types/store-data";
import { WindowOpenInfo } from "@/@types/window";
import { questionDialog } from "@/app/core/utility/Utility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SeekBarComponent from "@/app/basic/cut-in/bgm/SeekBarComponent.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

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
  private selectedSceneKey: string | null = null;

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
          const imageData = (await SocketFacade.instance
            .mediaCC()
            .findSingle("key", texture.mediaKey))!.data!;
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
  private selectAreaMap(scene: StoreData<SceneStore>) {
    this.selectedSceneKey = scene.key;
  }

  @VueEvent
  private async send() {
    if (!this.selectedSceneKey) return;
    await GameObjectManager.instance.updateRoomData({
      sceneKey: this.selectedSceneKey
    });
  }

  @VueEvent
  private preview() {
    if (!this.selectedSceneKey) return;
    GameObjectManager.instance.roomData.sceneKey = this.selectedSceneKey;
  }

  @VueEvent
  private async editMap() {
    if (!this.selectedSceneKey) return;
    await this.close();
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "edit-scene-window",
        args: this.selectedSceneKey
      }
    });
  }

  @VueEvent
  private async chmodMap() {
    if (!this.selectedSceneKey) return;
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: "scene-list",
          key: this.selectedSceneKey
        }
      }
    });
  }

  @VueEvent
  private async deleteMap() {
    if (!this.selectedSceneKey) return;
    const confirm = await questionDialog({
      title: this.$t("button.delete").toString(),
      text: this.$t("message.really-delete").toString(),
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;
    await this.cc.deletePackage([this.selectedSceneKey]);
  }

  @VueEvent
  private async createMap() {
    const firstImage = this.mediaList[0].data!;
    const firstImageKey = this.mediaList[0].key;

    const scene: SceneStore = {
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
        mediaTag: firstImage.tag,
        mediaKey: firstImageKey,
        direction: "none",
        backgroundSize: "100%"
      },
      background: {
        texture: {
          type: "image",
          mediaTag: firstImage.tag,
          mediaKey: firstImageKey,
          direction: "none",
          backgroundSize: "100%"
        },
        maskBlur: 3
      },
      margin: {
        useTexture: "original",
        texture: {
          type: "image",
          mediaTag: firstImage.tag,
          mediaKey: firstImageKey,
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
    await SocketFacade.instance.sceneListCC().addDirect([{ data: scene }]);
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
