<template>
  <div class="container" ref="window-container">
    <!-- ログビューアー -->
    <chat-log-viewer
      class="chat-log-viewer"
      :windowKey="windowInfo.key"
      :editedMessage="editedMessage"
      :userTypeLanguageMap="userTypeLanguageMap"
      :chatList="chatList"
      :userList="userList"
      :likeList="likeList"
      :actorList="actorList"
      :actorGroupList="actorGroupList"
      :chatTabList="chatTabList"
      :groupChatTabList="groupChatTabList"
      @edit="editChat"
      @delete="deleteChat"
      @changeTab="value => (tabKey = value)"
      @like="onLike"
    />

    <!-- 操作盤 -->
    <chat-operation-line
      class="chat-operation-line"
      :windowInfo="windowInfo"
      :actorKey.sync="actorKey"
      :statusKey.sync="statusKey"
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
        :hasSetting="false"
      >
        <div class="chat-input-box">
          <chat-input-info-component
            :windowInfo="windowInfo"
            :sender="sender"
            :targetType="targetType"
            :targetName="targetName"
            :isDefaultTab="!outputTabKey"
            :outputTabName="outputTabName"
            :isSecret="isSecret"
          />
          <label class="chat-input-container">
            <textarea
              v-model="inputtingChatText"
              :placeholder="$t('chat-window.placeholder')"
              @input="onInputChat($event.target.value)"
              @keydown.up.self.stop="event => changeChatOption('up', event)"
              @keydown.down.self.stop="event => changeChatOption('down', event)"
              @keydown.esc.prevent="resetChatOption"
              @keypress.enter.prevent="event => sendMessage(event, true)"
              @keyup.enter.prevent="event => sendMessage(event, false)"
              @keydown.229.stop
              @keyup.229.stop
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

      <!-- 単位変換テーブル -->
      <unit-table-component v-if="unitList" :unitList="unitList" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import LifeCycle from "../../core/decorator/LifeCycle";
import TaskProcessor from "../../core/task/TaskProcessor";
import UnitTableComponent from "./UnitTableComponent.vue";
import {
  ActorStore,
  LikeStore,
  ChatStore,
  ChatTabStore,
  GroupChatTabStore
} from "@/@types/store-data";
import { CustomDiceBotInfo } from "@/@types/room";
import ChatOperationLine from "./ChatOperationLine.vue";
import WindowVue from "../../core/window/WindowVue";
import GameObjectManager from "../GameObjectManager";
import { TabInfo } from "@/@types/window";
import ChatOptionSelector from "./ChatOptionSelector.vue";
import ChatInputInfoComponent from "./ChatInputInfoComponent.vue";
import { conversion, sendChatLog } from "../../core/utility/ChatUtility";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import ChatLogViewer from "./log/ChatLogViewer.vue";
import VueEvent from "../../core/decorator/VueEvent";
import {
  createEmptyStoreUseData,
  errorDialog,
  findByKey,
  findRequireByKey,
  findRequireByOwner,
  questionDialog
} from "../../core/utility/Utility";
import LanguageManager from "../../../LanguageManager";
import SimpleTabComponent from "../../core/component/SimpleTabComponent.vue";
import ReadAloudManager from "../../../ReadAloudManager";
import { Getter } from "vuex-class";
import { ThrowParabolaInfo, UpdateResourceInfo } from "task-info";
import TaskManager from "@/app/core/task/TaskManager";
import { UserType } from "@/@types/store-data-optional";

