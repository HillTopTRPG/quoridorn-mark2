<template>
  <div class="root" ref="window-container">
    <div class="message-scroll-area selectable" v-if="message">
      <img
        class="logo"
        src="https://quoridorn.com/img/bg_white_4c.svg"
        alt="logo"
        draggable="false"
      />
      <div class="message-documents">
        <div class="h-box">
          <div class="term-of-use flat-button" @click="viewTermOfUse()">
            <span v-t="'login-window.label.terms-of-use'"></span>
          </div>
          <div
            class="version-info flat-button"
            v-if="roomList"
            @click="viewVersionInfo()"
          >
            <span class="normal" v-t="'login-window.label.version-info'"></span>
            <span class="hovering">{{ versionText }}</span>
          </div>
        </div>
        <div class="title-contents flat-button" @click="serverSetting()">
          <span class="title">{{ message.title }}</span>
          <span class="icon-cog"></span>
        </div>
        <ul>
          <li v-for="(description, index) in message.descriptions" :key="index">
            <!-- HTMLインジェクション対策済み -->
            <span v-html="toHtml(description)"></span>
          </li>
        </ul>
      </div>
    </div>
    <keep-alive>
      <table-component
        :windowInfo="windowInfo"
        :tableIndex="0"
        :status="status"
        :dataList="roomList"
        v-if="roomList"
        :selectLock="roomStatus !== 'normal'"
        keyProp="order"
        :rowClassGetter="getRowClasses"
        v-model="selectedRoomNo"
        @doubleClick="playRoom"
        @adjustWidth="adjustWidth"
        @enter="rowEnter"
      >
        <template #contents="{ colDec, data, index }">
          <template v-if="index === 0">{{ data | roomNo }}</template>
          <template v-else-if="index === 1">
            <span v-if="data.data">{{ data.data.name }}</span>
            <span v-else v-t="'login-window.label.empty-room'"></span>
          </template>
          <template v-else-if="index === 2">{{ data | system }}</template>
          <template v-else-if="index === 3">{{ data | memberNum }}</template>
          <template v-else-if="index === 4">
            <span v-if="!data.data || !data.data.hasPassword">--</span>
            <span v-else v-t="'label.exist'"></span>
          </template>
          <template v-else-if="index === 5">
            <span
              v-if="
                !data.data || !data.data.extend || !data.data.extend.visitable
              "
              >--</span
            >
            <span v-else v-t="'login-window.label.possible'"></span>
          </template>
          <template v-else-if="index === 6">{{ data | updateDate }}</template>
          <template v-else-if="index === 7">
            <ctrl-button
              :focusable="false"
              @click.stop="deleteRoom(data.order)"
              @dblclick.stop
              :disabled="data | deleteButtonDisabled"
            >
              <span v-t="'button.delete'"></span>
            </ctrl-button>
          </template>
          <template v-else>
            {{ data[colDec.target] }}
          </template>
        </template>
      </table-component>
      <template v-else>
        <version-info-component
          v-if="serverTestResult"
          :serverTestResult="serverTestResult"
        />
      </template>
    </keep-alive>
    <label class="language-select">
      <span class="label-input">Language</span>
      <language-select v-model="language" />
    </label>
    <div class="button-area">
      <ctrl-button @click="createRoom()" :disabled="disabledCreate">
        <span v-t="'button.create-new'"></span>
      </ctrl-button>
      <ctrl-button @click="login()" :disabled="disabledLogin">
        <span v-t="'button.login'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import moment from "moment/moment";
import { Task, TaskResult } from "task";
import * as Cookies from "es-cookie";
import { ModeInfo } from "mode";
import {
  AppServerSettingInput,
  ClientRoomInfo,
  CreateRoomInput,
  CreateRoomRequest,
  DeleteRoomInput,
  DeleteRoomRequest,
  GetRoomListResponse,
  LoginRoomInput,
  LoginWindowInput,
  Message,
  ReleaseTouchRequest,
  RoomLoginRequest,
  RoomViewResponse,
  ServerTestResult,
  TouchRequest,
  UploadMediaInfo,
  UserLoginInput,
  UserLoginRequest,
  UserLoginResponse,
  UserLoginWindowInput
} from "@/@types/socket";
import { AddRoomPresetDataRequest, OriginalTableStore } from "@/@types/room";
import { WindowOpenInfo } from "@/@types/window";
import { sendSystemChatLog } from "@/app/core/utility/ChatUtility";
import {
  LikeStore,
  CutInStore,
  MediaStore,
  SceneStore
} from "@/@types/store-data";
import { DiceMaterial } from "@/@types/store-data-optional";
import { errorDialog, successDialog } from "@/app/core/utility/Utility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import {
  convertNumberNull,
  getExt,
  getUrlParam,
  listToEmpty
} from "@/app/core/utility/PrimaryDataUtility";
import { ConfirmInfo } from "@/app/core/window/ConfirmWindow.vue";
import {
  loadYaml,
  mediaUpload,
  raw2UploadMediaInfoList
} from "@/app/core/utility/FileUtility";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import LanguageSelect from "@/app/basic/common/components/select/LanguageSelect.vue";
import TaskManager from "@/app/core/task/TaskManager";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import LanguageManager from "@/LanguageManager";
import VersionInfoComponent from "@/app/basic/login/VersionInfoComponent.vue";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";

