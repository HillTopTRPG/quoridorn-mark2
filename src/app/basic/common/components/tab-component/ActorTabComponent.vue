<template>
  <div class="actor-tab-container">
    <!-- タブのコンテナー -->
    <div
      class="actor-tabs"
      :class="{ isDiagonal: isDiagonal }"
      @contextmenu.prevent
    >
      <!-- 表示するタブを選択するためのタブ -->
      <label class="tab addButton">
        <self-actor-select
          :selectedActorList="standActorList"
          v-model="selectActorKey"
          ref="actorSelect"
        />
        <span
          class="icon-arrow-up-right2"
          @click="diagonalButtonOnClick"
          :class="{ isDiagonal: isDiagonal }"
          title="タブを斜め表示機能"
        ></span>
      </label>

      <!-- 選択されて表示状態となっているタブ -->
      <label
        class="tab"
        v-for="(actor, index) in standActorList"
        :key="actor.key"
        :class="{
          active: actor.key === activeId,
          isDiagonal: isDiagonal,
          isHover: actor.key === hoverTabKey,
          isLast: index === standActorList.length - 1
        }"
      >
        <div
          class="corner-container"
          v-if="isDiagonal"
          @mousedown.prevent="selectTab(actor.key)"
          @mouseenter.prevent="hoverTab(actor.key)"
          @mouseleave.prevent="hoverTab('')"
        >
          <div class="corner"></div>
        </div>

        <div
          class="tab-container"
          @mousedown.prevent="selectTab(actor.key)"
          @mouseenter.prevent="hoverTab(actor.key)"
          @mouseleave.prevent="hoverTab('')"
        >
          <span
            class="icon-eye-blocked"
            @click.stop="delTab(actor.key)"
            v-if="actor.key === hoverTabKey"
          ></span>
          <span>{{ getViewName(actor.key) }}</span>
        </div>
        <!--
        -->
      </label>

      <!-- 選択されて表示状態となっているタブ -->
      <div class="option-tab-container">
        <label
          class="tab plane-tab"
          v-for="(optionTab, index) in optionTabInfo"
          :key="index"
          @click="selectTab(optionTab.text)"
          @mouseenter.prevent="hoverTab(optionTab.text)"
          @mouseleave.prevent="hoverTab('')"
          :class="{
            active: optionTab.text === activeId,
            isDiagonal: isDiagonal,
            isHover: optionTab.text === hoverTabKey,
            isLast: index === optionTabInfo.length - 1
          }"
        >
          {{ optionTab.text }}
        </label>
      </div>
    </div>

    <!-- 内容 -->
    <div class="container">
      <slot name="actor" :actor="actor"></slot>
      <slot name="option" :option="actor ? null : activeId"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import SelfActorSelect from "../select/SelfActorSelect.vue";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";

@Component({
  components: {
    SelfActorSelect
  }
})
export default class ActorTabComponent extends Vue {
  @Prop({
    type: Array,
    default: () => {
      [];
    }
  })
  private optionTabInfo!: any[];

  @Getter("getViewName") private getViewName: any;
  @Getter("getObj") private getObj: any;

  private standActorList: any[] = [];
  private activeId: string = "";
  private selectActorKey: string = "";
  private isDiagonal: boolean = false;
  private hoverTabKey: string = "";

  public requestFocus(): void {
    const elm: SelfActorSelect = this.$refs.actorSelect as SelfActorSelect;
    elm.requestFocus();
  }

  private selectTab(activeId: string) {
    this.activeId = activeId;
  }

  private hoverTab(actorKey: string) {
    this.hoverTabKey = actorKey;
  }

  private delTab(actorKey: string) {
    const index = this.standActorList.findIndex(
      actor => actor.key === actorKey
    );
    this.standActorList.splice(index, 1);

    if (this.standActorList.length === 0) {
      this.activeId = "";
      return;
    }

    this.activeId = this.standActorList[
      index < this.standActorList.length ? index : index - 1
    ].key;
  }

  @Emit("change")
  public change(value: string) {}

  @Watch("activeId")
  private onChangeActiveTabIndex(value: number) {
    const actor: any = this.actor;
    this.change(actor ? actor.key : null);
  }

  @Watch("selectActorKey")
  private onChangeSelectActorKey(selectActorKey: string) {
    if (selectActorKey) {
      const actor = this.getObj(selectActorKey);

      // 先頭に追加
      this.standActorList.unshift(actor);
      this.activeId = "";
      setTimeout(() => {
        this.selectActorKey = "";
        this.activeId = selectActorKey;
        this.hoverTabKey = "";
      }, 0);
    }
  }

