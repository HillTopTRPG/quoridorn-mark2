<template>
  <div>
    <div class="message">
      <span class="icon-notification"></span>
      <span class="text">{{ message }}</span>
    </div>
    <fieldset>
      <legend>Webサーバの利用規約</legend>
      <div class="selectable">{{ webServerTermOfUse }}</div>
    </fieldset>
    <fieldset>
      <legend>Appサーバの利用規約</legend>
      <div class="selectable">{{ appServerTermOfUse }}</div>
    </fieldset>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">確認</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import { Message } from "@/@types/room";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
const webServerTermOfUse = require("../../../../public/static/conf/termsOfUse.txt");

@Component({
  components: { CtrlButton }
})
export default class TermsOfUseWindow extends Mixins<
  WindowVue<{ message: Message }>
>(WindowVue) {
  private readonly message: string =
    "各サーバの利用規約をご確認いただき、これらすべての内容を守ってご利用ください。";
  private appServerTermOfUse: string | null = null;
  private webServerTermOfUse: string = webServerTermOfUse.default;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.appServerTermOfUse = this.windowInfo.args!.message.termsOfUse;
  }

  @VueEvent
  private async commit() {
    await this.close();
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.message {
  @include flex-box(row, flex-start, center);
  background-color: white;
  padding: 0.5rem;

  .icon-notification {
    font-size: 150%;
    background-color: var(--uni-color-yellow);
    border-radius: 50%;
    margin-right: 0.3rem;
  }

  .text {
    white-space: pre-wrap;
  }
}

fieldset {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin: 0;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: white;

  legend {
    background-color: inherit;
    border: inherit;
  }

  div {
    white-space: pre-wrap;
  }
}
</style>
