import map from "../basic/map/store_public_map";
import character from "../basic/map-object/character/store_public_character";
import chit from "../basic/map-object/chit/store_public_chit";
import diceSymbol from "../basic/map-object/dice-symbol/store_public_diceSymbol";
import floorTile from "../basic/map-object/floor-tile/store_public_floorTile";
import mapMask from "../basic/map-object/map-mask/store_public_mapMask";
import setting from "./store_public_setting";
import image from "./store_public_image";

export default {
  modules: {
    map,
    character,
    chit,
    diceSymbol,
    floorTile,
    mapMask,
    setting,
    image
  }
};
