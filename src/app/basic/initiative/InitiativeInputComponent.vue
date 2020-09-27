<template>
  <input
    :id="elmId"
    :type="inputType"
    :value="dataObj.data[colDec.target]"
    :checked="parseBoolean(dataObj.data[colDec.target])"
    @input="inputCell(dataObj, colDec.target, $event.target)"
    @click.stop
    @mousedown.stop
    @mouseup.stop
  />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
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
  private dataObj!: StoreData<any>;

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
  private inputCell(data: StoreData<any>, target: string) {
    const param = this.inputType === "checkbox" ? "checked" : "value";
    const value = (this.$el as HTMLInputElement)[param]!.toString();
    if (value === this.dataObj.data![this.colDec.target]) return;
    this.$emit("inputCell", data, target, this.elmId);
  }

  @VueEvent
  private parseBoolean(bool: string): boolean {
    return convertBooleanFalse(bool);
  }
}
</script>
