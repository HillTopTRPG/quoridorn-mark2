<template>
  <div class="root" ref="login">
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
          <!--
          <div class="version-info flat-button" @click="viewVersionInfo()">
            <span v-t="'label.version-info'"></span>
          </div>
          -->
        </div>
        <div class="title-contents flat-button" @click="serverSetting()">
          <span class="title">{{ message.title }}</span>
          <span class="icon-cog"></span>
        </div>
        <ul>
          <li v-for="(description, index) in message.descriptions" :key="index">
            <span v-html="toHtml(description)"></span>
          </li>
        </ul>
      </div>
    </div>
    <label class="language-select">
      Language:
      <language-select v-model="language" />
    </label>
    <keep-alive>
      <table-component
        :windowInfo="windowInfo"
        :tableIndex="0"
        :status="status"
        :dataList="roomList"
        :selectLock="isInputtingRoomInfo"
        keyProp="order"
        :rowClassGetter="getRowClasses"
        @selectLine="selectRoom"
        @doubleClick="playRoom"
        @adjustWidth="adjustWidth"
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
    </keep-alive>
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
  LoginRequest,
  LoginResponse
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
import { Task, TaskResult } from "@/@types/task";
import { loadYaml } from "@/app/core/File";
import { getFileNameArgList } from "@/app/core/Utility";
import { Image } from "@/@types/image";
import { MapSetting, RoomData } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({
  components: { LanguageSelect, TableComponent, CtrlButton },
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
export default class LoginWindow extends Mixins<WindowVue<GetRoomListResponse>>(
  WindowVue
) {
  private roomList: StoreUseData<ClientRoomInfo>[] = [];
  private selectedRoomNo: number | null = null;
  private isInputtingServerSetting: boolean = false;
  private isInputtingRoomInfo: boolean = false;
  private message: Message | null = null;
  private version: string | null = null;
  private readonly htmlRegExp: RegExp = new RegExp(
    "\\[([^\\]]+)]\\(([^)]+)\\)",
    "g"
  );
  private language: string = navigator.language;

  @Watch("language")
  private onChangeLanguage() {
    LanguageManager.instance.language = this.language;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.roomList = this.windowInfo.args!.roomList;
    this.message = this.windowInfo.args!.message;
    this.version = this.windowInfo.args!.version;
    this.elm.style.setProperty(
      "--msg-creating",
      `"${LanguageManager.instance.getText("label.creating")}"`
    );
  }

  private get elm(): HTMLElement {
    return this.$refs.login as HTMLElement;
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
  private async viewVersionInfo() {
    await TaskManager.instance.ignition<
      WindowOpenInfo<{
        message: Message;
        version: string;
      }>,
      void
    >({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "version-info-window",
        args: {
          message: this.message!,
          version: this.version!
        }
      }
    });
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
      window.console.warn(err);
      this.isInputtingServerSetting = false;
      return;
    }

    // 入力画面がキャンセルされていたら中断
    if (!appServerSettingInput) return;

    await SocketFacade.instance.setAppServerUrl(appServerSettingInput.url);
    const serverInfo = await SocketFacade.instance.socketCommunication<
      never,
      GetRoomListResponse
    >("get-room-list");
    SocketFacade.instance.socketOn<RoomViewResponse[]>(
      "result-room-view",
      (err, changeList) => {
        changeList.forEach(change => {
          if (change.changeType === "removed") {
            const index = this.roomList.findIndex(
              info => info.id === change.id
            );
            this.roomList.splice(index, 1, {
              order: index,
              exclusionOwner: null,
              createTime: new Date(),
              updateTime: null,
              id: null
            });
          } else {
            const index = change.data!.order;
            this.roomList.splice(index, 1, {
              ...change.data!,
              id: change.id
            });
          }
        });
      }
    );
    this.roomList.splice(0, this.roomList.length);
    serverInfo.roomList.forEach((roomInfo: StoreUseData<ClientRoomInfo>) => {
      this.roomList.push(roomInfo);
    });
    this.message = serverInfo.message;
  }

  @VueEvent
  private toHtml(d: string) {
    return d.replace(this.htmlRegExp, `<a href="$2" target="_blank">$1</a>`);
  }

  @VueEvent
  private get disabledCreate(): boolean {
    if (this.isInputtingRoomInfo) return true;
    if (this.selectedRoomNo === null) return true;
    return !!this.roomList[this.selectedRoomNo].data;
  }

  @VueEvent
  private get disabledLogin(): boolean {
    if (this.isInputtingRoomInfo) return true;
    if (this.selectedRoomNo === null) return true;
    return !this.roomList[this.selectedRoomNo].data;
  }

  @LifeCycle
  private async beforeDestroy() {
    await this.releaseTouchRoom();
  }

  @VueEvent
  private selectRoom(order: number) {
    this.selectedRoomNo = order;
  }

  @VueEvent
  private async playRoom(order?: number) {}

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {
    if (this.windowInfo.declare.minSize)
      this.windowInfo.declare.minSize.widthPx = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.widthPx = totalWidth;
  }

  @VueEvent
  private async deleteRoom(order: number) {
    if (this.selectedRoomNo === null) {
      alert("部屋を選択してください。");
      return;
    }

    this.isInputtingRoomInfo = true;

    // タッチ
    if (!(await this.touchRoom(true))) {
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
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!confirmResult) {
      await this.releaseTouchRoom();
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
      await this.releaseTouchRoom();
      return;
    } finally {
      this.isInputtingRoomInfo = false;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!deleteRoomInput) {
      await this.releaseTouchRoom();
      return;
    }

    // 部屋削除リクエストを投げる
    let deleteResult: boolean;
    try {
      deleteResult = await SocketFacade.instance.socketCommunication<
        DeleteRoomRequest,
        boolean
      >("delete-room", {
        roomId: this.roomList[this.selectedRoomNo].id!,
        roomNo: this.selectedRoomNo,
        ...deleteRoomInput
      });
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
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

  private async touchRoom(isModify: boolean): Promise<boolean> {
    try {
      await SocketFacade.instance.socketCommunication<TouchRequest, never>(
        isModify ? "touch-room-modify" : "touch-room",
        {
          roomNo: this.selectedRoomNo!
        }
      );
      return true;
    } catch (err) {
      window.console.warn(err);
      return false;
    }
  }

  private async releaseTouchRoom() {
    if (this.selectedRoomNo === null) return;
    if (!this.roomList[this.selectedRoomNo].exclusionOwner) return;
    await SocketFacade.instance.socketCommunication<ReleaseTouchRequest, never>(
      "release-touch-room",
      {
        roomNo: this.selectedRoomNo
      }
    );
  }

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

    // 部屋情報入力画面
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
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!createRoomInput) {
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
      return;
    }

    // ユーザログイン画面
    let userLoginInput: UserLoginInput;
    try {
      const userLoginInputList = await TaskManager.instance.ignition<
        WindowOpenInfo<boolean>,
        UserLoginInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "user-login-window",
          args: true
        }
      });
      userLoginInput = userLoginInputList[0];
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
      return;
    } finally {
      this.isInputtingRoomInfo = false;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!userLoginInput) {
      await this.releaseTouchRoom();
      return;
    }

    // 部屋作成リクエストを投げる

    let initRoomInfo: ClientRoomInfo = {
      name: createRoomInput.name,
      system: createRoomInput.system,
      extend: createRoomInput.extend,
      memberNum: 0,
      hasPassword: !!createRoomInput.roomPassword,
      roomNo: this.selectedRoomNo
    };
    try {
      SocketFacade.instance.roomCollectionPrefix = await SocketFacade.instance.socketCommunication<
        CreateRoomRequest,
        string
      >("create-room", {
        roomId: this.roomList[this.selectedRoomNo].id!,
        roomNo: this.selectedRoomNo,
        ...createRoomInput,
        ...userLoginInput
      });

      const imageList: Image[] = await loadYaml<Image[]>(
        "./static/conf/image.yaml"
      );
      const imageTagList: string[] = await loadYaml<string[]>(
        "./static/conf/imageTag.yaml"
      );
      imageList.forEach((image: Image, index: number) => {
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

      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "create-room",
          value: "on"
        }
      });
      await this.close();

      /* --------------------------------------------------
       * 画像タグのプリセットデータ投入
       */
      const imageTagStore = SocketFacade.instance.imageTagCC();

      const pushImageTag = async (imageTag: string): Promise<void> => {
        await imageTagStore.add(await imageTagStore.touch(), imageTag);
      };

      // pushImageTagを直列の非同期で全部実行する
      await imageTagList
        .map((imageTag: string) => () => pushImageTag(imageTag))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());

      /* --------------------------------------------------
       * 画像データのプリセットデータ投入
       */
      const imageDataStore = SocketFacade.instance.imageDataCC();

      let imageId: string | null = null;
      const pushImage = async (image: Image): Promise<void> => {
        const docId = await imageDataStore.touch();
        if (!imageId) imageId = docId;
        await imageDataStore.add(docId, image);
      };

      // pushImageを直列の非同期で全部実行する
      await imageList
        .map((image: Image) => () => pushImage(image))
        .reduce((prev, curr) => prev.then(curr), Promise.resolve());

      /* --------------------------------------------------
       * マップデータのプリセットデータ投入
       */
      const mapDataStore = SocketFacade.instance.mapListCC();

      const mapSetting: MapSetting = {
        backgroundType: "image",
        imageTag: imageList[0].tag,
        imageId: imageId!,
        reverse: "none",
        shapeType: "square",
        totalColumn: 20,
        totalRow: 15,
        gridSize: 50,
        gridBorderColor: "#000000",
        isPourTile: false,
        isHexFirstCorner: false,
        isHexSecondSmall: false,
        background: {
          backgroundType: "image",
          imageTag: imageList[0].tag,
          imageId: imageId!,
          reverse: "none",
          // , backgroundColor: "rgb(146, 168, 179)"
          maskBlur: 3
        },
        margin: {
          backgroundType: "image",
          imageTag: imageList[0].tag,
          imageId: imageId!,
          reverse: "none",
          isUseGridColor: true,
          gridColorBold: "rgba(255, 255, 255, 0.3)",
          gridColorThin: "rgba(255, 255, 255, 0.1)",
          column: 5,
          row: 5,
          isUseMaskColor: true,
          maskColor: "rgba(20, 80, 20, 0.1)",
          maskBlur: 3,
          isUseImage: "none",
          borderWidth: 10,
          borderColor: "gray",
          borderStyle: "ridge"
        },
        chatLinkage: 0,
        chatLinkageSearch: "",
        portTileMapping: ""
      };
      const mapDataDocId = await mapDataStore.add(
        await mapDataStore.touch(),
        mapSetting
      );

      /* --------------------------------------------------
       * 部屋データのプリセットデータ投入
       */
      const roomDataStore = SocketFacade.instance.roomDataCC();

      const roomData: RoomData = {
        mapId: mapDataDocId,
        isDrawGridLine: true,
        isDrawGridId: true,
        isFitGrid: true,
        isUseRotateMarker: true
      };
      await roomDataStore.add(await roomDataStore.touch(), roomData);

      await TaskManager.instance.ignition<ModeInfo, never>({
        type: "mode-change",
        owner: "Quoridorn",
        value: {
          type: "create-room",
          value: "off"
        }
      });

      await TaskManager.instance.ignition<ClientRoomInfo, void>({
        type: "room-initialize",
        owner: "Quoridorn",
        value: initRoomInfo
      });
    } catch (err) {
      window.console.warn(err);
    }
  }

  @VueEvent
  private async login() {
    if (this.selectedRoomNo === null) {
      alert("部屋を選択してから新規作成をしてください。");
      return;
    }

    this.isInputtingRoomInfo = true;

    // タッチ
    if (!(await this.touchRoom(true))) {
      this.isInputtingRoomInfo = false;
      return;
    }

    // 部屋情報入力画面
    let loginRoomInput: LoginRoomInput;
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
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!loginRoomInput) {
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
      return;
    }

    // ユーザログイン画面
    let userLoginInput: UserLoginInput;
    try {
      const userLoginInputList = await TaskManager.instance.ignition<
        WindowOpenInfo<boolean>,
        UserLoginInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "user-login-window",
          args: false
        }
      });
      userLoginInput = userLoginInputList[0];
    } catch (err) {
      window.console.warn(err);
      await this.releaseTouchRoom();
      return;
    } finally {
      this.isInputtingRoomInfo = false;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!userLoginInput) {
      await this.releaseTouchRoom();
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

    // ログインリクエストを投げる
    let loginResult: LoginResponse;
    try {
      loginResult = await SocketFacade.instance.socketCommunication<
        LoginRequest,
        LoginResponse
      >("login", {
        roomId: this.roomList[this.selectedRoomNo].id!,
        roomNo: this.selectedRoomNo,
        ...loginRoomInput,
        ...userLoginInput
      });
      if (!loginResult) {
        alert("ログイン失敗");
        return;
      }
      SocketFacade.instance.roomCollectionPrefix =
        loginResult.roomCollectionPrefix;
    } catch (err) {
      window.console.warn(err);
      alert("ログイン失敗");
      return;
    }
    await this.close();

    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "create-room",
        value: "off"
      }
    });

    loginResult.roomNo = this.selectedRoomNo;
    GameObjectManager.instance.clientRoomInfo = loginResult;

    await TaskManager.instance.ignition<ClientRoomInfo, void>({
      type: "room-initialize",
      owner: "Quoridorn",
      value: loginResult
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
    bottom: calc(24em + 0.5rem + 5px);
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
      height: 1.5rem;
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

<style lang="scss">
@import "../../../assets/common";
.isCreating {
  position: relative;
  pointer-events: none;

  &.isSelected:before {
    outline: 2px solid var(--uni-color-red);
    outline-offset: -2px;
  }

  &:before {
    content: "";
    display: inline-block;
    position: absolute;
    background-image: linear-gradient(
      -45deg,
      var(--uni-color-cream) 25%,
      var(--uni-color-light-pink) 25%,
      var(--uni-color-light-pink) 50%,
      var(--uni-color-cream) 50%,
      var(--uni-color-cream) 75%,
      var(--uni-color-light-pink) 75%,
      var(--uni-color-light-pink)
    );
    background-size: 1em 1em;
    background-attachment: local;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 9999999998;
  }

  &:after {
    content: var(--msg-creating, "さくせいちゅう");
    @include inline-flex-box(row, center, center);
    position: absolute;
    left: 50%;
    padding: 0.2em 0.6em;
    top: 0;
    bottom: 0;
    height: 1em;
    margin: auto;
    background-color: var(--uni-color-white);
    color: var(--uni-color-black);
    transform: translateX(-50%);
    z-index: 9999999999;
  }
}
</style>
