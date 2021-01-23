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

    <button-area
      :is-commit-able="true"
      commit-text="delete"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { DeleteRoomInput } from "@/@types/socket";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";

@Component({
  components: { ButtonArea, BaseInput }
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
