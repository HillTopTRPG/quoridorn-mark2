export type DiceSystem = {
  system: string;
  name: string;
  sort_key: string | undefined; // BCDice Ver2.06対応
};

export type BcdiceVersionInfo = {
  api: string;
  bcdice: string;
};

export type BcdiceSystemInfo = {
  name: string;
  gameType: string;
  prefixs: string[];
  info: string;
};

export type DiceResult = {
  faces: number;
  value: number;
};

export type BcdiceDiceRollResult = {
  ok: string;
  result?: string;
  secret?: boolean;
  dices?: DiceResult[];
};
