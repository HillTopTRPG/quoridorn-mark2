import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

@Component
export default class SelectMixin extends Vue {
  @Prop({ type: String, default: "" })
  public value!: string;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  @Emit("input")
  public input(value: string | null) {}

  public requestFocus(): void {
    const elm: CtrlSelect = this.$refs.select as CtrlSelect;
    // @ts-ignore
    elm.requestFocus();
  }

  private get localValue(): string | null {
    if (this.test)
      window.console.log("set '" + this.value + "'", this.constructor.name);
    return this.value || "";
  }

  private set localValue(value: string | null) {
    if (this.test)
      window.console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  // updated() {
  //   const optionValueStrList: string[] = this.optionInfoList.concat();
  //   optionValueStrList.push("");
  //
  //   if (this.test) {
  //     window.console.log("updated", this.value, this.constructor.name, optionValueStrList);
  //   }
  //
  //   this.onChangeValue(this.value);
  //
  //   const index = optionValueStrList.findIndex(
  //     option => option === this.localValue
  //   );
  //   if (index === -1) {
  //     // window.console.log(optionValueStrList);
  //     // window.console.log("select reset", this.localValue, "-> ''");
  //     this.localValue = "";
  //   }
  // }
}
