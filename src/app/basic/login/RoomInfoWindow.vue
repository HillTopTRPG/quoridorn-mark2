<template>
  <div class="root" ref="window-container">
    <div class="base-area">
      <div class="basic">
        <label>
          <span
            class="label-input"
            v-t="'room-info-window.label.room-no'"
          ></span>
          <span class="selectable" v-if="clientRoomInfo">{{
            clientRoomInfo.roomNo
          }}</span>
        </label>
        <label>
          <span class="label-input" v-t="'label.room-name'"></span>
          <span class="selectable" v-if="clientRoomInfo">{{
            clientRoomInfo.name
          }}</span>
        </label>
      </div>
      <label>
        <span
          class="label-input"
          v-t="'room-info-window.label.bcdice-api-url'"
        ></span>
        <span class="selectable" v-if="clientRoomInfo">{{ systemName }}</span>
      </label>
      <label>
        <span
          class="label-input"
          v-t="'room-info-window.label.game-system-view'"
        ></span>
        <span class="selectable" v-if="clientRoomInfo">{{ systemName }}</span>
      </label>
      <div class="invite">
        <label>
          <span
            class="label-input"
            v-t="'room-info-window.label.invite-url'"
          ></span>
          <base-input
            type="text"
            v-if="clientRoomInfo"
            :value="getInviteUrl()"
            tabindex="-1"
            readonly="readonly"
          />
        </label>
        <ctrl-button @click="copyToClipboard(getInviteUrl())">
          <span v-t="'button.copy'"></span>
        </ctrl-button>
      </div>
      <table class="selectable">
        <thead>
          <tr>
            <th v-t="'label.user-name'"></th>
            <th v-t="'label.permission'"></th>
            <th v-t="'room-info-window.label.room-member-num'"></th>
            <th colspan="2" v-t="'room-info-window.label.comeback-url'"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in useUserList" :key="user.key">
            <td class="left">{{ user.data.name }}</td>
            <td
              class="center"
              v-t="'selection.user-type.GM'"
              v-if="user.data.type === 'GM'"
            ></td>
            <td
              class="center"
              v-t="'selection.user-type.PL'"
              v-if="user.data.type === 'PL'"
            ></td>
            <td
              class="center"
              v-t="'selection.user-type.VISITOR'"
              v-if="user.data.type === 'VISITOR'"
            ></td>
            <td class="center">{{ user.data.login }}</td>
            <td class="url">
              <base-input
                type="text"
                v-if="clientRoomInfo"
                :value="getInviteUrl(user)"
                tabindex="-1"
                readonly="readonly"
              />
            </td>
            <td class="button">
              <ctrl-button @click="copyToClipboard(getInviteUrl(user))">
                <span v-t="'button.copy'"></span>
              </ctrl-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="close()">
        <span v-t="'button.close'"></span>
      </ctrl-button>
      <ctrl-button class="modify" @click.stop="modify()">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import { UserData } from "../../../@types/room";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import { execCopy } from "../../core/utility/Utility";
import BaseInput from "../../core/component/BaseInput.vue";
import { ClientRoomInfo, UserType } from "../../../@types/socket";
import VueEvent from "../../core/decorator/VueEvent";
import { StoreObj } from "../../../@types/store";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import GameObjectManager from "../GameObjectManager";
import BcdiceManager from "../../core/api/bcdice/BcdiceManager";

