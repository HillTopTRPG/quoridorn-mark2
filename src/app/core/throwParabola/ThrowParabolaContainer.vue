<template>
  <div id="throw-parabola-container" ref="elm">
    <div class="object" v-for="obj in objList" :key="obj.key" ref="elms">
      {{ obj.char }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-mixin-decorator";
import { Vue } from "vue-property-decorator";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import animations from "create-keyframe-animation";
import { ThrowParabolaInfo } from "task-info";
const uuid = require("uuid");

@Component
export default class ThrowParabolaContainer extends Vue {
  private readonly key = "ThrowParabolaSimulator";
  private objList: ThrowParabolaInfo[] = [];

  @TaskProcessor("throw-parabola-finished")
  private async throwParabolaFinished(
    task: Task<ThrowParabolaInfo, never>
  ): Promise<TaskResult<never> | void> {
    const tpObj = task.value!;
    const key = uuid.v4();
    tpObj.key = key;

    const obj: any = {};
    for (let i = 0; i <= 20; i++) {
      const o = tpObj.list[i];
      if (!o) {
        window.console.log("WARNING:::", i);
        continue;
      }
      obj[`${i * 5}%`] = {
        translate: [o.x, o.y],
        rotate: `${i * 20}deg`
      };
    }
    this.objList.push(tpObj);

    setTimeout(() => {
      const animeName = `throw-parabola-${key}`;
      const elms: HTMLElement[] = this.$refs.elms as HTMLElement[];
      (animations as any).registerAnimation({
        name: animeName,
        animation: obj,
        presets: {
          duration: 1500,
          easing: "linear",
          delay: 0
        }
      });
      (animations as any).runAnimation(elms[elms.length - 1], animeName, () => {
        const index = this.objList.findIndex(o => o.key === key);
        this.objList.splice(index, 1);
      });
    });
  }
}
</script>

<style lang="scss">
@import "../../../assets/common";

#throw-parabola-container {
  width: 0;
  height: 0;
  z-index: 13;
}

.object {
  position: fixed;
  left: -50px;
  top: 0;
  width: 50px;
  height: 50px;
  font-size: 500%;
  pointer-events: none;
}
</style>
