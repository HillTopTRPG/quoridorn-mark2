import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { Mixin } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import TaskProcessor from "../task/TaskProcessor";
import TaskManager from "../task/TaskManager";
import { WindowInfo } from "../../../@types/window";

// @ts-ignore
@Mixin
export default class WindowVue<T, U> extends Vue {
  @Prop({ type: Object, required: true })
  public windowInfo!: WindowInfo<T>;
  @Prop({ type: String, required: true })
  public status!: string;
  @Prop({ type: Boolean, required: true })
  public isResizing!: boolean;

  private finalized: boolean = false;

  public async init() {
    this.windowFrameElm.style.visibility = "visible";
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
            console.warn(`No such task. type=${this.windowInfo.type}`);
            return;
          }
          task.resolve();
        }
      }
    }
    setTimeout(() => {
      const windowContainerElm: HTMLElement | null =
        "window-container" in this.$refs
          ? (this.$refs["window-container"] as HTMLElement)
          : null;
      if (!windowContainerElm) return;

      const inputElmList = Array.prototype.slice.call(
        windowContainerElm.getElementsByClassName("input")
      );
      const idx = inputElmList.findIndex(elm => !elm.disabled);
      if (idx >= 0) inputElmList[idx].focus();
    });
  }

  public get key() {
    return `${this.windowKey}-${this.status}`;
  }

  public get windowKey(): string {
    return this.windowInfo.key;
  }

  public get windowFrameElm(): HTMLElement {
    return document.getElementById(this.windowKey) as HTMLElement;
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (this.windowInfo.declare.isInputWindow) {
      await this.finally(undefined, true);
    }
  }

  public async finally(result?: U, isClosing: boolean = false) {
    if (this.finalized) return;
    const task = TaskManager.instance.getTask<U>(
      "window-open",
      this.windowInfo.taskKey
    );
    this.finalized = true;
    if (task) task.resolve(result !== undefined ? [result] : []);
    if (!isClosing) {
      await this.close();
    }
  }

  public async close() {
    await TaskManager.instance.ignition<string, never>({
      type: "window-close",
      owner: "Quoridorn",
      value: this.windowInfo.key
    });
  }

  public inputEnter(target: string, callback: () => void) {
    const windowContainerElm: HTMLElement | null =
      "window-container" in this.$refs
        ? (this.$refs["window-container"] as HTMLElement)
        : null;
    if (!windowContainerElm) return;

    Array.prototype.slice
      .call(windowContainerElm.querySelectorAll(target))
      .forEach(elm => {
        elm.addEventListener("keydown", (event: KeyboardEvent) => {
          const elm: HTMLElement = event.target! as HTMLElement;
          if (event.key === "Enter" && !event.isComposing) {
            if ((elm.className as string).indexOf("pending") > -1) return;
            event.stopPropagation();
            callback();
          }
        });
      });
  }
}
