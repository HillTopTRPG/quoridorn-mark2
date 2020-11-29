import shinobigami from "@/app/core/utility/trpg_system/shinobigami";
import nechronica from "@/app/core/utility/trpg_system/nechronica";
import magicaLogia from "@/app/core/utility/trpg_system/magicalogia";
import inSane from "@/app/core/utility/trpg_system/insane";
import { MemoStore } from "@/@types/store-data";

export type TrpgSystemHelper = {
  isThis: (url: string) => Promise<boolean>;
  createOtherText: (url: string) => Promise<MemoStore[] | null>;
};

export async function getTrpgSystemHelper(
  url: string
): Promise<TrpgSystemHelper | null> {
  if (await shinobigami.isThis(url)) return shinobigami; // シノビガミ
  if (await nechronica.isThis(url)) return nechronica; // ネクロニカ
  if (await magicaLogia.isThis(url)) return magicaLogia; // マギカロギア
  if (await inSane.isThis(url)) return inSane; // インセイン
  return null;
}
