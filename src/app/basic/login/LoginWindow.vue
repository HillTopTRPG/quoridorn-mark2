<template>
  <div>
    <table-component
      :windowInfo="windowInfo"
      :tableIndex="0"
      :status="status"
      :dataList="roomList"
      keyProp="order"
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
          <ctrl-button @click.stop @dblclick.stop>削除</ctrl-button>
        </template>
        <template v-else>
          {{ data[colDec.target] }}
        </template>
      </template>
    </table-component>
    <div class="button-area">
      <ctrl-button @click="createRoom()">新規作成</ctrl-button>
      <ctrl-button>ログイン</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";
import { Mixins } from "vue-mixin-decorator";
import moment from "moment/moment";
import { CreateRoomInfo, RoomInfo } from "@/@types/room";
import { StoreMetaData, StoreObj } from "@/@types/store";
import TaskManager from "@/app/core/task/TaskManager";
import QuerySnapshot from "nekostore/lib/QuerySnapshot";

@Component({
  components: { TableComponent, CtrlButton },
  filters: {
    roomNo: (storeObj: StoreObj<RoomInfo>) => storeObj.order + 1,
    roomName: (storeObj: StoreObj<RoomInfo>) =>
      storeObj.data ? storeObj.data.name : "（空き部屋）",
    system: (storeObj: StoreObj<RoomInfo>) =>
      storeObj.data ? storeObj.data.system : "",
    memberNum: (storeObj: StoreObj<RoomInfo>) =>
      storeObj.data ? storeObj.data.memberNum || 0 : 0,
    password: (storeObj: StoreObj<RoomInfo>) =>
      storeObj.data && storeObj.data.password ? "有り" : "--",
    visitable: (storeObj: StoreObj<RoomInfo>) =>
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
    }
  }
})
export default class LoginWindow extends Mixins<WindowVue<never>>(WindowVue) {
  private roomList: (StoreObj<RoomInfo> & StoreMetaData)[] = [];
  private selectedRoomKey: number | null = null;

  private async mounted() {
    try {
      SocketFacade.instance
        .generateRoomInfoController()
        .addCollectionSnapshot(
          this.key,
          (snapshot: QuerySnapshot<StoreObj<RoomInfo>>) => {
            snapshot.docs.forEach(async doc => {
              const docSnapshot = await doc.ref.get();
              if (docSnapshot.exists()) {
                const obj = await getStoreObj<RoomInfo>(doc);
                if (obj) this.roomList.splice(docSnapshot.data.order, 1, obj);
                else this.roomList.splice(docSnapshot.data.order, 1);
              }
            });
          }
        );
      this.roomList = await SocketFacade.instance.socketCommunication<
        (StoreObj<RoomInfo> & StoreMetaData)[]
      >("get-room-list");
      window.console.log(this.roomList);
    } catch (err) {
      window.console.error(err);
    }
  }

  private selectRoom(roomKey: number) {
    this.selectedRoomKey = roomKey;
  }

  private async playRoom(bgmKey?: string) {}

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {
    if (this.windowInfo.declare.minSize)
      this.windowInfo.declare.minSize.width = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.width = totalWidth;
  }

  private async createRoom() {
    if (this.selectedRoomKey === null) {
      alert("部屋を選択してから新規作成をしてください。");
      return;
    }
    const [info] = await TaskManager.instance.ignition<
      CreateRoomInfo,
      RoomInfo
    >({
      type: "input-create-room",
      owner: "Quoridorn",
      value: {
        no: this.selectedRoomKey
      }
    });
    window.console.log(info);
    try {
      const tableName = await SocketFacade.instance.socketCommunication(
        "create-room",
        {
          no: this.selectedRoomKey,
          roomInfo: info
        }
      );
      window.console.log(tableName);
    } catch (err) {
      window.console.log(err);
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.button-area {
  @include flex-box(row, flex-start, center);

  .margin-left-auto {
    margin-left: auto;
  }
}
</style>
