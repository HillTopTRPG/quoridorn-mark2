<template>
  <div>
    <div class="base-area">
      <div>部屋を削除します。</div>
      <label>
        <span>パスワード：</span>
        <base-input
          type="password"
          :value="password"
          @input="password = $event.target.value"
        />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">実行</ctrl-button>
      <ctrl-button @click.stop="rollback()">キャンセル</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { DeleteRoomInput } from "@/@types/room";

@Component({
  components: { BaseInput, CtrlButton }
})
export default class DeleteRoomWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  private password: string = "";

  @VueEvent
  private async commit() {
    this.finally({
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

  private finally(roomInfo?: DeleteRoomInput) {
    const task = TaskManager.instance.getTask<DeleteRoomInput>(
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
