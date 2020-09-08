<template>
  <div class="tabs" @contextmenu.prevent>
    <!-- タブ -->
    <div
      class="tab"
      v-for="(tabObj, index) in tabList"
      :key="tabObj.name"
      :class="getTabClasses(tabObj, index)"
    >
      <div class="corner-container" v-if="isVertical">
        <div
          class="corner"
          @mousedown.prevent="chatTabOnSelect(tabObj.key)"
          @mouseenter.prevent="chatTabOnHover(tabObj.key)"
          @mouseleave.prevent="chatTabOnHover('')"
        ></div>
      </div>

      <div
        class="text"
        :tabindex="isModal ? -1 : tabIndex + index + 1"
        @keydown.space.stop="chatTabOnSelect(tabObj.key)"
        @keydown.enter.stop="chatTabOnSelect(tabObj.key)"
        @mousedown.prevent="chatTabOnSelect(tabObj.key)"
        @mouseenter.prevent="chatTabOnHover(tabObj.key)"
        @mouseleave.prevent="chatTabOnHover('')"
      >
        <span>{{ textFunc(tabObj) }}</span>
      </div>
    </div>

    <slot />

    <!-- タブ設定ボタン -->
    <span
      class="tab addButton"
      @click="tabAddButtonOnClick"
      @keydown.space.stop="tabAddButtonOnClick"
      @keydown.enter.stop="tabAddButtonOnClick"
      :tabindex="isModal ? -1 : tabIndex + tabList.length + 1"
      v-if="viewOption"
      ><span class="icon-cog"></span
    ></span>
  </div>
</template>

<script lang="ts">
import { Emit, Prop } from "vue-property-decorator";
import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({ components: {} })
export default class TabsComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Getter("isModal") private isModal: any;

  @Prop({ type: Array, required: true })
  private tabList!: any[];

  @Prop({ type: String, required: true })
  private activeChatTab!: string;

  @Prop({ type: String, required: true })
  private hoverChatTab!: string;

  @Prop({ type: Boolean, required: true })
  private isVertical!: boolean;

  @Prop({ type: Number, required: true })
  private tabIndex!: number;

  @Prop({ type: Function, required: true })
  private textFunc!: Function;

  @Prop({ type: Boolean, required: true })
  private viewOption!: boolean;

  /**
   * チャットログ表示タブを選択されたときの挙動
   * @param key タブのkey
   */
  @Emit("onSelect")
  private chatTabOnSelect(key: string): void {}

  /**
   * チャットログ表示タブをホバーされたときの挙動
   * @param key タブのkey
   */
  @Emit("onHover")
  private chatTabOnHover(key: string): void {}

  /**
   * チャットタブ追加ボタンクリックイベントハンドラ
   */
  @Emit("editTab")
  private tabAddButtonOnClick(): void {}

  private getTabClasses(tabObj: any, index: number) {
    return {
      active: tabObj.key === this.activeChatTab,
      hover: tabObj.key === this.hoverChatTab,
      unRead: tabObj.unRead > 0,
      vertical: this.isVertical,
      isLast: index === this.tabList.length - 1
    };
  }
}
</script>

<style scoped lang="scss">
@import "../../../../../assets/common.scss";

$background-gradient: linear-gradient(
  to bottom,
  rgba(240, 240, 240, 1),
  rgba(200, 200, 200, 1)
);

$hover-border-color: #0092ed;

.tabs {
  display: flex;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: -1px;
  overflow: visible;
  outline: none;
  font-size: 11px;

  .tab {
    @include inline-flex-box(row, flex-start, flex-end);
    /*outline: none;*/
    overflow: visible;
    margin-right: -2px;

    .corner-container {
      @include flex-box(row, center, center);
      position: absolute;
      width: calc(2.82em - 1px);
      height: 1.41em;
      /*border-bottom: solid 1px gray;*/
      z-index: 7;
      overflow: hidden;

      .corner {
        transform: translateY(calc(0.7em + 1px)) translateX(1px) rotate(-45deg)
          translateX(-1px);
        background: $background-gradient;
        transform-origin: center;
        width: 2em;
        height: 2em;
        min-height: 1px;
        border: 1px solid gray;
        border-left-color: transparent;
        border-right-color: transparent;
        box-sizing: content-box;
        cursor: pointer;
      }
    }

    .text {
      @include flex-box(row, flex-start, center);
      /*position: absolute;*/
      border-radius: 5px 5px 0 0;
      padding: 0 0.5em;
      z-index: 8;
      height: calc(2em - 0px);
      background: $background-gradient;
      box-sizing: content-box;
      cursor: pointer;
      border: 1px solid gray;
      border-bottom-color: transparent;
    }

    &.vertical {
      width: calc(2.82em);
      /*margin-right: 0;*/

      .text {
        border-radius: 0 5px 0 0;
        border-left-color: transparent;
        border-bottom-color: transparent;
        height: calc(2em - 3px);
        margin-top: 2.5em;
        transform: translateX(2.82em) rotate(-45deg) translateX(-1px)
          translateY(-1px);
        transform-origin: left bottom;
        flex: 1;
        width: 5em;
        padding: 0;

        > * {
          margin-left: -0.7em;
          min-width: 5em;
          padding-right: 0.5em;
          overflow: hidden;
        }
      }

      &.hover {
        .text {
          border-bottom-color: $hover-border-color;
          border-left-color: transparent;
          z-index: 20;
        }

        &.isLast .text {
          border-bottom-color: $hover-border-color;
        }
      }

      &.isLast .text {
        border-bottom-color: gray;
      }
    }

    &.unRead {
      .corner-container .corner,
      .text {
        background: yellow none;
      }
    }

    &.hover {
      .corner-container .corner {
        border-top-color: $hover-border-color;
      }

      .text {
        z-index: 9;
        width: auto;
        border-color: $hover-border-color;
        border-bottom-color: transparent;
      }
    }

    &.active {
      .corner-container .corner,
      .text {
        background: white none;
      }

      .corner-container {
        z-index: 11;
      }

      .text {
        z-index: 12;
      }
    }

    &.addButton {
      @include flex-box(row, center, center);
      position: absolute;
      right: 2px;
      cursor: pointer;
      z-index: 13;
      height: 2em;
      padding: 0 0.5em;
      background: $background-gradient;
      border: 1px solid gray;
      border-radius: 5px 5px 0 0;
      box-sizing: border-box;
    }
  }
}
</style>