@Component({
  components: {
    CtrlButton,
    BaseInput
  }
})
export default class RoomInfoWindow extends Mixins<WindowVue<never, never>>(
  WindowVue
) {
  private clientRoomInfo: ClientRoomInfo | null = null;
  private userList: StoreObj<UserData>[] = GameObjectManager.instance.userList;
  private systemKey: string | null = null;
  private systemName: string | null = null;

  @Watch("clientRoomInfo", { deep: true })
  private async onChangeClientRoomInfo() {
    this.systemKey = this.clientRoomInfo ? this.clientRoomInfo.system : null;
  }

  @Watch("systemKey")
  private async onChangeSystemKey() {
    this.systemName = await BcdiceManager.getBcdiceSystemName(
      SocketFacade.instance.connectInfo.bcdiceServer,
      this.systemKey
    );
  }

  private get useUserList(): StoreObj<UserData>[] {
    const typeOrder: UserType[] = ["VISITOR", "PL", "GM"];
    return this.userList.concat().sort((u1, u2) => {
      const u1Index = typeOrder.findIndex(t => t === u1.data!.type);
      const u2Index = typeOrder.findIndex(t => t === u2.data!.type);
      if (u1Index < u2Index) return 1;
      if (u1Index > u2Index) return -1;
      if (u1.order < u2.order) return 1;
      if (u1.order > u2.order) return -1;
      return 0;
    });
  }

  public getInviteUrl(user?: StoreObj<UserData>) {
    if (!this.clientRoomInfo) return "";
    const roomNo = this.clientRoomInfo.roomNo;
    const name = user ? user.data!.name : "";

    const baseUrl = location.href.replace(/\?.+$/, "");
    const params = new URLSearchParams();
    params.append("no", roomNo.toString(10));
    if (name) params.append("player", name);
    return `${baseUrl}?${params.toString()}`;
  }

  @VueEvent
  private copyToClipboard(text: string) {
    execCopy(text);
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.clientRoomInfo = GameObjectManager.instance.clientRoomInfo;
    SocketFacade.instance.connectInfo.bcdiceServer;

    const declareObj = this.windowInfo.declare;

    const heightEm = this.userList.length * 2 + 12;
    this.windowInfo.heightEm = heightEm;
    declareObj.size.heightEm = heightEm;
    declareObj.minSize!.heightEm = heightEm;
    declareObj.maxSize!.heightEm = heightEm;

    const heightPx = this.userList.length + 3;
    this.windowInfo.heightPx = heightPx;
    declareObj.size.heightPx = heightPx;
    declareObj.minSize!.heightPx = heightPx;
    declareObj.maxSize!.heightPx = heightPx;
  }

  @VueEvent
  private modify() {
    alert("未実装です！ごめんなさい！");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.root {
  position: relative;
}

.base-area {
  @include flex-box(column, stretch, center);
  line-height: 1.5;

  > *:not(:first-child) {
    margin-top: 0.2rem;
  }

  > .basic {
    @include flex-box(row, flex-start, center);

    > *:first-child input {
      padding: 0 0.5rem;
    }

    > *:not(:first-child) {
      flex: 1;
      margin-left: 0.5rem;
    }
  }

  > .invite {
    @include flex-box(row, flex-start, center);

    > *:first-child {
      flex: 1;
    }
  }

  label:not(.ctrl-button-wrapper) {
    @include flex-box(row, flex-start, center);
    height: 2em;

    > span:first-child {
      color: gray;
      font-size: 80%;
    }

    > span:not(:first-child) {
      @include flex-box(row, flex-start, center);
      padding: 0 0.5rem;
      background-color: var(--uni-color-white);
      border: 1px solid var(--uni-color-light-gray);
      flex: 1;
      box-sizing: border-box;
      height: 100%;
    }

    input {
      flex: 1;
      width: 10px;
    }
  }

  table {
    border-bottom: solid 1px gray;
    border-left: solid 1px gray;
    width: 100%;
    box-sizing: border-box;
    white-space: nowrap;

    th {
      padding: 0 0.5rem;
      background-color: var(--uni-color-cream);
      height: var(--table-row-height);
    }

    th,
    td {
      border-top: solid 1px gray;
      border-right: solid 1px gray;
      box-sizing: border-box;

      > * {
        @include inline-flex-box(row, flex-start, center);
      }

      &:not(.url) {
        width: 10px;
        padding: 0 0.2rem;
      }

      &.url {
        padding: 0;

        > * {
          width: 100%;
          border: none;
        }
      }

      &.button {
        > * {
          margin: 0;
        }
      }

      &.left {
        text-align: left;
      }

      &.center {
        text-align: center;
      }
    }
  }
}

.button-area {
  .modify {
    position: absolute;
    right: 0;
  }
}
</style>
