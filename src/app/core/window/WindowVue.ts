import Vue from "vue";
import { Prop } from "vue-property-decorator";
import { WindowInfo } from "@/@types/window";
import { Mixin } from "vue-mixin-decorator";
import TaskManager from "@/app/core/task/TaskManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";

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
      const windowContainerElm: HTMLElement | null =
        "window-container" in this.$refs
          ? (this.$refs["window-container"] as HTMLElement)
          : null;
      if (!windowContainerElm) return;

      const elmList = Array.prototype.slice.call(
        windowContainerElm.querySelectorAll("input, select")
      );

      for (const elm of elmList) {
        if (elm.tagName === "INPUT" && elm.value) continue;
        elm.focus();
        break;
      }
    });
  }

  public get key() {
    return `${this.windowKey}-${this.status}`;
  }

  public get windowKey(): string {
    return this.windowInfo.key;
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    if (task.value !== this.windowInfo.key) return;
    if (this.windowInfo.declare.isInputWindow)
      await this.finally(undefined, true);
  }

  @LifeCycle
  public async beforeDestroy() {
    if (this.windowInfo.declare.isInputWindow) await this.finally();
  }

  public async finally(result?: U, isClosing: boolean = false) {
    if (this.finalized) return;
    const task = TaskManager.instance.getTask<U>(
      "window-open",
      this.windowInfo.taskKey
    );
    this.finalized = true;
    if (task) task.resolve(result ? [result] : []);
    if (!isClosing) await this.close();
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
          if (event.key === "Enter") {
            event.stopPropagation();
            callback();
          }
        });
      });
  }
}
