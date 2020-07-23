import { TaskProcess } from "task";
import { NoSuchMethodError } from "../error/NoSuchMethodError";
const changeCase = require("change-case");

/**
 * Class Decorator
 * インスタンスメソッドをタスクリスナーに登録する
 * @param taskList タスク名の一覧
 */
export default function TaskProcessorClass<
  T extends { new (...args: any[]): {} }
>(...taskList: string[]) {
  // beforeMountメソッドを作成、もしくはオーバーライトする
  return (c: T) => {
    const original = c.prototype["beforeMount"];

    // メソッド上書き
    c.prototype["beforeMount"] = function() {
      taskList.forEach((taskName: string) => {
        const funcName: string = changeCase.camelCase(taskName);
        const process: TaskProcess<unknown, unknown> = c.prototype[funcName];
        if (!process) {
          // Decoratorから例外を投げても無視されるのでこれは飾り
          new NoSuchMethodError(c.name, funcName);
          return;
        }
        // タスク名に対応する関数を登録
        // TaskManager.instance.addTaskListener(taskName, process.bind(this), "");
      });
      // 元のメソッドがあれば呼ぶ
      if (original) original();
    };
  };
}
