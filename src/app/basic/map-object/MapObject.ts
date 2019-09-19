import { Point } from "@/@types/address";

type SetDataOrderArg = {
  key: string;
  value: any;
  isDebug?: boolean;
  isShare?: boolean;
};

abstract class DataStore {
  abstract setData(args: SetDataOrderArg): void;
}

export interface MapObject extends SyncObj, Point {
  text: string;
  kind: string;
  columns: number;
  rows: number;
  place: string;
  order: number;
  isHideBorder: boolean;
  isHideHighlight: boolean;
  useImageList: string[];
  useImageIndex: number;
  currentImageTag: string;
  move: {
    from: Point;
    dragging: Point;
    gridOffset: Point;
  };
  angle: {
    total: number;
    dragging: number;
    dragStart: number;
  };
  isLock: boolean;
}
