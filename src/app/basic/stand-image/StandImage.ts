export type StandImageDiffInfo = {
  key: string;
  statusName: string;
  image: string;
  tag: string;
  x: number;
  y: number;
  type: number;
  time: [number, number];
};

export type StandImageInfo = {
  ref: string;
  base: string;
  baseTag: string;
  autoResize: boolean;
  animationLength: number;
  locate: number;
  diffList: StandImageDiffInfo[];
  isSystemLock: boolean;
};
