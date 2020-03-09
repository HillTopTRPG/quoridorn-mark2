<template>
  <div class="container" ref="window-container">
    <!-- ログビューアー -->
    <chat-log-viewer :windowKey="windowKey" />

    <!-- 操作盤 -->
    <chat-operation-line
      :windowInfo="windowInfo"
      :actorId.sync="actorId"
      :statusId.sync="statusId"
      :system.sync="system"
      :bcdiceUrl.sync="bcdiceUrl"
    />

    <!-- 入力盤 -->
    <div class="chat-edit-container">
      <simple-tab-component
        class="edit-tab-component"
        :windowKey="windowKey"
        :tabList="targetTabList"
        v-model="currentTargetTabInfo"
        :hasSetting="true"
        @settingOpen="onSettingOpen()"
      >
        <div>
          <label class="chat-input-container">
            <textarea
              v-model="inputtingChatText"
              @input="onInputChat($event.target.value)"
              @keydown.up.self.stop="event => changeChatOption('up', event)"
              @keydown.down.self.stop="event => changeChatOption('down', event)"
              @keydown.esc.prevent="resetChatOption"
              @keypress.enter.prevent="event => sendMessage(event, true)"
              @keyup.enter.prevent="event => sendMessage(event, false)"
            ></textarea>
            <!--
              @blur="resetChatOption"
            -->
          </label>
        </div>
      </simple-tab-component>

      <!-- チャットオプションリスト -->
      <chat-option-selector
        v-if="chatOptionSelectMode !== 'none'"
        :title="chatOptionSelectMode"
        :list="chatOptionList"
        :max="chatOptionMax"
        v-model="chatOptionValue"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import WindowVue from "@/app/core/window/WindowVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { conversion, sendChatLog } from "@/app/core/Utility";
import VueEvent from "@/app/core/decorator/VueEvent";
import {
  ChatTabInfo,
  CustomDiceBotInfo,
  GroupChatTabInfo
} from "@/@types/room";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { TabInfo } from "@/@types/window";
import ChatOperationLine from "@/app/basic/chat/ChatOperationLine.vue";
import ChatLogViewer from "@/app/basic/chat/ChatLogViewer.vue";
import ChatOptionSelector from "@/app/basic/chat/ChatOptionSelector.vue";
import { StoreUseData } from "@/@types/store";
import { ActorStore } from "@/@types/gameObject";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";

