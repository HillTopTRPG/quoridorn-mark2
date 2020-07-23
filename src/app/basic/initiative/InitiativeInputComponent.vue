<template>
  <input
    :id="elmId"
    :type="inputType"
    :value="data.data[colDec.target]"
    @focus.stop="onFocus()"
    @input="inputCell(data, colDec.target)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { StoreUseData } from "../../../@types/store";
import { WindowTableColumn } from "../../../@types/window";
import VueEvent from "../../core/decorator/VueEvent";

@Component
export default class InitiativeInputComponent extends Vue {
  @Prop({ type: Object, required: true })
  private colDec!: WindowTableColumn;
  @Prop({ type: Object, required: true })
  private data!: StoreUseData<any>;
  @Prop({ type: String, required: true })
  private inputType!: string;

  private get elmId(): string {
    return `prop-${this.data.owner}-${this.colDec.target}`;
  }

  @VueEvent
  private inputCell(data: any, target: string) {
    this.$emit("inputCell", data, target, this.elmId);
  }

  @VueEvent
  private onFocus() {
    window.console.log("onFocus");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
