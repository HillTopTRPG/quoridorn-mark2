<template>
  <div ref="window-container">
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <div class="item">
        <label>
          <span>URL：</span>
          <base-input
            type="text"
            :value="url"
            @input="url = $event.target.value"
          />
        </label>
        <ctrl-button @click.stop="test()">TEST</ctrl-button>
      </div>
      <div
        class="test-message"
        :class="{
          isError: testStatus !== 'success' && testStatus !== 'testing',
          isSuccess: testStatus === 'success'
        }"
        v-if="testStatus"
      >
        <span v-t="`${windowInfo.type}.${testStatus}`"></span>
        <template v-if="testStatus === 'error'">
          <span class="icon-hour-glass"></span>
        </template>
        <template v-if="testStatus === 'success'">
          <span class="icon-grin"></span><br />
          API：<span class="selectable api">{{ apiVersion }}</span>
          BCDice：<span class="selectable">{{ bcdiceVersion }}</span>
        </template>
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
import { Component, Watch } from "vue-property-decorator";
import WindowVue from "@/app/core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
import { BcdiceVersionInfo } from "@/@types/bcdice";
import LanguageManager from "@/LanguageManager";
import BaseInput from "@/app/core/component/BaseInput.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";

@Component({
  components: {
    CtrlButton,
    BaseInput
  }
})
export default class BcdiceApiServerSettingWindow extends Mixins<
  WindowVue<string, string>
>(WindowVue) {
  private url: string = "";
  private testMessage: string = "";
  private testStatus: string = "";
  private apiVersion: string = "";
  private bcdiceVersion: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.url = this.windowInfo.args!;
  }

  @Watch("currentDiceBotSystem")
  private onChangeCurrentDiceBotSystem(system: string) {
    window.console.log(system);
  }

  @VueEvent
  private async test() {
    window.console.log("test");
    this.testStatus = "testing";
    try {
      const info: BcdiceVersionInfo = await BcdiceManager.getBcdiceVersionInfo(
        this.url
      );
      this.apiVersion = info.api;
      this.bcdiceVersion = info.bcdice;
      this.testStatus = "success";
    } catch (err) {
      this.testMessage = LanguageManager.instance.getText(
        `${this.windowInfo.key}.error-messages.connect-error`
      );
      this.testStatus = "error";
    }
  }

  @VueEvent
  private async commit() {
    await this.finally(this.url);
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
  .test-message {
    font-size: 120%;

    &.isError {
      color: var(--uni-color-red);
    }
    &.isSuccess {
      color: var(--uni-color-blue);
    }
  }
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
.api {
  margin-right: 2rem;
}
</style>
