import { Prop, Vue, Watch } from "vue-property-decorator";
import WindowManager from "@/app/core/window/WindowManager";
import { WindowInfo } from "@/@types/window";

export default class WindowVue<T> extends Vue {
  @Prop({ type: String, required: true })
  private windowKey!: string;
  @Prop({ type: String, required: true })
  protected status!: string;

  private __args: T | null = null;

  @Watch("__args")
  private onChangeArgs(args: T) {
    this.windowInfo.args = args;
  }

  @Watch("windowInfo.args", { immediate: true })
  onChangeWindowArgs(args: T) {
    this.__args = args;
  }

  protected get args(): T | null {
    return this.__args;
  }

  protected set args(args: T | null) {
    this.__args = args;
  }

  protected get windowInfo(): WindowInfo<T> {
    return WindowManager.instance.getWindowInfo<T>(this.windowKey);
  }
}
