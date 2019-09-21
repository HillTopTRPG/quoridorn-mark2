export type MethodDecoratorFactory = (...args: any[]) => MethodDecorator;

export type GenerateProcess = (
  methodName: string,
  func: any,
  ...args: any[]
) => void;

export type GenerateProcessInfo = {
  method?: string;
  generator: GenerateProcess;
};

export const generateMethodDecorator = (
  processorList: GenerateProcessInfo[],
  ...args: any[]
): MethodDecorator => (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) => {
  processorList.forEach(p => {
    const methodName: string = p.method || propertyKey.toString();
    // window.console.log(p.method, propertyKey, methodName);
    const method: Function = descriptor.value;
    if (p.method) {
      const original = target[methodName];
      target[methodName] = function(...a: any[]) {
        p.generator(propertyKey.toString(), method.bind(this), ...args);
        if (original) return original.bind(this, ...a)();
      };
    } else {
      const original = descriptor.value;
      descriptor.value = function(...a: any[]) {
        p.generator(propertyKey.toString(), method.bind(this), ...args);
        if (original) return original.bind(this, ...a)();
      };
    }
  });
  return descriptor;
};

export const generateMethodDecoratorFactory = (
  ...processorList: GenerateProcessInfo[]
): MethodDecoratorFactory => (...args: any[]) =>
  generateMethodDecorator(processorList, ...args);
