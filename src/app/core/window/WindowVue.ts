import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { WindowInfo } from "@/@types/window";
import { Mixin } from "vue-mixin-decorator";

// @ts-ignore
@Mixin
export default class WindowVue<T> extends Vue {
  @Prop({ type: Object, required: true })
  public windowInfo!: WindowInfo<T>;
  @Prop({ type: String, required: true })
  public status!: string;
  @Prop({ type: Boolean, required: true })
  public isResizing!: boolean;

  public get key() {
    return `${this.windowKey}-${this.status}`;
  }

  public get windowKey(): string {
    return this.windowInfo.key;
  }
}
