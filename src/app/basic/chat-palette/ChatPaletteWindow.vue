<template>
  <div class="container" ref="window-container">
    <div class="send-line-block">
      <base-input
        type="text"
        :value="sendText"
        @input="sendText = $event.target.value"
        :class="{ pending: !sendText }"
      />

      <ctrl-button @click="sendLine()" :disabled="!sendText">
        <span v-t="'button.send'"></span>
      </ctrl-button>

      <ctrl-button @click="clearLine()" :disabled="!sendText">
        <span v-t="'button.clear'"></span>
      </ctrl-button>
    </div>
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="targetTabList"
      v-model="currentTargetTabInfo"
      :hasSetting="false"
    >
      {{ (_chatPalette = chatPaletteObj) && null }}
      <div class="chat-palette-box">
        <chat-palette-list-component
          :paletteText="_chatPalette.data.paletteText"
          @selectLine="selectLine"
          @sendLine="sendLine"
        />
      </div>
    </simple-tab-component>

    <div class="button-area">
      <ctrl-button @click="editChatPalette()" :disabled="!currentTargetTabInfo">
        <span v-t="'button.edit'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import { ChatPaletteStore } from "@/@types/gameObject";
import { CustomDiceBotInfo } from "@/@types/room";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import BaseInput from "../../core/component/BaseInput.vue";
import TableComponent from "../../core/component/table/TableComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";
import { StoreUseData } from "@/@types/store";
import TaskManager from "../../core/task/TaskManager";
import ChatPaletteListComponent from "./ChatPaletteListComponent.vue";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import GameObjectManager from "../GameObjectManager";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import { sendChatLog } from "../../core/utility/ChatUtility";
import { DataReference } from "@/@types/data";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: {
    SimpleTabComponent,
    ChatPaletteListComponent,
    BaseInput,
    TableComponent,
    CtrlButton
  }
})
export default class ChatPaletteWindow extends Mixins<WindowVue<number, never>>(
  WindowVue
) {
  // リスト/CC
  private chatPaletteListCC = SocketFacade.instance.chatPaletteListCC();
  private chatPaletteList = GameObjectManager.instance.chatPaletteList;
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private actorList = GameObjectManager.instance.actorList;

  // 画面入力を受ける変数
  private sendText: string = "";

  // クラス内向け
  private customDiceBotList: CustomDiceBotInfo[] = [];

  // DB項目
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private actorId: string | null = null;
  private sceneObjectId: string | null = null;
  private targetId: string | null = null;
  private outputTabId: string | null = null;
  private statusId: string | null = null;
  private system: string | null = null;
  private isSecret: boolean = false;

  @Watch("chatPaletteObj", { immediate: true, deep: true })
  private onChangeChatPaletteObj() {
    if (!this.chatPaletteObj) return;
    const chatPaletteData = this.chatPaletteObj.data!;

    this.chatFontColorType = chatPaletteData.chatFontColorType;
    this.chatFontColor = chatPaletteData.chatFontColor;
    this.actorId = chatPaletteData.actorId;
    this.sceneObjectId = chatPaletteData.sceneObjectId;
    this.targetId = chatPaletteData.targetId;
    this.outputTabId = chatPaletteData.outputTabId;
    this.statusId = chatPaletteData.statusId;
    this.system = chatPaletteData.system;
    this.isSecret = chatPaletteData.isSecret;
  }

  /*
   * tab controls
   */
  private targetTabList: TabInfo[] = [];
  private currentTargetTabInfo: TabInfo | null = null;

  @Watch("chatPaletteList", { immediate: true })
  private onChangeChatPaletteList() {
    this.targetTabList = this.chatPaletteList.map(cp => ({
      target: cp.id!,
      text: cp.data!.name
    }));
    const matchCurrent = this.currentTargetTabInfo
      ? this.targetTabList.find(
          tt => tt.target === this.currentTargetTabInfo!.target
        )
      : this.targetTabList[0];
    if (!this.currentTargetTabInfo || !matchCurrent) {
      this.currentTargetTabInfo = this.targetTabList[0];
    }
    console.log(JSON.stringify(this.currentTargetTabInfo, null, "  "));
  }

  @VueEvent
  private get chatPaletteObj(): StoreUseData<ChatPaletteStore> | undefined {
    return this.currentTargetTabInfo
      ? this.chatPaletteList.find(
          cp => cp.id === this.currentTargetTabInfo!.target
        )
      : undefined;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private async selectLine(line: string) {
    this.sendText = line;
  }

  @VueEvent
  private async clearLine() {
    this.sendText = "";
  }

  @VueEvent
  private async editChatPalette() {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, null>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chat-palette-edit-window",
        args: {
          type: "chat-palette",
          docId: this.currentTargetTabInfo!.target!.toString()
        }
      }
    });
  }

  @VueEvent
  private async sendLine() {
    await sendChatLog(
      {
        actorId: this.actorId,
        text: this.sendText.replace(/\\n/g, "\n"),
        tabId: this.outputTabId,
        statusId: this.statusId, // Actorに設定されているものを使う
        targetId: this.targetId,
        system: this.system,
        isSecret: this.isSecret
      },
      this.customDiceBotList
    );
    this.sendText = "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include inline-flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.send-line-block {
  @include flex-box(row, flex-start, center);

  > *:first-child {
    flex: 1;
  }
}

.simple-tab-component {
  flex: 1;
}

.chat-palette-box {
  @include inline-flex-box(column, stretch, flex-start);
  border: 1px solid gray;
  width: 100%;
  height: 100%;
}
</style>
