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
import { Component, Prop } from "vue-property-decorator";
import { StoreObj } from "@/@types/store";
import { WindowTableColumn } from "@/@types/window";
import VueEvent from "../../core/decorator/VueEvent";
import { convertBooleanFalse } from "../../core/utility/PrimaryDataUtility";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component
export default class InitiativeInputComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private colDec!: WindowTableColumn;

  @Prop({ type: Object, required: true })
  private dataObj!: StoreObj<any>;

  @Prop({ type: String, required: true })
  private inputType!: string;

  // @Watch("dataObj", { immediate: true })
  // private onChangeDataObj() {
  //   console.log("#########################################");
  //   console.log(this.dataObj);
  // }

  private get elmId(): string {
    return `prop-${this.dataObj.owner}-${this.colDec.target}`;
  }

  @VueEvent
  private inputCell(data: any, target: string) {
    this.$emit("inputCell", data, target, this.elmId);
  }

  @VueEvent
  private onFocus() {
    console.log("onFocus");
  }

  @VueEvent
  private parseBoolean(bool: string) {
    return convertBooleanFalse(bool);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
