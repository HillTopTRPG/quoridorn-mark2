<template>
  <div class="root" ref="window-container">
    <div class="message-scroll-area selectable" v-if="message">
      <img
        class="logo"
        src="http://quoridorn.com/img/bg_white_4c.svg"
        alt="logo"
        draggable="false"
      />
      <div class="message-documents">
        <div class="h-box">
          <div class="term-of-use flat-button" @click="viewTermOfUse()">
            <span v-t="'label.terms-of-use'"></span>
          </div>
          <div
            class="version-info flat-button"
            v-if="roomList"
            @click="viewVersionInfo()"
          >
            <span class="normal" v-t="'label.version-info'"></span>
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
        :selectLock="isInputtingRoomInfo"
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
            <span v-else v-t="'label.empty-room'"></span>
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
            <span v-else v-t="'label.possible'"></span>
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
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { Mixins } from "vue-mixin-decorator";
import moment from "moment/moment";
import {
  CreateRoomInput,
  CreateRoomRequest,
  ClientRoomInfo,
  ReleaseTouchRequest,
  TouchRequest,
  UserLoginInput,
  GetRoomListResponse,
  Message,
  AppServerSettingInput,
  RoomViewResponse,
  DeleteRoomInput,
  DeleteRoomRequest,
  LoginRoomInput,
  UserLoginWindowInput,
  UserLoginRequest,
  RoomLoginRequest,
  UserLoginResponse,
  LoginWindowInput,
  ServerTestResult
} from "@/@types/socket";
import { StoreObj, StoreUseData } from "@/@types/store";
import TaskManager from "@/app/core/task/TaskManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { WindowOpenInfo } from "@/@types/window";
import { ConfirmInfo } from "@/app/core/window/ConfirmWindow.vue";
import LanguageSelect from "@/app/basic/common/components/select/LanguageSelect.vue";
import LanguageManager from "@/LanguageManager";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { loadYaml } from "@/app/core/File";
import {
  convertNumber,
  getFileNameArgList,
  getUrlParam
} from "@/app/core/Utility";
import {
  Scene,
  RoomData,
  SceneLayerType,
  Image,
  CutInDeclareInfo
} from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import * as Cookies from "es-cookie";
import VersionInfoComponent from "@/app/basic/login/VersionInfoComponent.vue";
import { ModeInfo } from "mode";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";

