<template>
  <div ref="window-container">
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <label>
        <span class="label-input" v-t="'label.password'"></span>
        <base-input
          type="password"
          :value="password"
          @input="password = $event.target.value"
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
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import BaseInput from "../../core/component/BaseInput.vue";
import { DeleteRoomInput } from "../../../@types/socket";
import VueEvent from "../../core/decorator/VueEvent";

@Component({
  components: { BaseInput, CtrlButton }
})
export default class DeleteRoomWindow extends Mixins<
  WindowVue<never, DeleteRoomInput>
>(WindowVue) {
  private password: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private async commit() {
    await this.finally({
      roomPassword: this.password
    });
  }

  @VueEvent
  private async rollback() {
    await this.finally();
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
