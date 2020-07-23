<template>
  <div ref="window-container">
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <label>
        <span class="label-input" v-t="'label.password'"></span>
        <input-password-component
          :comp-key="`${key}-password`"
          v-model="password"
          :setting="false"
          @keydown.enter.stop="commit()"
          @keyup.enter.stop
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
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import { LoginRoomInput } from "../../../@types/socket";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import InputPasswordComponent from "../../core/component/InputPasswordComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";

@Component({
  components: {
    CtrlButton,
    InputPasswordComponent
  }
})
export default class LoginRoomWindow extends Mixins<
  WindowVue<never, LoginRoomInput>
>(WindowVue) {
  private password: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter(".base-area select", this.commit);
    this.inputEnter(".base-area input:not([type='button'])", this.commit);
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
