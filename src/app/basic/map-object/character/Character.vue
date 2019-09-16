<template>
  <div
    class="character"
    :class="[
      isThisRolling ? 'rolling' : '',
      isMoving ? 'moving' : '',
      isHover ? 'hover' : '',
      isBorderHide ? 'isBorderHide' : ''
    ]"
    :style="characterStyle"
    :title="storeObj.text[0].text"
    :id="storeObj.key"
    @click.right.prevent="
      e => openContext(e, 'private.display.characterContext')
    "
    @mouseover="mouseover"
    @mouseout="mouseout"
    @dblclick="dblClick"
    @mousedown.left.stop="leftDown"
    @mouseup.left.stop="leftUp"
    @mousedown.right.stop="rightDown"
    @mouseup.right.stop="rightUp"
    @touchstart="leftDown"
    @touchend="leftUp"
    @touchcancel="leftUp"
    @contextmenu.prevent
  >
    <sight-field
      v-for="range in rangeList"
      :key="range.key"
      :type="type"
      :objKey="objKey"
      :distance="range.distance"
      :distanceMode="range.distanceMode"
      :isVision="range.isVision"
      :color="range.color"
      :borderColor="range.borderColor"
      :targetColor="range.targetColor"
      :lineWidth="range.lineWidth"
    />
    <div class="checkPropertyArea">
      <div
        v-for="(checkObj, index) in checkPropertyList"
        :key="index"
        class="checkProperty"
        :style="{
          background: `radial-gradient(
            circle farthest-side at top left,
            white 10%,
            ${checkObj.color} 90%,
            black 120%
          )`
        }"
      ></div>
    </div>
    <div class="numberPropertyArea">
      <div
        v-for="(numObj, index) in numberPropertyList"
        :key="index"
        class="numberProperty"
      >
        <div class="bar">
          <div
            :style="{
              backgroundColor: numObj.color,
              width: numObj.ratio
            }"
          ></div>
        </div>
        <div class="value" :style="{ color: numObj.fontColor }">
          {{ numObj.value }}
        </div>
      </div>
    </div>
    <div class="selectHighlight" v-if="isViewHighlight"></div>
    <div class="border" v-if="!isBorderHide"></div>
    <img
      class="image"
      v-img="imageObj.data"
      :class="{ reverse: imageObj.isReverse }"
      draggable="false"
    />
    <div class="name">{{ name }}</div>
    <span
      class="rotate"
      v-show="(isViewPieceRotateMarker && isHover) || isThisRolling"
      draggable="false"
    >
      <i
        class="icon-redo2 roll-knob"
        @mousedown.stop="rollStart"
        @mouseup.stop="rollEnd"
        @touchstart.stop="rollStart"
        @touchend.stop="rollEnd"
        @touchcancel.stop="rollEnd"
      ></i>
    </span>
  </div>
</template>

<script lang="ts">
import PieceMixin from "@/app/basic/common/mixin/PieceMixin.vue";
import SightField from "@/app/basic/sight-field/SightField.vue";

