import { Point } from "@/@types/address";

type StandImageInfo = Point & {
  status: string;
  viewStart: number;
  viewEnd: number;
  type: "pile" | "replace";
};

type Image = {
  tag: string;
  data: string;
  password: string;
  standImageInfo: StandImageInfo | null;
};
