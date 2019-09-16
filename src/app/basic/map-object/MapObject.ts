type SetDataOrderArg = {
  key: string;
  value: any;
  isDebug?: boolean;
  isShare?: boolean;
};

abstract class DataStore {
  abstract setData(args: SetDataOrderArg): void;
}

export interface MapObject extends SyncObj, LocationPoint {
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
    from: LocationPoint;
    dragging: LocationPoint;
    gridOffset: LocationPoint;
  };
  angle: {
    total: number;
    dragging: number;
    dragStart: number;
  };
  isLock: boolean;
}
