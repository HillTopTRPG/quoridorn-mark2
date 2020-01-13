<template>
  <div class="container" ref="window">
    <div class="area-map-container">
      <div
        class="area-map"
        :class="{ selected: selectedMapId === map.id }"
        v-for="map in mapList"
        :key="map.id"
        @click="selectAreaMap(map)"
        ref="mapList"
      ></div>
      <div class="area-map add" @click="createMap()">
        <span>＋</span>
      </div>
    </div>
    <div class="button-area">
      <ctrl-button @click="editMap()" :disabled="!selectedMapId">
        <span v-t="'button.edit'"></span>
      </ctrl-button>
      <ctrl-button
        @click="deleteMap()"
        :disabled="!selectedMapId || mapList.length <= 1"
      >
        <span v-t="'button.delete'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import SeekBarComponent from "@/app/basic/music/SeekBarComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import MapLayerSelect from "@/app/basic/common/components/select/MapLayerSelect.vue";
import GameTable from "@/app/basic/map/GameTable.vue";
import { StoreUseData } from "@/@types/store";
import { MapSetting } from "@/@types/room";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";

@Component({
  components: {
    MapLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class EditAreaMapWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private cc = SocketFacade.instance.mapListCC();
  private imageList = GameObjectManager.instance.imageList;
  private mapList = GameObjectManager.instance.mapList;
  private selectedMapId: string | null = null;

  @LifeCycle
  private async mounted() {
    await this.init();
    this.isMounted = true;
  }

  @Watch("isMounted")
  @Watch("mapList", { deep: true })
  private onChangeMapList() {
    const elmList: HTMLElement[] = this.$refs.mapList as HTMLElement[];
    if (this.mapList.findIndex(map => !map.data) > -1) return;
    // window.console.log(this.mapList[0].data.texture);
    this.mapList
      .map(map => map.data!)
      .forEach(async (map, index) => {
        // window.console.log(map.texture);
        const elm = elmList[index];
        let direction: string = "";
        let backgroundColor: string = "transparent";
        let backgroundImage: string = "none";
        if (map.texture.type === "color") {
          backgroundColor = map.texture.backgroundColor;
        } else {
          const imageData = await SocketFacade.instance
            .imageDataCC()
            .getData(map.texture.imageId);
          if (imageData && imageData.data) {
            backgroundImage = `url("${GameTable.changeImagePath(
              imageData.data.data
            )}")`;
          }
          if (map.texture.direction === "horizontal")
            direction = "scale(-1, 1)";
          if (map.texture.direction === "vertical") direction = "scale(1, -1)";
          if (map.texture.direction === "180") direction = "rotate(180deg)";
        }
        elm.style.setProperty("--background-color", backgroundColor);
        elm.style.setProperty("--background-image", backgroundImage);
        elm.style.setProperty("--image-direction", direction);
        elm.style.setProperty("--name", `"${map.name}"`);
      });
  }

  private selectAreaMap(map: StoreUseData<MapSetting>) {
    this.selectedMapId = map.id;
  }

  private async editMap() {
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "edit-map-window",
        args: this.selectedMapId!
      }
    });
  }

  private async deleteMap() {
    await this.cc.touchModify(this.selectedMapId!);
    await this.cc.delete(this.selectedMapId!);
  }

  private async createMap() {
    const docId = await this.cc.touch();
    const firstImage = this.imageList[0].data!;
    const firstImageId = this.imageList[0].id!;

    const mapSetting: MapSetting = {
      name: "New map",
      shapeType: "square",
      totalColumn: 20,
      totalRow: 15,
      gridSize: 50,
      gridBorderColor: "#000000",
      isPourTile: false,
      isHexFirstCorner: false,
      isHexSecondSmall: false,
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
        texture: {
          type: "image",
          imageTag: firstImage.tag,
          imageId: firstImageId,
          direction: "none",
          backgroundSize: "100%"
        },
        isUseGridColor: true,
        gridColorBold: "rgba(255, 255, 255, 0.3)",
        gridColorThin: "rgba(255, 255, 255, 0.1)",
        column: 5,
        row: 5,
        isUseMaskColor: true,
        maskColor: "rgba(20, 80, 20, 0.1)",
        maskBlur: 3,
        isUseImage: "none",
        borderWidth: 10,
        borderColor: "gray",
        borderStyle: "ridge"
      },
      chatLinkage: 0,
      chatLinkageSearch: "",
      portTileMapping: ""
    };
    const mapDataDocId = await this.cc.add(docId, mapSetting);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  overflow-y: auto;
}

.area-map-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  padding-top: 0.5rem;
  padding-left: 0.5rem;
  border: 1px solid black;
  box-sizing: border-box;
  height: calc(20em + 1.5rem + 2px);
  overflow-y: auto;

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

    &:before {
      content: var(--name);
      background-color: rgba(255, 255, 255, 0.4);
      @include flex-box(row, flex-start, center);
      position: absolute;
      top: 0;
      left: 0;
      padding: 0 0.3rem;
    }

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
