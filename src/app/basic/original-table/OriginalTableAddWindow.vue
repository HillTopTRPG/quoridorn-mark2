<template>
  <div class="container" ref="window-container">
    <original-table-info-form
      :windowKey="windowKey"
      :isAdd="true"
      :obj="obj"
      :window-info="windowInfo"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="add"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import WindowVue from "@/app/core/window/WindowVue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import AddWindowDelegator, {
  AddWindow
} from "@/app/core/window/AddWindowDelegator";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import OriginalTableInfoForm from "@/app/basic/original-table/OriginalTableInfoForm.vue";
import { OriginalTableStore } from "@/@types/room";

@Component({ components: { OriginalTableInfoForm, ButtonArea } })
export default class OriginalTableAddWindow
  extends Mixins<WindowVue<OriginalTableStore, boolean>>(WindowVue)
  implements AddWindow<OriginalTableStore> {
  private addWindowDelegator = new AddWindowDelegator<
    OriginalTableStore,
    "commandName"
  >(
    this,
    SocketFacade.instance.originalTableListCC().collectionNameSuffix,
    "commandName"
  );

  private obj: OriginalTableStore = {
    tableTitle: "",
    system: "DiceBot",
    bcdiceVersion: GameObjectManager.instance.roomData.bcdiceVersion,
    bcdiceServer: GameObjectManager.instance.roomData.bcdiceServer,
    commandName: "",
    diceRoll: "1D6",
    tableContents: {}
  };

  @LifeCycle
  public async mounted() {
    await this.addWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return (
      !!this.obj.tableTitle &&
      !!this.obj.commandName &&
      !!this.obj.diceRoll &&
      !!Object.keys(this.obj.tableContents).length &&
      !this.isDuplicate()
    );
  }

  public isDuplicate(): boolean {
    return this.addWindowDelegator.isDuplicateBasic(this.obj.commandName);
  }

  @Watch("obj.commandName")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.addWindowDelegator.onChangeIsDuplicateBasic();
  }

  @VueEvent
  private async commit() {
    await this.addWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.addWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.addWindowDelegator.rollback();
  }

  public setStoreData(data: OriginalTableStore): void {
    this.obj.tableContents = data.tableContents;
    this.obj.bcdiceServer = data.bcdiceServer;
    this.obj.bcdiceVersion = data.bcdiceVersion;
    this.obj.system = data.system;
    this.obj.diceRoll = data.diceRoll;
    this.obj.commandName = data.commandName;
    this.obj.tableTitle = data.tableTitle;
  }

  public async getStoreDataList(): Promise<
    DelegateStoreData<OriginalTableStore>[]
  > {
    const gameMastersAuthorityGroup = GameObjectManager.instance.authorityGroupList.find(
      ag => ag.data!.isSystem && ag.data!.name === "GameMasters"
    )!;
    const gameMastersPermission: PermissionNode = {
      type: "group",
      key: gameMastersAuthorityGroup.key
    };
    return [
      {
        collection: SocketFacade.instance.originalTableListCC()
          .collectionNameSuffix,
        permission: {
          view: { type: "none", list: [] },
          edit: { type: "allow", list: [gameMastersPermission] },
          chmod: { type: "allow", list: [gameMastersPermission] }
        },
        data: { ...this.obj }
      }
    ];
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, flex-start, center);
  width: 100%;
  height: 100%;
}

.button-area {
  align-self: center;
}
</style>
