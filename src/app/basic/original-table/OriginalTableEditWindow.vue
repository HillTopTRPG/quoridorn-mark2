<template>
  <div class="container" ref="window-container">
    <original-table-info-form
      v-if="isMounted"
      :windowKey="windowKey"
      :isAdd="false"
      :obj="obj"
      :window-info="windowInfo"
    />

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="modify"
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
import VueEvent from "@/app/core/decorator/VueEvent";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";
import OriginalTableInfoForm from "@/app/basic/original-table/OriginalTableInfoForm.vue";
import { OriginalTableStore } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({ components: { OriginalTableInfoForm, ButtonArea } })
export default class OriginalTableEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<OriginalTableStore> {
  private editWindowDelegator = new EditWindowDelegator<
    OriginalTableStore,
    "commandName"
  >(this, "commandName");

  private obj: OriginalTableStore = {
    tableTitle: "",
    system: "DiceBot",
    bcdiceVersion: GameObjectManager.instance.roomData.bcdiceVersion,
    bcdiceServer: GameObjectManager.instance.roomData.bcdiceServer,
    commandName: "",
    diceRoll: "1D6",
    tableContents: {}
  };
  private isMounted: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
    this.isMounted = true;
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
    return this.editWindowDelegator.isDuplicateBasic(this.obj.commandName);
  }

  @Watch("obj.commandName")
  private onChangeIsDuplicate() {
    this.windowInfo.message = this.editWindowDelegator.onChangeIsDuplicateBasic();
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<OriginalTableStore>): void {
    this.obj.tableContents = data.data!.tableContents;
    this.obj.bcdiceServer = data.data!.bcdiceServer;
    this.obj.bcdiceVersion = data.data!.bcdiceVersion;
    this.obj.system = data.data!.system;
    this.obj.diceRoll = data.data!.diceRoll;
    this.obj.commandName = data.data!.commandName;
    this.obj.tableTitle = data.data!.tableTitle;
  }

  public async pushStoreData(
    data: StoreData<OriginalTableStore>
  ): Promise<void> {
    data.data!.tableContents = this.obj.tableContents;
    data.data!.bcdiceServer = this.obj.bcdiceServer;
    data.data!.bcdiceVersion = this.obj.bcdiceVersion;
    data.data!.system = this.obj.system;
    data.data!.diceRoll = this.obj.diceRoll;
    data.data!.commandName = this.obj.commandName;
    data.data!.tableTitle = this.obj.tableTitle;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, flex-start, flex-start);
  width: 100%;
  height: 100%;
}

.button-area {
  align-self: center;
}
</style>
