<template>
  <div>
    <div class="base-area">
      <div>新規プレイルームを作成します。</div>
      <label>
        <span>プレイルーム名：</span>
        <base-input
          type="text"
          :value="name"
          @input="name = $event.target.value"
          placeholder="仮プレイルーム（削除可能）"
        />
      </label>
      <label>
        <span>パスワード(空ならパスワードなし)：</span>
        <base-input
          type="password"
          :value="password"
          @input="password = $event.target.value"
        />
      </label>
      <label>
        <span>ゲームシステム：</span>
        <dice-bot-select v-model="system" />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">作成</ctrl-button>
      <ctrl-button @click.stop="rollback()">キャンセル</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { CreateRoomInput } from "@/@types/room";

@Component({
  components: { DiceBotSelect, BaseInput, TableComponent, CtrlButton }
})
export default class CreateNewRoomWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  private name: string = "";
  private password: string = "";
  /** 選択されているシステム */
  private system: string = "DiceBot";

  @Watch("currentDiceBotSystem")
  private onChangeCurrentDiceBotSystem(system: string) {
    window.console.log(system);
  }

  @VueEvent
  private async commit() {
    this.finally({
      name: this.name,
      system: this.system,
      roomPassword: this.password
    });
    await this.close();
  }

  @VueEvent
  private async rollback() {
    this.finally();
    await this.close();
  }

  @VueEvent
  private async beforeDestroy() {
    this.finally();
  }

  private finally(roomInfo?: CreateRoomInput) {
    const task = TaskManager.instance.getTask<CreateRoomInput>(
      "window-open",
      this.windowInfo.taskKey
    );
    if (task) task.resolve(roomInfo ? [roomInfo] : []);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.base-area {
  @include flex-box(column, stretch, center);
  label {
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
}
</style>
