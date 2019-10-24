<template>
  <div class="root">
    <div class="message-scroll-area selectable" v-if="message">
      <img
        class="logo"
        src="http://quoridorn.com/img/bg_white_4c.svg"
        alt="logo"
        draggable="false"
      />
      <span class="button" @click="serverSetting()">
        <span class="icon-cog"></span>
      </span>
      <div class="message-documents">
        <span class="title">{{ message.title }}</span>
        <ul>
          <li v-for="(description, index) in message.descriptions" :key="index">
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
        :selectLock="isInputtingRoomInfo"
        keyProp="order"
        :rowClassGetter="getRowClasses"
        @selectLine="selectRoom"
        @doubleClick="playRoom"
        @adjustWidth="adjustWidth"
      >
        <template #contents="{ colDec, data, index }">
          <template v-if="index === 0">{{ data | roomNo }}</template>
          <template v-else-if="index === 1">{{ data | roomName }}</template>
          <template v-else-if="index === 2">{{ data | system }}</template>
          <template v-else-if="index === 3">{{ data | memberNum }}</template>
          <template v-else-if="index === 4">{{ data | password }}</template>
          <template v-else-if="index === 5">{{ data | visitable }}</template>
          <template v-else-if="index === 6">{{ data | updateDate }}</template>
          <template v-else-if="index === 7">
            <ctrl-button
              @click.stop="deleteRoom(data.order)"
              @dblclick.stop
              :disabled="data | deleteButtonDisabled"
            >
              削除
            </ctrl-button>
          </template>
          <template v-else>
            {{ data[colDec.target] }}
          </template>
        </template>
      </table-component>
    </keep-alive>
    <div class="button-area">
      <ctrl-button @click="createRoom()" :disabled="unTouchable">
        新規作成
      </ctrl-button>
      <ctrl-button>ログイン</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit } from "vue-property-decorator";
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
  Message
} from "@/@types/room";
import { StoreMetaData, StoreObj } from "@/@types/store";
import TaskManager from "@/app/core/task/TaskManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { WindowOpenInfo } from "@/@types/window";