@Component({
  components: {
    UnitTableComponent,
    ChatOptionSelector,
    ChatInputInfoComponent,
    SimpleTabComponent,
    ChatOperationLine,
    ChatLogViewer
  }
})
export default class ChatWindow extends Mixins<WindowVue<void, void>>(
  WindowVue
) {
  @Getter("useReadAloud")
  private useReadAloud!: boolean;

  // List
  private unitList:
    | { value: number; name: string; unit: string }[]
    | null = null;
  private chatList = GameObjectManager.instance.chatList;
  private userList = GameObjectManager.instance.userList;
  private likeList = GameObjectManager.instance.likeList;
  private actorList = GameObjectManager.instance.actorList;
  private selfActors: StoreUseData<ActorStore>[] = [];
  private chatTabList = GameObjectManager.instance.chatTabList;
  private outputTabList: StoreUseData<ChatTabStore>[] = [];
  private isSecretList: StoreUseData<{ name: string }>[] = [
    createEmptyStoreUseData<{ name: string }>("false", {
      name: LanguageManager.instance.getText("label.non-secret")
    }),
    createEmptyStoreUseData<{ name: string }>("true", {
      name: LanguageManager.instance.getText("label.secret")
    })
  ];
  private actorGroupList = GameObjectManager.instance.actorGroupList;
  private chatFormatList = GameObjectManager.instance.chatFormatList;
  private actorStatusList = GameObjectManager.instance.actorStatusList;
  private chatFormatWrapList: StoreUseData<{ name: string }>[] = [];
  private groupChatTabList = GameObjectManager.instance.groupChatTabList;
  private customDiceBotList: CustomDiceBotInfo[] = [];

  // NekostoreCollectionController
  private actorCC = SocketFacade.instance.actorCC();
  private chatListCC = SocketFacade.instance.chatListCC();

  /*
   * global info
   */
  private chatPublicInfo = GameObjectManager.instance.chatPublicInfo;
  /** チャット発言者 */
  private actorKey: string = "";
  /** ステータス */
  private statusKey: string = "";
  private isActorChanging: boolean = false;
  /** タブ */
  private tabKey: string = "";
  /** 発言先 */
  private targetKey: string = "";
  /** システム */
  private system: string = "DiceBot";
  /** BCDice-APIのURL */
  private bcdiceUrl: string = "";

  private lastChatNum: number = -1;

  /*
   * local flags
   */
  /** 秘匿通信かどうか */
  private isSecret: boolean = false;
  /** 後からチャット内容を更新するID */
  private edittingChat: StoreUseData<ChatStore> | null = null;
  /** 出力先タブ */
  private outputTabKey: string | null = null;
  /** 発言に括弧をつけるかどうか */
  private addBrackets: boolean = false;
  /** 入力されたチャット文言を格納する変数 */
  private inputtingChatText: string = "";
  /** Enterを押しているかどうか */
  private enterPressing: boolean = false;
  /** 選択済みのタブを意味する文言 */
  private selectedItemLabel: string = LanguageManager.instance.getText(
    "chat-window.options.selected-item"
  );
  private editedMessage: string = LanguageManager.instance.getText(
    "label.edited"
  );
  /** ユーザタイプ */
  private userTypeLanguageMap: { [type in UserType]: string } = {
    PL: LanguageManager.instance.getText("selection.user-type.pl"),
    GM: LanguageManager.instance.getText("selection.user-type.gm"),
    VISITOR: LanguageManager.instance.getText("selection.user-type.visitor")
  };

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
    | "select-sender" // !
    | "select-output-tab" // #
    | "select-target" // @
    | "select-chat-format" // $
    | "select-is-secret" = "none"; // ?

  private chatOptionMax: number = 7;
  private chatOptionList: StoreUseData<any>[] | null = null;
  private chatOptionValue: string | null = null;

  /** 選択中のチャットフォーマット */
  private partsFormat: string | null = null;

  // チャットオプション用一時退避領域
  private volatileActorKey: string | null = null;
  private volatileStatusKey: string | null = null;
  private volatileTarget: string | null = null;
  private volatileActiveTab: string | null = null;
  private volatileTargetTab: string | null | undefined = undefined;
  private volatileIsSecret: boolean | null = null;
  private isMounted: boolean = false;

  /*
   * getters
   */
  private get targetList(): StoreUseData<GroupChatTabStore | ActorStore>[] {
    return [...this.groupChatTabList, ...this.actorList];
  }

  private get windowElm(): HTMLDivElement {
    return this.$refs["window-container"] as HTMLDivElement;
  }

  @VueEvent
  private get sender(): string {
    return this.getName(this.actorKey, "actor", true);
  }

  @VueEvent
  private get targetType(): string {
    const groupChatTabInfo = findByKey(this.groupChatTabList, this.targetKey);
    if (groupChatTabInfo)
      return groupChatTabInfo.data!.isSystem ? "default" : "group";
    return "direct";
  }

  @VueEvent
  private get targetName(): string {
    const groupChatTabInfo = findByKey(this.groupChatTabList, this.targetKey);
    if (groupChatTabInfo) {
      return groupChatTabInfo.data!.name;
    }

    return findRequireByKey(this.actorList, this.targetKey).data!.name;
  }

  private getName(
    key: string,
    type: "group" | "actor",
    addStatus: boolean
  ): string {
    if (!key) return "";
    if (type === "group") {
      const gct = findRequireByKey(this.groupChatTabList, key);
      if (gct.data!.isSystem) return "";
      return gct.data!.name;
    } else {
      const actor = findRequireByKey(this.actorList, key);
      let userTypeStr = "";
      if (actor.data!.type === "user") {
        const user = findRequireByKey(this.userList, actor.owner);
        const userType = this.userTypeLanguageMap[user.data!.type];
        userTypeStr = `(${userType})`;
      }
      let statusStr = "";
      if (addStatus) {
        const status = findRequireByOwner(this.actorStatusList, this.actorKey);
        statusStr = `-${status.data!.name}`;
      }
      return `${actor.data!.name}${userTypeStr}${statusStr}`;
    }
  }

  @VueEvent
  private get outputTabName(): string {
    if (!this.outputTabKey) return this.selectedItemLabel;
    return findRequireByKey(this.chatTabList, this.outputTabKey).data!.name;
  }

  private get actorStatusKey(): string {
    return findRequireByOwner(this.actorStatusList, this.actorKey).key;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.setFontColors();
    this.isMounted = true;
  }

  @Watch("actorList", { immediate: true, deep: true })
  private onChangeActorList() {
    this.selfActors = this.actorList.filter(
      a => a.owner === SocketFacade.instance.userKey
    );

    if (this.isMounted) this.setFontColors();
  }

  private setFontColors() {
    const getFontColor = (actor: StoreUseData<ActorStore>) => {
      let cActor: StoreUseData<ActorStore> = actor;
      if (cActor.data!.chatFontColorType !== "original") {
        const cActorOwner = findRequireByKey(this.userList, cActor.owner);
        cActor = findRequireByOwner(this.actorList, cActorOwner.key);
      }
      return cActor.data!.chatFontColor;
    };

    this.actorList.forEach(actor => {
      const fontColor = getFontColor(actor);
      this.windowElm.style.setProperty(`--font-color-${actor.key}`, fontColor);
    });
  }

  @Watch("groupChatTabList", { immediate: true, deep: true })
  private onChangeGroupChatTabList() {
    this.targetTabList = this.groupChatTabList
      .filter(gct => permissionCheck(gct, "view"))
      .map(ct => ({
        key: ct.key,
        text: ct.data!.name,
        target: ct.key
      }));
    if (!this.currentTargetTabInfo)
      this.currentTargetTabInfo = this.targetTabList[0];
  }

  /*
   * PublicInfo更新検出
   */
  @Watch("chatPublicInfo.actorKey", { immediate: true })
  private onChangeChatPublicActorKey() {
    // これはactorKeyのWatchを発動させるのに必要
    setTimeout(() => {
      this.actorKey = this.chatPublicInfo.actorKey;
    });
  }

  @Watch("chatPublicInfo.tabKey", { immediate: true })
  private onChangeChatPublicTabKey() {
    this.tabKey = this.chatPublicInfo.tabKey;
  }

  @Watch("chatPublicInfo.targetKey", { immediate: true })
  private onChangeChatPublicTargetKey() {
    this.targetKey = this.chatPublicInfo.targetKey;
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
  @Watch("actorKey")
  private onChangeActorKey() {
    this.chatPublicInfo.actorKey = this.actorKey;
    this.isActorChanging = true;
    const actor = findRequireByKey(this.actorList, this.actorKey);
    this.statusKey = actor.data!.statusKey;
  }

  @Watch("statusKey")
  private async onChangeStatusKey() {
    if (this.isActorChanging) {
      this.isActorChanging = false;
      return;
    }
    await this.updateActorStatus(this.statusKey);
  }

  @Watch("tabKey")
  private onChangeTabKey() {
    this.chatPublicInfo.tabKey = this.tabKey;
  }

  @Watch("targetKey")
  private onChangeTargetKey() {
    this.chatPublicInfo.targetKey = this.targetKey;

    const groupChatTabInfo = findByKey(this.groupChatTabList, this.targetKey);
    if (groupChatTabInfo) {
      const outputChatTabKey = groupChatTabInfo.data!.outputChatTabKey;
      if (outputChatTabKey) {
        this.tabKey = outputChatTabKey;
      }

      const actorGroupKey = groupChatTabInfo.data!.actorGroupKey;
      const actorGroupInfo = findRequireByKey(
        this.actorGroupList,
        actorGroupKey
      );

      let isMatchCurrentActor = false;
      let otherMatchActorKey: string | null = null;
      actorGroupInfo.data!.list.forEach(actorRef => {
        if (isMatchCurrentActor) return;
        if (
          actorRef.actorKey ===
          GameObjectManager.instance.chatPublicInfo.actorKey
        ) {
          isMatchCurrentActor = true;
          return;
        }
        const actor = findRequireByKey(this.actorList, actorRef.actorKey);
        if (
          actor.owner === SocketFacade.instance.userKey &&
          !otherMatchActorKey
        ) {
          otherMatchActorKey = actor.key;
        }
      });
      if (!isMatchCurrentActor && otherMatchActorKey)
        this.actorKey = otherMatchActorKey;
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

  @VueEvent
  private onInputChat(text: string) {
    const getKeyByName = (
      text: string,
      list: StoreUseData<any>[],
      defaultKey: string | null
    ): string | null => {
      if (text.length === 0) return defaultKey;
      for (const item of list) {
        if (item.data!.name.startsWith(text)) {
          return item.key;
        }
      }
      return null;
    };

    // コマンド（発言者選択）
    let actorKey: string | null = null;
    if (text.startsWith("!") || text.startsWith("！")) {
      actorKey = getKeyByName(
        text.substring(1),
        this.selfActors,
        this.actorKey
      );
    }

    // コマンド（グループチャット選択）
    let targetKey: string | null = null;
    if (text.startsWith(">") || text.startsWith("＞")) {
      targetKey = getKeyByName(
        text.substring(1),
        this.targetList,
        this.targetKey
      );
    }

    // コマンド（出力先タブ選択）
    let outputTabKey: string | null | undefined = undefined;
    if (text.startsWith("#") || text.startsWith("＃")) {
      outputTabKey = getKeyByName(
        text.substring(1),
        this.outputTabList,
        this.outputTabKey
      );
    }

    // コマンド（秘匿）
    let isSecret: string | null = null;
    if (text.endsWith("?") || text.endsWith("？")) {
      isSecret = getKeyByName(
        text.substring(1),
        this.isSecretList,
        String(this.isSecret)
      );
    }

    // コマンド（部分フォーマット）
    let partsFormat: string | null = null;
    if (text.endsWith("&") || text.endsWith("＆")) {
      partsFormat = this.chatFormatWrapList[0].key;
    }

    if (actorKey) {
      this.chatOptionList = this.selfActors;
      this.chatOptionValue = actorKey;
      this.actorKey = actorKey;
      this.chatOptionSelectMode = "select-sender";
    } else if (targetKey) {
      this.chatOptionList = this.targetList;
      this.chatOptionValue = targetKey;
      this.targetKey = targetKey;
      this.chatOptionSelectMode = "select-target";
    } else if (outputTabKey !== undefined) {
      this.chatOptionList = this.outputTabList;
      this.chatOptionValue = outputTabKey;
      this.outputTabKey = outputTabKey;
      this.chatOptionSelectMode = "select-output-tab";
    } else if (partsFormat) {
      this.chatOptionList = this.chatFormatWrapList;
      this.chatOptionValue = partsFormat;
      this.partsFormat = partsFormat;
      this.chatOptionSelectMode = "select-chat-format";
    } else if (isSecret !== null) {
      this.chatOptionList = this.isSecretList;
      this.chatOptionValue = isSecret;
      this.isSecret = isSecret === "true";
      this.chatOptionSelectMode = "select-is-secret";
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

      console.log(num, unit, matchResult);

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
    if (!this.volatileActorKey) this.volatileActorKey = this.actorKey;
    if (!this.volatileStatusKey) this.volatileStatusKey = this.actorStatusKey;
    if (!this.volatileTarget) this.volatileTarget = this.targetKey;
    if (!this.volatileActiveTab) this.volatileActiveTab = this.tabKey;
    if (!this.volatileTargetTab === undefined)
      this.volatileTargetTab = this.outputTabKey;
    if (this.volatileIsSecret === null) this.volatileIsSecret = this.isSecret;

    // カーソル移動と、移動後の輪転処理
    const getNextKey = (): string => {
      event.preventDefault();
      let index = this.chatOptionList!.findIndex(
        co => co.key === this.chatOptionValue
      );
      index += direction === "up" ? -1 : 1;
      if (index < 0) index = this.chatOptionList!.length - 1;
      if (index === this.chatOptionList!.length) index = 0;
      const nextKey = this.chatOptionList![index].key;
      this.chatOptionValue = nextKey;
      return nextKey;
    };

    // 発言者の選択の場合
    if (this.chatOptionSelectMode === "select-sender")
      this.actorKey = getNextKey();

    // 発言先の選択の場合
    if (this.chatOptionSelectMode === "select-target")
      this.targetKey = getNextKey();

    // タブの選択の場合
    if (this.chatOptionSelectMode === "select-output-tab")
      this.outputTabKey = getNextKey();

    // 秘匿チャットかどうかの選択の場合
    if (this.chatOptionSelectMode === "select-is-secret")
      this.isSecret = getNextKey() === "true";

    // チャットフォーマットの選択の場合
    if (this.chatOptionSelectMode === "select-chat-format")
      this.partsFormat = getNextKey();
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
      if (this.volatileActorKey) this.actorKey = this.volatileActorKey;
      if (this.volatileStatusKey) {
        await this.updateActorStatus(this.volatileStatusKey);
      }
      if (this.volatileTarget) this.targetKey = this.volatileTarget;
      if (this.volatileActiveTab) this.tabKey = this.volatileActiveTab;
      if (this.volatileTargetTab !== undefined)
        this.outputTabKey = this.volatileTargetTab;
      if (this.volatileIsSecret !== null) this.isSecret = this.volatileIsSecret;
    }
    this.chatOptionSelectMode = "none";
    this.volatileActorKey = null;
    this.volatileTarget = null;
    this.volatileStatusKey = null;
    this.volatileActiveTab = null;
    this.volatileTargetTab = undefined;
    this.volatileIsSecret = null;
  }

  @VueEvent
  private async onLike(
    actorKey: string,
    chatKey: string,
    like: StoreUseData<LikeStore>,
    add: number
  ) {
    const chat = findRequireByKey(this.chatList, chatKey);
    const char = like.data!.char;
    const likeIndex = chat.data!.like.findIndex(
      l => l.actorKey === actorKey && l.char === char
    );
    const chatLike = chat.data!.like[likeIndex];
    if (chatLike) {
      chatLike.count += add;
      if (chatLike.count <= 0) chat.data!.like.splice(likeIndex, 1);
    } else {
      if (add > 0) {
        chat.data!.like.push({
          actorKey,
          char: like.data!.char,
          count: add
        });
      }
    }
    await this.chatListCC.updatePackage([{ key: chatKey, data: chat.data! }]);
    if (add > 0 && like.data!.isThrowLinkage) {
      await SocketFacade.instance.sendData<ThrowParabolaInfo>({
        dataType: "throw-parabola",
        data: { char }
      });
    }
    const resourceMasterKey = like.data!.linkageResourceKey;
    if (resourceMasterKey) {
      await TaskManager.instance.ignition<UpdateResourceInfo, never>({
        type: "resource-update",
        owner: "Quoridorn",
        value: {
          resourceMasterKey,
          ownerType: "actor-list",
          ownerKey: chat.data!.actorKey!,
          operationType: "add",
          value: add.toString()
        }
      });
    }
  }

  // アクターステータスを切り替える
  private async updateActorStatus(statusKey: string) {
    await this.actorCC.touchModify([this.actorKey]);
    const actorInfo = findRequireByKey(this.actorList, this.actorKey);
    const actorData = actorInfo.data!;
    actorData.statusKey = statusKey;
    await this.actorCC.update([
      {
        key: this.actorKey,
        data: actorData
      }
    ]);
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.selectedItemLabel = this.$t(
      "chat-window.options.selected-item"
    )!.toString();
    this.editedMessage = this.$t("label.edited")!.toString();
    this.userTypeLanguageMap.PL = this.$t("selection.user-type.pl")!.toString();
    this.userTypeLanguageMap.GM = this.$t("selection.user-type.gm")!.toString();
    this.userTypeLanguageMap.VISITOR = this.$t(
      "selection.user-type.visitor"
    )!.toString();
    this.updateOutputTabList();
    task.resolve();
  }

  @Watch("chatTabList", { immediate: true, deep: true })
  private updateOutputTabList() {
    const outputTabList = this.chatTabList.concat();
    outputTabList.splice(
      0,
      0,
      createEmptyStoreUseData<ChatTabStore>("", {
        name: this.selectedItemLabel,
        isSystem: true,
        useReadAloud: false,
        readAloudVolume: 1
      })
    );
    this.outputTabList = outputTabList;
  }

  @Watch("chatFormatList", { immediate: true, deep: true })
  private updateChatFormatWrapList() {
    this.chatFormatWrapList = this.chatFormatList.map(cf =>
      createEmptyStoreUseData<{ name: string }>(cf.chatText, {
        name: cf.label
      })
    );
  }

  @Watch("chatList", { deep: true })
  private onChangeChatList() {
    if (!this.chatList.length) return;
    if (this.lastChatNum < this.chatList.length) {
      const chatInfo = this.chatList[this.chatList.length - 1].data!;
      // テキスト読み上げ機能（ダイス結果でない物を読み上げ）
      if (this.useReadAloud && !chatInfo.dices.length) {
        let text = chatInfo.text;
        const actor = this.actorList.find(a => a.key === chatInfo.actorKey);
        if (actor) text = `${actor.data!.name}, ${text}`;
        const tabKey = chatInfo.tabKey;
        const tab = this.chatTabList.find(ct => ct.key === tabKey);
        if (tab && tab.data!.useReadAloud) {
          console.log(text);
          ReadAloudManager.instance.volume = tab.data!.readAloudVolume || 1;
          ReadAloudManager.instance.speakVoice(text);
        }
      }
    }
    this.lastChatNum = this.chatList.length;
  }

  @VueEvent
  private async editChat(key: string) {
    try {
      await this.chatListCC.touchModify([key]);
    } catch (err) {
      // TODO error show.
      return;
    }
    const chat = findRequireByKey(this.chatList, key);
    this.edittingChat = chat;
    this.inputtingChatText = chat.data!.text;
  }

  @VueEvent
  private async deleteChat(key: string) {
    const confirm = await questionDialog({
      title: this.$t("button.delete").toString(),
      text: this.$t("chat-window.dialog.delete-chat").toString(),
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!confirm) return;
    try {
      await this.chatListCC.deletePackage([key]);
    } catch (err) {
      await errorDialog({
        title: this.$t("message.error").toString(),
        text: this.$t("message.delete-failure")!.toString()
      });
      return;
    }
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
        const chatFormat: any = GameObjectManager.instance.chatFormatList.find(
          format => format.chatText === this.partsFormat
        )!;
        this.inputtingChatText =
          this.inputtingChatText.replace(/[&＆]$/, "") + chatFormat.chatText;
        // this.partsFormat = GameObjectManager.instance.chatFormatList[0].chatText;
      } else {
        // if (this.chatOptionSelectMode === "select-output-tab") {
        //   this.tabKey = this.outputTabKey;
        //   this.outputTabKey = null;
        // }
        this.inputtingChatText = "";
      }
      this.chatOptionSelectMode = "none";
      this.volatileActorKey = "";
      this.volatileStatusKey = "";
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

    // チャット編集中の場合
    if (this.edittingChat) {
      this.edittingChat.data!.text = text;
      await this.chatListCC.update([
        {
          key: this.edittingChat.key,
          data: this.edittingChat.data!
        }
      ]);
      this.edittingChat = null;
      return;
    }
    await sendChatLog(
      {
        actorKey: this.actorKey,
        text,
        tabKey: this.outputTabKey || this.tabKey,
        statusKey: null, // Actorに設定されているものを使う
        targetKey: this.targetKey,
        system: this.system,
        isSecret: this.isSecret
      },
      this.customDiceBotList
    );
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

.chat-log-viewer {
  height: calc(100% - 10em - 1rem);
  margin-bottom: 0.5rem;
}

.chat-operation-line {
  flex-shrink: 0;
}

.chat-edit-container {
  height: 8em;
}

.chat-edit-container {
  @include flex-box(column, stretch, stretch);
  position: relative;
}

.edit-tab-component {
  @include inline-flex-box(column, stretch, flex-start);
  flex: 1;
}

.chat-input-box {
  @include flex-box(row, flex-start, stretch);
  border: 1px solid gray;
  margin-top: -1px;
  background-color: white;
  flex: 1;
}

.chat-input-container {
  @include flex-box(row, flex-start, stretch);
  flex: 1;
}

textarea {
  flex: 1;
  padding: 0 0.2rem;
  border: none;
  font-size: inherit;
  overflow-y: auto;
  outline: none;
  line-height: 1.5em;
  resize: none;
}
</style>
