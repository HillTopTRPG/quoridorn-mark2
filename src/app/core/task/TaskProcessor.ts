import TaskManager from "./TaskManager";
import { TaskProcess } from "task";
import {
  generateMethodDecorator,
  generateMethodDecoratorFactory,
  GenerateProcessInfo
} from "../decorator/generateMethodDecorator";

const changeCase = require("change-case");

const mounted: GenerateProcessInfo = {
  method: "mounted",
  generator: function(
    this: any,
    methodName: string,
    func: TaskProcess<unknown, unknown>,
    taskName?: string
  ) {
    if (!taskName) taskName = changeCase.paramCase(methodName);
    if (!this.key) console.warn("Unset key: ", this.constructor.name);
    TaskManager.instance.addTaskListener(taskName!, func, this.key);
  }
};

const beforeDestroy: GenerateProcessInfo = {
  method: "beforeDestroy",
  generator: function(
    this: any,
    methodName: string,
    func: TaskProcess<unknown, unknown>,
    taskName?: string
  ) {
    if (!taskName) taskName = changeCase.paramCase(methodName);
    TaskManager.instance.removeTaskListener(taskName!, this.key);
  }
};

const list: GenerateProcessInfo[] = [mounted, beforeDestroy];

/** Method Decorator(括弧ありパターン) */
const TaskProcessor = generateMethodDecoratorFactory(...list);
export default TaskProcessor;

/** Method Decorator(括弧なしパターン) */
export const TaskProcessorSimple = generateMethodDecorator(list);
