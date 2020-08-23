<template>
  <div ref="window-container">
    <div class="base-area">
      <div class="item">
        <label>
          <base-input
            type="text"
            :value="text"
            :placeholder="label"
            @input="text = $event.target.value"
          />
        </label>
      </div>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">
        <span v-t="'button.commit'"></span>
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
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { CtrlButton, BaseInput } })
export default class SimpleTextInputWindow extends Mixins<
  WindowVue<{ title: string; label: string; text: string }, string>
>(WindowVue) {
  private label: string = "";
  private text: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.windowInfo.title = this.windowInfo.args!.title;
    this.label = this.windowInfo.args!.label;
    this.text = this.windowInfo.args!.text;
  }

  @VueEvent
  private async commit() {
    await this.finally(this.text);
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
  line-height: 1.5em;

  .item {
    @include flex-box(row, flex-start, center);

    > *:first-child {
      flex: 1;
    }
  }
  label {
    @include flex-box(row, flex-start, center);

    input {
      flex: 1;
      width: 10px;
    }
  }
}
</style>
