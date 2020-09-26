type DiceSystem = {
  system: string;
  name: string;
  sort_key: string | undefined; // BCDice Ver2.06対応
};

type BcdiceVersionInfo = {
  api: string;
  bcdice: string;
};

type BcdiceSystemInfo = {
  name: string;
  gameType: string;
  prefixs: string[];
  info: string;
};
