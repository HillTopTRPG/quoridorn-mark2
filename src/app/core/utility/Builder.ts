type Builder<Props, Result> = ({} extends Props
  ? {
      build: () => Result;
    }
  : {}) &
  { [P in keyof Props]-?: SetFunction<Props, P, Result> };

type SetFunction<Props, K extends keyof Props, Result> = (
  value: Exclude<Props[K], undefined>
) => Builder<Pick<Props, Exclude<keyof Props, K>>, Result>;

type BuildFunction<Props, Result> = (props: Props) => Result;

const propsObject = Symbol();
const buildFunction = Symbol();
class BuilderImpl<Props, Result> {
  constructor(bf: BuildFunction<Props, Result>) {
    return new Proxy(
      {
        [propsObject]: {},
        [buildFunction]: bf
      },
      {
        get(target: any, prop: any, receiver: any) {
          if (prop === "build") {
            // build関数
            return () => target[buildFunction](target[propsObject]);
          } else {
            // それ以外はsetter関数
            return (value: any) => {
              target[propsObject][prop] = value;
              return receiver;
            };
          }
        }
      }
    );
  }
}

export function builderFactory<Props, Result>(
  bf: BuildFunction<Props, Result>
): new () => Builder<Props, Result> {
  return class {
    constructor() {
      return new BuilderImpl(bf);
    }
  } as any;
}