@Component({
  components: {
    ChatOptionSelector,
    SimpleTabComponent,
    ChatOperationLine,
    ChatLogViewer
  }
})
export default class ChatWindow extends Mixins<WindowVue<void, void>>(
  WindowVue
) {
  // List
  private unitList:
    | { value: number; name: string; unit: string }[]
    | null = null;
  private chatList = GameObjectManager.instance.chatList;
  private actorList = GameObjectManager.instance.actorList;
  private selfActors = GameObjectManager.instance.selfActors;
  private chatTabList = GameObjectManager.instance.chatTabList;
  private outputTabList: StoreUseData<ChatTabInfo>[] = [];
  private actorGroupList = GameObjectManager.instance.actorGroupList;
  private chatFormatList = GameObjectManager.instance.chatFormatList;
  private chatFormatWrapList: StoreUseData<{ name: string }>[] = [];
  private groupChatTabList = GameObjectManager.instance.groupChatTabList;
  private customDiceBotList: CustomDiceBotInfo[] = [];

  // NekostoreCollectionController
  private actorCC = SocketFacade.instance.actorCC();

  /*
   * global info
   */
  private chatPublicInfo = GameObjectManager.instance.chatPublicInfo;
  /** チャット発言者 */
  private actorId: string = "";
  private isActorChanging: boolean = false;
  /** タブ */
  private tabId: string = "";
  /** 発言先 */
  private targetId: string = "";
  /** システム */
  private system: string = "DiceBot";
  /** BCDice-APIのURL */
  private bcdiceUrl: string = "";

  /*
   * local flags
   */
  /** 出力先タブ */
  private outputTabId: string | null = null;
  /** 発言に括弧をつけるかどうか */
  private addBrackets: boolean = false;
  /** ステータス */
  private statusId: string = "";
  /** 入力されたチャット文言を格納する変数 */
  private inputtingChatText: string = "";
  /** Enterを押しているかどうか */
  private enterPressing: boolean = false;

  /*
   * tab controls
   */
  private targetTabList: TabInfo[] = [];
  private currentTargetTabInfo: TabInfo | null = null;

  /*
   * チャットオプション系変数
   */
  /** チャットオプション入力モード */
  private chatOptionSelectMode:
    | "none" // 指定なし
    | "select-actor" // !
    | "select-tab" // #
    | "select-target" // @
    | "select-chat-format" = "none"; // $

  private chatOptionTitle: string | null = null;
  private chatOptionMax: number = 7;
  private chatOptionList: StoreUseData<any>[] | null = null;
  private chatOptionValue: string | null = null;

  /** 選択中のチャットフォーマット */
  private partsFormat: string = "";

  // チャットオプション用一時退避領域
  private volatileActorId: string | null = null;
  private volatileStatusId: string | null = null;
  private volatileTarget: string | null = null;
  private volatileActiveTab: string | null = null;
  private volatileTargetTab: string | null = null;

  /*
   * getters
   */
  private get targetList(): StoreUseData<GroupChatTabInfo | ActorStore>[] {
    return [...this.groupChatTabList, ...this.actorList];
  }

  private get useCommandActorList(): {
    actorId: string;
    statusId: string;
    name: string;
  }[] {
    const resultList: {
      actorId: string;
      statusId: string;
      name: string;
    }[] = [];
    GameObjectManager.instance.selfActors.forEach(actor => {
      GameObjectManager.instance.actorStatusList
        .filter(status => status.owner === actor.id)
        .forEach(status => {
          resultList.push({
            actorId: actor.id!,
            statusId: status.id!,
            name: `${actor.data!.name}-${status.data!.name}`
          });
        });
    });
    return resultList;
  }

  private get actorStatusId(): string {
    const status = GameObjectManager.instance.actorStatusList.filter(
      as => as.owner === this.actorId
    )[0];
    return status.id!;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @Watch("groupChatTabList", { immediate: true, deep: true })
  private onChangeGroupChatTabList() {
    this.targetTabList = this.groupChatTabList
      .filter(gct => permissionCheck(gct, "view"))
      .map(ct => ({
        text: ct.data!.name,
        target: ct.id!
      }));
    if (!this.currentTargetTabInfo)
      this.currentTargetTabInfo = this.targetTabList[0];
  }

  /*
   * PublicInfo更新検出
   */
  @Watch("chatPublicInfo.actorId", { immediate: true })
  private onChangeChatPublicActorId() {
    this.actorId = this.chatPublicInfo.actorId;
    this.setActorStatus();
  }

  @Watch("chatPublicInfo.tabId", { immediate: true })
  private onChangeChatPublicTabId() {
    this.tabId = this.chatPublicInfo.tabId;
  }

  @Watch("chatPublicInfo.targetId", { immediate: true })
  private onChangeChatPublicTargetId() {
    this.targetId = this.chatPublicInfo.targetId;
  }

  @Watch("chatPublicInfo.system", { immediate: true })
  private onChangeChatPublicSystem() {
    this.system = this.chatPublicInfo.system;
  }

  @Watch("chatPublicInfo.bcdiceUrl", { immediate: true })
  private onChangeChatPublicBcdiceUrl() {
    this.bcdiceUrl = this.chatPublicInfo.bcdiceUrl;
  }

  /*
   * PublicInfoに対応するローカル変数の変化の検出
   */
  @Watch("actorId")
  private onChangeActorId() {
    this.chatPublicInfo.actorId = this.actorId;
    this.setActorStatus();
  }

  @Watch("statusId")
  private async onChangeStatusId() {
    if (this.isActorChanging) {
      this.isActorChanging = false;
      return;
    }
    await this.updateActorStatus(this.statusId);
  }

  @Watch("tabId")
  private onChangeTabId() {
    this.chatPublicInfo.tabId = this.tabId;
  }

  @Watch("targetId")
  private onChangeTargetId() {
    this.chatPublicInfo.targetId = this.targetId;

    const groupChatTabInfo = this.groupChatTabList.filter(
      gct => gct.id === this.targetId
    )[0];
    if (groupChatTabInfo) {
      const outputChatTabId = groupChatTabInfo.data!.outputChatTabId;
      if (outputChatTabId) {
        this.tabId = outputChatTabId;
      }

      const actorGroupInfo = this.actorGroupList.filter(
        ag => ag.id === groupChatTabInfo.data!.actorGroupId
      )[0];

      let isMatchCurrentActor = false;
      let otherMatchActorId: string | null = null;
      actorGroupInfo.data!.list.forEach(actorRef => {
        if (isMatchCurrentActor) return;
        if (actorRef.id === GameObjectManager.instance.chatPublicInfo.actorId) {
          isMatchCurrentActor = true;
          return;
        }
        const actor = this.actorList.filter(a => a.id === actorRef.id)[0];
        if (
          actor.owner === GameObjectManager.instance.mySelfUserId &&
          !otherMatchActorId
        ) {
          otherMatchActorId = actor.id!;
        }
      });
      if (!isMatchCurrentActor && otherMatchActorId)
        this.actorId = otherMatchActorId;
      return;
    }
  }

  @Watch("system")
  private onChangeSystem() {
    this.chatPublicInfo.system = this.system;
  }

  @Watch("bcdiceUrl")
  private onChangeBcdiceUrl() {
    this.chatPublicInfo.bcdiceUrl = this.bcdiceUrl;
  }

  private setActorStatus() {
    this.isActorChanging = true;
    const actor = this.actorList.filter(a => a.id === this.actorId)[0];
    this.statusId = actor.data!.statusId;
  }

  @VueEvent
  private onInputChat(text: string) {
    const getIdByName = (
      text: string,
      list: StoreUseData<any>[],
      defaultId: string | null
    ): string | null => {
      if (text.length === 0) return defaultId;
      for (const item of list) {
        if (item.data!.name.startsWith(text)) {
          return item.id!;
        }
      }
      return null;
    };

    // コマンド（発言者選択）
    let actorId: string | null = null;
    if (text.startsWith("!") || text.startsWith("！")) {
      actorId = getIdByName(text.substring(1), this.selfActors, this.actorId);
    }

    // コマンド（グループチャット選択）
    let targetId: string | null = null;
    if (text.startsWith(">") || text.startsWith("＞")) {
      targetId = getIdByName(text.substring(1), this.targetList, this.targetId);
    }

    // コマンド（出力先タブ選択）
    let outputTabId: string | null | undefined = undefined;
    if (text.startsWith("#") || text.startsWith("＃")) {
      outputTabId = getIdByName(
        text.substring(1),
        this.outputTabList,
        this.outputTabId
      );
    }

    // コマンド（部分フォーマット）
    let partsFormat: string | null = null;
    if (text.endsWith("&") || text.endsWith("＆")) {
      partsFormat = getIdByName(
        text.substring(1),
        this.chatFormatWrapList,
        this.partsFormat
      );
    }

    if (actorId) {
      this.chatOptionList = this.selfActors;
      this.chatOptionValue = actorId;
      this.actorId = actorId;
      this.chatOptionSelectMode = "select-actor";
    } else if (targetId) {
      this.chatOptionList = this.targetList;
      this.chatOptionValue = targetId;
      this.targetId = targetId;
      this.chatOptionSelectMode = "select-target";
    } else if (outputTabId !== undefined) {
      this.chatOptionList = this.outputTabList;
      this.chatOptionValue = outputTabId;
      this.outputTabId = outputTabId;
      this.chatOptionSelectMode = "select-tab";
    } else if (partsFormat) {
      this.chatOptionList = this.chatFormatWrapList;
      this.chatOptionValue = partsFormat;
      this.partsFormat = partsFormat;
      this.chatOptionSelectMode = "select-chat-format";
    } else {
      this.chatOptionSelectMode = "none";
      // TODO 入力中であることをルームメイトに通達
    }

    // 単位変換機能
    this.unitList = null;
    const matchResult = text.match(/([-.０-９0-9]+) *(.+)/);
    if (matchResult) {
      // 全角の数字を半角数字に直して数値化
      const num: number = parseFloat(
        matchResult[1].replace(/[０-９]/g, (s: string) =>
          String.fromCharCode(s.charCodeAt(0) - 0xfee0)
        )
      );
      // 単位
      const unit: string = matchResult[2];

      window.console.log(num, unit, matchResult);

      this.unitList = conversion(num, unit) || this.unitList;
    }
  }

  /**
   * 上下キーを押下されてチャットオプションの選択項目を移動させる処理
   */
  @VueEvent
  private async changeChatOption(direction: string, event: any): Promise<void> {
    if (!this.chatOptionList) return;

    // 変化前の値を保存
    if (!this.volatileActorId) this.volatileActorId = this.actorId;
    if (!this.volatileStatusId) this.volatileStatusId = this.actorStatusId;
    if (!this.volatileTarget) this.volatileTarget = this.targetId;
    if (!this.volatileActiveTab) this.volatileActiveTab = this.tabId;
    if (!this.volatileTargetTab) this.volatileTargetTab = this.outputTabId;

    // カーソル移動と、移動後の輪転処理
    const getNextId = (): string => {
      event.preventDefault();
      let index = this.chatOptionList!.findIndex(
        co => co.id === this.chatOptionValue
      );
      index += direction === "up" ? -1 : 1;
      if (index < 0) index = this.chatOptionList!.length - 1;
      if (index === this.chatOptionList!.length) index = 0;
      const nextId = this.chatOptionList![index].id!;
      this.chatOptionValue = nextId;
      return nextId;
    };

    // 発言者の選択の場合
    if (this.chatOptionSelectMode === "select-actor")
      this.actorId = getNextId();

    // 発言先の選択の場合
    if (this.chatOptionSelectMode === "select-target")
      this.targetId = getNextId();

    // タブの選択の場合
    if (this.chatOptionSelectMode === "select-tab")
      this.outputTabId = getNextId();

    // チャットフォーマットの選択の場合
    if (this.chatOptionSelectMode === "select-chat-format")
      this.partsFormat = getNextId();
  }

  /**
   * チャットオプションを仮変更前の状態に戻す
   */
  @VueEvent
  private async resetChatOption(): Promise<void> {
    if (this.chatOptionSelectMode !== "none") {
      if (this.chatOptionSelectMode === "select-chat-format") {
        this.inputtingChatText = this.inputtingChatText.replace(/[&＆]$/, "");
      } else {
        this.inputtingChatText = "";
      }
      if (this.volatileActorId) this.actorId = this.volatileActorId;
      if (this.volatileStatusId) {
        await this.updateActorStatus(this.volatileStatusId);
      }
      if (this.volatileTarget) this.targetId = this.volatileTarget;
      if (this.volatileActiveTab) this.tabId = this.volatileActiveTab;
      if (this.volatileTargetTab) this.outputTabId = this.volatileTargetTab;
    }
    this.chatOptionSelectMode = "none";
    this.volatileActorId = null;
    this.volatileTarget = null;
    this.volatileStatusId = null;
    this.volatileActiveTab = null;
    this.volatileTargetTab = null;
  }

  // アクターステータスを切り替える
  private async updateActorStatus(statusId: string) {
    await this.actorCC.touchModify(this.actorId);
    const actorInfo = this.actorList.filter(a => a.id === this.actorId)[0];
    const actorData = actorInfo.data!;
    actorData.statusId = statusId;
    await this.actorCC.update(this.actorId, actorData);
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.updateOutputTabList();
    task.resolve();
  }

  private static createEmptyStoreUseData<T>(
    id: string | null,
    data: T
  ): StoreUseData<T> {
    return {
      id,
      order: -1,
      exclusionOwner: null,
      lastExclusionOwner: null,
      owner: null,
      data,
      permission: null,
      status: "added",
      createTime: new Date(),
      updateTime: null
    };
  }

  @Watch("chatTabList", { immediate: true, deep: true })
  private updateOutputTabList() {
    const outputTabList = this.chatTabList.concat();
    outputTabList.splice(
      0,
      0,
      ChatWindow.createEmptyStoreUseData<ChatTabInfo>(null, {
        name: LanguageManager.instance.getText(
          "chat-window.options.selected-item"
        ),
        isSystem: true
      })
    );
    this.outputTabList = outputTabList;
  }

  @Watch("chatFormatList", { immediate: true, deep: true })
  private updateChatFormatWrapList() {
    this.chatFormatWrapList = this.chatFormatList.map(cf =>
      ChatWindow.createEmptyStoreUseData<{ name: string }>(cf.chatText, {
        name: cf.label
      })
    );
  }

  @VueEvent
  private onSettingOpen() {
    window.console.log("## onSettingOpen");
    // TODO Open view tab setting.
  }

  /**
   * チャット欄に記入された内容をチャットに反映させる
   * @param event イベント
   * @param flg 押下ならtrue, 離す場合はfalse
   */
  @VueEvent
  private async sendMessage(event: any, flg: boolean): Promise<void> {
    if (this.enterPressing === flg) return;
    this.enterPressing = flg;
    if (!flg) return;
    if (event && event.shiftKey) {
      const textArea: HTMLTextAreaElement = event.target as HTMLTextAreaElement;
      const sentence = textArea.value;
      const pos = textArea.selectionStart;

      const before = sentence.substr(0, pos);
      const after = sentence.substr(pos, sentence.length);
      this.inputtingChatText = `${before}\n${after}`;
      setTimeout(() => {
        textArea.selectionStart = pos + 1;
        textArea.selectionEnd = pos + 1;
      });
      return;
    }
    if (this.inputtingChatText === "") return;

    // 単位を初期化
    this.unitList = null;

    // チャット送信オプション選択中のEnterは特別仕様
    if (this.chatOptionSelectMode !== "none") {
      if (this.chatOptionSelectMode === "select-chat-format") {
        const chatFormat: any = GameObjectManager.instance.chatFormatList.filter(
          (format: any) => format.label === this.partsFormat
        )[0];
        this.inputtingChatText =
          this.inputtingChatText.replace(/[&＆]$/, "") + chatFormat.chatText;
        this.partsFormat = GameObjectManager.instance.chatFormatList[0].label;
      } else {
        this.inputtingChatText = "";
      }
      this.chatOptionSelectMode = "none";
      this.volatileActorId = "";
      this.volatileStatusId = "";
      this.volatileTarget = "";
      this.volatileActiveTab = "";
      this.volatileTargetTab = "";
      return;
    }

    // 括弧をつけるオプション
    let text = this.inputtingChatText;
    if (this.addBrackets) {
      text = `「${text}」`;
    }
    this.inputtingChatText = "";

    await sendChatLog(
      {
        actorId: this.actorId,
        text,
        tabId: this.tabId,
        statusId: null, // Actorに設定されているものを使う
        targetId: this.targetId,
        system: this.system
      },
      this.customDiceBotList
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  width: 100%;
  height: 100%;
}

.chat-edit-container {
  @include flex-box(column, stretch, stretch);
  position: relative;
}

.edit-tab-component {
  @include flex-box(column, stretch, stretch);
  flex: 1;
}

.chat-input-container {
  @include flex-box(row, flex-start, stretch);
  height: 6em;
  border: 1px solid gray;
  margin-top: -1px;
}

textarea {
  flex: 1;
  padding: 0;
  border: none;
  font-size: inherit;
  overflow-y: auto;
  outline: none;
  line-height: 1.5em;
  resize: none;
}
</style>
