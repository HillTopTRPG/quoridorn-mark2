import { convertNumberZero, zeroPadding } from "./PrimaryDataUtility";
import { ApplicationError } from "../error/ApplicationError";

const colorMap: { [name: string]: string } = {
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  ghostwhite: "#f8f8ff",
  aliceblue: "#f0f8ff",
  lavender: "#e6e6fa",
  azure: "#f0ffff",
  lightcyan: "#e0ffff",
  mintcream: "#f5fffa",
  honeydew: "#f0fff0",
  ivory: "#fffff0",
  beige: "#f5f5dc",
  lightyellow: "#ffffe0",
  lightgoldenrodyellow: "#fafad2",
  lemonchiffon: "#fffacd",
  floralwhite: "#fffaf0",
  oldlace: "#fdf5e6",
  cornsilk: "#fff8dc",
  papayawhite: "#ffefd5",
  blanchedalmond: "#ffebcd",
  bisque: "#ffe4c4",
  snow: "#fffafa",
  linen: "#faf0e6",
  antiquewhite: "#faebd7",
  seashell: "#fff5ee",
  lavenderblush: "#fff0f5",
  mistyrose: "#ffe4e1",
  gainsboro: "#dcdcdc",
  lightgray: "#d3d3d3",
  lightsteelblue: "#b0c4de",
  lightblue: "#add8e6",
  lightskyblue: "#87cefa",
  powderblue: "#b0e0e6",
  paleturquoise: "#afeeee",
  skyblue: "#87ceeb",
  mediumaquamarine: "#66cdaa",
  aquamarine: "#7fffd4",
  palegreen: "#98fb98",
  lightgreen: "#90ee90",
  khaki: "#f0e68c",
  palegoldenrod: "#eee8aa",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  peachpuff: "#ffdab9",
  wheat: "#f5deb3",
  pink: "#ffc0cb",
  lightpink: "#ffb6c1",
  thistle: "#d8bfd8",
  plum: "#dda0dd",
  silver: "#c0c0c0",
  darkgray: "#a9a9a9",
  lightslategray: "#778899",
  slategray: "#708090",
  slateblue: "#6a5acd",
  steelblue: "#4682b4",
  mediumslateblue: "#7b68ee",
  royalblue: "#4169e1",
  blue: "#0000ff",
  dodgerblue: "#1e90ff",
  cornflowerblue: "#6495ed",
  deepskyblue: "#00bfff",
  cyan: "#00ffff",
  aqua: "#00ffff",
  turquoise: "#40e0d0",
  mediumturquoise: "#48d1cc",
  darkturquoise: "#00ced1",
  lightseagreen: "#20b2aa",
  mediumspringgreen: "#00fa9a",
  springgreen: "#00ff7f",
  lime: "#00ff00",
  limegreen: "#32cd32",
  yellowgreen: "#9acd32",
  lawngreen: "#7cfc00",
  chartreuse: "#7fff00",
  greenyellow: "#adff2f",
  yellow: "#ffff00",
  gold: "#ffd700",
  orange: "#ffa500",
  darkorange: "#ff8c00",
  goldenrod: "#daa520",
  burlywood: "#deb887",
  tan: "#d2b48c",
  sandybrown: "#f4a460",
  darksalmon: "#e9967a",
  lightcoral: "#f08080",
  salmon: "#fa8072",
  lightsalmon: "#ffa07a",
  coral: "#ff7f50",
  tomato: "#ff6347",
  orangered: "#ff4500",
  red: "#ff0000",
  deeppink: "#ff1493",
  hotpink: "#ff69b4",
  palevioletred: "#db7093",
  violet: "#ee82ee",
  orchid: "#da70d6",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  mediumorchid: "#ba55d3",
  darkorchid: "#9932cc",
  darkviolet: "#9400d3",
  blueviolet: "#8a2be2",
  mediumpurple: "#9370db",
  gray: "#808080",
  mediumblue: "#0000cd",
  darkcyan: "#008b8b",
  cadetblue: "#5f9ea0",
  darkseagreen: "#8fbc8f",
  mediumseagreen: "#3cb371",
  teal: "#008080",
  forestgreen: "#228b22",
  seagreen: "#2e8b57",
  darkkhaki: "#bdb76b",
  peru: "#cd853f",
  crimson: "#dc143c",
  indianred: "#cd5c5c",
  rosybrown: "#bc8f8f",
  mediumvioletred: "#c71585",
  dimgray: "#696969",
  black: "#000000",
  midnightblue: "#191970",
  darkslateblue: "#483d8b",
  darkblue: "#00008b",
  navy: "#000080",
  darkslategray: "#2f4f4f",
  green: "#008000",
  darkgreen: "#006400",
  darkolivegreen: "#556b2f",
  olivedrab: "#6b8e23",
  olive: "#808000",
  darkgoldenrod: "#b8860b",
  chocolate: "#d2691e",
  sienna: "#a0522d",
  saddlebrown: "#8b4513",
  firebrick: "#b22222",
  brown: "#a52a2a",
  maroon: "#800000",
  darkred: "#8b0000",
  darkmagenta: "#8b008b",
  purple: "#800080",
  indigo: "#4b0082"
};

