<template>
  <div
    class="diceSymbol"
    :class="[
      isHover ? 'hover' : '',
      isMoving ? 'moving' : '',
      storeObj.isHide ? 'isHide' : ''
    ]"
    :style="chitStyle"
    :id="storeObj.key"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @mousedown.left.stop="leftDown"
    @mouseup.left.stop="leftUp"
    @mousedown.right.stop="rightDown"
    @touchstart="leftDown"
    @touchend="leftUp"
    @touchcancel="leftUp"
    @contextmenu.prevent
  >
    <div class="border"></div>
    <img
      class="image"
      v-img="diceImage"
      draggable="false"
      v-if="!isAbsoluteHide"
    />
    <div class="balloon" v-if="isHover">
      <span v-if="ownerPlayer">[{{ ownerPlayer.name }}]のダイス</span>
      <span>
        {{ storeObj.isHide ? "非公開：" : "" }}
        {{ isAbsoluteHide ? "" : `${storeObj.pips} / D${storeObj.faceNum}` }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import PieceMixin from "../../common/mixin/PieceMixin.vue";

@Component({})
export default class DiceSymbol extends PieceMixin<"dice-symbol"> {
  // @Getter("dicePipsImage") private dicePipsImage: any;
  // @Getter("playerKey") private playerKey: any;
  //
  // private getKeyObj(list: any[], key: string) {
  //   const filteredList = list.filter(obj => obj.key === key);
  //   if (filteredList.length === 0) return null;
  //   if (filteredList.length > 1) return null;
  //   return filteredList[0];
  // }
  //
  // private get chitStyle() {
  //   let obj: any = this.style;
  //   if (this.storeObj.isDraggingLeft) {
  //     const plus = 1.5;
  //     obj.left = this.rect.left - plus + "px";
  //     obj.top = this.rect.top - plus + "px";
  //     obj.width = this.rect.width + plus * 2 + "px";
  //     obj.height = this.rect.height + plus * 2 + "px";
  //     obj.opacity = 0.6;
  //   }
  //   return obj;
  // }
  //
  // private get isAbsoluteHide() {
  //   if (!this.storeObj.isHide) return false;
  //   return this.storeObj.owner !== this.playerKey;
  // }
  //
  // private get ownerPlayer() {
  //   return this.getObj(this.storeObj.owner);
  // }
  //
  // private get diceImage() {
  //   return this.dicePipsImage(
  //     this.storeObj.faceNum,
  //     this.storeObj.type,
  //     this.storeObj.pips
  //   );
  // }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common.scss";

.diceSymbol {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  font-size: 12px;
  cursor: crosshair;
  border-radius: 3px;
  z-index: 700000000;

  &.hover {
    z-index: 799999999;
  }

  &.hover.moving,
  &.rolling {
    z-index: 999999999;
  }

  &.isHide {
    background-color: black;
  }

  &:before {
    content: "";
    position: absolute;
    left: -2px;
    right: -2px;
    bottom: -2px;
    top: -2px;
    border: 2px solid #99660f;
    border-radius: 2px;
  }

  .balloon {
    @include flex-box(column, flex-start);
    position: absolute;
    background-color: lightyellow;
    border-radius: 5px;
    padding: 0.5em;
    font-size: 10px;
    top: 80%;
    left: 80%;
  }
}

img.image {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
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
</style>
