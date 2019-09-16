<template>
  <label @contextmenu.prevent>
    <input
      type="text"
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
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import { Getter } from "vuex-class";

@Component
export default class ActorStatusCombo extends Vue {
  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Array, required: true })
  private statusList!: any[];

  @Prop({ type: Array, required: true })
  private selectedStatusList!: any[];

  @Emit("input")
  private change(value: string) {}

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
