type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

type Rectangle = Point & Size;

type Matrix = {
  column: number;
  row: number;
};

export type Anchor =
  | "left-top"
  | "left-center"
  | "left-bottom"
  | "center-top"
  | "center"
  | "center-bottom"
  | "right-top"
  | "right-center"
  | "right-bottom";
