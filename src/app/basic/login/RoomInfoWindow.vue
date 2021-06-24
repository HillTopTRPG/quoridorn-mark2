<template>
  <div class="root" ref="window-container">
    <div class="base-area">
      <div class="basic">
        <label>
          <span
            class="label-input"
            v-t="'room-info-window.label.room-no'"
          ></span>
          <span class="selectable">{{ roomData.roomNo }}</span>
        </label>
        <label>
          <span class="label-input" v-t="'label.room-name'"></span>
          <span class="selectable">{{ roomData.name }}</span>
        </label>
      </div>
      <label>
        <span
          class="label-input"
          v-t="'room-info-window.label.bcdice-api-url'"
        ></span>
        <span class="selectable">{{ roomData.bcdiceServer }}</span>
      </label>
      <label>
        <span
          class="label-input"
          v-t="'room-info-window.label.bcdice-api-version'"
        ></span>
        <span class="selectable">{{ roomData.bcdiceVersion }}</span>
      </label>
      <label>
        <span
          class="label-input"
          v-t="'room-info-window.label.game-system-view'"
        ></span>
        <span class="selectable">{{ systemName }}</span>
      </label>
      <div class="invite">
        <label>
          <span
            class="label-input"
            v-t="'room-info-window.label.invite-url'"
          ></span>
          <base-input
            type="text"
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
              v-t="'selection.user-type.gm'"
              v-if="user.data.type === 'GM'"
            ></td>
            <td
              class="center"
              v-t="'selection.user-type.pl'"
              v-if="user.data.type === 'PL'"
            ></td>
            <td
              class="center"
              v-t="'selection.user-type.visitor'"
              v-if="user.data.type === 'VISITOR'"
            ></td>
            <td class="center">{{ user.data.login }}</td>
            <td class="url">
              <base-input
                type="text"
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

    <button-area
      :is-commit-able="true"
      commit-text="modify"
      @commit="modify()"
      rollback-text="close"
      @rollback="close()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { RoomDataStore, UserStore } from "@/@types/store-data";
import { UserType } from "@/@types/store-data-optional";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { execCopy } from "@/app/core/utility/Utility";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";

@Component({
  components: {
    ButtonArea,
    CtrlButton,
    BaseInput
  }
})
export default class RoomInfoWindow extends Mixins<WindowVue<never, never>>(
  WindowVue
) {
  private userList: StoreData<UserStore>[] =
    GameObjectManager.instance.userList;
  private systemName: string | null = null;

  private roomData: RoomDataStore = GameObjectManager.instance.roomData;

  @TaskProcessor("room-data-update-finished")
  private async roomDataUpdateFinished(
    task: Task<RoomDataStore, never>
  ): Promise<TaskResult<never> | void> {
    this.roomData = task.value!;
  }

  @Watch("roomData", { deep: true, immediate: true })
  private async onChangeRoomData() {
    this.systemName = await BcdiceManager.instance.getSystemName();
  }

  private get useUserList(): StoreData<UserStore>[] {
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

  public getInviteUrl(user?: StoreData<UserStore>) {
    console.log(JSON.stringify(this.roomData, null, "  "));
    const roomNo = this.roomData.roomNo;
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

    const declareObj = this.windowInfo.declare;

    const heightEm = this.userList.length * 2 + 14;
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
  private async modify() {
    const roomData = (
      await TaskManager.instance.ignition<
        WindowOpenInfo<RoomDataStore>,
        RoomDataStore
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "room-data-edit-window",
          args: this.roomData
        }
      })
    )?.[0];
    if (roomData) {
      await GameObjectManager.instance.updateRoomData(roomData);
    }
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

  label:not(.ctrl-button) {
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
