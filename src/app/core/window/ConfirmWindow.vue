<template>
  <div>
    <div class="base-area">
      <div class="message" v-if="info" :class="info.type">
        <span class="icon-warning" v-if="info.type === 'warning'"></span>
        <span
          class="icon-notification"
          v-if="info.type === 'notification'"
        ></span>
        <span class="icon-question" v-if="info.type === 'question'"></span>
        <span class="text selectable">{{ message }}</span>
      </div>
    </div>

    <button-area
      :is-commit-able="true"
      commit-text="ok"
      @commit="commit()"
      rollback-text="cancel"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

export type ConfirmInfo = {
  target: string;
  type: "notification" | "warning" | "question";
};

@Component({
  components: { ButtonArea, BaseInput }
})
export default class ConfirmWindow extends Mixins<
  WindowVue<ConfirmInfo, boolean>
>(WindowVue) {
  private info: ConfirmInfo | null = null;
  private message: string | null = null;

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    const type = this.windowInfo.type;
    const target = this.info!.target;
    this.windowInfo.title = this.$t(`${type}.${target}.title`)!.toString();
    this.message = this.$t(`${type}.${target}.message`)!.toString();
    task.resolve();
  }

  @LifeCycle
  public async mounted() {
    await this.init();
    this.info = this.windowInfo.args!;
    const type = this.windowInfo.type;
    const target = this.info!.target;
    this.windowInfo.title = this.$t(`${type}.${target}.title`)!.toString();
    this.message = this.$t(`${type}.${target}.message`)!.toString();
  }

  @VueEvent
  private async commit() {
    await this.finally(true);
  }

  @VueEvent
  private async rollback() {
    await this.finally(false);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.base-area {
  @include flex-box(column, stretch, center);
  line-height: 1.5;

  .message {
    height: 2em;
    @include flex-box(row, flex-start, center);

    > *[class^="icon-"] {
      font-size: 150%;
      margin-right: 0.3rem;
      position: relative;
      display: inline-block;
    }

    > .icon-warning {
      &:after {
        content: "";
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
        border-width: 1em 0.5em;
        border-bottom-color: var(--uni-color-yellow);
        z-index: -1;
      }
    }

    > .icon-notification {
      border-radius: 50%;
      background-color: var(--uni-color-skyblue);
    }

    > .icon-question {
      border-radius: 50%;
      background-color: var(--uni-color-green);
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
