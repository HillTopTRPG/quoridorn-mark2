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
      :hasSetting="true"
      @settingOpen="onSettingOpen()"
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
import { ChatPaletteStore, ResourceStore } from "@/@types/store-data";
import { CustomDiceBotInfo } from "@/@types/room";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import BaseInput from "../../core/component/BaseInput.vue";
import TableComponent from "../../core/component/table/TableComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";
import TaskManager from "../../core/task/TaskManager";
import ChatPaletteListComponent from "./ChatPaletteListComponent.vue";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import GameObjectManager from "../GameObjectManager";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import { sendChatLog } from "../../core/utility/ChatUtility";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import { findRequireByKey } from "@/app/core/utility/Utility";
import App from "@/views/App.vue";

const uuid = require("uuid");

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
  private chatPaletteList = GameObjectManager.instance.chatPaletteList;
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private userList = GameObjectManager.instance.userList;
  private actorList = GameObjectManager.instance.actorList;
  private resourceList = GameObjectManager.instance.resourceList;
  private resourceMasterList = GameObjectManager.instance.resourceMasterList;

  // 画面入力を受ける変数
  private sendText: string = "";

  // クラス内向け
  private customDiceBotList: CustomDiceBotInfo[] = [];

  // DB項目
  private chatFontColorType: "owner" | "original" = "owner";
  private chatFontColor: string = "#000000";
  private actorKey: string | null = null;
  private sceneObjectKey: string | null = null;
  private targetKey: string | null = null;
  private outputTabKey: string | null = null;
  private statusKey: string | null = null;
  private system: string | null = null;
  private isSecret: boolean = false;

  @Watch("chatPaletteObj", { immediate: true, deep: true })
  private onChangeChatPaletteObj() {
    if (!this.chatPaletteObj) return;
    const chatPaletteData = this.chatPaletteObj.data!;

    this.chatFontColorType = chatPaletteData.chatFontColorType;
    this.chatFontColor = chatPaletteData.chatFontColor;
    this.actorKey = chatPaletteData.actorKey;
    this.sceneObjectKey = chatPaletteData.sceneObjectKey;
    this.targetKey = chatPaletteData.targetKey;
    this.outputTabKey = chatPaletteData.outputTabKey;
    this.statusKey = chatPaletteData.statusKey;
    this.system = chatPaletteData.system;
    this.isSecret = chatPaletteData.isSecret;

    const userKey = this.chatPaletteObj.owner;
    if (userKey === SocketFacade.instance.userKey) {
      this.windowInfo.message = "";
    } else {
      const user = findRequireByKey(this.userList, userKey);
      const ownerLabel = this.$t("label.owner").toString();
      this.windowInfo.message = `${ownerLabel}：${user.data!.name}`;
    }
  }

  /*
   * tab controls
   */
  private targetTabList: TabInfo[] = [];
  private currentTargetTabInfo: TabInfo | null = null;

  @Watch("chatPaletteList", { immediate: true })
  private onChangeChatPaletteList() {
    this.targetTabList = this.chatPaletteList
      .filter(cp => permissionCheck(cp, "view"))
      .map(cp => ({
        key: uuid.v4(),
        target: cp.key,
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
  }

  @VueEvent
  private get chatPaletteObj(): StoreData<ChatPaletteStore> | undefined {
    return this.currentTargetTabInfo
      ? this.chatPaletteList.find(
          cp => cp.key === this.currentTargetTabInfo!.target
        )
      : undefined;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private async selectLine(line: string) {
    const refList: { [key: string]: string } = {};
    if (this.chatPaletteObj) {
      this.chatPaletteObj.data!.paletteText.split("\n").forEach(line => {
        const matchResult = line.match(/^\s*\/\/([^=]+)=(.+)$/);
        if (matchResult) refList[matchResult[1]] = matchResult[2];
      });
    }
    const refReplace = (l: string): string =>
      l.replace(/{([^}]+)}/g, (match: string, p1: string) => {
        const refValue = refList[p1];
        if (refValue) {
          return refValue.match(/{[^}]+}/) ? refReplace(refValue) : refValue;
        }

        const splitted = p1.split(".");
        const label = splitted.length === 1 ? splitted[0] : splitted[1];
        const sceneObjectName = splitted.length === 1 ? null : splitted[0];
        const actorKey: string =
          this.actorKey || GameObjectManager.instance.chatPublicInfo.actorKey;
        const actor = findRequireByKey(this.actorList, actorKey);
        const sceneObject = this.sceneObjectList.find(
          so =>
            so.data!.actorKey === actorKey && so.data!.name === sceneObjectName
        );
        const sceneObjectKey = sceneObject
          ? sceneObject.key
          : this.sceneObjectKey;

        // リソース名で検索
        const resourceMaster = this.resourceMasterList.find(
          rm => rm.data!.label === label
        );
        if (resourceMaster) {
          const filteredList: StoreUseData<
            ResourceStore
          >[] = this.resourceList.filter(
            r => r.data!.resourceMasterKey === resourceMaster.key
          );

          if (sceneObjectKey) {
            // コマまで指定されている場合はコマのリソースを優先して検索する
            let resource = filteredList.find(f => {
              if (f.ownerType === "actor-list") return false;
              return f.owner === sceneObjectKey;
            });
            if (resource) return resource.data!.value;

            // コマで見つからない場合はアクターで検索
            resource = filteredList.find(f => {
              if (f.ownerType !== "actor-list") return false;
              return f.owner === actorKey;
            });
            if (resource) return resource.data!.value;
          } else {
            // コマが指定されていない場合はアクターのリソースを優先して検索する
            let resource = filteredList.find(f => {
              if (f.ownerType !== "actor-list") return false;
              return f.owner === actorKey;
            });
            if (resource) return resource.data!.value;

            // アクターのリソースが見つからない場合はコマのリソースを検索する
            resource = filteredList.find(f => {
              if (f.ownerType === "actor-list") return false;
              return actor.data!.pieceKeyList.some(
                pieceKey => pieceKey === f.owner
              );
            });
            if (resource) return resource.data!.value;
          }
        }
        return match;
      });
    this.sendText = refReplace(line);
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
          key: this.currentTargetTabInfo!.target!.toString()
        }
      }
    });
  }

  @VueEvent
  private async sendLine() {
    await sendChatLog(
      {
        actorKey:
          this.actorKey || GameObjectManager.instance.chatPublicInfo.actorKey,
        text: this.sendText.replace(/\\n/g, "\n"),
        tabKey: this.outputTabKey,
        statusKey: this.statusKey, // Actorに設定されているものを使う
        targetKey: this.targetKey,
        system: this.system,
        isSecret: this.isSecret
      },
      this.customDiceBotList
    );
    this.sendText = "";
  }

  @VueEvent
  private async onSettingOpen() {
    await App.openSimpleWindow("chat-palette-tab-setting-window");
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
  margin-bottom: 0.5rem;

  > *:first-child {
    flex: 1;
  }
}

.simple-tab-component {
  flex: 1;
  position: relative;
  height: calc(100% - 4em - 1rem);
}

.chat-palette-box {
  @include inline-flex-box(column, stretch, flex-start);
  border: 1px solid gray;
  width: 100%;
  max-height: calc(100% - 2em);
  flex: 1;
}
</style>
