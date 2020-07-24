<template>
  <input
    :id="elmId"
    :type="inputType"
    :value="dataObj.data[colDec.target]"
    :checked="parseBoolean(dataObj.data[colDec.target])"
    @focus.stop="onFocus()"
    @input="inputCell(dataObj, colDec.target)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { StoreUseData } from "../../../@types/store";
import { WindowTableColumn } from "../../../@types/window";
import VueEvent from "../../core/decorator/VueEvent";
import { convertBooleanFalse } from "../../core/utility/PrimaryDataUtility";

@Component
export default class InitiativeInputComponent extends Vue {
  @Prop({ type: Object, required: true })
  private colDec!: WindowTableColumn;
  @Prop({ type: Object, required: true })
  private dataObj!: StoreUseData<any>;
  @Prop({ type: String, required: true })
  private inputType!: string;

  private get elmId(): string {
    return `prop-${this.dataObj.owner}-${this.colDec.target}`;
  }

  @VueEvent
  private inputCell(data: any, target: string) {
    this.$emit("inputCell", data, target, this.elmId);
  }

  @VueEvent
  private onFocus() {
    window.console.log("onFocus");
  }

  private parseBoolean(bool: string) {
    return convertBooleanFalse(bool);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
