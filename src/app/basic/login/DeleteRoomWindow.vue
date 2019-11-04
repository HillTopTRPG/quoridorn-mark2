<template>
  <div>
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <label>
        <span v-t="'label.password'"></span>
        <base-input
          type="password"
          :value="password"
          @input="password = $event.target.value"
          ref="firstFocus"
        />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">
        <span v-t="'button.execution'"></span>
      </ctrl-button>
      <ctrl-button @click.stop="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
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
import { DeleteRoomInput } from "@/@types/socket";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component({
  components: { BaseInput, CtrlButton }
})
export default class DeleteRoomWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  private password: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
  }

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
  line-height: 1.5;

  label {
    @include flex-box(row, flex-start, center);
    margin-top: 0.2rem;

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
