<template>
  <ctrl-radio
    :optionInfoList="optionInfoList"
    name="mode"
    v-model="localValue"
    :test="test"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import CtrlRadio from "../../../../core/component/CtrlRadio.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { CtrlRadio } })
export default class OtherTextEditModeRadio extends Vue {
  @Prop({ type: String, default: "edit" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  public input(value: string | null) {
    this.$emit("input", value);
  }

  private get localValue(): string | null {
    if (this.test)
      console.log("set '" + this.value + "'", this.constructor.name);
    return this.value || "";
  }

  private set localValue(value: string | null) {
    if (this.test) console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  @VueEvent
  private get optionInfoList() {
    return [
      { text: this.$t("button.edit").toString(), value: "edit" },
      { text: this.$t("button.preview").toString(), value: "preview" }
    ];
  }
}
</script>
