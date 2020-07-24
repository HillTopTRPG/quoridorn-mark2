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
            list="urlList"
          />
          <datalist id="urlList" v-if="originalUrlList.length > 1">
            <option
              v-for="(urlInfo, index) in originalUrlList"
              :key="index"
              :value="urlInfo.url"
            >
              {{ urlInfo.title }}
            </option>
          </datalist>
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
        <template v-if="testStatus === 'testing'">
          <span class="icon-hour-glass"></span>
        </template>
        <template v-if="testStatus === 'not-quoridorn'">
          <span class="icon-confused"></span>
        </template>
        <template v-if="testStatus === 'no-such-server'">
          <span class="icon-wondering"></span>
        </template>
        <template v-if="testStatus === 'internal-server-error'">
          <span class="icon-warning"></span>
        </template>
        <template v-if="testStatus === 'success'">
          <span class="icon-grin"></span>
          ：<span class="selectable">{{ testServerTitle }}</span>
          <br />
          （
          <span class="selectable">{{ testServerVersion }}</span>
          ）
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
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import BaseInput from "../../core/component/BaseInput.vue";
import {
  AppServerSettingInput,
  DefaultServerInfo
} from "../../../@types/socket";
import VueEvent from "../../core/decorator/VueEvent";

@Component({
  components: {
    CtrlButton,
    BaseInput
  }
})
export default class AppServerSettingWindow extends Mixins<
  WindowVue<never, AppServerSettingInput>
>(WindowVue) {
  private url: string = "";
  private readonly originalUrlList: DefaultServerInfo[] =
    SocketFacade.instance.appServerUrlList;
  private testMessage: string = "";
  private testStatus: string = "";
  private testServerTitle: string = "";
  private testServerVersion: string = "";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.url = SocketFacade.instance.appServerUrl;
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
      const info = await SocketFacade.instance.testServer(this.url);
      this.testServerTitle = info.title;
      this.testServerVersion = info.serverVersion;
      this.testStatus = "success";
    } catch (err) {
      switch (err) {
        case "internal-server-error":
          this.testMessage = "サーバ内でエラーが発生しました";
          break;
        case "not-quoridorn":
          this.testMessage = "Quoridornサーバではありません";
          break;
        case "no-such-server":
          this.testMessage = "接続できませんでした";
          break;
        case "un-match-version":
          this.testMessage = "互換性の無いバージョンのサーバです";
          break;
        default:
      }
      this.testStatus = err;
    }
  }

  @VueEvent
  private async commit() {
    await this.finally({
      url: this.url
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
</style>
