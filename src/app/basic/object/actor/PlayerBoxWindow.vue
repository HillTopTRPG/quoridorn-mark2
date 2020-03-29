<template>
  <div class="container" ref="window-container">
    <div class="user-area">
      <label>
        <span class="label-input" v-t="'label.owner'"></span>
        <user-select :isUseAll="true" v-model="userId" />
      </label>
    </div>
    <label class="view-type-select">
      <span class="label-input" v-t="'label.view-type'"></span>
      <player-box-view-type-radio v-model="viewType" />
      <input
        type="text"
        class="search-input"
        :value="searchText"
        @input="searchText = $event.target.value"
        :placeholder="$t('label.search-name-box')"
        @keydown.enter.prevent.stop
        @keyup.enter.prevent.stop
        @keydown.229.prevent.stop
        @keyup.229.prevent.stop
      />
    </label>
    <div class="view-area">
      <!-- アクター -->
      <template v-if="viewType === 'actor'">
        <simple-tab-component
          class="tab-component"
          :windowKey="windowKey"
          :tabList="actorTabList"
          v-model="currentActorTabInfo"
          :hasSetting="false"
        >
          <div class="tab-container">
            <div
              class="actor-info"
              v-for="actor in tabbedOwnerActorList"
              :key="actor.id"
              :class="[actor.data.type]"
            >
              <div class="first-line">
                <span class="name">
                  <span>{{ actor.data.name }}</span>
                  <span class="user-type" v-if="actor.data.type === 'user'">{{
                    getOwnerType(actor.owner)
                  }}</span>
                </span>
                <span class="owner" v-if="actor.data.type !== 'user'">
                  {{ getOwnerName(actor.owner) }}
                </span>
                <s-button
                  icon="pencil"
                  colorStyle="pink"
                  :disabled="!isEditable(actor)"
                  @hover="value => onHover('edit', value)"
                  @click="editActor(actor)"
                />
                <s-button
                  icon="user-tie"
                  colorStyle="pink"
                  :disabled="!isChmodAble(actor)"
                  @hover="value => onHover('chmod', value)"
                  @click="chmodActor(actor)"
                />
                <s-button
                  icon="bin"
                  colorStyle="pink"
                  :disabled="actor.data.type === 'user' || !isDeletable(actor)"
                  @hover="value => onHover('delete', value)"
                  @click="deleteActor(actor)"
                />
              </div>

              <table class="info-table">
                <!-- チャット文字色 -->
                <tr>
                  <tr-chat-color-input-component
                    labelName="chat-font-color"
                    :readonly="true"
                    :type.sync="actor.data.chatFontColorType"
                    :color.sync="actor.data.chatFontColor"
                  />
                </tr>
                <!-- 立ち絵位置 -->
                <tr>
                  <tr-range-component
                    labelName="stand-image-position"
                    :min="1"
                    :max="12"
                    :readonly="true"
                    v-model="actor.data.standImagePosition"
                  />
                </tr>
                <!-- データの有無 -->
                <tr>
                  <tr-checkbox-component
                    labelName="has-data"
                    :readonly="true"
                    :cLabel="$t('label.exist')"
                    :nLabel="$t('label.not-exist')"
                    v-model="actor.data.isUseTableData"
                  />
                </tr>
                <!-- ステータス -->
                <tr>
                  <tr-actor-status-select-component
                    labelName="status"
                    :readonly="true"
                    :actorId="actor.id"
                    v-model="actor.data.statusId"
                  />
                </tr>
              </table>
            </div>
          </div>
        </simple-tab-component>
      </template>

      <!-- コマ -->
      <template v-if="viewType === 'piece'"> </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import UserSelect from "@/app/basic/common/components/select/UserSelect.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import { ActorStore } from "@/@types/gameObject";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import LanguageManager from "@/LanguageManager";
import ActorSelect from "@/app/basic/common/components/select/ActorSelect.vue";
import ChatColorTypeSelect from "@/app/basic/common/components/select/ChatColorTypeSelect.vue";
import PlayerBoxViewTypeRadio from "@/app/basic/common/components/radio/PlayerBoxViewTypeRadio.vue";
import RangeComponent from "@/app/basic/common/components/RangeComponent.vue";
import SButton from "@/app/basic/common/components/SButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import { DataReference } from "@/@types/data";
import SCheck from "@/app/basic/common/components/SCheck.vue";
import TrCheckboxComponent from "@/app/basic/common/components/TrCheckboxComponent.vue";
import TrRangeComponent from "@/app/basic/common/components/TrRangeComponent.vue";
import TrColorPickerComponent from "@/app/basic/common/components/TrColorPickerComponent.vue";
import TrChatColorInputComponent from "@/app/basic/common/components/TrChatColorInputComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import TrActorStatusSelectComponent from "@/app/basic/common/components/TrActorStatusSelectComponent.vue";