@Component({
  components: {
    VersionInfoComponent,
    LanguageSelect,
    TableComponent,
    CtrlButton
  },
  filters: {
    roomNo: (storeObj: StoreObj<ClientRoomInfo>) => storeObj.order,
    system: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.system : "",
    memberNum: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.memberNum || 0 : 0,
    updateDate: (data: StoreObj<ClientRoomInfo>) => {
      if (!data) return "";
      if (!data.data) return "";
      return moment(data.updateTime ? data.updateTime : data.createTime).format(
        "YYYY/MM/DD HH:mm:ss"
      );
    },
    deleteButtonDisabled: (storeObj: StoreObj<ClientRoomInfo>) =>
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
  private isInputtingRoomInfo: boolean = false;
  private message: Message | null = null;
  private serverTestResult: ServerTestResult | null = null;
  private readonly htmlRegExp: RegExp = new RegExp(
    '\\[([^"<>]]+)]\\(([^)"<>]+)\\)',
    "g"
  );
  private language: string = LanguageManager.instance.defaultLanguage;
  private urlPassword: string | null = null;
  private urlPlayerName: string | null = null;

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
    this.serverTestResult = this.windowInfo.args!.serverTestResult;
    this.elm.style.setProperty(
      "--msg-creating",
      `"${LanguageManager.instance.getText("label.creating")}"`
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
      `"${LanguageManager.instance.getText("label.creating")}"`
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
      window.console.log(appServerSettingInputList);
      appServerSettingInput = appServerSettingInputList[0];
      this.isInputtingServerSetting = false;
    } catch (err) {
      window.console.warn(err);
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
                order: index,
                exclusionOwner: null,
                lastExclusionOwner: null,
                owner: null,
                permission: null,
                status: null,
                createTime: new Date(),
                updateTime: null,
                id: null
              });
            } else {
              const index = change.data!.order;
              this.roomList!.splice(index, 1, {
                ...change.data!,
                id: change.id
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
        window.console.warn(`${err}. url:${url}`);
        return;
      }
      this.serverTestResult = resp;
      if (serverInfo.roomList) {
        if (!this.roomList) this.roomList = [];
        else this.roomList!.splice(0, this.roomList!.length);
        serverInfo.roomList.forEach(
          (roomInfo: StoreUseData<ClientRoomInfo>) => {
            this.roomList!.push(roomInfo);
          }
        );
      } else {
        this.roomList = null;
      }
      this.message = serverInfo.message;
    } catch (err) {
      window.console.error(err);
    }
  }

  @VueEvent
  private toHtml(d: string) {
    return d.replace(this.htmlRegExp, `<a href="$2" target="_blank">$1</a>`);
  }

  @VueEvent
  private get disabledCreate(): boolean {
    if (this.isInputtingRoomInfo) return true;
    if (this.selectedRoomNo === null) return true;
    if (!this.roomList) return true;
    return !!this.roomList[this.selectedRoomNo].data;
  }

  @VueEvent
  private get disabledLogin(): boolean {
    if (this.isInputtingRoomInfo) return true;
    if (this.selectedRoomNo === null) return true;
    if (!this.roomList) return true;
    return !this.roomList[this.selectedRoomNo].data;
  }

  @LifeCycle
  public async beforeDestroy() {
    await this.releaseTouchRoom();
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
    window.console.log(this.selectedRoomNo, order);

    this.isInputtingRoomInfo = true;

    // タッチ
    if (!(await this.touchRoom(true, order))) {
      this.isInputtingRoomInfo = false;
      return;
    }

    // 確認画面
    let confirmResult: boolean;
    this.isInputtingRoomInfo = true;
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
      window.console.warn(err);
      await this.releaseTouchRoom(order);
      this.isInputtingRoomInfo = false;
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!confirmResult) {
      await this.releaseTouchRoom(order);
      this.isInputtingRoomInfo = false;
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
      window.console.warn(err);
      await this.releaseTouchRoom(order);
      return;
    } finally {
      this.isInputtingRoomInfo = false;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!deleteRoomInput) {
      await this.releaseTouchRoom(order);
      return;
    }

    // 部屋削除リクエストを投げる
    let deleteResult: boolean;
    try {
      deleteResult = await SocketFacade.instance.socketCommunication<
        DeleteRoomRequest,
        boolean
      >("delete-room", {
        roomId: this.roomList![order].id!,
        roomNo: order,
        ...deleteRoomInput
      });
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom(order);
      this.isInputtingRoomInfo = false;
      return;
    }
    setTimeout(() => {
      alert(
        deleteResult ? "部屋を削除しました。" : "部屋の削除に失敗しました。"
      );
    });
  }

  @VueEvent
  private getRowClasses(data: StoreUseData<ClientRoomInfo>): string[] {
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
      window.console.warn(err);
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
      alert("部屋を選択してから新規作成をしてください。");
      return;
    }

    this.isInputtingRoomInfo = true;

    // タッチ
    if (!(await this.touchRoom(false))) {
      this.isInputtingRoomInfo = false;
      return;
    }

    /* ----------------------------------------------------------------------
     * 部屋情報入力画面
     */
    let createRoomInput: CreateRoomInput;
    try {
      const roomInfoList = await TaskManager.instance.ignition<
        WindowOpenInfo<never>,
        CreateRoomInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "create-new-room-window"
        }
      });
      createRoomInput = roomInfoList[0];

      if (!createRoomInput) {
        // 入力画面キャンセル
        await this.releaseTouchRoom();
        this.isInputtingRoomInfo = false;
        return;
      }
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
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
            userNameList: [],
            userName: ""
          }
        }
      });
      userLoginInput = userLoginInputList[0];

      if (!userLoginInput) {
        // 入力画面キャンセル
        await this.releaseTouchRoom();
        return;
      }
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
      return;
    } finally {
      this.isInputtingRoomInfo = false;
    }

    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "create-room",
        value: "on"
      }
    });

    window.console.log(this.selectedRoomNo);
    const roomId = this.roomList![this.selectedRoomNo].id!;

    /* ----------------------------------------------------------------------
     * 部屋作成リクエスト
     */
    try {
      SocketFacade.instance.roomCollectionPrefix = await SocketFacade.instance.socketCommunication<
        CreateRoomRequest,
        string
      >("create-room", {
        roomId,
        roomNo: this.selectedRoomNo,
        ...createRoomInput
      });
    } catch (err) {
      window.console.warn(err);

      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "create-room",
          value: "off"
        }
      });
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
      window.console.warn(err);
      alert("ログイン失敗");
      SocketFacade.instance.roomCollectionPrefix = null;

      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "create-room",
          value: "off"
        }
      });
      return;
    }
    SocketFacade.instance.userId = userLoginResponse.userId;
    Cookies.set(
      `${roomId}/${userLoginInput.userName}`,
      userLoginResponse.token,
      {
        expires: 365
      }
    );

    /* ----------------------------------------------------------------------
     * 部屋の使用準備
     */
    await this.close();

    await this.addPresetData();

    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "create-room",
        value: "off"
      }
    });

    const loginResult: ClientRoomInfo = {
      name: createRoomInput.name,
      system: createRoomInput.system,
      extend: createRoomInput.extend,
      memberNum: 0,
      hasPassword: !!createRoomInput.roomPassword,
      roomNo: this.selectedRoomNo
    };
    await GameObjectManager.instance.setClientRoomInfo(loginResult);

    const params = new URLSearchParams();
    params.append("no", loginResult.roomNo.toString(10));
    params.append("player", userLoginInput.userName);
    window.history.replaceState("", "", `?${params.toString()}`);

    await TaskManager.instance.ignition<ClientRoomInfo, void>({
      type: "room-initialize",
      owner: "Quoridorn",
      value: loginResult
    });
  }

  private async procUrlParam() {
    const no: number | null = convertNumber(getUrlParam("no"));

    if (this.roomList && no !== null && 0 <= no && no < this.roomList.length) {
      this.selectedRoomNo = no;
      this.urlPassword = getUrlParam("password");
      this.urlPlayerName = getUrlParam("player");

      if (this.urlPlayerName) {
        const roomId = this.roomList.filter(r => r.order === no)[0].id;
        const cookieToken = Cookies.get(`${roomId}/${this.urlPlayerName}`);
        window.console.log(`token: ${cookieToken}`);
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
      alert("部屋を選択してからログインをしてください。");
      return;
    }

    this.isInputtingRoomInfo = true;

    // タッチ
    if (!(await this.touchRoom(true))) {
      this.isInputtingRoomInfo = false;
      return;
    }

    let loginRoomInput: LoginRoomInput;
    if (this.urlPassword !== null) {
      loginRoomInput = {
        roomPassword: this.urlPassword
      };
    } else {
      /* ----------------------------------------------------------------------
       * 部屋情報入力画面
       */
      this.isInputtingRoomInfo = true;
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
          this.isInputtingRoomInfo = false;
          return;
        }
      } catch (err) {
        window.console.warn(err);
        await this.releaseTouchRoom();
        this.isInputtingRoomInfo = false;
        return;
      }
    }

    const roomId = this.roomList![this.selectedRoomNo].id!;

    /* ----------------------------------------------------------------------
     * 部屋ログインリクエスト
     */
    try {
      SocketFacade.instance.roomCollectionPrefix = await SocketFacade.instance.socketCommunication<
        RoomLoginRequest,
        string
      >("room-login", {
        roomId,
        roomNo: this.selectedRoomNo,
        ...loginRoomInput
      });
    } catch (err) {
      window.console.warn(err);
      alert("ログイン失敗");
      if (this.urlPassword !== null) {
        // TODO URLパラメータによる自動部屋ログイン時のログイン失敗の場合の処理
      }
      this.isInputtingRoomInfo = false;
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
            userNameList: (
              await SocketFacade.instance.userCC().getList(false)
            ).map(userData => userData.data!.userName),
            userName: this.urlPlayerName
          }
        }
      });
      userLoginInput = userLoginInputList[0];

      if (!userLoginInput) {
        // 入力画面キャンセル
        // TODO 部屋ログアウト
        this.isInputtingRoomInfo = false;
        return;
      }
    } catch (err) {
      window.console.warn(err);
      // TODO 部屋ログアウト
      this.isInputtingRoomInfo = false;
      return;
    }

    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "create-room",
        value: "on"
      }
    });

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
      window.console.warn(err);
      alert("ログイン失敗");
      SocketFacade.instance.roomCollectionPrefix = null;
      return;
    } finally {
      this.isInputtingRoomInfo = false;
      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "create-room",
          value: "off"
        }
      });
    }
    SocketFacade.instance.userId = userLoginResponse.userId;
    Cookies.set(
      `${roomId}/${userLoginInput.userName}`,
      userLoginResponse.token,
      {
        expires: 365
      }
    );

    /* ----------------------------------------------------------------------
     * 部屋の使用準備
     */
    await this.close();

    const loginResult: ClientRoomInfo = this.roomList![this.selectedRoomNo]
      .data!;
    loginResult.roomNo = this.selectedRoomNo;
    await GameObjectManager.instance.setClientRoomInfo(loginResult);

    const params = new URLSearchParams();
    params.append("no", loginResult.roomNo.toString(10));
    params.append("player", userLoginInput.userName);
    window.history.replaceState("", "", `?${params.toString()}`);

    await TaskManager.instance.ignition<ClientRoomInfo, void>({
      type: "room-initialize",
      owner: "Quoridorn",
      value: loginResult
    });
  }

  private async addPresetData() {
    const imageList: Image[] = await loadYaml<Image[]>(
      "./static/conf/image.yaml"
    );
    const imageTagList: string[] = await loadYaml<string[]>(
      "./static/conf/imageTag.yaml"
    );
    imageList.forEach((image: Image) => {
      if (!image.tag)
        image.tag = imageTagList.length ? imageTagList[0] : "default";
      if (image.standImageInfo) {
        // 立ち絵パラメータの値を正しく設定
        const si = image.standImageInfo;
        if (!si.status) si.status = "";
        if (si.type !== "pile" && si.type !== "replace") si.type = "pile";
        if (
          si.viewStart === undefined ||
          si.viewStart < 0 ||
          si.viewStart > 100
        )
          si.viewStart = 0;
        if (si.viewEnd === undefined || si.viewEnd < 0 || si.viewEnd > 100)
          si.viewEnd = 100;
      } else {
        // 立ち絵パラメータを推測＆設定
        image.standImageInfo = getFileNameArgList(image.data) || null;
      }

      const regExp = new RegExp("[ 　]+", "g");
      const tagStrList = image.tag.split(regExp);
      tagStrList.forEach((tagStr: string) => {
        const imageTag: string = imageTagList.filter(
          (imageTag: string) => imageTag === tagStr
        )[0];
        if (!imageTag) imageTagList.push(tagStr);
      });
    });

    /* --------------------------------------------------
     * 画像タグのプリセットデータ投入
     */
    const imageTagCC = SocketFacade.instance.imageTagCC();
    await imageTagCC.addDirect(imageTagList);

    /* --------------------------------------------------
     * 画像データのプリセットデータ投入
     */
    const imageDataCC = SocketFacade.instance.imageDataCC();
    const docIdList = await imageDataCC.addDirect(imageList);

    const imageId: string = docIdList[0];

    /* --------------------------------------------------
     * BGMデータのプリセットデータ投入
     */
    const bgmList: CutInDeclareInfo[] = await loadYaml("/static/conf/bgm.yaml");
    const cutInDataCC = SocketFacade.instance.cutInDataCC();

    await cutInDataCC.addDirect(bgmList);

    /* --------------------------------------------------
     * マップデータのプリセットデータ投入
     */
    const scene: Scene = {
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
        imageTag: imageList[0].tag,
        imageId: imageId!,
        direction: "none",
        backgroundSize: "100%"
      },
      background: {
        texture: {
          type: "image",
          imageTag: imageList[0].tag,
          imageId: imageId!,
          direction: "none",
          backgroundSize: "100%"
        },
        maskBlur: 3
      },
      margin: {
        useTexture: "original",
        texture: {
          type: "image",
          imageTag: imageList[0].tag,
          imageId: imageId!,
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
    const addMapResult = await GameObjectManager.instance.addScene(scene);

    /* --------------------------------------------------
     * マップレイヤーのプリセットデータ投入
     */
    const addSceneLayer = async (
      type: SceneLayerType,
      defaultOrder: number
    ) => {
      await GameObjectManager.instance.addSceneLayer({
        type,
        defaultOrder,
        isSystem: true
      });
    };
    await addSceneLayer("floor-tile", 1);
    await addSceneLayer("map-mask", 2);
    await addSceneLayer("map-marker", 3);
    await addSceneLayer("dice-symbol", 4);
    await addSceneLayer("character", 5);

    /* --------------------------------------------------
     * 部屋データのプリセットデータ投入
     */
    const roomDataCC = SocketFacade.instance.roomDataCC();

    const roomData: RoomData = {
      sceneId: addMapResult.sceneId,
      isDrawGridLine: true,
      isDrawGridId: true,
      isFitGrid: true,
      isUseRotateMarker: true
    };
    Object.assign(GameObjectManager.instance.roomData, roomData);
    const roomDataId = (await roomDataCC.addDirect([roomData]))[0];
    await roomDataCC.setSnapshot(
      this.key,
      roomDataId,
      (snapshot: DocumentSnapshot<StoreObj<RoomData>>) => {
        if (snapshot.exists() && snapshot.data.status === "modified") {
          Object.assign(
            GameObjectManager.instance.roomData,
            snapshot.data.data
          );
        }
      }
    );
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
    background-image: url("http://quoridorn.com/img/mascot/normal/mascot_normal.png");
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
