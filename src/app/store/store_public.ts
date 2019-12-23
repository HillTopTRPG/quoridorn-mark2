import map from "../basic/map/store_public_map";
import character from "../basic/map-object/character/store_public_character";
import diceSymbol from "../basic/map-object/dice-symbol/store_public_diceSymbol";
import floorTile from "../basic/map-object/floor-tile/store_public_floorTile";
import setting from "./store_public_setting";
import image from "../basic/image/store_public_image";

export default {
  modules: {
    map,
    character,
    diceSymbol,
    floorTile,
    setting,
    image
  }
};
