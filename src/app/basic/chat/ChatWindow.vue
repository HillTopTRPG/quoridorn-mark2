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
      :authorityGroupList="authorityGroupList"
      :chatTabList="chatTabList"
      :groupChatTabList="groupChatTabList"
      :tab-key.sync="tabKey"
      @edit="editChat"
      @delete="deleteChat"
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
      :bcdice-version.sync="bcdiceVersion"
    />

    <!-- 入力盤 -->
    <div class="chat-edit-container">
      <simple-tab-component
        class="edit-tab-component"
        :windowKey="windowKey"
        :tabList="targetTabList"
        v-model="currentTargetTabInfo"
        @settingOpen="editGroupChat"
        :hasSetting="true"
      >
        <div class="chat-input-box" :class="{ secret: isSecret }">
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
              :class="{ secret: isSecret }"
              :placeholder="$t('chat-window.placeholder')"
              @input="onInputChat($event.target.value)"
              @keydown.up.self.stop="event => changeChatOption('up', event)"
              @keydown.down.self.stop="event => changeChatOption('down', event)"
              @keydown.esc.prevent="resetChatOption"
              @keypress.enter.prevent="event => sendMessage(event, true)"
              @keyup.enter.prevent="event => sendMessage(event, false)"
              @keydown.229.stop
              @keyup.229.stop
              ref="textareaElm"
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
      <div class="notify-message" :class="notifyMessage ? '' : 'empty'">
        {{ notifyMessage }}
      </div>

      <!-- 単位変換テーブル -->
      <unit-table-component v-if="unitList" :unitList="unitList" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import {
  ActorStore,
  ChatStore,
  ChatTabStore,
  GroupChatTabStore,
  LikeStore,
  ResourceMasterStore,
  ResourceStore,
  SceneObjectStore
} from "@/@types/store-data";
import { TabInfo } from "@/@types/window";
import { Getter } from "vuex-class";
import {
  ChatInputtingInfo,
  ThrowParabolaInfo,
  UpdateResourceInfo
} from "task-info";
import TaskManager from "@/app/core/task/TaskManager";
import { ResourceType, UserType } from "@/@types/store-data-optional";
import App from "@/views/App.vue";
import CssManager from "@/app/core/css/CssManager";
import { changeColorAlpha } from "@/app/core/utility/ColorUtility";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  createEmptyStoreUseData,
  errorDialog,
  findByKey,
  findRequireByKey,
  findRequireByOwner,
  questionDialog
} from "@/app/core/utility/Utility";
import UnitTableComponent from "@/app/basic/chat/UnitTableComponent.vue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import ChatLogViewer from "@/app/basic/chat/log/ChatLogViewer.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ChatOperationLine from "@/app/basic/chat/ChatOperationLine.vue";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import ChatOptionSelector from "@/app/basic/chat/ChatOptionSelector.vue";
import { conversion, sendChatLog } from "@/app/core/utility/ChatUtility";
import ChatInputInfoComponent from "@/app/basic/chat/ChatInputInfoComponent.vue";
import ReadAloudManager from "@/ReadAloudManager";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import {
  convertBooleanNull,
  convertNumberNull,
  convertNumberZero
} from "@/app/core/utility/PrimaryDataUtility";

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
  private resourceTargetList: StoreUseData<SceneObjectStore>[] = [];
  private resourceMasterList = GameObjectManager.instance.resourceMasterList;
  private authorityGroupList = GameObjectManager.instance.authorityGroupList;
  private chatFormatList = GameObjectManager.instance.chatFormatList;
  private actorStatusList = GameObjectManager.instance.actorStatusList;
  private chatFormatWrapList: StoreUseData<{ name: string }>[] = [];
  private groupChatTabList = GameObjectManager.instance.groupChatTabList;

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
  /** BCDice-APIのバージョン */
  private bcdiceVersion: string = "";

  private lastChatNum: number = -1;

  private chatInputtingOffTimeoutKey: number | null = null;

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
    | "select-is-secret" // ?
    | "resource-change-resource-master" // :  この次にはResourceMasterがくる
    | "resource-change-target-operation" // :resource-master   この次には対象か演算子がくる
    | "resource-change-operation" // :resource-master.target   この次には演算子がくる
    | "resource-change-value" = "none"; // :resource-master.target =   この次には選択肢がくる

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
  /** リソース更新対象 */
  private resourceTargetKey: string | null = null;

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

  @TaskProcessor("global-enter-finished")
  private async globalEnterFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    const textareaElm: HTMLTextAreaElement = this.$refs
      .textareaElm as HTMLTextAreaElement;
    textareaElm.focus();
    task.resolve();
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
    const secretColor = changeColorAlpha(
      CssManager.getCss("--uni-color-light-purple"),
      0.5
    );
    this.targetTabList = this.groupChatTabList
      .filter(gct => {
        if (!permissionCheck(gct, "view")) return false;
        const authorityGroup = findRequireByKey(
          this.authorityGroupList,
          gct.data!.authorityGroupKey
        );
        return authorityGroup.data!.list.some(d => {
          if (d.type === "user")
            return d.userKey === SocketFacade.instance.userKey;
          else {
            const actor = findRequireByKey(this.actorList, d.actorKey);
            return GameObjectManager.isOwn(actor);
          }
        });
      })
      .map(ct => ({
        key: ct.key,
        text: ct.data!.name,
        target: ct.key,
        isDisabled: false,
        color: ct.data!.isSecret ? secretColor : ""
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
      this.resourceTargetList = GameObjectManager.instance.sceneObjectList.filter(
        so => so.data!.actorKey === this.actorKey
      );
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

  @Watch("chatPublicInfo.bcdiceVersion", { immediate: true })
  private onChangeChatPublicBcdiceVersion() {
    this.bcdiceVersion = this.chatPublicInfo.bcdiceVersion;
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

  @Watch("currentTargetTabInfo", { deep: true })
  private onChangeCurrentTargetTabInfo() {
    this.targetKey = this.currentTargetTabInfo?.target as string;
  }

  @Watch("targetKey")
  private onChangeTargetKey() {
    this.chatPublicInfo.targetKey = this.targetKey;

    const groupChatTabInfo = findByKey(this.groupChatTabList, this.targetKey);
    if (groupChatTabInfo) {
      this.currentTargetTabInfo =
        this.targetTabList.find(tt => tt.key === this.targetKey) || null;
      const outputChatTabKey = groupChatTabInfo.data!.outputChatTabKey;
      this.outputTabKey = outputChatTabKey;
      if (outputChatTabKey) {
        this.tabKey = outputChatTabKey;
      }
      this.isSecret = groupChatTabInfo.data!.isSecret;

      const authorityGroupKey = groupChatTabInfo.data!.authorityGroupKey;
      const authorityGroupInfo = findRequireByKey(
        this.authorityGroupList,
        authorityGroupKey
      );

      let isMatchCurrentActor = false;
      let otherMatchActorKey: string | null = null;
      authorityGroupInfo.data!.list.forEach(actorRef => {
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

  @Watch("bcdiceVersion")
  private onChangeBcdiceVersion() {
    this.chatPublicInfo.bcdiceVersion = this.bcdiceVersion;
  }

  private parseResourceChange(
    text: string
  ): {
    resourceMasterName: string | null;
    targetName: string | null;
    operator: string | null;
    value: string | null;
    resourceMaster: StoreData<ResourceMasterStore> | null;
    validOperationList: string[];
    valueSelectResourceTypeList: ResourceType[];
    targetTypeList: ResourceType[];
  } {
    const convertStr = (str: string | null): string | null =>
      str?.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) =>
        String.fromCharCode(s.charCodeAt(0) - 65248)
      ) || null;

    const matchResult = text.match(
      /^[:：](?:(.+?)[ 　]*(?:[.。][ 　]*(.+?)[ 　]*)?(?:([+\-=＋−＝])[ 　]*(.*)?)?)?$/
    );

    let resourceMasterName: string | null = null;
    let targetName: string | null = null;
    let operator: string | null = null;
    let value: string | null = null;
    if (matchResult) {
      resourceMasterName = matchResult[1] || null;
      targetName = matchResult[2] || null;
      operator = convertStr(matchResult[3]);
      value = matchResult[4] || null;
    }

    const resourceMaster =
      this.resourceMasterList.find(
        rm => rm.data!.name === resourceMasterName
      ) || null;

    const validOperationList: string[] = ["="];
    if (resourceMaster?.data!.type === "number")
      validOperationList.push("+", "-");
    const valueSelectResourceTypeList: ResourceType[] = [
      "select",
      "check",
      "combo"
    ];

    return {
      resourceMasterName,
      targetName,
      operator,
      value,
      resourceMaster,
      validOperationList,
      valueSelectResourceTypeList,
      targetTypeList: ["number", ...valueSelectResourceTypeList]
    };
  }

  private getResource(
    resourceMasterName: string,
    targetName: string | null
  ): StoreData<ResourceStore> | null {
    const actor = findRequireByKey(this.actorList, this.actorKey);
    const sceneObjectList = actor
      .data!.pieceKeyList.map(pk =>
        findByKey(GameObjectManager.instance.sceneObjectList, pk)
      )
      .filter(mo => !!mo);

    if (!targetName) targetName = actor.data!.name;

    const resourceMaster = this.resourceMasterList.find(
      rm => rm.data!.name === resourceMasterName
    );
    if (!resourceMaster) return null;
    const isAutoAddActor = resourceMaster.data!.isAutoAddActor;
    const isAutoAddMapObject = resourceMaster.data!.isAutoAddMapObject;

    let targetKey: string | null = null;
    if (/actor/i.test(targetName)) targetKey = actor.key;
    if (!targetKey && isAutoAddMapObject) {
      targetKey =
        sceneObjectList.find(so => so!.data!.name === targetName)?.key || null;
    }
    if (!targetKey && isAutoAddActor) {
      targetKey = actor.data!.name === targetName ? actor.key : null;
    }
    return (
      GameObjectManager.instance.resourceList.find(
        r =>
          r.data!.resourceMasterKey === resourceMaster.key &&
          r.owner === targetKey
      ) || null
    );
  }

  @VueEvent
  private async onInputChat(text: string) {
    const getKeyByName = (
      text: string,
      list: StoreData<any>[],
      defaultKey: string | null
    ): string | null =>
      text
        ? list.find(item => item.data!.name.startsWith(text))?.key || null
        : defaultKey;

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

    // コマンド（リソース修正）
    const resourceTargetList: StoreUseData<any>[] = [];
    let resourceTargetKey: string | null = null;
    let chatOptionSelectMode:
      | "resource-change-resource-master"
      | "resource-change-target-operation"
      | "resource-change-operation"
      | "resource-change-value"
      | "none"
      | null = null;
    if (text.startsWith(":") || text.startsWith("：")) {
      const actor = findRequireByKey(this.actorList, this.actorKey);

      const {
        resourceMasterName,
        targetName,
        operator,
        resourceMaster,
        validOperationList,
        valueSelectResourceTypeList,
        targetTypeList
      } = this.parseResourceChange(text);

      // 分岐開始
      let resource: StoreData<ResourceStore> | null = null;

      // 有効でない演算子が使われていたら、問答無用で処理中止
      if (operator && !validOperationList.some(o => o === operator))
        chatOptionSelectMode = "none";

      if (!chatOptionSelectMode && !resourceMasterName) {
        // リソース名が指定されてなかったらリソース選択モード
        chatOptionSelectMode = "resource-change-resource-master";
      } else {
        // リソース名が指定されているのにリソースオブジェクトが取れなかったら処理中止
        chatOptionSelectMode = resourceMaster ? null : "none";
      }

      if (!chatOptionSelectMode && resourceMaster && resourceMasterName) {
        if (operator) {
          // 演算子が指定されていたらリソースを特定できるはず
          resource = this.getResource(resourceMasterName, targetName);
          // 値を選択してもらうかどうかでモードを判断する
          chatOptionSelectMode =
            resource &&
            valueSelectResourceTypeList.some(
              t => t === resourceMaster.data!.type
            )
              ? "resource-change-value"
              : "none";
        } else {
          if (targetName) {
            // 対象を指定されているのでリソースを特定できるはず
            resource = this.getResource(resourceMasterName, targetName);
            // 演算子を選んでほしいモード
            chatOptionSelectMode = resource
              ? "resource-change-operation"
              : "none";
          } else {
            // 対象も演算子も指定されていないので、対象か演算子を選んで欲しいモード
            chatOptionSelectMode = "resource-change-target-operation";
          }
        }
      }
      if (chatOptionSelectMode === "resource-change-resource-master") {
        resourceTargetList.push(
          ...this.resourceMasterList
            .filter(rm => {
              if (!targetTypeList.some(t => t === rm.data!.type)) return false;
              return GameObjectManager.instance.resourceList.some(
                r => r.data!.resourceMasterKey === rm.key
              );
            })
            .map(rm => createEmptyStoreUseData(rm.key, { name: rm.data!.name }))
        );
      }
      if (
        chatOptionSelectMode === "resource-change-operation" ||
        chatOptionSelectMode === "resource-change-target-operation"
      ) {
        resourceTargetList.push(
          ...validOperationList.map(o =>
            createEmptyStoreUseData(o, { name: o })
          )
        );
      }
      if (chatOptionSelectMode === "resource-change-target-operation") {
        const sceneObjectRefList = this.resourceTargetList.map(rt =>
          createEmptyStoreUseData(rt.key, { name: `.${rt.data!.name}` })
        );
        const isSameName = sceneObjectRefList.some(
          sor => sor.data!.name === actor.data!.name
        );
        if (
          resourceMaster!.data!.isAutoAddActor &&
          resourceMaster!.data!.isAutoAddMapObject
        ) {
          resourceTargetList.push(
            createEmptyStoreUseData(this.actorKey, {
              name: isSameName ? ".actor" : `.${actor.data!.name}`
            })
          );
          console.log("!!!");
          resourceTargetList.push(
            ...this.resourceTargetList
              .filter(rt => rt.data!.name !== actor.data!.name)
              .map(rt =>
                createEmptyStoreUseData(rt.key, { name: `.${rt.data!.name}` })
              )
          );
        } else {
          if (resourceMaster!.data!.isAutoAddActor) {
            // 省略できる
          }
          if (resourceMaster!.data!.isAutoAddMapObject) {
            resourceTargetList.push(
              ...this.resourceTargetList
                .filter(rt => rt.data!.name !== actor.data!.name)
                .map(rt =>
                  createEmptyStoreUseData(rt.key, { name: `.${rt.data!.name}` })
                )
            );
          }
        }
      }
      if (resourceTargetList.length) {
        resourceTargetKey = resourceTargetList[0].key;
      }
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
      this.chatOptionValue = outputTabKey || "";
      this.outputTabKey = outputTabKey;
      if (outputTabKey) {
        this.tabKey = outputTabKey;
      }
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
    } else if (chatOptionSelectMode && chatOptionSelectMode !== "none") {
      this.chatOptionList = resourceTargetList;
      this.chatOptionValue = resourceTargetKey;
      this.resourceTargetKey = resourceTargetKey;
      this.chatOptionSelectMode = chatOptionSelectMode;
    } else {
      this.chatOptionSelectMode = "none";
      // TODO 入力中であることをルームメイトに通達
    }

    if (this.chatOptionSelectMode !== "none") return;

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

      // console.log(num, unit, matchResult);

      this.unitList = conversion(num, unit) || this.unitList;
    }

    // 入力中を通知
    const sendDataChatInputting = async (flag: boolean) => {
      await SocketFacade.instance.sendData<ChatInputtingInfo>({
        dataType: "chat-inputting",
        data: {
          actorKey: this.actorKey,
          flag
        }
      });
    };

    if (this.chatInputtingOffTimeoutKey !== null) {
      window.clearTimeout(this.chatInputtingOffTimeoutKey);
    } else {
      await sendDataChatInputting(true);
    }
    this.chatInputtingOffTimeoutKey = window.setTimeout(() => {
      sendDataChatInputting(false);
      this.chatInputtingOffTimeoutKey = null;
    }, 700);
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
    if (this.chatOptionSelectMode === "select-output-tab") {
      const key = getNextKey();
      this.outputTabKey = key;
      if (key) {
        this.tabKey = key;
      }
    }

    // 秘匿チャットかどうかの選択の場合
    if (this.chatOptionSelectMode === "select-is-secret")
      this.isSecret = getNextKey() === "true";

    // リソース更新の選択の場合
    if (this.chatOptionSelectMode.startsWith("resource-change-"))
      this.resourceTargetKey = getNextKey();

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
  private async editGroupChat() {
    await App.openSimpleWindow("group-chat-setting-window");
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

    // XXX デバッグ用コマンド
    if (this.inputtingChatText === "open db-viewer-window") {
      await App.openSimpleWindow("db-viewer-window");
      return;
    }

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
    const mode = this.chatOptionSelectMode;
    if (mode !== "none") {
      if (mode === "select-chat-format") {
        const chatFormat: any = GameObjectManager.instance.chatFormatList.find(
          format => format.chatText === this.partsFormat
        )!;
        this.inputtingChatText =
          this.inputtingChatText.replace(/[&＆]$/, "") + chatFormat.chatText;
      } else if (mode.startsWith("resource-change-")) {
        let addText: string | null = null;
        if (mode === "resource-change-resource-master") {
          addText =
            findByKey(this.resourceMasterList, this.resourceTargetKey)?.data!
              .name || null;
        }
        if (mode === "resource-change-operation") {
          addText = this.resourceTargetKey;
        }
        if (mode === "resource-change-value") {
          addText = this.resourceTargetKey;
        }
        if (mode === "resource-change-target-operation") {
          if (["+", "-", "="].some(o => o === this.resourceTargetKey)) {
            addText = this.resourceTargetKey;
          } else if (this.actorKey === this.resourceTargetKey) {
            addText =
              findByKey(this.actorList, this.actorKey)?.data!.name || null;
            if (addText) addText = `.${addText}`;
          } else {
            addText =
              findByKey(
                GameObjectManager.instance.sceneObjectList,
                this.resourceTargetKey
              )?.data!.name || null;
            if (addText) addText = `.${addText}`;
          }
        }
        if (addText) {
          this.inputtingChatText += addText;
          setTimeout(() => {
            this.onInputChat(this.inputtingChatText);
          });
        } else {
          this.inputtingChatText = "";
        }
      } else {
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

    let text = this.inputtingChatText;
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

    const {
      resourceMasterName,
      targetName,
      operator,
      value,
      resourceMaster,
      validOperationList,
      targetTypeList
    } = this.parseResourceChange(text);
    if (resourceMasterName && operator && value) {
      const convertStr = (str: string | null): string | null =>
        str?.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) =>
          String.fromCharCode(s.charCodeAt(0) - 65248)
        ) || null;
      const numValue = convertNumberNull(convertStr(value));
      const boolValue = convertBooleanNull(convertStr(value));

      // リソースを更新する
      let isOk = true;
      const resource = this.getResource(resourceMasterName, targetName);
      if (!resource) isOk = false;
      if (!resourceMaster) isOk = false;
      if (!validOperationList.some(o => o === operator)) isOk = false;
      const resourceType = resourceMaster?.data!.type;
      if (!targetTypeList.some(t => t === resourceType)) isOk = false;
      switch (resourceType) {
        case "number":
          if (numValue === null) isOk = false;
          break;
        case "check":
          if (boolValue === null) isOk = false;
          break;
        case "select":
          if (!value) isOk = false;
          if (isOk)
            isOk = (resourceMaster?.data!.selectionStr || "")
              .split(",")
              .map(s => s.trim())
              .filter(s => s)
              .some(s => s === value);
          break;
        case "combo":
          break;
        default:
      }

      if (isOk) {
        await TaskManager.instance.ignition<any, never>({
          type: "counter-remocon-execute",
          owner: "Quoridorn",
          value: {
            modifyType: operator === "=" ? "substitute" : "plus-minus",
            messageFormat: "{0}の{1}を{2}した({3})",
            resourceMasterKey: resourceMaster!.key,
            targetKey: resource!.owner,
            targetType: resource!.ownerType,
            value:
              operator === "-" ? (-convertNumberZero(value)).toString() : value
          }
        });
      }
      return;
    }

    // 括弧をつけるオプション
    if (this.addBrackets) text = `「${text}」`;

    await sendChatLog({
      actorKey: this.actorKey,
      text,
      tabKey: this.outputTabKey || this.tabKey,
      statusKey: null, // Actorに設定されているものを使う
      targetKey: this.targetKey,
      system: this.system,
      isSecret: this.isSecret,
      bcdiceServer: this.bcdiceUrl,
      bcdiceVersion: this.bcdiceVersion
    });
  }

  private chatInputtingActorList: StoreData<ActorStore>[] = [];

  @TaskProcessor("chat-inputting-notify-finished")
  private async chatInputtingNotifyFinished(
    task: Task<ChatInputtingInfo, never>
  ): Promise<TaskResult<never> | void> {
    const actorKey = task.value?.actorKey;
    if (task.value?.flag) {
      if (
        actorKey &&
        actorKey !== this.actorKey &&
        !this.chatInputtingActorList.some(a => a.key === actorKey)
      )
        this.chatInputtingActorList.push(
          findRequireByKey(this.actorList, actorKey)
        );
    } else {
      const index = this.chatInputtingActorList.findIndex(
        a => a.key === actorKey
      );
      if (index > -1) this.chatInputtingActorList.splice(index, 1);
    }
    task.resolve();
  }

  private get notifyMessage(): string {
    if (!this.chatInputtingActorList.length) return "";
    return `入力中: ${this.chatInputtingActorList
      .map(a => a.data!.name)
      .join(", ")}`;
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
  position: relative;
  border: 1px solid gray;
  margin-top: -1px;
  flex: 1;

  &.secret {
    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      z-index: 0;
      background-color: var(--uni-color-light-purple);
      opacity: 0.3;
    }
  }
}

.chat-input-container {
  @include flex-box(row, flex-start, stretch);
  flex: 1;
}

.notify-message {
  height: 2em;

  &.empty {
    color: gray;
  }
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
  background-color: rgba(0, 0, 0, 0);
  z-index: 1;
}
</style>
