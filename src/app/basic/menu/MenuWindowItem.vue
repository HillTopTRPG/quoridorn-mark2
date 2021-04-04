<template>
  <div
    class="item"
    v-t="`${type}.window-title`"
    @click="onClickItem"
    :class="{ disabled: isDisabled }"
  ></div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import App from "@/views/App.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { WindowSetting } from "@/@types/store-data-optional";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { RoomDataStore } from "@/@types/store-data";

@Component
export default class MenuWindowItem extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private type!: string;

  private roomData = GameObjectManager.instance.roomData;
  @TaskProcessor("room-data-update-finished")
  private async roomDataUpdateFinished(
    task: Task<RoomDataStore, never>
  ): Promise<TaskResult<never> | void> {
    this.roomData = task.value!;
  }

  private get isDisabled() {
    const type = this.type.replace("-window", "");
    const windowSettings = this.roomData.settings.windowSettings;
    const windowSetting = (windowSettings as any)[type];
    if (!windowSetting) return false;
    return (windowSetting as WindowSetting) === "not-use";
  }

  @VueEvent
  private async onClickItem(event: MouseEvent) {
    if (this.isDisabled) return;
    this.$emit("click", event);
    await App.openSimpleWindow(this.type);
  }
}
</script>
