type DiceSystem = {
  system: string;
  name: string;
  sort_key: string | undefined; // BCDice Ver2.06対応
  systemInfo: BcdiceSystemInfo | null;
};

type BcdiceServerInfo = {
  api: string;
  bcdice: string;
};

type BcdiceSystemInfo = {
  name: string;
  gameType: string;
  info: string;
  prefixs?: string[];
  commandPattern?: string;
};
