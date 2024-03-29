<template>
  <div class="container" ref="window-container">
    <div class="user-area">
      <label>
        <span class="label-input" v-t="'label.owner'"></span>
        <user-select :isUseAll="true" v-model="userKey" />
      </label>
    </div>
    <label class="view-type-select">
      <span class="label-input" v-t="'label.view-type'"></span>
      <player-box-view-type-radio v-model="viewType" />
      <base-input
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
              :key="actor.key"
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
                    labelName="label.chat-font-color"
                    :readonly="true"
                    :actorType="actor.data.type"
                    :type.sync="actor.data.chatFontColorType"
                    :color.sync="actor.data.chatFontColor"
                  />
                </tr>
                <!-- 立ち絵位置 -->
                <tr>
                  <tr-range-component
                    labelName="label.stand-image-position"
                    :min="1"
                    :max="12"
                    :readonly="true"
                    v-model="actor.data.standImagePosition"
                  />
                </tr>
                <!-- ステータス -->
                <tr>
                  <tr-actor-status-select-component
                    labelName="label.status"
                    :readonly="true"
                    :actorKey="actor.key"
                    v-model="actor.data.statusKey"
                  />
                </tr>
              </table>

              <div class="last-line piece-list-container">
                <template v-for="sceneObject in getSceneObjectList(actor)">
                  <map-mask-piece-component
                    v-if="sceneObject.data.type === 'map-mask'"
                    :key="sceneObject.key"
                    :docKey="sceneObject.key"
                    type="map-mask"
                  />

                  <chit-piece-component
                    v-if="sceneObject.data.type === 'chit'"
                    :key="sceneObject.key"
                    :docKey="sceneObject.key"
                    type="chit"
                  />

                  <character-piece-component
                    v-if="sceneObject.data.type === 'character'"
                    :key="sceneObject.key"
                    :docKey="sceneObject.key"
                    type="character"
                  />

                  <map-marker-piece-component
                    v-if="sceneObject.data.type === 'map-marker'"
                    :key="sceneObject.key"
                    :docKey="sceneObject.key"
                    type="map-marker"
                  />
                </template>
              </div>
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
import { Task, TaskResult } from "task";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import { ActorStore } from "@/@types/store-data";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import VueEvent from "../../../core/decorator/VueEvent";
import TaskManager from "../../../core/task/TaskManager";
import WindowVue from "../../../core/window/WindowVue";
import GameObjectManager from "../../GameObjectManager";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import LanguageManager from "../../../../LanguageManager";
import UserSelect from "../../common/components/select/UserSelect.vue";
import PlayerBoxViewTypeRadio from "../../common/components/radio/PlayerBoxViewTypeRadio.vue";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import SButton from "../../common/components/SButton.vue";
import TrChatColorInputComponent from "../../common/components/table-item/TrChatColorInputComponent.vue";
import TrRangeComponent from "../../common/components/table-item/TrRangeComponent.vue";
import TrActorStatusSelectComponent from "../../common/components/table-item/TrActorStatusSelectComponent.vue";
import MapMaskPieceComponent from "../map-mask/MapMaskPieceComponent.vue";
import ChitPieceComponent from "../chit/ChitPieceComponent.vue";
import CharacterPieceComponent from "../character/CharacterPieceComponent.vue";
import { findRequireByKey, questionDialog } from "@/app/core/utility/Utility";
import App from "../../../../views/App.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import MapMarkerPieceComponent from "@/app/basic/object/map-marker/MapMarkerPieceComponent.vue";

@Component({
  components: {
    MapMarkerPieceComponent,
    BaseInput,
    CharacterPieceComponent,
    ChitPieceComponent,
    MapMaskPieceComponent,
    TrActorStatusSelectComponent,
    TrRangeComponent,
    TrChatColorInputComponent,
    SButton,
    SimpleTabComponent,
    PlayerBoxViewTypeRadio,
    UserSelect
  }
})
export default class PlayerBoxWindow extends Mixins<WindowVue<string, never>>(
  WindowVue
) {
  private userKey = SocketFacade.instance.userKey;
  private userList = GameObjectManager.instance.userList;
  private actorCC = SocketFacade.instance.actorCC();
  private actorList = GameObjectManager.instance.actorList;
  private viewType: "actor" | "piece" = "actor";
  private searchText: string = "";
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private sceneAndObjectList = GameObjectManager.instance.sceneAndObjectList;

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
      return a.owner === SocketFacade.instance.userKey;
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
      return a.owner === SocketFacade.instance.userKey;
    });
  }

  @VueEvent
  private getSceneObjectList(actor: StoreUseData<ActorStore>) {
    const sceneKey = GameObjectManager.instance.roomData.sceneKey;
    return this.sceneAndObjectList
      .filter(
        sao =>
          sao.data!.sceneKey === sceneKey &&
          actor.data!.pieceKeyList.some(p => p === sao.data!.objectKey)
      )
      .map(sao => findRequireByKey(this.sceneObjectList, sao.data!.objectKey))
      .filter(so => so.data!.place === "field");
  }

  @VueEvent
  private getOwnerType(userKey: string): string {
    const user = findRequireByKey(this.userList, userKey);
    return this.$t(
      `selection.user-type.${user.data!.type}`.toLowerCase()
    )!.toString();
  }

  @VueEvent
  private getOwnerName(userKey: string): string {
    return GameObjectManager.instance.getUserName(userKey);
  }

  private actorTabList: TabInfo[] = [
    { key: "1", target: "actor", text: "", isDisabled: false },
    { key: "2", target: "piece", text: "", isDisabled: false }
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
        (tag: string, index: number, list: string[]) =>
          list.indexOf(tag) === index
      )
      .map((tag, index) => ({
        key: index.toString(),
        target: tag,
        text: tag || this.$t("label.non-tag")!.toString(),
        isDisabled: false
      }));
    const index = this.currentActorTabInfo
      ? this.actorTabList.findIndex(
          at =>
            at.text === this.currentActorTabInfo!.text &&
            at.target === this.currentActorTabInfo!.target
        )
      : -1;
    if (index === -1) {
      this.currentActorTabInfo = this.actorTabList[0];
    }
  }

  @VueEvent
  private async addActor() {
    await App.openSimpleWindow("actor-add-window");
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
          type: "actor-list",
          key: actor.key
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
          type: actor.collection,
          key: actor.key
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
    const text = PlayerBoxWindow.getDialogMessage("delete-actor").replace(
      "$1",
      actor.data!.name
    );
    const confirm = await questionDialog({
      title: this.$t("button.delete").toString(),
      text,
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;

    try {
      await this.actorCC.deletePackage([actor.key]);
    } catch (err) {
      // TODO error message.
      return;
    }
  }

  private static getDialogMessage(target: string) {
    const msgTarget = "player-box-window.dialog." + target;
    return LanguageManager.instance.getText(msgTarget);
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t(`chat-setting-window.message-list.${messageType}`)!.toString()
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
  @include inline-flex-box(row, flex-start, center, wrap);
}

.view-type-select {
  @include inline-flex-box(row, flex-start, center);
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
  align-self: stretch;
}

.view-area {
  @include flex-box(column, stretch, flex-start);
  height: calc(100% - 4em - 0.5rem);
}

.simple-tab-component {
  height: 100%;
  box-sizing: border-box;
}

.tab-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  border: 1px solid gray;
  box-sizing: border-box;
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

.piece-list-container {
  @include inline-flex-box(row, space-between, center);
  position: relative;

  > * {
    position: relative;
    margin-top: 1.5em;
    width: 50px !important;
    height: 50px !important;
    transform: none !important;
  }
}
</style>
