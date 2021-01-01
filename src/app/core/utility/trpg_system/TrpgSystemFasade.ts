import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";
import { ShinobigamiHelper } from "@/app/core/utility/trpg_system/shinobigami";
import { NechronicaHelper } from "@/app/core/utility/trpg_system/nechronica";
import { StellarKnightsHelper } from "@/app/core/utility/trpg_system/stellarKnights";
import { InSaneHelper } from "@/app/core/utility/trpg_system/insane";
import { MagicalogiaHelper } from "@/app/core/utility/trpg_system/magicalogia";

export async function getTrpgSystemHelper(
  url: string
): Promise<TrpgSystemHelper<any> | null> {
  const helperList: TrpgSystemHelper<unknown>[] = [
    new ShinobigamiHelper(url), // シノビガミ
    new NechronicaHelper(url), // ネクロニカ
    new MagicalogiaHelper(url), // マギカロギア
    new InSaneHelper(url), // インセイン
    new StellarKnightsHelper(url) // ステラナイツ
  ];
  const results = await Promise.all(
    helperList.map(async h => ((await h.isThis()) ? h : null))
  );
  return results.find(h => h) || null;
}
