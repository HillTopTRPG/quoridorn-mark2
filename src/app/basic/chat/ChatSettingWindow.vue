<template>
  <div class="container" ref="window-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- タブリストタブ -->
      <div class="tab-container" v-if="currentTabInfo.target === 'tab-list'">
        <div
          class="tab-info tab-all"
          :class="{ 'not-use': !isUseAllTab }"
          @click="isUseAllTab = !isUseAllTab"
        >
          <span class="icon-menu"></span>
          <span v-t="'label.all'"></span>

          <div class="check-box">
            <span v-t="`label.${isUseAllTab ? '' : 'un-'}use`"></span>
            <span :class="`icon-eye${isUseAllTab ? '' : '-blocked'}`"></span>
          </div>
        </div>
        <draggable
          :options="{
            animation: 10,
            handle: dragModeTab ? '' : '.anonymous'
          }"
          class="draggable-box"
          v-model="filteredChatTabList"
          @start="onSortStart()"
          @end="onSortEnd()"
          @sort="onSortOrderChangeTab()"
        >
          <chat-tab-component
            v-for="tab in filteredChatTabList"
            :key="tab.key"
            :tab="tab"
            :dragMode="dragModeTab"
            :changeOrderKey="changeOrderKey"
            @hover="onHover"
          />
        </draggable>
      </div>

      <div class="button-area" v-if="currentTabInfo.target === 'tab-list'">
        <ctrl-button @click="addTab()">
          <span v-t="'button.add'"></span>
        </ctrl-button>
        <s-check
          class="sort-check"
          v-model="dragModeTab"
          colorStyle="skyblue"
          c-icon="checkmark"
          :c-label="$t('label.sort')"
          n-icon=""
          :n-label="$t('label.sort')"
        />
      </div>

      <!-- いいねタブ -->
      <div class="like-container" v-if="currentTabInfo.target === 'like-list'">
        <draggable
          :options="{
            animation: 10,
            handle: dragModeLike ? '' : '.anonymous'
          }"
          class="draggable-box"
          v-model="filteredLikeList"
          @start="onSortStart()"
          @end="onSortEnd()"
          @sort="onSortOrderChangeLike()"
        >
          <like-component
            v-for="like in filteredLikeList"
            :key="like.key"
            :like="like"
            :dragMode="dragModeLike"
            :changeOrderKey="changeOrderKey"
            @hover="onHover"
          />
        </draggable>
      </div>

      <div class="button-area" v-if="currentTabInfo.target === 'like-list'">
        <ctrl-button @click="addLike()">
          <span v-t="'button.add'"></span>
        </ctrl-button>
        <s-check
          class="sort-check"
          v-model="dragModeLike"
          colorStyle="skyblue"
          c-icon="checkmark"
          :c-label="$t('label.sort')"
          n-icon=""
          :n-label="$t('label.sort')"
        />
      </div>

      <!-- その他タブ -->
      <div class="other-block" v-if="currentTabInfo.target === 'other'">
        <table>
          <tr>
            <tr-checkbox-component
              labelName="label.read-aloud"
              cLabel=""
              nLabel=""
              v-model="useReadAloudLocal"
            />
          </tr>
        </table>
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
import { Getter, Mutation } from "vuex-class";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import LikeComponent from "@/app/basic/chat/like/LikeComponent.vue";
import { LikeStore, ChatTabStore } from "@/@types/store-data";
import {
  errorDialog,
  findRequireByKey,
  questionDialog
} from "@/app/core/utility/Utility";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import App from "@/views/App.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import ChatTabComponent from "@/app/basic/chat/tab/ChatTabComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

