<template>
  <div id="throw-parabola-container" ref="elm">
    <div class="object" v-for="obj in objList" :key="obj.key" ref="elms">
      <span class="object-char">{{ obj.char }}</span>
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
import { calcParabola } from "@/app/core/throwParabola/parabolaUtil";
import { Point } from "address";
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

    const radius = task.value!.radius;
    const ratio = task.value!.ratio;

    const obj1: any = {};
    const obj2: any = {
      "0%": {
        translate: ["-50%", "-50%"],
        rotate: `0deg`,
        scale: 1
      },
      "100%": {
        translate: ["-50%", "-50%"],
        rotate: `${-360 * Math.sign(radius)}deg`,
        scale: 0.5
      }
    };
    const parabolaResult = calcParabola(radius, ratio);
    parabolaResult.points.forEach((o: Point, idx: number, list: Point[]) => {
      const per = (100 * idx) / (list.length - 1);
      obj1[`${per}%`] = {
        translate: [o.x, o.y],
        opacity: 1
      };
    });
    // window.console.log(JSON.stringify(obj, null, "  "));
    this.objList.push(tpObj);

    // リストへの追加が要素に反映されるのを待つためにsetTimeout
    setTimeout(() => {
      const animeName1 = `throw-parabola-move-${key}`;
      const animeName2 = `throw-parabola-rotate-scale-${key}`;
      const duration = 1500 * parabolaResult.distanceRatio;
      const elms: HTMLElement[] = this.$refs.elms as HTMLElement[];
      (animations as any).registerAnimation({
        name: animeName1,
        animation: obj1,
        presets: { duration, easing: "linear" }
      });
      (animations as any).registerAnimation({
        name: animeName2,
        animation: obj2,
        presets: { duration, easing: "linear" }
      });

      const containerElm = elms[elms.length - 1];
      const charElm = containerElm.getElementsByClassName("object-char");
      (animations as any).runAnimation(containerElm, animeName1, () => {
        const index = this.objList.findIndex(o => o.key === key);
        this.objList.splice(index, 1);
      });
      (animations as any).runAnimation(charElm, animeName2);
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#throw-parabola-container {
  width: 0;
  height: 0;
}

.object {
  position: fixed;
  display: inline-block;
  height: 1em;
  left: 0;
  top: 0;
  opacity: 0;
  font-size: 1000%;
  pointer-events: none;
  transform-origin: center;
}

.object-char {
  position: absolute;
  display: inline-block;
  height: 1em;
  left: 0;
  top: 0;
  transform-origin: center;
}
</style>
