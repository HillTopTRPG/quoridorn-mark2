type CharacterSheetMeta = {
  url: string;
  jsonUrl: string;
};

type ShinobigamiUpperStyle =
  | "斜歯忍軍"
  | "鞍馬神流"
  | "ハグレモノ"
  | "比良坂機関"
  | "私立御斎学園"
  | "隠忍の血統"
  | "";

type ShinobigamiHaikei = {
  name: string;
  type: string;
  point: string;
  effect: string;
};

type ShinobigamiNinpou = {
  secret: boolean;
  name: string;
  type: string;
  targetSkill: string;
  range: string;
  cost: string;
  effect: string;
  page: string;
};

type ShinobigamiLearnedTokugi = {
  name: string;
  row: number;
  column: number;
};

type ShinobigamiTokugi = {
  table: string[][];
  tokugiList: ShinobigamiLearnedTokugi[];
  spaceList: number[];
};

type Shinobigami = {
  meta: CharacterSheetMeta;
  playerName: string;
  characterName: string;
  characterNameKana: string;
  upperStyle: ShinobigamiUpperStyle;
  subStyle: string;
  level: string;
  age: string;
  sex: string;
  cover: string;
  belief: string;
  stylerule: string;
  ninpouList: ShinobigamiNinpou[];
  backgroundList: ShinobigamiHaikei[];
  tokugi: ShinobigamiTokugi;
};
