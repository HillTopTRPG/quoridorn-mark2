<template>
  <div class="container" ref="window-container">
    <table>
      <thead>
        <tr>
          <th v-t="`${windowInfo.type}.header.name`" rowspan="2"></th>
          <th v-t="`${windowInfo.type}.header.type`" rowspan="2"></th>
          <th v-t="`${windowInfo.type}.header.initiative`" colspan="2"></th>
          <th rowspan="2">
            <ctrl-button @click="addResource()">
              <span v-t="'button.add'"></span>
            </ctrl-button>
          </th>
        </tr>
        <tr>
          <th v-t="`${windowInfo.type}.header.initiative-actor`"></th>
          <th v-t="`${windowInfo.type}.header.initiative-map-object`"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          class="resource-master"
          v-for="resource in resourceMasterList"
          :key="resource.id"
        >
          <td>{{ resource.data.label }}</td>
          <td v-t="`label.resource-type-${resource.data.type}`"></td>
          <td class="center">{{ resource.data.isAutoAddActor ? "✔︎" : "" }}</td>
          <td class="center">
            {{ resource.data.isAutoAddMapObject ? "✔︎" : "" }}
          </td>
          <td>
            <ctrl-button @click="editResource(resource.id)">
              <span v-t="'button.modify'"></span>
            </ctrl-button>
            <ctrl-button
              @click="deleteResource(resource.id)"
              :disabled="!!resource.data.systemColumnType"
            >
              <span v-t="'button.delete'"></span>
            </ctrl-button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="button-area space-between margin-bottom">
      <ctrl-button @click="downloadData">
        <span class="icon-download"></span>
        <span v-t="'button.download'"></span>
      </ctrl-button>
      <ctrl-button @click="uploadData">
        <span class="icon-upload"></span>
        <span v-t="'button.upload'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import WindowVue from "@/app/core/window/WindowVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";
import { DataReference } from "@/@types/data";
import App from "@/views/App.vue";
import { importJson, saveJson } from "@/app/core/utility/FileUtility";
import { ResourceMasterStore } from "@/@types/gameObject";
import { StoreUseData } from "@/@types/store";
import LanguageManager from "@/LanguageManager";
import moment from "moment/moment";

@Component({
  components: {
    CtrlButton
  }
})
export default class ResourceMasterListWindow extends Mixins<
  WindowVue<string, never>
>(WindowVue) {
  private isMounted: boolean = false;
  private cc = SocketFacade.instance.resourceMasterCC();

  private resourceMasterList = GameObjectManager.instance.resourceMasterList;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.isMounted = true;
  }

  @VueEvent
  private async addResource() {
    await App.openSimpleWindow("resource-master-add-window");
  }

  @VueEvent
  private async downloadData() {
    window.console.log(JSON.stringify(this.resourceMasterList, null, "  "));
    const dateTimeStr = moment().format("YYYYMMDDHHmmss");
    saveJson<StoreUseData<ResourceMasterStore>[]>(
      `Quoridorn_ResourceMaster_${dateTimeStr}`,
      "resource-master",
      this.resourceMasterList
    );
  }

  @VueEvent
  private async uploadData() {
    window.console.log(JSON.stringify(this.resourceMasterList, null, "  "));
    const dataContainer = await importJson<StoreUseData<ResourceMasterStore>[]>(
      "resource-master"
    );
    if (!dataContainer) {
      alert(LanguageManager.instance.getText("label.importFailure"));
      return;
    }
    const importResourceMasterList = dataContainer.data;
    window.console.log(JSON.stringify(importResourceMasterList, null, "  "));
    importResourceMasterList.filter(irm => {
      // TODO 実装
    });
  }

  @VueEvent
  private async editResource(id: string) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "resource-master-edit-window",
        args: {
          type: "resource-master",
          docId: id
        }
      }
    });
  }

  @VueEvent
  private async deleteResource(id: string) {
    const flg = window.confirm(
      this.$t(`${this.windowInfo.type}.dialog.delete-resource`)!.toString()
    );
    if (!flg) return;
    try {
      await this.cc.touchModify([id]);
    } catch (err) {
      alert(
        this.$t(`${this.windowInfo.type}.dialog.delete-failure`)!.toString()
      );
      return;
    }

    await this.cc.delete([id]);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include inline-flex-box(column, flex-start, flex-start);
  width: 100%;
  height: 100%;
  overflow: scroll;
}

table {
  width: 100%;
}

thead {
  border: 1px solid black;
  tr:nth-child(2) {
    th {
      min-width: 4em;
    }
  }
}

tbody {
  border-bottom: 1px solid black;
}

tr {
  border-right: 1px solid black;
  background-color: white;
}

td,
th {
  border-left: 1px solid black;
  border-top: 1px dashed black;

  &.center {
    text-align: center;
  }
}

.button-area {
  @include inline-flex-box(row, center, flex-start);
  width: 100%;
}
</style>
