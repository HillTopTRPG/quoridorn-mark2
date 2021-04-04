import { TrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemHelper";
import { ShinobigamiHelper } from "@/app/core/utility/trpg_system/shinobigami";
import { NechronicaHelper } from "@/app/core/utility/trpg_system/nechronica";
import { StellarKnightsHelper } from "@/app/core/utility/trpg_system/stellarKnights";
import { InSaneHelper } from "@/app/core/utility/trpg_system/insane";
import { MagicalogiaHelper } from "@/app/core/utility/trpg_system/magicalogia";
import { Coc7thCharaeno } from "@/app/core/utility/trpg_system/coc7thCharaeno";
import { Coc6thCharaeno } from "@/app/core/utility/trpg_system/coc6thCharaeno";

export async function getTrpgSystemHelper(
  url: string
): Promise<TrpgSystemHelper<any> | null> {
  const helperList: TrpgSystemHelper<unknown>[] = [
    new ShinobigamiHelper(url), // シノビガミ
    new NechronicaHelper(url), // ネクロニカ
    new MagicalogiaHelper(url), // マギカロギア
    new InSaneHelper(url), // インセイン
    new StellarKnightsHelper(url), // ステラナイツ
    new Coc7thCharaeno(url), // CoC7版(Charaeno)
    new Coc6thCharaeno(url) // CoC6版(Charaeno)
  ];
  const results = await Promise.all(
    helperList.map(async h => ((await h.isThis()) ? h : null))
  );
  return results.find(h => h) || null;
}
