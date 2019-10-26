<template>
  <div>
    <div class="base-area">
      <div>アプリケーションサーバに関する設定</div>
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
        <span>{{ testMessage }}</span>
        <span class="icon-hour-glass" v-if="testStatus === 'testing'"></span>
        <span
          class="icon-confused"
          v-if="testStatus === 'not-quoridorn'"
        ></span>
        <span
          class="icon-wondering"
          v-if="testStatus === 'no-such-server'"
        ></span>
        <span
          class="icon-warning"
          v-if="testStatus === 'internal-server-error'"
        ></span>
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
      <ctrl-button @click.stop="commit()">確定</ctrl-button>
      <ctrl-button @click.stop="rollback()">キャンセル</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { AppServerSettingInput } from "@/@types/room";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade, {
  DefaultServerInfo
} from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: { DiceBotSelect, BaseInput, TableComponent, CtrlButton }
})
export default class AppServerSettingWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
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
    this.testMessage = "接続中...";
    this.testStatus = "testing";
    try {
      const info = await SocketFacade.instance.testServer(this.url);
      this.testMessage = "接続成功";
      this.testServerTitle = info.title;
      this.testServerVersion = info.version;
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
    this.finally({
      url: this.url
    });
    await this.close();
  }

  @VueEvent
  private async rollback() {
    this.finally();
    await this.close();
  }

  @VueEvent
  private async beforeDestroy() {
    this.finally();
  }

  private finally(appServerSetting?: AppServerSettingInput) {
    const task = TaskManager.instance.getTask<AppServerSettingInput>(
      "window-open",
      this.windowInfo.taskKey
    );
    if (task) task.resolve(appServerSetting ? [appServerSetting] : []);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.base-area {
  @include flex-box(column, stretch, center);
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
