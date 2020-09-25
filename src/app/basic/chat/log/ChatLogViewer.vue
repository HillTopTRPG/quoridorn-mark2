<template>
  <div class="chat-view-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
      :hasSetting="!isExported"
      @settingOpen="onSettingOpen()"
    >
      <div class="chat-line-container selectable" ref="chat-line-container">
        <template v-for="(chat, index) in useChatList">
          <chat-log-line-component
            :key="chat.key"
            :isExported="isExported"
            :isSelected="selectedChatKey === chat.key"
            :isLast="index === useChatList.length - 1"
            :chat="chat"
            :userList="userList"
            :likeList="likeList"
            :actorList="actorList"
            :groupChatTabList="groupChatTabList"
            :editedMessage="editedMessage"
            :userTypeLanguageMap="userTypeLanguageMap"
            @edit="key => $emit('edit', key)"
            @delete="key => $emit('delete', key)"
            @select="onSelect"
            @like="onLike"
          />
        </template>
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ChatLogLineComponent from "./ChatLogLineComponent.vue";
import ComponentVue from "../../../core/window/ComponentVue";
import {
  ActorGroup,
  ChatInfo,
  ChatTabInfo,
  GroupChatTabInfo,
  UserData
} from "@/@types/room";
import { ActorStore, LikeStore } from "@/@types/gameObject";
import { TabInfo } from "@/@types/window";
import VueEvent from "../../../core/decorator/VueEvent";
import { StoreObj } from "@/@types/store";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { UserType } from "@/@types/socket";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import App from "../../../../views/App.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";
import { findByKey, findRequireByKey } from "@/app/core/utility/Utility";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({
  components: {
    ChatLogLineComponent,
    SimpleTabComponent
  }
})
export default class ChatLogViewer extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Boolean, default: false })
  private isExported!: boolean;

  @Prop({ type: String, required: true })
  private editedMessage!: string;

  @Prop({
    type: Array,
    default: () => [GameObjectManager.instance.mySelfUserKey]
  })
  private targetUserKeyList!: string[];

  @Prop({ type: Array, required: true })
  private userList!: StoreObj<UserData>[];

  @Prop({ type: Array, required: true })
  private actorList!: StoreObj<ActorStore>[];

  @Prop({ type: Array, required: true })
  private actorGroupList!: StoreObj<ActorGroup>[];

  @Prop({ type: Array, required: true })
  private groupChatTabList!: StoreObj<GroupChatTabInfo>[];

  @Prop({ type: Object, required: true })
  private userTypeLanguageMap!: { [type in UserType]: string };

  @Prop({ type: Array, required: true })
  private chatList!: StoreObj<ChatInfo>[];

  @Prop({ type: Array, default: () => [] })
  private likeList!: StoreObj<LikeStore>[];

  @Prop({ type: Array, required: true })
  private chatTabList!: StoreObj<ChatTabInfo>[];

  private useChatList: StoreObj<ChatInfo>[] = [];

  // tab controls
  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  private selectedChatKey: string | null = null;

  private lastLineLength: number = 0;

  @LifeCycle
  private mounted() {
    this.autoScrollEnd();
  }

  @LifeCycle
  private updated() {
    this.autoScrollEnd();
  }

  @VueEvent
  private onSelect(chatKey: string, isSelect: boolean) {
    if (this.isExported) return;
    this.selectedChatKey = isSelect ? chatKey : null;
  }

  @VueEvent
  private onLike() {
    if (this.isExported) return;
    this.$emit("like", ...arguments);
  }

  private autoScrollEnd() {
    const elm = this.$refs["chat-line-container"] as HTMLElement;
    if (this.lastLineLength < this.chatList.length) {
      if (elm) {
        // 入室直後はsetTimeoutしないと反映されない
        setTimeout(() => {
          elm.scroll(0, elm.scrollHeight);
        });
      }
    }
    this.lastLineLength = this.chatList.length;
  }

  @Watch("currentTabInfo")
  private onChangeCurrentTabInfo() {
    this.$emit("changeTab", this.currentTabInfo!.target);
  }

  @Watch("chatTabList", { immediate: true, deep: true })
  private onChangeChatTabList() {
    this.tabList = this.chatTabList
      .filter(ct => permissionCheck(ct, "view"))
      .map(ct => ({
        key: ct.key,
        text: ct.data!.name,
        target: ct.key
      }));
    if (
      !this.currentTabInfo ||
      JSON.stringify(this.tabList[0]) !== JSON.stringify(this.currentTabInfo)
    ) {
      this.currentTabInfo = this.tabList[0];
    }
  }

  @Watch("chatList", { immediate: true, deep: true })
  @Watch("currentTabInfo")
  private onChangeChatListImmediateDeep() {
    console.log("onChangeChatListImmediateDeep");
    listToEmpty(this.useChatList);
    const someActor = (key: string | null): boolean => {
      const actor = findByKey(this.actorList, key);
      if (!actor) return true;
      return this.targetUserKeyList.some(key => key === actor.owner);
    };
    this.useChatList = this.chatList.filter(c => {
      if (c.data!.tabKey !== this.currentTabInfo!.target) return false;
      if (!c.data!.isSecret) return true;
      if (someActor(c.data!.actorKey)) return true;
      const targetKey = c.data!.targetKey;
      switch (c.data!.targetType) {
        case "group":
          const groupChatTab = findRequireByKey(
            this.groupChatTabList,
            targetKey
          );
          const actorGroupKey = groupChatTab.data!.actorGroupKey;
          const actorGroup: StoreObj<ActorGroup> = findRequireByKey(
            this.actorGroupList,
            actorGroupKey
          );
          return actorGroup.data!.list.some(a =>
            this.targetUserKeyList.some(key => key === a.userKey)
          );
        case "actor":
          return someActor(targetKey);
        default:
          return true;
      }
    });
  }

  @VueEvent
  private async onSettingOpen() {
    await App.openSimpleWindow("chat-setting-window");
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chat-view-container {
  @include flex-box(column, stretch, stretch);
  flex: 1;
  z-index: 0;
}

.chat-line-container {
  @include flex-box(column, stretch, flex-start);
  flex: 1;
  border: 1px solid gray;
  margin-top: -1px;
  z-index: 0;
  background-color: white;
  overflow-y: scroll;
  box-sizing: content-box;
}

.simple-tab-component {
  @include flex-box(column, stretch, flex-start);
  height: 100%;
}
</style>
