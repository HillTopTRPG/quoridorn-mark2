<template>
  <div class="root">
    <div class="base-area">
      <div class="basic">
        <label>
          <span class="label-input" v-t="'label.room-name'"></span>
          <base-input
            v-if="clientRoomInfo"
            :value="clientRoomInfo.name"
            readonly="readonly"
          />
        </label>
        <label>
          <span class="label-input" v-t="'label.game-system'"></span>
          <base-input
            v-if="clientRoomInfo"
            :value="clientRoomInfo.system"
            readonly="readonly"
          />
        </label>
      </div>
      <div class="invite">
        <label>
          <span class="label-input" v-t="'label.invite-url'"></span>
          <base-input
            v-if="clientRoomInfo"
            :value="getInviteUrl()"
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
            <th v-t="'label.user-name'">プレイヤー名</th>
            <th v-t="'label.room-member-num'">入室数</th>
            <th colspan="2" v-t="'label.invite-url'"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userList" :key="user.id">
            <td class="left">{{ user.data.userName }}</td>
            <td class="center">{{ user.data.login }}</td>
            <td class="url">
              <base-input
                v-if="clientRoomInfo"
                :value="getInviteUrl(user)"
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
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import { ClientRoomInfo } from "@/@types/socket";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { StoreUseData } from "@/@types/store";
import { UserData } from "@/@types/room";
import { execCopy } from "@/app/core/Utility";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: {
    InputPasswordComponent,
    DiceBotSelect,
    BaseInput,
    TableComponent,
    CtrlButton
  }
})
export default class RoomInfoWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  private clientRoomInfo: ClientRoomInfo | null = null;
  private userList: StoreUseData<UserData>[] =
    GameObjectManager.instance.playerList;

  public getInviteUrl(user?: StoreUseData<UserData>) {
    if (!this.clientRoomInfo) return "";
    const roomNo = this.clientRoomInfo.roomNo;
    const roomName = this.clientRoomInfo.name;
    const userName = user ? user.data!.userName : "";

    const baseUrl = location.href.replace(/\?.+$/, "");
    const params = new URLSearchParams();
    params.append("roomNo", roomNo.toString(10));
    params.append("roomName", roomName);
    if (userName) params.append("userName", userName);
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
    window.console.log(this.clientRoomInfo.name);

    const heightEm = this.userList.length * 2 + 8;
    this.windowInfo.heightEm = heightEm;
    this.windowInfo.declare.size.heightEm = heightEm;
    this.windowInfo.declare.minSize!.heightEm = heightEm;
    this.windowInfo.declare.maxSize!.heightEm = heightEm;

    const heightPx = this.userList.length + 3;
    this.windowInfo.heightPx = heightPx;
    this.windowInfo.declare.size.heightPx = heightPx;
    this.windowInfo.declare.minSize!.heightPx = heightPx;
    this.windowInfo.declare.maxSize!.heightPx = heightPx;
  }

  @VueEvent
  private modify() {
    alert("modify");
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
    @include flex-box(row, space-between, center);

    > label {
      flex: 1;

      &:not(:first-child) {
        margin-left: 0.5rem;
      }
    }
  }

  > .invite {
    @include flex-box(row, flex-start, center);

    > label:first-child {
      flex: 1;
    }
  }

  label:not(.ctrl-button-wrapper) {
    @include flex-box(row, flex-start, center);

    span {
      color: gray;
      font-size: 80%;
    }

    input {
      flex: 1;
      width: 10px;
    }
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
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
