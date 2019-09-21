import TaskManager from "@/app/core/task/TaskManager";
const changeCase = require("change-case");

export default function Logging() {
  return (target: any, name: string, descriptor: PropertyDescriptor) => {
    const original: Function = descriptor.value;
    descriptor.value = function() {
      window.console.log(`# method called ${name}`);
      return original.apply(this, arguments);
    };
  };
}