  private diagonalButtonOnClick() {
    this.isDiagonal = !this.isDiagonal;
  }

  private get actor(): any {
    return this.standActorList.filter(
      (actor: any) => actor.key === this.activeId
    )[0];
  }
}
</script>

<style scoped lang="scss">
@import "../../common";

$hover-border-color: #0092ed;

$backColor: rgba(230, 255, 230, 1);
$backColorUnSelect: #c0d0c0;

.actor-tab-container {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.actor-tabs {
  display: flex;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: -1px;
  overflow: visible;
  outline: none;
  font-size: 11px;
  padding-left: 1em;
  min-height: calc(2em + 2px);

  &.isDiagonal {
    padding-left: 0;
  }

  .option-tab-container {
    position: absolute;
    right: 11em;
    z-index: 11;

    .tab.plane-tab {
      @include flex-box(row, center, center);
      cursor: pointer;
      padding: 0.2em 0.5em;
      background-color: #ccc;
      border: 1px solid gray;
      border-radius: 5px 5px 0 0;
      box-sizing: border-box;
      z-index: 13;
      margin-right: -1px;

      &.active {
        border-bottom-color: transparent;
      }
    }
  }

  .tab {
    @include inline-flex-box(row, flex-start, flex-end);
    outline: none;
    overflow: visible;
    margin-right: -2px;

    .corner-container {
      @include flex-box(row, center, center);
      position: absolute;
      width: calc(2.82em - 1px);
      height: 1.41em;
      z-index: 7;
      overflow: hidden;

      .corner {
        transform: translateY(calc(0.7em + 1px)) translateX(1px) rotate(-45deg)
          translateX(-1px);
        background-color: $backColorUnSelect;
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

    .tab-container {
      @include flex-box(row, flex-start, center);
      border-radius: 5px 5px 0 0;
      padding: 0 0.5em;
      z-index: 8;
      height: calc(2em - 0px);
      background-color: $backColorUnSelect;
      box-sizing: content-box;
      cursor: pointer;
      border: 1px solid gray;
      border-bottom-color: transparent;
    }

    .icon-eye-blocked {
      @include flex-box(row, flex-start, center);
      left: 0.5em;
      cursor: pointer;
      border-radius: 50%;
      background-color: white;
      color: black;
      padding: 0.2em;
      border: 1px black solid;
      transform: translateX(0);

      &:hover {
        background-color: lightyellow;
        color: red;
      }
    }

    &.addButton {
      @include flex-box(row, center, center);
      position: absolute;
      right: 1px;
      z-index: 13;
      height: 2em;
      padding: 0 0.5em;
      background-color: #ccc;
      border: 1px solid gray;
      border-radius: 5px 5px 0 0;
      box-sizing: border-box;
      margin-right: 0;

      .icon-arrow-up-right2 {
        border: 1px solid black;
        color: black;
        background-color: white;
        border-radius: 50%;
        padding: 0.2em;
        margin-left: 0.5em;
        cursor: pointer;

        &.isDiagonal {
          background-color: black;
          color: white;
        }
      }
    }

    &.isDiagonal:not(.plane-tab) {
      width: calc(2.82em);

      .tab-container {
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

        > *:not(.icon-eye-blocked) {
          margin-left: -0.7em;
          min-width: 5em;
          padding-right: 0.5em;
          overflow: hidden;
        }
      }

      .icon-eye-blocked {
        left: -1em;
      }

      &.isHover {
        .tab-container {
          border-bottom-color: $hover-border-color;
          border-left-color: transparent;
          z-index: 20;
        }

        &.isLast .tab-container {
          border-bottom-color: $hover-border-color;
        }
      }

      &.isLast .tab-container {
        border-bottom-color: gray;
      }

      &.active {
        .corner-container .corner,
        .tab-container {
          background-color: $backColor;
        }
      }
    }

    &.isHover {
      .corner-container .corner {
        border-top-color: $hover-border-color;
      }

      .tab-container {
        z-index: 9;
        width: auto;
        border-color: $hover-border-color;
        border-bottom-color: transparent;
      }

      &.isDiagonal .tab-container {
        .icon-eye-blocked {
          margin-left: -0.8em;
        }
        > *:not(.icon-eye-blocked) {
          padding-left: 0.8em;
        }
      }
    }

    &.active {
      &.plane-tab,
      .corner-container .corner,
      .tab-container {
        background-color: $backColor;
      }

      .corner-container {
        z-index: 11;
      }

      .tab-container {
        font-weight: bold;
        z-index: 12;
      }
    }
  }
}

.container {
  background-color: $backColor;
  border: 1px solid #777777;
  height: 100px;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 10;
}
</style>
