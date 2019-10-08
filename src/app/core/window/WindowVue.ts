import { Prop, Vue, Watch } from "vue-property-decorator";
import { WindowInfo } from "@/@types/window";

export default class WindowVue<T> extends Vue {
  @Prop({ type: Object, required: true })
  protected windowInfo!: WindowInfo<unknown>;
  @Prop({ type: String, required: true })
  protected status!: string;
  @Prop({ type: Boolean, required: true })
  protected isResizing!: boolean;

  protected __args: T | null = null;

  @Watch("__args")
  private onChangeArgs(args: T) {
    this.windowInfo.args = args;
  }

  @Watch("windowInfo.args", { immediate: true })
  private onChangeWindowArgs(args: T) {
    this.__args = args;
  }

  protected get key() {
    return `${this.windowKey}-${this.status}`;
  }

  protected get args(): T | null {
    return this.__args;
  }

  protected set args(args: T | null) {
    this.__args = args;
  }

  protected get windowKey(): string {
    return this.windowInfo.key;
  }
}
