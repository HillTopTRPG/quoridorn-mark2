import {
  generateMethodDecoratorFactory,
  GenerateProcessInfo
} from "@/app/core/decorator/generateMethodDecorator";
import EventManager from "@/app/core/event/EventManager";

type Listener = (this: Document, ev: MouseEvent | TouchEvent) => void;

const mounted: GenerateProcessInfo = {
  method: "mounted",
  generator: (
    methodName: string,
    func: Listener,
    eventName?: any,
    target?: any
  ) => {
    if (!eventName) return;
    if (!target) target = document;
    EventManager.instance.addListener(target!, eventName, func);
  }
};

const beforeDestroy: GenerateProcessInfo = {
  method: "beforeDestroy",
  generator: (
    methodName: string,
    func: Listener,
    eventName?: any,
    target?: any
  ) => {
    if (!eventName) return;
    if (!target) target = document;
    EventManager.instance.removeListener(eventName);
  }
};

const list: GenerateProcessInfo[] = [mounted, beforeDestroy];

/** Method Decorator(括弧ありパターン) */
const EventProcessor = generateMethodDecoratorFactory(...list);
export default EventProcessor;