@Component({
  components: {
    LikeComponent,
    SimpleTabComponent,
    ChatTabComponent,
    TrCheckboxComponent,
    SCheck,
    CtrlButton,
    draggable
  }
})
export default class ChatSettingWindow extends Mixins<WindowVue<void, never>>(
  WindowVue
) {
  @Mutation("setUseReadAloud")
  private setUseReadAloud!: (useReadAloud: boolean) => void;

  @Getter("useReadAloud")
  private useReadAloud!: boolean;

  private chatTabList = GameObjectManager.instance.chatTabList;
  private likeList = GameObjectManager.instance.likeList;
  private filteredChatTabList: StoreData<ChatTabStore>[] = [];
  private filteredLikeList: StoreData<LikeStore>[] = [];
  private chatTabListCC = SocketFacade.instance.chatTabListCC();
  private likeListCC = SocketFacade.instance.likeListCC();
  private chatPublicInfo = GameObjectManager.instance.chatPublicInfo;

  private dragModeTab = false;
  private dragModeTabProcessed: boolean = false;
  private dragModeLike = false;
  private dragModeLikeProcessed: boolean = false;
  private changeOrderKey: string = "";
  private orderChangingKeyList: string[] = [];
  private useReadAloudLocal: boolean = false;

  private isUseAllTab: boolean = false;

  private tabList: TabInfo[] = [
    { key: "1", target: "tab-list", text: "", isDisabled: false },
    { key: "2", target: "like-list", text: "", isDisabled: false },
    { key: "3", target: "other", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @Watch("useReadAloudLocal")
  private onChangeUseReadAloudLocal() {
    this.setUseReadAloud(this.useReadAloudLocal);
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
    this.useReadAloudLocal = this.useReadAloud;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isUseAllTab = this.chatPublicInfo.isUseAllTab;
    this.currentTabInfo = this.tabList.find(t => t.target === "tab-list")!;
  }

  @Watch("currentTabInfo")
  private onChangeCurrentTabInfo() {
    this.dragModeTab = false;
    this.dragModeLike = false;
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @Watch("isUseAllTab")
  private onChangeIsUseAllTab() {
    this.chatPublicInfo.isUseAllTab = this.isUseAllTab;
  }

  @Watch("chatPublicInfo.isUseAllTab")
  private onChangePublicIsUseAllTab() {
    this.isUseAllTab = this.chatPublicInfo.isUseAllTab;
  }

  @Watch("chatTabList", { immediate: true, deep: true })
  private onChangeTabListImmediateDeep() {
    this.filteredChatTabList = this.chatTabList.filter(ct =>
      permissionCheck(ct, "view")
    );
  }

  @Watch("likeList", { immediate: true, deep: true })
  private onChangeLikeListImmediateDeep() {
    this.filteredLikeList = this.likeList.concat();
  }

  @VueEvent
  private isEditable(tabInfo: StoreData<ChatTabStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async editTab(tabInfo: StoreData<ChatTabStore>) {
    if (!this.isEditable(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chat-tab-edit-window",
        args: {
          type: "chat-tab-list",
          key: tabInfo.key
        }
      }
    });
  }

  @VueEvent
  private isChmodAble(tabInfo: StoreData<ChatTabStore>) {
    return permissionCheck(tabInfo, "chmod");
  }

  @VueEvent
  private async chmodTab(tabInfo: StoreData<ChatTabStore>) {
    if (!this.isChmodAble(tabInfo)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
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

  @VueEvent
  private isDeletable(tabInfo: StoreData<ChatTabStore>) {
    return !tabInfo.data!.isSystem && permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async deleteTab(tabInfo: StoreData<ChatTabStore>) {
    if (!this.isDeletable(tabInfo)) return;
    const text = this.$t("message.delete-tab")!
      .toString()
      .replace("$1", tabInfo.data!.name);
    const result = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!result) return;

    try {
      await this.chatTabListCC.deletePackage([tabInfo.key]);
    } catch (err) {
      // TODO error message.
      return;
    }
  }

  @VueEvent
  private async addTab() {
    await App.openSimpleWindow("chat-tab-add-window");
  }

  @VueEvent
  private async addLike() {
    await App.openSimpleWindow("like-add-window");
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

  @Watch("dragModeTab")
  private async onChangeDragModeTab() {
    const keyList: string[] = this.filteredChatTabList.map(ct => ct.key);
    if (this.dragModeTab) {
      let error: boolean = false;

      try {
        await this.chatTabListCC.touchModify(keyList);
      } catch (err) {
        error = true;
        await errorDialog({
          title: LanguageManager.instance.getText("message.error"),
          text: "Failure to get sceneAndLayerList's lock.\nPlease try again."
        });
      }

      if (error) {
        this.dragModeTabProcessed = true;
        this.dragModeTab = false;
        this.orderChangingKeyList = [];
      } else {
        this.orderChangingKeyList = keyList;
      }
    } else {
      this.orderChangingKeyList = [];
      if (!this.dragModeTabProcessed) {
        await this.chatTabListCC.releaseTouch(keyList);
        this.dragModeTabProcessed = false;
      }
    }
  }

  @Watch("dragModeLike")
  private async onChangeDragModeLike() {
    const keyList: string[] = this.filteredLikeList.map(ct => ct.key);
    if (this.dragModeLike) {
      let error: boolean = false;

      try {
        await this.likeListCC.touchModify(keyList);
      } catch (err) {
        error = true;
        await errorDialog({
          title: this.$t("message.error").toString(),
          text: "Failure to get likeList's lock.\nPlease try again."
        });
      }

      if (error) {
        this.dragModeLikeProcessed = true;
        this.dragModeLike = false;
        this.orderChangingKeyList = [];
      } else {
        this.orderChangingKeyList = keyList;
      }
    } else {
      this.orderChangingKeyList = [];
      if (!this.dragModeLikeProcessed) {
        await this.likeListCC.releaseTouch(keyList);
        this.dragModeLikeProcessed = false;
      }
    }
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (this.dragModeTab && !this.dragModeTabProcessed) {
      const keyList: string[] = this.filteredChatTabList.map(ct => ct.key);
      await this.chatTabListCC.releaseTouch(keyList);
      this.dragModeTabProcessed = false;
    }
    if (this.dragModeLike && !this.dragModeLikeProcessed) {
      const keyList: string[] = this.likeList.map(ct => ct.key);
      await this.likeListCC.releaseTouch(keyList);
      this.dragModeLikeProcessed = false;
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
  private async onSortEnd() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: { type: "special-drag", value: "off" as "off" }
    });
    this.changeOrderKey = "";
  }

  @VueEvent
  private async onSortOrderChangeTab() {
    await ChatSettingWindow.sortUpdate(
      this.filteredChatTabList,
      this.chatTabListCC
    );
  }

  @VueEvent
  private async onSortOrderChangeLike() {
    await ChatSettingWindow.sortUpdate(this.filteredLikeList, this.likeListCC);
  }

  private static async sortUpdate<T>(
    dataList: StoreData<T>[],
    cc: NekostoreCollectionController<T>
  ) {
    const keyOrderList = dataList.map(ct => ({
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

    const list: (Partial<StoreData<T>> & {
      key: string;
      continuous?: boolean;
    })[] = [];
    dataList.forEach((obj, index) => {
      if (!keyOrderList[index].target) return;
      const key = keyOrderList[index].key;
      const order = keyOrderList[index].order;
      const data = findRequireByKey(dataList, key).data!;
      list.push({
        key,
        order,
        data,
        continuous: true
      });
    });

    await cc.update(list);
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

.tab-container,
.like-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  background-color: white;
  overflow-y: scroll;
  border: solid 1px gray;
}

.draggable-box {
  display: contents;
}

.tab-info,
.like-info {
  @include flex-box(row, flex-start, center);
  position: relative;
  height: 2em;
  min-height: 2em;
  padding: 0 0.3rem;
  border-bottom: 1px dotted var(--uni-color-gray);
  box-sizing: border-box;
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

.sort-check {
  position: absolute;
  right: 0;
}
</style>
