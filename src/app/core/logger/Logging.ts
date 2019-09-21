import { generateMethodDecorator } from "@/app/core/decorator/generateMethodDecorator";

const logger = {
  generator: (methodName: string) => {
    window.console.log(`# method called ${methodName}`);
  }
};

const Logging = generateMethodDecorator([logger]);
export default Logging;
