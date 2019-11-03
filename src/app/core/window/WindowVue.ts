import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { WindowInfo } from "@/@types/window";
import { Mixin } from "vue-mixin-decorator";
import TaskManager from "@/app/core/task/TaskManager";

// @ts-ignore
@Mixin
export default class WindowVue<T> extends Vue {
  @Prop({ type: Object, required: true })
  public windowInfo!: WindowInfo<T>;
  @Prop({ type: String, required: true })
  public status!: string;
  @Prop({ type: Boolean, required: true })
  public isResizing!: boolean;

  public async init() {
    if (this.status === "window") {
      await TaskManager.instance.ignition<string, never>({
        type: "window-active",
        owner: "Quoridorn",
        value: this.windowKey
      });

      if (!this.windowInfo.declare.isInputWindow) {
        // 入力画面でないなら表示タスクは完了にする
        if (this.windowInfo.taskKey) {
          const task = TaskManager.instance.getTask(
            "window-open",
            this.windowInfo.taskKey
          );
          if (!task) {
            window.console.warn(`No such task. type=${this.windowInfo.type}`);
            return;
          }
          task.resolve();
        }
      }
    }
    setTimeout(() => {
      const elm: any | null =
        "firstFocus" in this.$refs
          ? (this.$refs.firstFocus as HTMLElement)
          : null;
      if (!elm) return;
      if ("focus" in elm) elm.focus();
      else {
        if ("$refs" in elm && "component" in elm.$refs) {
          const componentElm = elm.$refs.component as HTMLElement;
          componentElm.querySelector("input")!.focus();
        } else {
          window.console.warn(elm);
        }
      }
    });
  }

  public get key() {
    return `${this.windowKey}-${this.status}`;
  }

  public get windowKey(): string {
    return this.windowInfo.key;
  }

  public async close() {
    await TaskManager.instance.ignition<string, never>({
      type: "window-close",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
  }

  public inputEnter(target: string | any, callback: () => void) {
    const elm =
      typeof target === "string"
        ? (document.getElementById(target) as HTMLElement)
        : target;
    if ("addEventListener" in elm) {
      elm.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          event.stopPropagation();
          callback();
        }
      });
    } else {
      if ("$refs" in elm && "component" in elm.$refs) {
        const componentElm = elm.$refs.component as HTMLElement;
        let inputElm: HTMLElement | null = componentElm;
        if (componentElm.tagName !== "INPUT")
          inputElm = componentElm.querySelector("input");
        if (!inputElm) {
          window.console.warn(elm);
          return;
        }
        inputElm.addEventListener("keydown", (event: KeyboardEvent) => {
          if (event.key === "Enter") {
            event.stopPropagation();
            callback();
          }
        });
      } else {
        window.console.warn(elm);
      }
    }
  }
}