@Component({
  components: {
    VersionInfoComponent,
    LanguageSelect,
    TableComponent,
    CtrlButton
  },
  filters: {
    roomNo: (storeObj: StoreData<ClientRoomInfo>) => storeObj.order,
    system: (storeObj: StoreData<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.system : "",
    memberNum: (storeObj: StoreData<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.memberNum || 0 : 0,
    updateDate: (data: StoreData<ClientRoomInfo>) => {
      if (!data) return "";
      if (!data.data) return "";
      return moment(data.updateTime ? data.updateTime : data.createTime).format(
        "YYYY/MM/DD HH:mm:ss"
      );
    },
    deleteButtonDisabled: (storeObj: StoreData<ClientRoomInfo>) =>
      !storeObj.data ||
      !!storeObj.exclusionOwner ||
      (storeObj.data && storeObj.data.memberNum > 0)
  }
})
export default class LoginWindow extends Mixins<
  WindowVue<LoginWindowInput, never>
>(WindowVue) {
  private roomList: StoreUseData<ClientRoomInfo>[] | null = null;
  private selectedRoomNo: number | null = null;
  private isInputtingServerSetting: boolean = false;
  private roomStatus: "normal" | "processing" | "processingNoneRelease" =
    "normal";
  private message: Message | null = null;
  private serverTestResult: ServerTestResult | null = null;
  private readonly htmlRegExp: RegExp = new RegExp(
    '\\[([^"<>\\]]+)]\\(([^)"<>]+)\\)',
    "g"
  );
  private language: string = LanguageManager.defaultLanguage;
  private urlPassword: string | null = null;
  private urlPlayerName: string | null = null;
  private isNeedRoomCreatePassword: boolean = false;

  @Watch("language")
  private onChangeLanguage() {
    LanguageManager.instance.language = this.language;
  }

  @VueEvent
  private get versionText(): string {
    if (!this.serverTestResult) return "";
    const server = this.serverTestResult.serverVersion.replace(
      "Quoridorn ",
      ""
    );
    const client = process.env.VUE_APP_VERSION;
    return `${server} / ${client}`;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.roomList = this.windowInfo.args!.roomList;
    this.message = this.windowInfo.args!.message;
    this.isNeedRoomCreatePassword = this.windowInfo.args!.isNeedRoomCreatePassword;
    this.serverTestResult = this.windowInfo.args!.serverTestResult;
    this.elm.style.setProperty(
      "--msg-creating",
      `"${this.$t("login-window.label.creating")!.toString()}"`
    );

    await this.procUrlParam();

    if (!this.roomList) {
      this.windowInfo.heightEm -= 10.5;
      this.windowInfo.heightPx += 4;
      this.windowInfo.heightRem += 3;
      this.windowInfo.declare.size!.heightEm -= 10.5;
      this.windowInfo.declare.size!.heightPx += 4;
      this.windowInfo.declare.size!.heightRem += 3;
      this.windowInfo.declare.minSize!.heightEm -= 10.5;
      this.windowInfo.declare.minSize!.heightPx += 4;
      this.windowInfo.declare.minSize!.heightRem += 3;
      this.windowInfo.declare.maxSize!.heightEm -= 10.5;
      this.windowInfo.declare.maxSize!.heightPx += 4;
      this.windowInfo.declare.maxSize!.heightRem += 3;
      // 24em + 2px
      // ↓↓↓
      // 13.5em + 3rem + 6px
      // TODO
      this.elm.style.setProperty(
        "--language-bottom",
        `calc(13.5em + 3.5rem + 9px)`
      );
    } else {
      this.elm.style.setProperty(
        "--language-bottom",
        `calc(24em + 0.5rem + 5px)`
      );
    }
  }

  private get elm(): HTMLElement {
    return this.$refs["window-container"] as HTMLElement;
  }

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.elm.style.setProperty(
      "--msg-creating",
      `"${this.$t("login-window.label.creating")!.toString()}"`
    );
    task.resolve();
  }

  @TaskProcessor("global-enter-finished")
  private async globalEnterFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    await this.playRoom();
    task.resolve();
  }

  @VueEvent
  private async viewTermOfUse() {
    await TaskManager.instance.ignition<
      WindowOpenInfo<{ message: Message }>,
      void
    >({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "terms-of-use-window",
        args: {
          message: this.message!
        }
      }
    });
  }

  @VueEvent
  private async rowEnter() {
    if (!this.disabledLogin) {
      await this.login();
    }
    if (!this.disabledCreate) {
      await this.createRoom();
    }
  }

  @VueEvent
  private async viewVersionInfo() {
    await TaskManager.instance.ignition<WindowOpenInfo<ServerTestResult>, void>(
      {
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "version-info-window",
          args: this.serverTestResult!
        }
      }
    );
  }

  @VueEvent
  private async serverSetting() {
    // 既に入力画面を開いていたら何もしない
    if (this.isInputtingServerSetting) return;

    this.isInputtingServerSetting = true;

    // アプリケーションサーバ設定入力画面
    let appServerSettingInput: AppServerSettingInput;
    try {
      const appServerSettingInputList = await TaskManager.instance.ignition<
        WindowOpenInfo<void>,
        AppServerSettingInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "app-server-setting-window"
        }
      });
      appServerSettingInput = appServerSettingInputList[0];
      this.isInputtingServerSetting = false;
    } catch (err) {
      console.warn(err);
      this.isInputtingServerSetting = false;
      return;
    }

    // 入力画面がキャンセルされていたら中断
    if (!appServerSettingInput) return;

    await SocketFacade.instance.setAppServerUrl(appServerSettingInput.url);
    try {
      const serverInfo = await SocketFacade.instance.socketCommunication<
        string,
        GetRoomListResponse
      >("get-room-list", process.env.VUE_APP_VERSION);
      SocketFacade.instance.socketOn<RoomViewResponse[]>(
        "result-room-view",
        (err, changeList) => {
          changeList.forEach(change => {
            if (change.changeType === "removed") {
              const index = this.roomList!.findIndex(
                info => info.id === change.id
              );
              this.roomList!.splice(index, 1, {
                id: "",
                collection: "rooms",
                key: "",
                order: index,
                ownerType: null,
                owner: null,
                exclusionOwner: null,
                lastExclusionOwner: null,
                permission: null,
                status: null,
                createTime: new Date(),
                updateTime: null,
                refList: []
              });
            } else {
              const index = change.data!.order;
              this.roomList!.splice(index, 1, {
                id: change.id,
                ...change.data!
              });
            }
          });
        }
      );
      let resp: ServerTestResult;
      const url = SocketFacade.instance.appServerUrl;
      try {
        resp = await SocketFacade.instance.testServer(url);
      } catch (err) {
        console.warn(`${err}. url:${url}`);
        return;
      }
      this.serverTestResult = resp;
      if (serverInfo.roomList) {
        if (!this.roomList) this.roomList = [];
        else listToEmpty(this.roomList!);
        serverInfo.roomList.forEach(roomInfo => {
          this.roomList!.push(roomInfo);
        });
      } else {
        this.roomList = null;
      }
      this.message = serverInfo.message;
    } catch (err) {
      console.error(err);
    }
  }

  @VueEvent
  private toHtml(d: string) {
    return d.replace(this.htmlRegExp, `<a href="$2" target="_blank">$1</a>`);
  }

  @VueEvent
  private get disabledCreate(): boolean {
    if (this.roomStatus !== "normal") return true;
    if (this.selectedRoomNo === null) return true;
    if (!this.roomList) return true;
    return !!this.roomList[this.selectedRoomNo].data;
  }

  @VueEvent
  private get disabledLogin(): boolean {
    if (this.roomStatus !== "normal") return true;
    if (this.selectedRoomNo === null) return true;
    if (!this.roomList) return true;
    return !this.roomList[this.selectedRoomNo].data;
  }

  @LifeCycle
  public async beforeDestroy() {
    if (this.roomStatus === "processing") await this.releaseTouchRoom();
  }

  @VueEvent
  private async playRoom() {
    if (!this.disabledLogin) await this.login();
    if (!this.disabledCreate) await this.createRoom();
  }

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {
    if (this.windowInfo.declare.minSize)
      this.windowInfo.declare.minSize.widthPx = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.widthPx = totalWidth;
  }

  @VueEvent
  private async deleteRoom(order: number) {
    // タッチ
    if (!(await this.touchRoom(true, order))) return;

    // 確認画面
    let confirmResult: boolean;
    this.roomStatus = "processing";

    try {
      const confirmResultList = await TaskManager.instance.ignition<
        WindowOpenInfo<ConfirmInfo>,
        boolean
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "confirm-window",
          args: {
            target: "delete-room",
            type: "warning"
          }
        }
      });
      confirmResult = confirmResultList[0];
    } catch (err) {
      console.warn(err);
      await this.releaseTouchRoom(order);
      this.roomStatus = "normal";
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!confirmResult) {
      await this.releaseTouchRoom(order);
      this.roomStatus = "normal";
      return;
    }

    // 部屋削除入力画面
    let deleteRoomInput: DeleteRoomInput;
    try {
      const deleteRoomInputList = await TaskManager.instance.ignition<
        WindowOpenInfo<never>,
        DeleteRoomInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "delete-room-window"
        }
      });
      deleteRoomInput = deleteRoomInputList[0];
    } catch (err) {
      console.warn(err);
      await this.releaseTouchRoom(order);
      this.roomStatus = "normal";
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!deleteRoomInput) {
      await this.releaseTouchRoom(order);
      this.roomStatus = "normal";
      return;
    }

    // 部屋削除リクエストを投げる
    let deleteResult: boolean;
    try {
      deleteResult = await SocketFacade.instance.socketCommunication<
        DeleteRoomRequest,
        boolean
      >("delete-room", {
        roomKey: this.roomList![order].key,
        roomNo: order,
        ...deleteRoomInput
      });
    } catch (err) {
      console.warn(err);
      await this.releaseTouchRoom(order);
      this.roomStatus = "normal";
      return;
    }
    this.roomStatus = "normal";

    setTimeout(() => {
      if (deleteResult) {
        successDialog({
          title: this.$t("button.delete").toString(),
          text: this.$t("login-window.message-list.deleted").toString()
        }).then();
      } else {
        errorDialog({
          title: this.$t("button.delete").toString(),
          text: this.$t("login-window.message-list.delete-failue").toString()
        }).then();
      }
    });
  }

  @VueEvent
  private getRowClasses(data: StoreData<ClientRoomInfo>): string[] {
    const classList: string[] = [];
    if (data.exclusionOwner) {
      classList.push(data.data ? "isEditing" : "isCreating");
    }
    return classList;
  }

  private async touchRoom(
    isModify: boolean,
    roomNo?: number | null
  ): Promise<boolean> {
    if (!roomNo) roomNo = this.selectedRoomNo;
    if (roomNo === null) return false;
    try {
      await SocketFacade.instance.socketCommunication<TouchRequest, never>(
        isModify ? "touch-room-modify" : "touch-room",
        { roomNo }
      );
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  private async releaseTouchRoom(roomNo?: number | null) {
    if (!roomNo) roomNo = this.selectedRoomNo;
    if (roomNo === null) return;
    if (!this.roomList![roomNo].exclusionOwner) return;
    await SocketFacade.instance.socketCommunication<ReleaseTouchRequest, never>(
      "release-touch-room",
      { roomNo }
    );
  }

  /** ====================================================================================================
   * 部屋を作成する
   */
  @VueEvent
  private async createRoom() {
    if (this.selectedRoomNo === null) {
      await errorDialog({
        title: this.$t("message.error").toString(),
        text: "部屋を選択してから新規作成をしてください。"
      });
      return;
    }

    // タッチ
    if (!(await this.touchRoom(false))) return;
    this.roomStatus = "processing";

    /* ----------------------------------------------------------------------
     * 部屋情報入力画面
     */
    let createRoomInput: CreateRoomInput;
    try {
      const roomInfoList = await TaskManager.instance.ignition<
        WindowOpenInfo<boolean>,
        CreateRoomInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "create-new-room-window",
          args: this.isNeedRoomCreatePassword
        }
      });
      createRoomInput = roomInfoList[0];
    } catch (err) {
      console.warn(err);
      await this.releaseTouchRoom();
      this.roomStatus = "normal";
      return;
    }

    if (!createRoomInput) {
      // 入力画面キャンセル
      await this.releaseTouchRoom();
      this.roomStatus = "normal";
      return;
    }

    /* ----------------------------------------------------------------------
     * ユーザログイン画面
     */
    let userLoginInput: UserLoginInput;
    try {
      const userLoginInputList = await TaskManager.instance.ignition<
        WindowOpenInfo<UserLoginWindowInput>,
        UserLoginInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "user-login-window",
          args: {
            isSetting: true,
            visitable: createRoomInput.extend.visitable,
            nameList: [],
            name: ""
          }
        }
      });
      userLoginInput = userLoginInputList[0];

      if (!userLoginInput) {
        // 入力画面キャンセル
        await this.releaseTouchRoom();
        this.roomStatus = "normal";
        return;
      }
    } catch (err) {
      console.warn(err);
      await this.releaseTouchRoom();
      this.roomStatus = "normal";
      return;
    }

    const roomKey = this.roomList![this.selectedRoomNo].key;

    /* ----------------------------------------------------------------------
     * 部屋の使用準備
     */
    this.roomStatus = "processingNoneRelease";
    await this.close();
    performance.mark("room-init-start");
    this.roomStatus = "processing";

    await LoginWindow.viewProcessView("creating-room");

    /* ----------------------------------------------------------------------
     * 部屋作成リクエスト
     */
    try {
      SocketFacade.instance.roomCollectionPrefix = await SocketFacade.instance.socketCommunication<
        CreateRoomRequest,
        string
      >("create-room", {
        roomKey,
        roomNo: this.selectedRoomNo,
        ...createRoomInput
      });
    } catch (err) {
      console.warn(err);
      await errorDialog({
        title: err.name,
        text: err.detail
      });

      await LoginWindow.viewProcessView("");

      await TaskManager.instance.ignition<
        WindowOpenInfo<LoginWindowInput>,
        never
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "login-window",
          args: {
            roomList: this.roomList,
            message: this.message!,
            serverTestResult: this.serverTestResult!,
            isNeedRoomCreatePassword: this.isNeedRoomCreatePassword
          }
        }
      });

      return;
    }

    await LoginWindow.viewProcessView("entering-room");

    /* ----------------------------------------------------------------------
     * ログインリクエスト
     */
    let userLoginResponse: UserLoginResponse;
    try {
      userLoginResponse = await SocketFacade.instance.socketCommunication<
        UserLoginRequest,
        UserLoginResponse
      >("user-login", userLoginInput);
    } catch (err) {
      console.warn(err);
      await errorDialog({
        title: "ログイン失敗",
        text: ""
      });

      await LoginWindow.viewProcessView("");

      SocketFacade.instance.roomCollectionPrefix = null;

      await TaskManager.instance.ignition<
        WindowOpenInfo<LoginWindowInput>,
        never
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "login-window",
          args: {
            roomList: this.roomList,
            message: this.message!,
            serverTestResult: this.serverTestResult!,
            isNeedRoomCreatePassword: this.isNeedRoomCreatePassword
          }
        }
      });

      return;
    }

    SocketFacade.instance.userKey = userLoginResponse.userKey;
    Cookies.set(`${roomKey}/${userLoginInput.name}`, userLoginResponse.token, {
      expires: 365
    });

    await LoginWindow.viewProcessView("add-preset-room");

    try {
      await this.addPresetData(createRoomInput);
    } catch (err) {
      await errorDialog({
        title: "Error",
        text: err.message
      });
    }

    await LoginWindow.viewProcessView("last-process-room");

    await GameObjectManager.instance.initialize();

    const params = new URLSearchParams();
    params.append("no", this.selectedRoomNo.toString(10));
    params.append("player", userLoginInput.name);
    window.history.replaceState("", "", `?${params.toString()}`);

    const msg = this.$t("message.login-text")
      .toString()
      .replace("{0}", `${userLoginInput.name}`);
    await sendSystemChatLog(msg);

    await TaskManager.instance.ignition<void, void>({
      type: "room-initialize",
      owner: "Quoridorn",
      value: null
    });
  }

  private static async viewProcessView(msgTarget: string | null) {
    const message: string = msgTarget
      ? LanguageManager.instance.getText(`message.${msgTarget}`)
      : "";
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "view-progress",
        value: { message, all: 0, current: 0 }
      }
    });
  }

  private async procUrlParam() {
    const no: number | null = convertNumberNull(getUrlParam("no"));

    if (this.roomList && no !== null && 0 <= no && no < this.roomList.length) {
      this.selectedRoomNo = no;
      this.urlPassword = getUrlParam("password");
      this.urlPlayerName = getUrlParam("player");

      if (this.urlPlayerName) {
        // const roomKey = this.roomList.filter(r => r.order === no)[0].key;
        // const cookieToken = Cookies.get(`${roomKey}/${this.urlPlayerName}`);
        // console.log(`token: ${cookieToken}`);
      } else {
        if (!this.disabledLogin) await this.login();
      }
      return;
    }
    window.history.replaceState("", "", "");
  }

  /** ====================================================================================================
   * ログイン
   */
  @VueEvent
  private async login() {
    if (this.selectedRoomNo === null) {
      await errorDialog({
        title: this.$t("message.error").toString(),
        text: "部屋を選択してからログインをしてください。"
      });
      return;
    }

    // タッチ
    if (!(await this.touchRoom(true))) return;

    this.roomStatus = "processing";

    let loginRoomInput: LoginRoomInput;
    if (this.urlPassword !== null) {
      loginRoomInput = {
        roomPassword: this.urlPassword
      };
    } else {
      /* ----------------------------------------------------------------------
       * 部屋情報入力画面
       */
      try {
        const loginRoomInputList = await TaskManager.instance.ignition<
          WindowOpenInfo<never>,
          LoginRoomInput
        >({
          type: "window-open",
          owner: "Quoridorn",
          value: {
            type: "login-room-window"
          }
        });
        loginRoomInput = loginRoomInputList[0];

        if (!loginRoomInput) {
          // 入力画面キャンセル
          await this.releaseTouchRoom();
          this.roomStatus = "normal";
          return;
        }
      } catch (err) {
        console.warn(err);
        await this.releaseTouchRoom();
        this.roomStatus = "normal";
        return;
      }
    }

    const roomKey = this.roomList![this.selectedRoomNo].key;

    /* ----------------------------------------------------------------------
     * 部屋ログインリクエスト
     */
    try {
      SocketFacade.instance.roomCollectionPrefix = await SocketFacade.instance.socketCommunication<
        RoomLoginRequest,
        string
      >("room-login", {
        roomKey,
        roomNo: this.selectedRoomNo,
        ...loginRoomInput
      });
    } catch (err) {
      console.warn(err);
      await errorDialog({
        title: "ログイン失敗",
        text: ""
      });
      this.roomStatus = "normal";
      return;
    }

    /* ----------------------------------------------------------------------
     * ユーザログイン画面
     */
    let userLoginInput: UserLoginInput;
    try {
      const userLoginInputList = await TaskManager.instance.ignition<
        WindowOpenInfo<UserLoginWindowInput>,
        UserLoginInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "user-login-window",
          args: {
            isSetting: false,
            visitable: true, // TODO 見学者可否を取得する
            nameList: (await SocketFacade.instance.userCC().getList(true)).map(
              userData => userData.data!.name
            ),
            name: this.urlPlayerName
          }
        }
      });
      userLoginInput = userLoginInputList[0];

      if (!userLoginInput) {
        // 入力画面キャンセル
        this.roomStatus = "normal";
        return;
      }
    } catch (err) {
      console.warn(err);
      this.roomStatus = "normal";
      return;
    }

    /* ----------------------------------------------------------------------
     * ログインリクエスト
     */
    let userLoginResponse: UserLoginResponse;
    try {
      userLoginResponse = await SocketFacade.instance.socketCommunication<
        UserLoginRequest,
        UserLoginResponse
      >("user-login", userLoginInput);
    } catch (err) {
      console.warn(err);
      await errorDialog({
        title: "ログイン失敗",
        text: ""
      });
      this.roomStatus = "normal";
      SocketFacade.instance.roomCollectionPrefix = null;
      return;
    }
    this.roomStatus = "normal";
    SocketFacade.instance.userKey = userLoginResponse.userKey;
    Cookies.set(`${roomKey}/${userLoginInput.name}`, userLoginResponse.token, {
      expires: 365
    });

    /* ----------------------------------------------------------------------
     * 部屋の使用準備
     */
    await this.close();
    performance.mark("room-init-start");
    await LoginWindow.viewProcessView("entering-room");

    await GameObjectManager.instance.initialize();

    const params = new URLSearchParams();
    params.append("no", this.selectedRoomNo.toString(10));
    params.append("player", userLoginInput.name);
    window.history.replaceState("", "", `?${params.toString()}`);

    const msg = this.$t("message.login-text")
      .toString()
      .replace("{0}", `${userLoginInput.name}`);
    await sendSystemChatLog(msg);

    await TaskManager.instance.ignition<void, void>({
      type: "room-initialize",
      owner: "Quoridorn",
      value: null
    });
  }

  /**
   * 部屋の初期データをDBに投入する
   *
   * @param createRoomInput
   */
  private async addPresetData(createRoomInput: CreateRoomInput) {
    /* --------------------------------------------------
     * メディアデータを用意する
     */
    // 読み込み必須のためthrowは伝搬させる
    const mediaDataList = await loadYaml<
      (Partial<MediaStore> & { preKey?: string })[]
    >("static/conf/media.yaml");

    mediaDataList.forEach(media => {
      if (!media.tag) media.tag = "";
    });

    /* --------------------------------------------------
     * カットインデータを用意する
     */
    // 読み込み必須のためthrowは伝搬させる
    const cutInDataList = await loadYaml<CutInStore[]>(
      "static/conf/cut-in.yaml"
    );

    // ダイスデータを用意する
    const diceMaterial = await loadYaml<DiceMaterial>("static/conf/dice.yaml");
    (Object.keys(diceMaterial) as (keyof DiceMaterial)[]).forEach(faceNum => {
      const diceSetList = diceMaterial[faceNum];
      diceSetList.forEach(diceSet => {
        const diceSetType = diceSet.type;
        const diceSetPips = diceSet.pips;
        (Object.keys(diceSetPips) as string[]).forEach(pips => {
          const url = diceSetPips[pips];
          mediaDataList.push({
            name: `dice-${faceNum}-${diceSetType}-${pips}.${getExt(url)}`,
            tag: "dice",
            url
          });
        });
      });
    });

    const uploadMediaInfoList = await raw2UploadMediaInfoList(
      mediaDataList.map(md => md.url!)
    );
    uploadMediaInfoList.forEach((umi: UploadMediaInfo, index: number) => {
      const mediaData = mediaDataList[index];
      if (mediaData.name !== undefined) umi.name = mediaData.name;
      if (mediaData.tag !== undefined) umi.tag = mediaData.tag;
    });

    const uploadMediaResponse = await mediaUpload({
      uploadMediaInfoList,
      option: { ownerType: null, owner: null }
    });

    uploadMediaResponse.forEach(umr => {
      if (umr.tag === "dice" && umr.urlType === "image") {
        const nameSplit = umr.name.split("-");
        if (nameSplit.length < 4) return;
        if (nameSplit.shift() !== "dice") return;
        const faceNum = nameSplit.shift()!;
        const pips = nameSplit.pop()!.replace(/\..+/, "");
        const diceType = nameSplit.join("-");
        diceMaterial[faceNum].find(dm => dm.type === diceType)!.pips[pips] =
          umr.key;
      }
    });

    const getMediaKey = (preKey: string | null): string | null => {
      if (!preKey) return null;
      const media = mediaDataList.find(m => m.preKey === preKey);
      if (media) {
        const rawUrl = media.url;
        const uploadMedia = uploadMediaResponse.find(
          umr => umr.rawPath === rawUrl
        );
        if (uploadMedia) {
          return uploadMedia.key;
        }
      }
      return null;
    };

    cutInDataList.forEach(cutIn => {
      cutIn.duration = 0;
      cutIn.imageKey = getMediaKey(cutIn.imageKey);
      cutIn.isUseImage = !!cutIn.imageKey;
      cutIn.bgmKey = getMediaKey(cutIn.bgmKey);
      cutIn.isUseBgm = !!cutIn.bgmKey;
    });

    const firstImageInfo = uploadMediaResponse.find(
      umr => umr.urlType === "image"
    )!;

    /* --------------------------------------------------
     * マップデータのプリセットデータを用意する
     */
    const scene: SceneStore = {
      name: "A-1",
      columns: 20,
      rows: 15,
      gridSize: 50,
      gridColor: "#000000",
      fontColor: "#000000",
      portTileMapping: "",
      switchBefore: {
        priority: 1,
        direction: "normal"
      },
      switchAfter: {
        priority: 1,
        direction: "normal"
      },
      shapeType: "square",
      texture: {
        type: "image",
        mediaTag: firstImageInfo.tag,
        mediaKey: firstImageInfo.key,
        direction: "none",
        backgroundSize: "100%"
      },
      background: {
        texture: {
          type: "image",
          mediaTag: firstImageInfo.tag,
          mediaKey: firstImageInfo.key,
          direction: "none",
          backgroundSize: "100%"
        },
        maskBlur: 3
      },
      margin: {
        useTexture: "original",
        texture: {
          type: "image",
          mediaTag: firstImageInfo.tag,
          mediaKey: firstImageInfo.key,
          direction: "none",
          backgroundSize: "100%"
        },
        columns: 5,
        rows: 5,
        isUseGrid: true,
        gridColorBold: "rgba(255, 255, 255, 0.3)",
        gridColorThin: "rgba(255, 255, 255, 0.1)",
        maskColor: "rgba(20, 80, 20, 0.1)",
        maskBlur: 3,
        border: {
          width: 10,
          color: "gray",
          style: "ridge"
        }
      },
      chatLinkage: 0,
      chatLinkageSearch: ""
    };

    const createLike = (char: string, isThrowLinkage: boolean): LikeStore => ({
      char,
      isThrowLinkage,
      linkageResourceKey: null
    });
    const likeList: LikeStore[] = [
      createLike("💗", true),
      createLike("💐", true),
      createLike("✨", false)
    ];

    const bcdiceServer = createRoomInput.bcdiceServer;
    const bcdiceVersion = createRoomInput.bcdiceVersion;

    const diceSystemMap = await BcdiceManager.instance.getDiceSystemMap(
      bcdiceServer,
      bcdiceVersion
    );
    const systemList = Array.from(diceSystemMap.values()).map(ds => ds.system);
    const originalTableList: OriginalTableStore[] = [];
    const loadOriginalTableYaml = async (system: string): Promise<void> => {
      const path = `static/conf/system/${system}/originalTable.yaml`;
      try {
        // トライアンドエラー方式読み込みのため、throwは握りつぶす
        const list = await loadYaml<OriginalTableStore[]>(path, true);
        list.forEach(cdb => {
          cdb.system = system;
          if (!cdb.bcdiceServer) cdb.bcdiceServer = bcdiceServer;
          if (!cdb.bcdiceVersion) cdb.bcdiceVersion = bcdiceVersion;
          Object.keys(cdb.tableContents).forEach(
            key => (cdb.tableContents[key] = cdb.tableContents[key].trim())
          );
        });
        originalTableList.push(...list);
      } catch (err) {
        // Nothing.
      }
    };
    const modInfoList = await loadYaml<
      { system: string; originalTable: boolean }[]
    >("static/conf/system/mod-list.yaml");
    await systemList
      .filter(system =>
        modInfoList.some(mi => mi.system === system && mi.originalTable)
      )
      .map(system => () => loadOriginalTableYaml(system))
      .reduce((prev, curr) => prev.then(curr), Promise.resolve());

    /* --------------------------------------------------
     * 部屋データのプリセットデータ投入
     */
    await SocketFacade.instance.socketCommunication<
      AddRoomPresetDataRequest,
      void
    >("add-room-preset-data", {
      roomName: createRoomInput.name,
      bcdiceServer: bcdiceServer, // BCDiceサーバー
      bcdiceVersion: bcdiceVersion, // BCDiceAPIバージョン
      system: createRoomInput.system, // BCDiceSystem
      roomExtendInfo: createRoomInput.extend,
      sceneData: scene,
      cutInDataList,
      diceMaterial,
      likeList,
      originalTableList,
      language: {
        mainChatTabName: LanguageManager.instance.getText("label.main"),
        allGroupChatTabName: LanguageManager.instance.getText(
          "label.target-all"
        ),
        nameLabel: LanguageManager.instance.getText("label.name")
      }
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.root {
  @include flex-box(column, stretch, flex-start);
  position: relative;
  height: 100%;

  .language-select {
    position: absolute;
    bottom: var(--language-bottom);
    right: 0;
  }

  .message-scroll-area {
    overflow-y: auto;
    border: 1px solid gray;
    margin-bottom: 0.5rem;
    flex: 1;
    background-color: var(--uni-color-white);
    background-image: url("https://quoridorn.com/img/mascot/normal/mascot_normal.png");
    background-size: 18rem;
    background-position: top 2rem right var(--scroll-bar-width);
    background-repeat: no-repeat;

    .logo {
      position: absolute;
      top: 0.4rem;
      right: calc(var(--scroll-bar-width) + 0.5rem);
      width: 8rem;
    }

    .message-documents {
      @include flex-box(column, flex-start, center);

      .welcome {
        font-size: 80%;
        margin-top: 0.5em;
        margin-left: 1em;
        margin-right: 1rem;
        align-self: flex-end;
      }

      .flat-button {
        @include flex-box(row, center, center);
        padding: 0.3rem 0.8rem;
        border-radius: 0.5em;
        cursor: pointer;

        &:hover {
          text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.66);
          box-shadow: inset 0 0 0 rgba(255, 255, 255, 0.5),
            0 2px 2px rgba(0, 0, 0, 0.19);
          background-color: var(--uni-color-light-skyblue);
        }

        &:active {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 1px 2px rgba(0, 0, 0, 0.19);
          border-bottom: none;
          transform: translateY(1px);
        }
      }

      .term-of-use,
      .version-info {
        margin-top: 0.2rem;
        margin-left: 0.2rem;
        font-size: 90%;
        line-height: 2em;
      }

      .version-info {
        &:not(:hover) .hovering {
          display: none;
        }
        &:hover .normal {
          display: none;
        }
      }

      .title-contents {
        margin-top: 0;
        margin-left: 3rem;
        font-size: 110%;

        .icon-cog {
          @include inline-flex-box(row, center, center);
          color: var(--uni-color-gray);
          margin-left: 0.3rem;
        }
      }

      ul {
        position: relative;
        font-size: 80%;
        padding-left: 2rem;
        width: 100%;
        box-sizing: border-box;

        li {
          width: 100%;
          line-height: 1.6;

          span {
            background-color: rgba(255, 255, 255, 0.6);
            white-space: pre-wrap;
            line-break: normal;
            word-wrap: normal;
          }
        }
      }
    }
  }
}
</style>
