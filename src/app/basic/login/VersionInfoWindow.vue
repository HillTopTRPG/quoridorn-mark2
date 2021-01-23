<template>
  <div ref="window-container">
    <version-info-component
      v-if="serverTestResult"
      :serverTestResult="serverTestResult"
    />
    <div class="button-area">
      <ctrl-button @click.stop="commit()">
        <span v-t="'button.commit'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { ServerTestResult } from "@/@types/socket";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import VersionInfoComponent from "@/app/basic/login/VersionInfoComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({
  components: {
    VersionInfoComponent,
    CtrlButton
  }
})
export default class VersionInfoWindow extends Mixins<
  WindowVue<ServerTestResult, void>
>(WindowVue) {
  private serverTestResult: ServerTestResult | null = null;

  @LifeCycle
  public async mounted() {
    await this.init();
    if (this.windowInfo.args) {
      this.serverTestResult = this.windowInfo.args;
    } else {
      let resp: ServerTestResult;
      const url = SocketFacade.instance.appServerUrl;
      try {
        resp = await SocketFacade.instance.testServer(url);
      } catch (err) {
        console.warn(`${err}. url:${url}`);
        return;
      }
      this.serverTestResult = resp;
    }
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
  padding: 0.5rem;
}

fieldset {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin: 0.5rem 0 0;
  padding: 0 0.5rem 0.5rem;
  background-color: white;

  legend {
    background-color: inherit;
    border: inherit;
    line-height: 2em;
    box-sizing: border-box;
  }

  div {
    line-height: 2em;
  }
}
</style>
