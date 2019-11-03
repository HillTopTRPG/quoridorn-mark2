<template>
  <div>
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <div>
        <span v-t="'label.isVisitor'"></span>
        <label>
          <base-input
            type="radio"
            v-model="userType"
            name="user-type"
            value="non-visitor"
            checked
          />
          <span v-t="'label.participant'"></span>
        </label>
        <label>
          <base-input
            type="radio"
            v-model="userType"
            name="user-type"
            value="visitor"
          />
          <span v-t="'label.visitor'"></span>
        </label>
      </div>
      <label>
        <span v-t="'label.password'"></span>
        <input-password-component
          :comp-key="`${key}-password`"
          v-model="password"
          :setting="false"
          @keydown.enter.stop="commit()"
          @keyup.enter.stop
          ref="firstFocus"
        />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">
        <span v-t="'button.next'"></span>
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
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { LoginRoomInput } from "@/@types/room";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component({
  components: {
    InputPasswordComponent,
    DiceBotSelect,
    BaseInput,
    TableComponent,
    CtrlButton
  }
})
export default class LoginRoomWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  private userType: string = "non-visitor";
  private password: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter(`${this.key}-password`, this.commit);
  }

  @VueEvent
  private async commit() {
    this.finally({
      roomPassword: this.password,
      isVisitor: this.userType === "visitor"
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

  private finally(roomInfo?: LoginRoomInput) {
    const task = TaskManager.instance.getTask<LoginRoomInput>(
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

  > * {
    @include flex-box(row, flex-start, center);

    &:not(:first-child) {
      margin-top: 0.2rem;
    }

    > span {
      color: gray;
      font-size: 80%;
    }

    > label {
      @include inline-flex-box(row, flex-start, center);
      height: 2em;
    }

    input {
      &:not([type="radio"]) {
        flex: 1;
        width: 10px;
      }
      &[type="radio"] {
        width: 1em;
        height: 1em;
      }
    }
  }
}
</style>
