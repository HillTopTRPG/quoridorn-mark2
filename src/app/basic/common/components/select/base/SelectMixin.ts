import { Prop, Vue } from "vue-property-decorator";
import { Component } from "vue-mixin-decorator";

@Component
export default class SelectMixin extends Vue {
  @Prop({ default: "" })
  public value!: string | string[] | null;

  @Prop({ type: String, default: null })
  public elmId!: string | null;

  @Prop({ type: Boolean, default: false })
  protected multiple!: boolean;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly!: boolean;

  @Prop({ type: Boolean, default: false })
  private isPending!: boolean;

  @Prop({ type: Boolean, default: false })
  private test!: boolean;

  public input(value: string | string[] | null) {
    this.$emit("input", value);
  }

  public focus(): void {
    (this.$refs.component as any).focus();
  }

  public get localValue(): string | string[] | null {
    if (this.test)
      console.log("set '" + this.value + "'", this.constructor.name);
    return this.value;
  }

  public set localValue(value: string | string[] | null) {
    if (this.test) console.log("return '" + value + "'", this.constructor.name);
    this.input(value);
  }

  // updated() {
  //   const optionValueStrList: string[] = this.optionInfoList.concat();
  //   optionValueStrList.push("");
  //
  //   if (this.test) {
  //     console.log("updated", this.value, this.constructor.name, optionValueStrList);
  //   }
  //
  //   this.onChangeValue(this.value);
  //
  //   const index = optionValueStrList.findIndex(
  //     option => option === this.localValue
  //   );
  //   if (index === -1) {
  //     // console.log(optionValueStrList);
  //     // console.log("select reset", this.localValue, "-> ''");
  //     this.localValue = "";
  //   }
  // }
}