@Component({
  components: { TableComponent, CtrlButton },
  filters: {
    roomNo: (storeObj: StoreObj<ClientRoomInfo>) => storeObj.order,
    roomName: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.name : "（空き部屋）",
    system: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.system : "",
    memberNum: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data ? storeObj.data.memberNum || 0 : 0,
    password: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data && storeObj.data.hasPassword ? "有り" : "--",
    visitable: (storeObj: StoreObj<ClientRoomInfo>) =>
      storeObj.data && storeObj.data.extend && storeObj.data.extend.visitable
        ? "可"
        : "--",
    updateDate: (data: StoreMetaData) => {
      if (!data) return "";
      // return data.updateTime || data.createTime;
      if (data.createTime)
        return moment(data.createTime).format("YYYY/MM/DD HH:mm:ss");
      if (data.updateTime)
        return moment(data.updateTime).format("YYYY/MM/DD HH:mm:ss");
      return "";
    },
    deleteButtonDisabled: (storeObj: StoreObj<ClientRoomInfo>) =>
      (!storeObj.data && !storeObj.exclusionOwner) ||
      (storeObj.data && storeObj.data.memberNum > 0)
  }
})
export default class LoginWindow extends Mixins<WindowVue<GetRoomListResponse>>(
  WindowVue
) {
  private roomList: (StoreObj<ClientRoomInfo> & StoreMetaData)[] = [];
  private selectedRoomNo: number | null = null;
  private isInputtingRoomInfo: boolean = false;
  private message: Message | null = null;
  private readonly htmlRegExp: RegExp = new RegExp(
    "\\[([^\\]]+)]\\(([^)]+)\\)",
    "g"
  );

  @LifeCycle
  public async mounted() {
    await this.init();
    this.roomList = this.windowInfo.args!.roomList;
    this.message = this.windowInfo.args!.message;
  }

  @VueEvent
  private serverSetting() {
    window.console.log("serverSetting");
    // TODO サーバ設定
  }

  @VueEvent
  private toHtml(d: string) {
    return d.replace(this.htmlRegExp, `<a href="$2" target="_blank">$1</a>`);
  }

  @VueEvent
  private get unTouchable() {
    if (this.isInputtingRoomInfo) return true;
    if (this.selectedRoomNo === null) return false;
    return !!this.roomList[this.selectedRoomNo].data;
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
      this.windowInfo.declare.minSize.width = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.width = totalWidth;
  }

  @VueEvent
  private async deleteRoom(order: number) {
    window.console.log(order);
  }

  @VueEvent
  private getRowClasses(
    data: StoreObj<ClientRoomInfo> & StoreMetaData
  ): string[] {
    const classList: string[] = [];
    if (data.exclusionOwner) {
      classList.push(data.data ? "isEditing" : "isCreating");
    }
    return classList;
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
    // const controller = SocketFacade.instance.generateRoomInfoController();
    // await controller.releaseTouch(this.selectedRoomNo);
  }

  @VueEvent
  private async createRoom() {
    if (this.selectedRoomNo === null) {
      alert("部屋を選択してから新規作成をしてください。");
      return;
    }

    // タッチ
    try {
      await SocketFacade.instance.socketCommunication<TouchRequest, never>(
        "touch-room",
        {
          roomNo: this.selectedRoomNo
        }
      );
    } catch (err) {
      return;
    }

    // 部屋情報入力画面
    let createRoomInput: CreateRoomInput;
    this.isInputtingRoomInfo = true;
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
        WindowOpenInfo<never>,
        UserLoginInput
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "user-login-window"
        }
      });
      userLoginInput = userLoginInputList[0];
    } catch (err) {
      window.console.warn(err);
      return;
    }

    // 入力画面がキャンセルされていたらタッチ状態を解除
    if (!userLoginInput) {
      await this.releaseTouchRoom();
      this.isInputtingRoomInfo = false;
      return;
    }

    this.isInputtingRoomInfo = false;

    // 部屋作成リクエストを投げる
    try {
      SocketFacade.instance.roomCollectionSuffix = await SocketFacade.instance.socketCommunication<
        CreateRoomRequest,
        string
      >("create-room", {
        roomId: this.roomList[this.selectedRoomNo].id!,
        roomNo: this.selectedRoomNo,
        ...createRoomInput,
        ...userLoginInput
      });
    } catch (err) {
      window.console.warn(err);
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.root {
  position: relative;

  .message-scroll-area {
    overflow-y: auto;
    border: 1px solid gray;
    margin-bottom: 0.5rem;
    height: 10rem;
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

    .button {
      @include inline-flex-box(row, center, center);
      position: absolute;
      top: 2px;
      left: 2px;
      text-decoration: none;
      color: var(--uni-color-gray);
      width: 2rem;
      height: 2rem;
      font-size: 1rem;
      border-radius: 50%;
      overflow: hidden;
      background-image: linear-gradient(#e8e8e8 0%, #d6d6d6 100%);
      text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.66);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5),
        0 1px 2px rgba(0, 0, 0, 0.19);
      border-bottom: solid 2px #b5b5b5;

      &:active {
        /*押したとき*/
        top: 3px;
        box-shadow: inset 0 0 0 rgba(255, 255, 255, 0.5),
          0 2px 2px rgba(0, 0, 0, 0.19);
        border-bottom: none;
      }
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
      .title {
        font-size: 110%;
        margin-top: 1.5rem;
        margin-left: 4rem;
        background-color: rgba(255, 255, 255, 0.6);
        padding: 0.2rem;
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
.button-area {
  @include flex-box(row, flex-start, center);

  .margin-left-auto {
    margin-left: auto;
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
    content: "作成中";
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
