import { generateMethodDecorator } from "../decorator/generateMethodDecorator";

const logger = {
  generator: (methodName: string) => {
    console.log(`👁️${methodName}`);
  }
};

const Logging = generateMethodDecorator([logger]);
export default Logging;
