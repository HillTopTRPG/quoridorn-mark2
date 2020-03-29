<template>
  <div class="card-deck-small" :style="cardDeckStyle" ref="elm">
    <!-- タイトルバー -->
    <div
      class="name-bar"
      @mousedown.left.stop="leftDown"
      @touchstart.stop="leftDown"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="name">{{ deck.data.name }}</div>
    </div>
    <div class="card-container">
      <div class="background"></div>
      <card-component
        class="card"
        v-for="cardObject in useCardObjectList"
        :key="cardObject.id"
        :size="cardSize"
        :cardMeta="getCardMeta(cardObject)"
        :isTurnOff="cardObject.data.isTurnOff"
        @leftDown="leftDown"
        @rightDown="rightDown"
      />
    </div>
    <div class="info-bar">
      <div class="num">{{ useCardObjectList.length }}</div>
    </div>
    <resize-knob side="left-top" :deco="true" @leftDown="leftDown" />
    <resize-knob side="left-bottom" :deco="true" @leftDown="leftDown" />
    <resize-knob side="right-top" :deco="true" @leftDown="leftDown" />
    <resize-knob side="right-bottom" :deco="true" @leftDown="leftDown" />
    <resize-knob
      side="top"
      :deco="true"
      :fontSizeChangeBan="true"
      @leftDown="leftDown"
    />
    <resize-knob side="left" :deco="true" @leftDown="leftDown" />
    <resize-knob side="right" :deco="true" @leftDown="leftDown" />
    <resize-knob side="bottom" :deco="true" @leftDown="leftDown" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop } from "vue-property-decorator";
import { CardDeckSmall, CardObject } from "@/@types/gameObject";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import { StoreUseData } from "@/@types/store";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import CssManager from "@/app/core/css/CssManager";
import {
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import { Point, Size } from "address";
import ResizeKnob from "@/app/core/window/ResizeKnob.vue";
import SButton from "@/app/basic/common/components/SButton.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import { ContextTaskInfo } from "context";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: { SButton, ResizeKnob, CardComponent }
})
export default class CardDeckSmallComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private deck!: StoreUseData<CardDeckSmall>;

  private cardObjectList = GameObjectManager.instance.cardObjectList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardObjectCC = SocketFacade.instance.cardObjectCC();

  private get docId(): string {
    return this.deck.id!;
  }

  @VueEvent
  private leftDown() {
    // TODO
  }

  protected rightDown(): void {
    window.console.log("rightDown");
    // if (this.isRolling) {
    //   this.$emit("rightDown");
    // }
    this.mouseDown("right");
  }

  private mouseDown(button: string) {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.docId,
      type: `button-${button}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      button === "right"
        ? "mouse-move-end-right-finished"
        : `mouse-move-end-left-finished`,
      {
        key: this.docId,
        type: `${button}-click`
      }
    );
  }

  @TaskProcessor("card-shuffle-finished")
  private async cardShuffleFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do shuffle!!!");
  }

  @TaskProcessor("card-draw-finished")
  private async cardDrawFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do draw!!!");
  }

  @VueEvent
  private get useCardObjectList() {
    return this.cardObjectList.filter(
      co => co.data!.cardDeckSmallId === this.deck.id
    );
  }

  private async updateAllCard(info: Partial<CardObject>) {
    const idList = this.useCardObjectList.map(co => co.id!);
    await this.cardObjectCC.touchModify(idList);
    await this.cardObjectCC.update(
      idList,
      this.useCardObjectList.map(co => {
        const cardObject = this.cardObjectList.filter(co => co.id)[0];
        const data = cardObject.data!;
        Object.assign(data, info);
        return data;
      })
    );
  }

  @TaskProcessor("card-turn-on-finished")
  private async cardTurnOnFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do turn on!!!");
    await this.updateAllCard({
      isTurnOff: false
    });
  }

  @TaskProcessor("card-turn-off-finished")
  private async cardTurnOffFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do turn off!!!");
    await this.updateAllCard({
      isTurnOff: true
    });
  }

  @TaskProcessor("card-spread-out-finished")
  private async cardSpreadOutFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do spread out!!!");
  }

  @TaskProcessor("card-put-together-finished")
  private async cardPutTogetherFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do put together!!!");
  }

  @TaskProcessor("card-setting-change-finished")
  private async cardSettingChangeFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do setting change!!!");
  }

  @TaskProcessor("mouse-move-end-right-finished")
  private async mouseRightUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;
    window.console.log("mouse-move-end-right-finished", param.key, param.type);
    const point: Point = task.value!;

    const eventType = param ? param.type!.split("-")[1] : "";
    if (eventType === "click") {
      //
    }

    // 右クリックメニュー表示
    setTimeout(async () => {
      await TaskManager.instance.ignition<ContextTaskInfo, never>({
        type: "context-open",
        owner: "Quoridorn",
        value: {
          type: "card-deck-small",
          target: this.docId,
          x: point.x,
          y: point.y
        }
      });
    });

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-right-finished", null);

    task.resolve();
  }

  @VueEvent
  private getCardMeta(cardObject: StoreUseData<CardObject>) {
    return this.cardMetaList.filter(
      cm => cm.id === cardObject.data!.cardMetaId
    )[0];
  }

  @VueEvent
  private get cardSize(): Size {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    const containerRect = createRectangle(
      gridSize * deckData.address.column,
      gridSize * deckData.address.row,
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    return createSize(
      containerRect.width / deckData.cardWidthRatio,
      containerRect.height / deckData.cardHeightRatio
    );
  }

  @VueEvent
  private get cardDeckStyle() {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    window.console.log(JSON.stringify(deckData, null, "  "));
    window.console.log(gridSize);
    const containerRect = createRectangle(
      gridSize * deckData.address.column,
      gridSize * deckData.address.row,
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    window.console.log(JSON.stringify(containerRect, null, "  "));
    return {
      left: `calc(${containerRect.x}px - 6px)`,
      top: `calc(${containerRect.y}px - 6px - 2em)`,
      width: `calc(${containerRect.width}px + 12px)`,
      height: `calc(${containerRect.height}px + 12px + 2em)`
    };
  }

  private get firstCardMeta() {
    const cardObject = this.cardObjectList.filter(
      co => co.data!.cardDeckSmallId === this.deck.id
    )[0];
    return this.cardMetaList.filter(
      cm => cm.id === cardObject.data!.cardMetaId
    )[0];
  }

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.card-deck-small {
  @include flex-box(column, stretch, flex-start);
  position: absolute;
  background-color: rgba(0, 0, 255, 0.5);
  padding: 6px;
  box-sizing: border-box;
}

.card-container {
  background-color: rgba(255, 0, 0, 0.5);
  position: relative;
  flex: 1;
}

.name-bar {
  height: 2em;
}

.info-bar {
  position: absolute;
  bottom: 10px;
  @include flex-box(row, center, center);
  height: 2em;
}

.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
