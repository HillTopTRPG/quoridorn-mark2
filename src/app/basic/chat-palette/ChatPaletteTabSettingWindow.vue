<template>
  <div class="container" ref="window-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- タブリストタブ -->
      <div class="tab-container" v-if="currentTabInfo.target === 'tab-list'">
        <draggable
          :options="{
            animation: 10,
            handle: dragMode ? '' : '.anonymous'
          }"
          class="draggable-box"
          v-model="filteredTabList"
          @start="onSortStart()"
          @end="onSortEnd()"
          @sort="onSortOrderChange()"
        >
          <template v-for="tab in filteredTabList">
            <chat-palette-tab-component
              :key="tab.key"
              :tab="tab"
              :dragMode="dragMode"
              :changeOrderKey="changeOrderKey"
              @hover="onHover"
              @edit="editTab"
              @chmod="chmodTab"
              @delete="deleteTab"
            />
          </template>
        </draggable>
      </div>

      <div class="button-area" v-if="currentTabInfo.target === 'tab-list'">
        <ctrl-button @click="addTab()">
          <span v-t="'button.add'"></span>
        </ctrl-button>
        <s-check
          class="sort-check"
          v-model="dragMode"
          colorStyle="skyblue"
          c-icon="checkmark"
          :c-label="$t('label.sort')"
          n-icon=""
          :n-label="$t('label.sort')"
        />
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import draggable from "vuedraggable";
import { Task, TaskResult } from "task";
import { ModeInfo } from "mode";
import { ChatPaletteStore } from "@/@types/store-data";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import ChatPaletteTabComponent from "@/app/basic/chat-palette/ChatPaletteTabComponent.vue";
import App from "@/views/App.vue";
import { errorDialog, questionDialog } from "@/app/core/utility/Utility";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import TaskManager from "@/app/core/task/TaskManager";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import ChatTabComponent from "@/app/basic/chat/tab/ChatTabComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

@Component({
  components: {
    ChatPaletteTabComponent,
    SimpleTabComponent,
    ChatTabComponent,
    TrCheckboxComponent,
    SCheck,
    CtrlButton,
    draggable
  }
})
export default class ChatPaletteTabSettingWindow extends Mixins<
  WindowVue<void, void>
>(WindowVue) {
  public chatPaletteList = GameObjectManager.instance.chatPaletteList;
  private filteredTabList: StoreData<ChatPaletteStore>[] = [];
  private chatPaletteListCC = SocketFacade.instance.chatPaletteListCC();

  private dragMode = false;
  private changeOrderKey: string = "";
  private dragModeProcessed: boolean = false;
  private orderChangingKeyList: string[] = [];

  private tabList: TabInfo[] = [
    { key: "1", target: "tab-list", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  @Watch("chatPaletteList", { immediate: true, deep: true })
  private onChangeChatPaletteList() {
    this.filteredTabList = this.chatPaletteList.filter(ct =>
      permissionCheck(ct, "view")
    );
  }

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

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @VueEvent
  private async editTab(tabInfo: StoreData<ChatPaletteStore>) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, null>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chat-palette-edit-window",
        args: {
          type: "chat-palette-list",
          key: tabInfo.key
        }
      }
    });
  }

  @VueEvent
  private async chmodTab(tabInfo: StoreData<ChatPaletteStore>) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, void>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: tabInfo.collection,
          key: tabInfo.key
        }
      }
    });
  }

  private static getDialogMessage(target: string): string {
    const msgTarget = "message." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreData<ChatPaletteStore>) {
    const text = ChatPaletteTabSettingWindow.getDialogMessage(
      "delete-tab"
    ).replace("$1", tabInfo.data!.name);
    const confirm = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;

    try {
      await this.chatPaletteListCC.deletePackage([tabInfo.key]);
    } catch (err) {
      // TODO error message.
      return;
    }
  }

  @VueEvent
  private async addTab() {
    await App.openSimpleWindow("chat-palette-add-window");
  }

  @VueEvent
  private getExclusionOwner(exclusionOwner: string) {
    return GameObjectManager.instance.getExclusionOwnerName(exclusionOwner);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t(`chat-setting-window.message-list.${messageType}`)!.toString()
      : "";
  }

  @Watch("dragMode")
  private async onChangeDragMode() {
    this.$emit("onChangeDragMode", this.dragMode);

    const keyList: string[] = this.filteredTabList.map(ct => ct.key);
    if (this.dragMode) {
      let error: boolean = false;

      try {
        await this.chatPaletteListCC.touchModify(keyList);
      } catch (err) {
        error = true;
        await errorDialog({
          title: this.$t("message.error").toString(),
          text: "Failure to get sceneAndLayerList's lock.\nPlease try again."
        });
      }

      if (error) {
        this.dragModeProcessed = true;
        this.dragMode = false;
        this.orderChangingKeyList = [];
      } else {
        this.orderChangingKeyList = keyList;
      }
    } else {
      this.orderChangingKeyList = [];
      console.log(this.dragModeProcessed);
      if (!this.dragModeProcessed) {
        await this.chatPaletteListCC.releaseTouch(keyList);
        console.log("releaseTouched", keyList);
        this.dragModeProcessed = false;
      }
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (this.dragMode && !this.dragModeProcessed) {
      const keyList: string[] = this.filteredTabList.map(ct => ct.key);
      await this.chatPaletteListCC.releaseTouch(keyList);
      this.dragModeProcessed = false;
    }
  }

  @VueEvent
  private async onSortStart() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "on" as "on" }
    });
  }

  @VueEvent
  private async onSortOrderChange() {
    console.log("onEndOrderChange");
    const keyOrderList = this.filteredTabList.map(ct => ({
      key: ct.key,
      order: ct.order,
      target: false
    }));
    const orderList = keyOrderList.concat().map(keyo => keyo.order);
    orderList.sort((o1, o2) => {
      if (o1 < o2) return -1;
      if (o1 > o2) return 1;
      return 0;
    });
    keyOrderList.forEach((keyo, index: number) => {
      if (keyo.order !== orderList[index]) keyo.target = true;
      keyo.order = orderList[index];
    });

    const list: (Partial<StoreData<ChatPaletteStore>> & {
      key: string;
      data: ChatPaletteStore;
      continuous?: boolean;
    })[] = [];
    this.filteredTabList.forEach((obj, index) => {
      if (!keyOrderList[index].target) return;
      const key = keyOrderList[index].key;
      const order = keyOrderList[index].order;
      const data = this.filteredTabList.filter(ct => ct.key === key)[0].data!;
      list.push({
        key,
        order,
        data,
        continuous: true
      });
    });

    await this.chatPaletteListCC.update(list);
  }

  @VueEvent
  private async onSortEnd() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "off" as "off" }
    });
    this.changeOrderKey = "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.simple-tab-component {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.other-block {
  border: solid 1px gray;
  height: 100%;
  box-sizing: border-box;
  padding: 0.2rem;
}

.tab-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  background-color: white;
  overflow-y: scroll;
  border: solid 1px gray;
}

.draggable-box {
  display: contents;
}

.tab-info {
  @include flex-box(row, flex-start, center);
  position: relative;
  height: 2em;
  min-height: 2em;
  padding: 0 0.3rem;
  border-bottom: 1px dotted var(--uni-color-gray);
  box-sizing: border-box;

  &.tab-all {
    @include btn-skyblue();
  }
}

.icon-menu {
  visibility: hidden;
}

.check-box {
  @include flex-box(row, flex-start, center);
  position: absolute;
  right: 0.3rem;
  top: 0;
  bottom: 0;
}
</style>