@Component({
  components: {
    TrActorStatusSelectComponent,
    BaseInput,
    TrChatColorInputComponent,
    TrColorPickerComponent,
    TrRangeComponent,
    TrCheckboxComponent,
    SCheck,
    SButton,
    RangeComponent,
    PlayerBoxViewTypeRadio,
    ChatColorTypeSelect,
    ActorSelect,
    SimpleTabComponent,
    UserSelect,
    ColorPickerComponent
  }
})
export default class PlayerBoxWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private userList = GameObjectManager.instance.userList;
  private actorCC = SocketFacade.instance.actorCC();
  private actorList = GameObjectManager.instance.actorList;
  private userId: string = GameObjectManager.instance.mySelfUserId;
  private viewType: "actor" | "piece" = "actor";
  private searchText: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private get ownerActorList(): StoreUseData<ActorStore>[] {
    return this.actorList.filter(a => {
      if (!permissionCheck(a, "view")) return false;

      if (this.searchText) {
        const name = a.data!.name;
        const regExp = new RegExp(this.searchText);
        if (!name.match(regExp)) return false;
      }
      return !(this.userId && a.owner !== this.userId);
    });
  }

  @VueEvent
  private get tabbedOwnerActorList(): StoreUseData<ActorStore>[] {
    return this.actorList.filter(a => {
      if (!permissionCheck(a, "view")) return false;

      if (this.searchText) {
        const name = a.data!.name;
        const regExp = new RegExp(this.searchText);
        if (!name.match(regExp)) return false;
      }
      if (
        this.currentActorTabInfo &&
        a.data!.tag !== this.currentActorTabInfo.target
      ) {
        return false;
      }
      return !(this.userId && a.owner !== this.userId);
    });
  }

  @VueEvent
  private getOwnerType(userId: string): string {
    const user = this.userList.filter(u => u.id === userId)[0];
    return this.$t(`label.${user.data!.type}`)!.toString();
  }

  @VueEvent
  private getOwnerName(userId: string): string {
    return GameObjectManager.instance.getUserName(userId);
  }

  private actorTabList: TabInfo[] = [
    { target: "actor", text: "" },
    { target: "piece", text: "" }
  ];
  private currentActorTabInfo: TabInfo | null = this.actorTabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createActorTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createActorTabInfoList();
  }

  @Watch("ownerActorList", { deep: true })
  private createActorTabInfoList() {
    this.actorTabList = this.ownerActorList
      .map(a => a.data!.tag)
      .filter(
        (tag: string, idx: number, list: string[]) => list.indexOf(tag) === idx
      )
      .map(tag => ({
        target: tag,
        text: tag || this.$t("label.non-tag")!.toString()
      }));
    const idx = this.currentActorTabInfo
      ? this.actorTabList.findIndex(
          at =>
            at.text === this.currentActorTabInfo!.text &&
            at.target === this.currentActorTabInfo!.target
        )
      : -1;
    if (idx === -1) {
      this.currentActorTabInfo = this.actorTabList[0];
    }
  }

  @VueEvent
  private async addActor() {
    await TaskManager.instance.ignition<WindowOpenInfo<void>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "actor-add-window"
      }
    });
  }

  @VueEvent
  private isEditable(tabInfo: StoreUseData<ActorStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async editActor(actor: StoreUseData<ActorStore>) {
    if (!this.isEditable(actor)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "actor-edit-window",
        args: {
          type: "actor",
          docId: actor.id!
        }
      }
    });
  }

  @VueEvent
  private isChmodAble(tabInfo: StoreUseData<ActorStore>) {
    return permissionCheck(tabInfo, "chmod");
  }

  @VueEvent
  private async chmodActor(actor: StoreUseData<ActorStore>) {
    if (!this.isChmodAble(actor)) return;

    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: "actor",
          docId: actor.id!
        }
      }
    });
  }

  @VueEvent
  private isDeletable(tabInfo: StoreUseData<ActorStore>) {
    return permissionCheck(tabInfo, "edit");
  }

  @VueEvent
  private async deleteActor(actor: StoreUseData<ActorStore>) {
    if (!this.isDeletable(actor)) return;
    const msg = PlayerBoxWindow.getDialogMessage("delete-actor").replace(
      "$1",
      actor.data!.name
    );
    const result = window.confirm(msg);
    if (!result) return;

    try {
      await this.actorCC.touchModify([actor.id!]);
    } catch (err) {
      // TODO error message.
      return;
    }
    await this.actorCC.delete([actor.id!]);
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "player-box-window.dialog." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? LanguageManager.instance.getText(
          `chat-tab-list-window.message-list.${messageType}`
        )
      : "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(column, flex-start, flex-start);
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.user-area {
  @include flex-box(row, flex-start, center, wrap);
}

.tab-component {
  @include flex-box(column, stretch, flex-start);
  align-self: stretch;
  flex: 1;
}

.view-type-select {
  @include flex-box(row, flex-start, center);
  margin-top: 0.5rem;
  align-self: stretch;
}

.search-input {
  height: 2em;
  flex: 1;
  margin-left: 1rem;
}

.view-area,
.tab-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  align-self: stretch;
}

.tab-container {
  border: 1px solid gray;
  overflow-y: scroll;
  background-color: var(--uni-color-white);
  margin-top: -1px;
}

.actor-info {
  @include flex-box(column, flex-start, flex-start);
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 0.5rem;
  border-bottom: 1px dashed gray;

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }

  /*
  &.user {
    background-color: var(--uni-color-cream);
  }

  &.character {
    background-color: var(--uni-color-white);
  }
  */
}

.first-line {
  @include flex-box(row, flex-start, center);
  font-weight: bold;
}

.name {
  font-size: 120%;
}

.user-type {
  &:before {
    content: "(";
  }
  &:after {
    content: ")";
  }
}

.owner {
  font-weight: normal;
  color: gray;
  border: 1px solid gray;
  border-radius: 0.3rem;
  padding: 0 0.3rem;
  margin-left: 0.5rem;
}

.param {
  @include flex-box(row, flex-start, center);
  margin-left: 1rem;
}

.info-table {
  margin-left: 1.5rem;
}
</style>
