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
        <template v-for="(chat, idx) in useChatList">
          <chat-log-line-component
            :key="chat.id"
            :isExported="isExported"
            :isSelected="selectedChatId === chat.id"
            :isLast="idx === useChatList.length - 1"
            :chat="chat"
            :userList="userList"
            :likeList="likeList"
            :actorList="actorList"
            :groupChatTabList="groupChatTabList"
            :editedMessage="editedMessage"
            :userTypeLanguageMap="userTypeLanguageMap"
            @edit="id => $emit('edit', id)"
            @delete="id => $emit('delete', id)"
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
import { TabInfo, WindowInfo } from "@/@types/window";
import VueEvent from "../../../core/decorator/VueEvent";
import { StoreUseData } from "@/@types/store";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { UserType } from "@/@types/socket";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import App from "../../../../views/App.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";
import { findById, findRequireById } from "@/app/core/utility/Utility";
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
    default: () => [GameObjectManager.instance.mySelfUserId]
  })
  private targetUserIdList!: string[];

  @Prop({ type: Array, required: true })
  private userList!: StoreUseData<UserData>[];

  @Prop({ type: Array, required: true })
  private actorList!: StoreUseData<ActorStore>[];

  @Prop({ type: Array, required: true })
  private actorGroupList!: StoreUseData<ActorGroup>[];

  @Prop({ type: Array, required: true })
  private groupChatTabList!: StoreUseData<GroupChatTabInfo>[];

  @Prop({ type: Object, required: true })
  private userTypeLanguageMap!: { [type in UserType]: string };

  @Prop({ type: Array, required: true })
  private chatList!: StoreUseData<ChatInfo>[];

  @Prop({ type: Array, default: () => [] })
  private likeList!: StoreUseData<LikeStore>[];

  @Prop({ type: Array, required: true })
  private chatTabList!: StoreUseData<ChatTabInfo>[];

  private useChatList: StoreUseData<ChatInfo>[] = [];

  // tab controls
  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  private selectedChatId: string | null = null;

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
  private onSelect(chatId: string, isSelect: boolean) {
    if (this.isExported) return;
    this.selectedChatId = isSelect ? chatId : null;
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
        key: ct.id!,
        text: ct.data!.name,
        target: ct.id!
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
    const someActor = (id: string | null): boolean => {
      const actor = findById(this.actorList, id);
      if (!actor) return true;
      return this.targetUserIdList.some(id => id === actor.owner);
    };
    this.useChatList = this.chatList.filter(c => {
      if (c.data!.tabId !== this.currentTabInfo!.target) return false;
      if (!c.data!.isSecret) return true;
      if (someActor(c.data!.actorId)) return true;
      const targetId = c.data!.targetId;
      switch (c.data!.targetType) {
        case "group":
          const groupChatTab = findRequireById(this.groupChatTabList, targetId);
          const actorGroupId = groupChatTab.data!.actorGroupId;
          const actorGroup: StoreUseData<ActorGroup> = findRequireById(
            this.actorGroupList,
            actorGroupId
          );
          return actorGroup.data!.list.some(a =>
            this.targetUserIdList.some(id => id === a.userId)
          );
        case "actor":
          return someActor(targetId);
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
