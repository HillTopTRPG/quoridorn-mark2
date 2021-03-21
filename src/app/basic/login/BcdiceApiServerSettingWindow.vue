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
        <ctrl-select
          v-if="optionInfoList.length"
          v-model="version"
          :optionInfoList="optionInfoList"
        />
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

    <button-area
      :is-commit-able="!testStatus || testStatus === 'success'"
      commit-text="commit"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import { HtmlOptionInfo } from "@/@types/window";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";

@Component({
  components: {
    CtrlSelect,
    CtrlButton,
    ButtonArea,
    BaseInput
  }
})
export default class BcdiceApiServerSettingWindow extends Mixins<
  WindowVue<{ url: string; version: string }, { url: string; version: string }>
>(WindowVue) {
  private url: string = "";
  private version: string = "";
  private testMessage: string = "";
  private testStatus: string = "";
  private apiVersion: string = "";
  private bcdiceVersion: string = "";
  private optionInfoList: HtmlOptionInfo[] = [];

  private async createOptionInfoList(isUpdateVersion: boolean) {
    const vList = await BcdiceManager.instance.getSupportVersion(this.url);
    if (!vList.length) throw "connect-error";
    const latestFormat = this.$t("label.ref-latest").toString();
    const oldFormat = this.$t("label.ref-old").toString();
    const formatList: string[] = [latestFormat, oldFormat];
    this.optionInfoList = vList.map((v, ind) => ({
      value: v,
      text: (vList.length === 1 ? formatList[0] : formatList[ind]!).replace(
        "$1",
        v
      ),
      key: v,
      disabled: !BcdiceManager.isSupportVersion(v)
    }));
    const matchVersion =
      vList.find(v => BcdiceManager.isSupportVersion(v)) || "";
    if (isUpdateVersion) {
      this.version = matchVersion;
    }
    if (!matchVersion) throw "un-supported-version-error";
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.url = this.windowInfo.args!.url.toString();
    this.version = this.windowInfo.args!.version.toString();
    await this.createOptionInfoList(false);
  }

  @Watch("url")
  private async test() {
    console.log("test");
    this.testStatus = "testing";

    let errorMessage: string = "";
    try {
      await this.createOptionInfoList(true);
    } catch (err) {
      errorMessage = err.toString();
      this.testStatus = "error";
    }

    if (this.testStatus === "testing") {
      try {
        const info: BcdiceServerInfo = await BcdiceManager.instance.getServerInfo(
          this.url,
          this.version
        );
        this.apiVersion = info.api;
        this.bcdiceVersion = info.bcdice;
        this.testStatus =
          this.apiVersion || this.bcdiceVersion ? "success" : "error";
      } catch (err) {
        this.testStatus = "error";
      }
      if (this.testStatus === "error") {
        errorMessage = "connect-error";
      }
    }
    if (this.testStatus === "error") {
      this.testMessage = this.$t(
        `${this.windowInfo.key}.error-messages.${errorMessage}`
      )!.toString();
      listToEmpty(this.optionInfoList);
      this.version = "";
    }
  }

  @VueEvent
  private async commit() {
    await this.finally({
      url: this.url,
      version: this.version
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
.api {
  margin-right: 2rem;
}
</style>
