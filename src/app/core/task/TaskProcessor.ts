import TaskManager from "./TaskManager";
import { TaskProcess } from "@/@types/task";
import {
  generateMethodDecorator,
  generateMethodDecoratorFactory,
  GenerateProcessInfo
} from "@/app/core/decorator/generateMethodDecorator";

const changeCase = require("change-case");

const mounted: GenerateProcessInfo = {
  method: "mounted",
  generator: function(
    this: any,
    methodName: string,
    func: TaskProcess<any>,
    taskName?: string
  ) {
    if (!taskName) taskName = changeCase.paramCase(methodName);
    TaskManager.instance.addTaskListener(taskName!, func, this.key);
  }
};

const beforeDestroy: GenerateProcessInfo = {
  method: "beforeDestroy",
  generator: function(
    this: any,
    methodName: string,
    func: TaskProcess<any>,
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
