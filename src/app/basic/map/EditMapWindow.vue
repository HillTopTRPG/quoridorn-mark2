<template>
  <div class="container" ref="window">
    <simple-tab-component :tabList="tabList" v-model="currentTabInfo">
      <div class="main" v-if="currentTabInfo.target === 'main' && mainBgObj">
        <input-background-component
          :key="1"
          v-model="mainBgObj"
          :windowKey="key"
          :defaultTag="defaultTag"
        />
      </div>
      <div
        class="margin"
        v-if="currentTabInfo.target === 'margin' && marginBgObj"
      >
        <input-background-component
          :key="2"
          v-model="marginBgObj"
          :windowKey="key"
          :defaultTag="defaultTag"
        />
      </div>
      <div
        class="background"
        v-if="currentTabInfo.target === 'background' && backgroundBgObj"
      >
        <input-background-component
          :key="3"
          v-model="backgroundBgObj"
          :windowKey="key"
          :defaultTag="defaultTag"
        />
      </div>
      <div class="layer" v-if="currentTabInfo.target === 'layer'"></div>
      <div class="authority" v-if="currentTabInfo.target === 'authority'"></div>
    </simple-tab-component>
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
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import MapLayerSelect from "@/app/basic/common/components/select/MapLayerSelect.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { TabInfo } from "@/@types/window";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import BackgroundTypeRadio from "@/app/basic/common/components/radio/BackgroundTypeRadio.vue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import { StoreUseData } from "@/@types/store";
import { MapSetting, Texture } from "@/@types/room";
import InputBackgroundComponent from "@/app/basic/map/InputBackgroundComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: {
    InputBackgroundComponent,
    ImagePickerComponent,
    BackgroundTypeRadio,
    MapLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class EditMapWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private cc = SocketFacade.instance.mapListCC();
  private imageList = GameObjectManager.instance.imageList;
  private mapList = GameObjectManager.instance.mapList;

  private mapId: string | null = null;
  private mapInfo: StoreUseData<MapSetting> | null = null;

  private mainBgObj: Texture | null = null;
  private marginBgObj: Texture | null = null;
  private backgroundBgObj: Texture | null = null;
  private defaultTag: string = LanguageManager.instance.getText("type.map");

  @Watch("mainBgObj", { deep: true })
  private async onChangeMainBg(newValue: Texture, oldValue: Texture | null) {
    if (!oldValue) return;
    window.console.log("main:", JSON.stringify(this.mainBgObj, null, "  "));
    this.mapInfo!.data!.texture = newValue;
    await this.updateMap();
  }

  @Watch("marginBgObj", { deep: true })
  private async onChangeMarginBg(newValue: Texture, oldValue: Texture | null) {
    if (!oldValue) return;
    window.console.log("margin:", JSON.stringify(this.marginBgObj, null, "  "));
    this.mapInfo!.data!.margin.texture = newValue;
    await this.updateMap();
  }

  @Watch("backgroundBgObj", { deep: true })
  private async onChangeBackgroundBg(
    newValue: Texture,
    oldValue: Texture | null
  ) {
    if (!oldValue) return;
    window.console.log(
      "background:",
      JSON.stringify(this.backgroundBgObj, null, "  ")
    );
    this.mapInfo!.data!.background.texture = newValue;
    await this.updateMap();
  }

  private async updateMap() {
    try {
      await this.cc.update(this.mapId!, this.mapInfo!.data!, true);
    } catch (err) {
      window.console.log("==========");
      window.console.log(err);
    }
  }

  private tabList: TabInfo[] = [
    { target: "main", text: "" },
    { target: "margin", text: "" },
    { target: "background", text: "" },
    { target: "layer", text: "" },
    { target: "authority", text: "" }
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
  private async mounted() {
    await this.init();
    this.isMounted = true;
    this.mapId = this.windowInfo.args!;
    this.mapInfo = this.mapList.filter(map => map.id === this.mapId)[0];

    const getBgObj = EditMapWindow.getBgObj;
    this.mainBgObj = getBgObj(this.mapInfo.data!.texture);
    this.marginBgObj = getBgObj(this.mapInfo.data!.margin.texture);
    this.backgroundBgObj = getBgObj(this.mapInfo.data!.background.texture);

    try {
      await this.cc.touchModify(this.mapId);
    } catch (err) {
      window.console.warn(err);
      await this.close();
    }
  }

  private static getBgObj(info: Texture): Texture {
    if (info.type === "image") {
      return {
        type: "image",
        imageId: info.imageId,
        imageTag: info.imageTag,
        direction: info.direction,
        backgroundSize: info.backgroundSize
      };
    } else {
      return {
        type: "color",
        backgroundColor: info.backgroundColor,
        fontColor: info.fontColor,
        text: info.text
      };
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    try {
      await this.cc!.releaseTouch(this.mapId!);
    } catch (err) {
      // nothing
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  height: 100%;
}

.simple-tab-component {
  height: 100%;

  > *:not(:first-child) {
    width: 100%;
    flex: 1;
  }
}
</style>
