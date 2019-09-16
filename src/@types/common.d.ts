declare module "skyway-js";
declare module "jszip";
declare module "file-saver";
declare module "vuedraggable";
declare module "vue-slider-component";
declare module "mustache";
declare module "mathjs";
declare module "crypto-js";
declare module "js-yaml";
declare function parseInt(s: string, radix?: number): number;

type LocationPoint = {
  x: number;
  y: number;
};

type Matrix = {
  c: number;
  r: number;
};

type SyncObj = {
  key: string;
  name: string;
  processTime: number;
  owner: string;
};

type SyncObjList<T extends SyncObj> = {
  list: T[];
  nextKey: number;
};