export function parseColor(colorText: string) {
  let _c: any = null;
  colorText = colorText.trim().toLowerCase();
  if (colorMap[colorText]) colorText = colorMap[colorText];
  const colorCodeRegExp = new RegExp(
    "^#(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})|([0-9a-f])([0-9a-f])([0-9a-f]))$"
  );
  const rgbRegExp = new RegExp(
    "^rgb *\\( *([0-9]+) *, *([0-9]+) *, *([0-9]+) *\\)$"
  );
  const rgbaRegExp = new RegExp(
    "^rgba *\\( *([0-9]+) *, *([0-9]+) *, *([0-9]+) *, *(1|0|0\\.[0-9]+) *\\)$"
  );
  const rgbaResult = colorText.match(rgbaRegExp);
  const rgbResult = colorText.match(rgbRegExp);
  const colorCodeResult = colorText.match(colorCodeRegExp);
  if (rgbaResult) {
    _c = {
      r: convertNumberZero(rgbaResult[1].trim()),
      g: convertNumberZero(rgbaResult[2].trim()),
      b: convertNumberZero(rgbaResult[3].trim()),
      a: parseFloat(rgbaResult[4])
    };
  } else if (rgbResult) {
    _c = {
      r: convertNumberZero(rgbResult[1].trim()),
      g: convertNumberZero(rgbResult[2].trim()),
      b: convertNumberZero(rgbResult[3].trim()),
      a: 1
    };
  } else if (colorCodeResult) {
    if (colorCodeResult[1].length === 6) {
      _c = {
        r: convertNumberZero(colorCodeResult[2], 16),
        g: convertNumberZero(colorCodeResult[3], 16),
        b: convertNumberZero(colorCodeResult[4], 16),
        a: 1
      };
    } else {
      _c = {
        r: convertNumberZero(Array(3).join(colorCodeResult[5]), 16),
        g: convertNumberZero(Array(3).join(colorCodeResult[6]), 16),
        b: convertNumberZero(Array(3).join(colorCodeResult[7]), 16),
        a: 1
      };
    }
  } else {
    throw new ApplicationError(`Illegal color-text. text: ${colorText}`);
  }
  _c.getColorCode = () =>
    `#${zeroPadding(_c.r.toString(16), 2)}${zeroPadding(
      _c.g.toString(16),
      2
    )}${zeroPadding(_c.b.toString(16), 2)}`;
  _c.getColorCodeReverse = () =>
    `#${zeroPadding((255 - _c.r).toString(16), 2)}${zeroPadding(
      (255 - _c.g).toString(16),
      2
    )}${zeroPadding((255 - _c.b).toString(16), 2)}`;
  _c.getRGB = () => `rgb(${_c.r}, ${_c.g}, ${_c.b})`;
  _c.getRGBA = () => `rgba(${_c.r}, ${_c.g}, ${_c.b}, ${_c.a})`;
  _c.getRGBReverse = () => `rgb(${255 - _c.r}, ${255 - _c.g}, ${255 - _c.b})`;
  return _c;
}

export function changeColorAlpha(color: string, alpha: number): string {
  const colorObj = parseColor(color);
  colorObj.a = alpha;
  return colorObj.getRGBA();
}
