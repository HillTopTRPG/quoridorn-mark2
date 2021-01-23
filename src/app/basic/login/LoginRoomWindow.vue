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
          :placeholder="$t('label.password-placeholder')"
          @keydown.enter.stop="commit()"
          @keyup.enter.stop
        />
      </label>
    </div>

    <button-area
      :is-commit-able="true"
      commit-text="next"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { LoginRoomInput } from "@/@types/socket";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";

@Component({
  components: {
    ButtonArea,
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
