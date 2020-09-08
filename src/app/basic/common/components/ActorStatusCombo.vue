<template>
  <label @contextmenu.prevent>
    <input
      type="text"
      class="input"
      list="actorStatus"
      placeholder="状態"
      :value="localValue"
      @change="event => changeValue(event.target.value)"
      @keydown.enter.stop
      @keyup.enter.stop
      @keydown.229.stop
      @keyup.229.stop
    />
    <datalist id="actorStatus">
      <option v-for="status in useStatusList" :key="status" :value="status">
        {{ status }}
      </option>
    </datalist>
  </label>
</template>

<script lang="ts">
import { Component, Emit, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class ActorStatusCombo extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Array, required: true })
  private statusList!: any[];

  @Prop({ type: Array, required: true })
  private selectedStatusList!: any[];

  private change(value: string) {
    this.$emit("input", value);
  }

  get localValue(): string {
    return this.value;
  }

  set localValue(value: string) {
    this.change(value);
  }

  changeValue(value: string) {
    this.localValue = value;
  }

  get useStatusList(): any[] {
    const selectedStatusNameList = this.selectedStatusList.map(
      (status: any) => status.name
    );
    return this.statusList
      .map((status: any) => status.name)
      .filter(
        (statusName: string) =>
          selectedStatusNameList.indexOf(statusName) === -1
      );
  }
}
</script>