import { Component, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";

@Component({
  components: {
    SightField
  }
})
export default class Character extends PieceMixin {
  @Getter("imageList") private imageList: any;
  @Getter("propertyList") private propertyList: any;
  @Getter("isViewPieceRotateMarker") private isViewPieceRotateMarker: any;

  private checkPropertyList: any[] = [];
  private numberPropertyList: any[] = [];
  private isViewHighlight: boolean = false;
  private highlightTimer: number | null = null;

  private rangeList: any[] = [
    // {
    //   key: 'range-1',
    //   distance: 7,
    //   distanceMode: 0,
    //   isVision: false,
    //   color: 'rgba(200, 0, 0, 0.2)',
    //   lineWidth: 1
    // },
    // {
    //   key: 'range-3',
    //   distance: 4,
    //   distanceMode: 0,
    //   isVision: false,
    //   color: 'rgba(200, 0, 0, 0.2)',
    //   lineWidth: 1
    // }
  ];

  mounted() {
    let color = "rgba(200, 0, 0, 0.3)";
    let borderColor = "rgba(255, 0, 0, 1)";
    if (this.objKey === "character-0") {
      color = "rgba(255, 0, 255, 0.3)";
      borderColor = "rgba(255, 0, 255, 1)";
    } else if (this.objKey === "character-1") {
      color = "rgba(0, 255, 255, 0.3)";
      borderColor = "rgba(0, 255, 255, 1)";
    }
    // const range = {
    //   key: "range-0",
    //   distance: 10.5,
    //   distanceMode: 0,
    //   isVision: false,
    //   color: color,
    //   borderColor: borderColor,
    //   targetColor: "rgba(0, 255, 0, 1)",
    //   lineWidth: 5
    // };
    // this.rangeList.push(range);
  }

  getKeyObj(list: any[], key: string) {
    const filteredList = list.filter(obj => obj.key === key);
    if (filteredList.length === 0) return null;
    if (filteredList.length > 1) return null;
    return filteredList[0];
  }
  dblClick() {
    const maxIndex = this.useImageList.split("|").length - 1;
    let nextIndex = this.useImageIndex + 1;
    if (nextIndex > maxIndex) {
      nextIndex = 0;
    }

    this.changeListObj({
      key: this.objKey,
      isNotice: true,
      useImageIndex: nextIndex
    });
  }

  get characterStyle(): any {
    let obj = this.style;
    if (this.storeObj.isDraggingLeft) {
      const plus = 1.5;
      obj.left = this.rect.left - plus + "px";
      obj.top = this.rect.top - plus + "px";
      obj.width = this.rect.width + plus * 2 + "px";
      obj.height = this.rect.height + plus * 2 + "px";
    }
    // window.console.log(` [computed] character(${this.objKey}) style => lt(${obj.left}, ${obj.top}), wh(${obj.width}, ${obj.height}), bg:"${obj['background-color']}", font:"${obj.color}"`)
    return obj;
  }
  get name(): string {
    return this.storeObj.name;
  }
  get useImageList(): string {
    return this.storeObj.useImageList;
  }
  get useImageIndex(): number {
    return this.storeObj.useImageIndex;
  }
  get isBorderHide(): number {
    return this.storeObj.isBorderHide;
  }
  get imageObj() {
    if (this.useImageList === "") return "";
    const imageStr = this.useImageList.split("|")[this.useImageIndex];
    const imageKey = imageStr.replace(":R", "");
    return {
      isReverse: imageStr.indexOf(":R") >= 0,
      data: this.getKeyObj(this.imageList, imageKey).data
    };
  }

  @Watch("property", { deep: true, immediate: true })
  onChangeProperty(property: any) {
    const checkPropertyList: any[] = [];
    const numberPropertyList: any[] = [];
    this.propertyList.forEach((prop: any, index: number) => {
      if (prop.type === "number") {
        // 最小値の取得
        let min: number | null = null;
        if (prop.min !== null) {
          min = prop.min;
        } else {
          const prevProp: any = this.propertyList[index - 1];
          if (prevProp && prevProp.type === "min") {
            min = property[prop.property + "-min"];
          }
        }

        // 現在値の取得
        const value: number = property[prop.property];

        // 最大値の取得
        let max: number | null = null;
        if (prop.max !== null) {
          max = prop.max;
        } else {
          const nextProp: any = this.propertyList[index + 1];
          if (nextProp && nextProp.type === "max") {
            max = property[prop.property + "-max"];
          }
        }

        if (min === null) return;
        if (max === null) return;

        numberPropertyList.push({
          type: "number",
          min,
          value,
          max
        });
      }
      if (prop.type === "checkbox") {
        const value: boolean = property[prop.property];
        const color: string = prop.color;

        if (value) {
          checkPropertyList.push({
            type: "checkbox",
            color
          });
        }
      }
    });

    let colorIndex: number = 0;
    const colorList: string[] = [
      "#D40044",
      "#99CF30",
      "#0D2189",
      "#FF7F15",
      "#008679",
      "#56017B",
      "#FE411A",
      "#33A244",
      "#271383",
      "#FFE62F",
      "#035D86",
      "#AF0063"
    ];
    const complementaryColorList: string[] = [
      "#2BFFBB",
      "#6630CF",
      "#F2DE76",
      "#0080EA",
      "#FF7986",
      "#A9FE84",
      "#01BEE5",
      "#CC5DBB",
      "#D8EC7C",
      "#0019D0",
      "#FCA279",
      "#50FF9C"
    ];

    this.checkPropertyList = checkPropertyList;
    this.numberPropertyList = numberPropertyList.map((obj, index) => {
      const range = obj.max - obj.min;
      const diff = obj.value - obj.min;
      const ratio = (diff * 100) / range;
      const useColorIndex = colorIndex++;
      if (colorIndex >= colorList.length) {
        colorIndex = 0;
      }
      return {
        min: obj.min,
        max: obj.max,
        value: obj.value,
        ratio: ratio + "%",
        color: colorList[useColorIndex],
        fontColor: complementaryColorList[useColorIndex]
      };
    });
  }

  @Watch("viewHighlight")
  onChangeViewHighlight(viewHighlight: boolean) {
    if (viewHighlight) {
      // タイマーをリセット
      if (this.highlightTimer !== null) {
        clearTimeout(this.highlightTimer);
      }

      // 値をすぐに戻す
      this.changeListObj({
        key: this.objKey,
        isNotice: false,
        viewHighlight: false
      });

      // ハイライトを表示
      this.isViewHighlight = true;
      // 時間差でハイライトを非表示
      this.highlightTimer = setTimeout(() => {
        this.isViewHighlight = false;
        this.highlightTimer = null;
      }, 300);
    }
  }

  get viewHighlight(): boolean {
    return this.storeObj.viewHighlight;
  }

  get property(): any {
    return this.storeObj.property;
  }
}
</script>

<style scoped lang="scss">
.character {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  font-size: 12px;
  cursor: crosshair;
  border-radius: 3px;
  z-index: 800000000;
  overflow: visible;

  &.hover {
    z-index: 899999999;
  }

  &.hover.moving,
  &.rolling {
    z-index: 999999999;
  }

  &:before {
    content: "";
    position: absolute;
    left: -2px;
    right: -2px;
    bottom: -2px;
    top: -2px;
    border: solid black 2px;
  }

  &.isBorderHide:before {
    border: none;
  }
}

img.image {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;

  &.reverse {
    transform: scale(-1, 1);
  }
}

.rotate {
  position: absolute;
  left: -5px;
  top: -5px;
  object-fit: fill;
  background-color: red;
  width: 15px;
  height: 15px;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    width: 19px;
    height: 19px;
    transform: translate(-2px, -2px);
  }
}

.name {
  position: absolute;
  top: calc(-1em - 4px);
  background-color: rgba(255, 255, 255, 0.3);
  padding: 0 3px;
}

.selectHighlight {
  position: absolute;
  left: -15px;
  top: -15px;
  right: -15px;
  bottom: -15px;
  background-color: rgba(255, 255, 0, 1);
  filter: blur(25px);
}

.border {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 4px solid rgb(187, 187, 0);
  border-radius: 1px;
}

.checkPropertyArea {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: absolute;
  left: 0;
  bottom: 0;
  max-width: 100%;
  z-index: 1;

  .checkProperty {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1px solid rgb(230, 230, 230);
  }
}

.numberPropertyArea {
  display: inline-flex;
  flex-direction: column;
  flex-wrap: wrap;
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 1em + 6px);
  z-index: 1;

  .numberProperty {
    position: relative;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    font-size: 10px;
    height: 10px;

    .bar {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 1;

      > div {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        height: 100%;
      }
    }
    .value {
      z-index: 2;
    }
  }
}
</style>
