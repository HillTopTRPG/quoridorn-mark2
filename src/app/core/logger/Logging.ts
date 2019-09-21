import { generateMethodDecorator } from "@/app/core/decorator/generateMethodDecorator";

const logger = {
  generator: (methodName: string) => {
    window.console.log(`👁️${methodName}`);
  }
};

const Logging = generateMethodDecorator([logger]);
export default Logging;
