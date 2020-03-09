<template>
  <div class="chat-view-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
      :hasSetting="true"
      @settingOpen="onSettingOpen()"
    >
      <div class="chat-line-container selectable">
        <div v-for="chat in chatList" :key="chat.id" class="chat-line">
          <span v-html="transText(chat.data.text)"></span>
        </div>
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";
import { transText } from "@/app/core/Utility";
import { TabInfo } from "@/@types/window";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({
  components: {
    SimpleTabComponent
  }
})
export default class ChatLogViewer extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  private chatTabList = GameObjectManager.instance.chatTabList;
  private chatList = GameObjectManager.instance.chatList;

  // tab controls
  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  @Watch("chatTabList", { immediate: true, deep: true })
  private onChangeChatTabList() {
    this.tabList = this.chatTabList
      .filter(ct => permissionCheck(ct, "view"))
      .map(ct => ({
        text: ct.data!.name,
        target: ct.id!
      }));
    if (!this.currentTabInfo) this.currentTabInfo = this.tabList[0];
  }

  @VueEvent
  private transText(raw: string): string {
    return transText(raw);
  }

  @VueEvent
  private onSettingOpen() {
    window.console.log("## onSettingOpen");
    // TODO Open view tab setting.
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.chat-view-container {
  @include flex-box(column, stretch, stretch);
  flex: 1;
  z-index: 0;
}

.chat-line-container {
  flex: 1;
  border: 1px solid gray;
  margin-top: -1px;
  z-index: 0;
  background-color: white;
  overflow-y: scroll;
  box-sizing: content-box;
  margin-bottom: 0.5rem;
}

.simple-tab-component {
  flex: 1;
  @include flex-box(column, stretch, stretch);
}

.chat-line {
  min-height: 2em;
  line-height: 2em;
}
</style>
