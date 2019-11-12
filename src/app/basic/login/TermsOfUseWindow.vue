<template>
  <div>
    <div class="message">
      <span class="icon-notification"></span>
      <span class="text" v-t="`${windowInfo.type}.message`"></span>
    </div>
    <fieldset>
      <legend v-t="'label.terms-of-use-web-server'"></legend>
      <div class="selectable">{{ webServerTermOfUse }}</div>
    </fieldset>
    <fieldset>
      <legend v-t="'label.terms-of-use-app-server'"></legend>
      <div class="selectable">{{ appServerTermOfUse }}</div>
    </fieldset>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">
        <span v-t="'button.commit'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import { Mixins } from "vue-mixin-decorator";
import { Message } from "@/@types/socket";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { loadText } from "@/app/core/File";

@Component({
  components: { CtrlButton }
})
export default class TermsOfUseWindow extends Mixins<
  WindowVue<{ message: Message }>
>(WindowVue) {
  private appServerTermOfUse: string | null = null;
  private webServerTermOfUse: string | null = null;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.appServerTermOfUse = this.windowInfo.args!.message.termsOfUse;
    this.webServerTermOfUse = await loadText("/static/conf/termsOfUse.txt");
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
