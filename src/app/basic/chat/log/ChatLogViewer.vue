<template>
  <div class="chat-view-container">
    <simple-tab-component
      :windowKey="windowInfo.key"
      :tabList="tabList"
      v-model="currentTabInfo"
      :hasSetting="true"
      @settingOpen="onSettingOpen()"
    >
      <div class="chat-line-container selectable" ref="chat-line-container">
        <template v-for="chat in chatList">
          <chat-log-line-component
            v-if="chat.data.tabId === currentTabInfo.target"
            :key="chat.id"
            :chat="chat"
            :userList="userList"
            :actorList="actorList"
            :groupChatTabList="groupChatTabList"
            :editedMessage="editedMessage"
            :userTypeLanguageMap="userTypeLanguageMap"
            @edit="id => $emit('edit', id)"
            @delete="id => $emit('delete', id)"
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
  ChatInfo,
  ChatTabInfo,
  GroupChatTabInfo,
  UserData
} from "@/@types/room";
import { ActorStore } from "@/@types/gameObject";
import { TabInfo, WindowInfo } from "@/@types/window";
import VueEvent from "../../../core/decorator/VueEvent";
import { StoreUseData } from "@/@types/store";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { UserType } from "@/@types/socket";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import App from "../../../../views/App.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component({
  components: {
    ChatLogLineComponent,
    SimpleTabComponent
  }
})
export default class ChatLogViewer extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  @Prop({ type: String, required: true })
  private editedMessage!: string;

  @Prop({ type: Array, required: true })
  private userList!: StoreUseData<UserData>[];

  @Prop({ type: Array, required: true })
  private actorList!: StoreUseData<ActorStore>[];

  @Prop({ type: Array, required: true })
  private groupChatTabList!: StoreUseData<GroupChatTabInfo>[];

  @Prop({ type: Object, required: true })
  private userTypeLanguageMap!: { [type in UserType]: string };

  @Prop({ type: Array, required: true })
  private chatList!: StoreUseData<ChatInfo>[];

  @Prop({ type: Array, required: true })
  private chatTabList!: StoreUseData<ChatTabInfo>[];

  // tab controls
  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  private lastLineLength: number = 0;

  @LifeCycle
  private mounted() {
    this.autoScrollEnd();
  }

  @LifeCycle
  private updated() {
    this.autoScrollEnd();
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
