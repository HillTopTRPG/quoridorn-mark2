<template>
  <div class="container" ref="window-container">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 基本タブ -->
      <div class="tab-container" v-if="currentTabInfo.target === 'basic'">
        <div class="list">
          <authority-group-component
            v-for="authorityGroup in authorityGroupList"
            :key="authorityGroup.key"
            :authority-group="authorityGroup"
            @edit="edit(authorityGroup.key)"
            @chmod="chmod(authorityGroup.key)"
            @delete="deleteAuthorityGroup(authorityGroup.key)"
          />
        </div>
      </div>
      <!-- コンテンツタブ -->
      <div class="tab-container" v-if="currentTabInfo.target === 'contents'">
        <table>
          <thead>
            <tr>
              <td class="empty" colspan="2">
                <authority-group-legend />
                <!-- 最初の斜め線 -->
                <label></label>
              </td>
              <th
                v-for="authorityGroup in authorityGroupList"
                :key="authorityGroup.key"
              >
                <label>
                  {{ authorityGroup.data.name }}
                </label>
              </th>
              <td class="margin"></td>
            </tr>
          </thead>
          <tbody>
            <template v-for="user in userList">
              <tr class="user" :key="user.key">
                <th class="name" colspan="2">{{ getUserName(user.key) }}</th>
                <td
                  v-for="authorityGroup in authorityGroupList"
                  :key="authorityGroup.key"
                  :title="authorityGroup.data.name"
                  class="selectable"
                >
                  {{ isContain(user, authorityGroup) ? "✔️" : "" }}
                </td>
                <td class="margin"></td>
              </tr>
              <tr
                class="actor"
                v-for="actor in getActorList(user.key)"
                :key="actor.key"
              >
                <th class="empty"></th>
                <th class="name">{{ getActorName(actor.key) }}</th>
                <td
                  v-for="authorityGroup in authorityGroupList"
                  :key="authorityGroup.key"
                  :title="authorityGroup.data.name"
                  class="selectable"
                >
                  {{ isContain(actor, authorityGroup) ? "✔️" : "" }}
                </td>
                <td class="margin"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </simple-tab-component>
    <div class="button-area">
      <ctrl-button @click="add()">
        <span v-t="'button.add'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import { errorDialog, questionDialog } from "@/app/core/utility/Utility";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import App from "@/views/App.vue";
import TaskManager from "@/app/core/task/TaskManager";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";
import AuthorityGroupComponent from "@/app/basic/object/authority-group/AuthorityGroupComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { AuthorityGroupStore } from "@/@types/store-data";
import AuthorityGroupLegend from "@/app/basic/object/authority-group/AuthorityGroupLegend.vue";

@Component({
  components: {
    AuthorityGroupLegend,
    SimpleTabComponent,
    AuthorityGroupComponent,
    CtrlButton
  }
})
export default class AuthorityGroupListWindow extends Mixins<
  WindowVue<string, never>
>(WindowVue) {
  private cc = SocketFacade.instance.authorityGroupCC();

  private authorityGroupList = GameObjectManager.instance.authorityGroupList;
  private userList = GameObjectManager.instance.userList;
  private actorList = GameObjectManager.instance.actorList;

  @VueEvent
  private getActorList(userKey: string) {
    return this.actorList
      .filter(a => a.owner === userKey)
      .sort((a1, a2) => {
        if (a1.data!.type === "user" && a2.data!.type === "character")
          return -1;
        if (a1.data!.type === "character" && a2.data!.type === "user") return 1;
        return a1.data!.name < a2.data!.name ? -1 : 1;
      });
  }

  @VueEvent
  private getUserName(userKey: string) {
    return GameObjectManager.instance.getUserName(userKey);
  }

  @VueEvent
  private getActorName(actorKey: string) {
    return GameObjectManager.instance.getActorName(actorKey);
  }

  @VueEvent
  private isContain(
    data: StoreData<any>,
    authorityGroup: StoreData<AuthorityGroupStore>
  ) {
    if (
      data.collection === SocketFacade.instance.userCC().collectionNameSuffix
    ) {
      return authorityGroup.data!.list.some(
        ag => ag.type === "user" && ag.userKey === data.key
      );
    }
    if (
      data.collection === SocketFacade.instance.actorCC().collectionNameSuffix
    ) {
      return authorityGroup.data!.list.some(
        ag => ag.type === "actor" && ag.actorKey === data.key
      );
    }
    return false;
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "basic", text: "", isDisabled: false },
    { key: "2", target: "contents", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.currentTabInfo = this.tabList.find(t => t.target === "basic")!;
  }

  @VueEvent
  private async add() {
    await App.openSimpleWindow("authority-group-add-window");
  }

  @VueEvent
  private async edit(key: string) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "authority-group-edit-window",
        args: {
          type: this.cc.collectionNameSuffix,
          key: key
        }
      }
    });
  }

  @VueEvent
  private async chmod(key: string) {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: this.cc.collectionNameSuffix,
          key: key
        }
      }
    });
  }

  @VueEvent
  private async deleteAuthorityGroup(key: string) {
    const result = await questionDialog({
      title: this.$t("button.delete").toString(),
      text: this.$t(
        `${this.windowInfo.type}.dialog.delete-resource`
      )!.toString(),
      confirmButtonText: this.$t("button.delete").toString(),
      cancelButtonText: this.$t("button.reject").toString()
    });
    if (!result) return;
    try {
      await this.cc.deletePackage([key]);
    } catch (err) {
      await errorDialog({
        title: this.$t("message.error").toString(),
        text: this.$t("message.delete-failure")!.toString()
      });
      return;
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include inline-flex-box(column, stretch, flex-start);
  position: relative;
  width: 100%;
  height: 100%;
}

.simple-tab-component {
  flex: 1;
  min-height: 0;
}

.tab-container {
  overflow-y: scroll;
  flex: 1;
}

.list {
  flex: 1;
}

table {
  border-left: 1px solid gray;

  th,
  td {
    border-style: solid;
    border-color: gray;
  }

  td {
    text-align: center;
  }

  thead {
    label {
      position: absolute;
      left: calc(2em + 4px);
      bottom: 0;
      width: 11.5em;
      text-align: left;
      height: calc(1.4em + 1px);
      transform: rotate(-45deg);
      transform-origin: left bottom;
      border-style: solid;
      border-color: gray;
      border-width: 0 0 1px 0;
    }

    .empty {
      position: relative;

      label {
        left: auto;
        right: 0;
        transform: rotate(135deg);
        transform-origin: right bottom;
      }
    }

    td {
      position: relative;
      border-width: 1px 0 0 0;
    }

    th {
      position: relative;
      width: 2em;
      min-width: 2em;
      height: 8em;
      border-width: 1px 0 0 0;
    }
  }

  tbody {
    th {
      border-width: 1px 1px 0 1px;
    }

    td {
      width: 2em;
      min-width: 2em;

      &.margin {
        width: 8em;
        border: none;
        background-color: inherit !important;
      }

      &:not(.margin) {
        border-width: 1px 1px 0 1px;
      }
    }

    tr {
      &.user {
        th,
        td {
          background-color: var(--uni-color-cream);
        }
      }
      &.actor {
        th,
        td {
          background-color: var(--uni-color-white);
        }
      }

      &:last-child {
        th,
        td {
          border-bottom-width: 1px;
        }
      }
    }

    .empty {
      background-color: var(--uni-color-cream) !important;
      width: 1em;
      border-width: 0 1px;
    }
  }
}

.button-area {
  @include inline-flex-box(row, center, flex-start);
  width: 100%;
}
</style>
