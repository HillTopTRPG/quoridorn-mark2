<template>
  <div class="card-deck-small" :style="cardDeckStyle" ref="elm">
    <!-- タイトルバー -->
    <div
      class="name-bar"
      @mousedown.left.stop="contentsLeftDown"
      @touchstart.stop="contentsLeftDown"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="name">{{ deck.data.name }}</div>
    </div>
    <div class="card-container">
      <div class="background"></div>
      <card-component
        class="card hover-view"
        :size="cardSize"
        :cardMeta="getCardMeta(hoverCardObject)"
        :isTurnOff="isTurnOffAll"
        @leftDown="event => cardLeftDown(hoverCardObject, event)"
        @rightDown="event => rightDown(hoverCardObject, event)"
        v-if="viewMode === 'spread-out' && hoverCardObject"
      />
      <card-component
        class="card"
        v-for="(cardObject, idx) in useCardObjectList"
        :key="cardObject.id"
        :size="cardSize"
        :cardMeta="getCardMeta(cardObject)"
        :isTurnOff="isTurnOffAll"
        @leftDown="event => cardLeftDown(cardObject, event)"
        @rightDown="event => rightDown(cardObject, event)"
        @hover="value => hoverCard(cardObject, value)"
        :style="getCardStyle(cardObject, idx)"
      />
    </div>
    <div class="info-bar">
      <div class="num">{{ useCardObjectList.length }}</div>
    </div>
    <resize-knob side="left-top" :deco="true" @leftDown="contentsLeftDown" />
    <resize-knob side="left-bottom" :deco="true" @leftDown="contentsLeftDown" />
    <resize-knob side="right-top" :deco="true" @leftDown="contentsLeftDown" />
    <resize-knob
      side="right-bottom"
      :deco="true"
      @leftDown="contentsLeftDown"
    />
    <resize-knob
      side="top"
      :deco="true"
      :fontSizeChangeBan="true"
      @leftDown="contentsLeftDown"
    />
    <resize-knob side="left" :deco="true" @leftDown="contentsLeftDown" />
    <resize-knob side="right" :deco="true" @leftDown="contentsLeftDown" />
    <resize-knob side="bottom" :deco="true" @leftDown="contentsLeftDown" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop } from "vue-property-decorator";
import {
  CardDeckSmall,
  CardObject,
  VolatileMapObject
} from "@/@types/gameObject";
import CardComponent from "@/app/basic/card/CardComponent.vue";
import { StoreUseData } from "@/@types/store";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import CssManager from "@/app/core/css/CssManager";
import {
  copyAddress,
  createAddress,
  createPoint,
  createRectangle,
  createSize,
  getEventPoint
} from "@/app/core/utility/CoordinateUtility";
import { Point, Size } from "address";
import ResizeKnob from "@/app/core/window/ResizeKnob.vue";
import SButton from "@/app/basic/common/components/SButton.vue";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import { ContextTaskInfo } from "context";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import AddressCalcMixin from "@/app/basic/common/mixin/AddressCalcMixin.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { clone } from "@/app/core/utility/PrimaryDataUtility";

interface MultiMixin extends AddressCalcMixin, ComponentVue {}

@Component({
  components: { SButton, ResizeKnob, CardComponent }
})
export default class CardDeckSmallComponent extends Mixins<MultiMixin>(
  AddressCalcMixin,
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private deck!: StoreUseData<CardDeckSmall>;

  private contentsMoveInfo: VolatileMapObject = {
    moveFrom: createPoint(0, 0),
    moveFromPlane: createPoint(0, 0),
    moveFromPlaneRelative: createPoint(0, 0),
    moveGridOffset: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };

  private cardMoveInfo: VolatileMapObject = {
    moveFrom: createPoint(0, 0),
    moveFromPlane: createPoint(0, 0),
    moveFromPlaneRelative: createPoint(0, 0),
    moveGridOffset: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };
  protected movingMode: "container" | "card" | "none" = "none";
  private otherLockTimeoutId: number | null = null;
  private isTransitioning: boolean = false;

  private cardObjectList = GameObjectManager.instance.cardObjectList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardDeckSmallList = GameObjectManager.instance.cardDeckSmallList;
  private cardObjectCC = SocketFacade.instance.cardObjectCC();
  private cardDeckSmallCC = SocketFacade.instance.cardDeckSmallCC();

  private viewMode: "normal" | "spread-out" = "normal";
  private hoverCardObject: StoreUseData<CardObject> | null = null;
  private isMounted: boolean = false;
  private isTurnOffAll: boolean = true;
  private moveCardId: string | null = null;

  @LifeCycle
  private mounted() {
    this.isMounted = true;
    this.isTurnOffAll = this.useCardObjectList[0]
      ? this.useCardObjectList[0].data!.isTurnOff
      : false;
  }

  @VueEvent
  private hoverCard(card: StoreUseData<CardObject>, isHover: boolean) {
    this.hoverCardObject = isHover ? card : null;
  }

  private get docId(): string {
    return this.deck.id!;
  }

  private getPoint(point: Point) {
    const currentAngle = CssManager.instance.propMap.currentAngle;
    const calcResult = this.calcCoordinate(point, currentAngle);
    return calcResult.planeLocateScene;
  }

  @VueEvent
  private async contentsLeftDown(event: MouseEvent) {
    window.console.log("contentsLeftDown");
    event.stopPropagation();
    try {
      await this.cardDeckSmallCC!.touchModify([this.docId]);
    } catch (err) {
      window.console.warn(err);
      return;
    }
    const clientRect = (event.target as any).getBoundingClientRect();
    const elmPoint = this.getPoint(createPoint(clientRect.x, clientRect.y));
    const point = getEventPoint(event);
    const planeLocateScene = this.getPoint(point);
    this.contentsMoveInfo.moveDiff = createPoint(0, 0);
    this.contentsMoveInfo.moveFrom = createPoint(point.x, point.y);
    this.contentsMoveInfo.moveFromPlane = createPoint(
      planeLocateScene.x,
      planeLocateScene.y
    );
    this.contentsMoveInfo.moveFromPlaneRelative = createPoint(
      planeLocateScene.x - elmPoint.x,
      planeLocateScene.y - elmPoint.y
    );
    this.movingMode = "container";
    this.onChangePoint();
    this.mouseDown("left");
  }

  @VueEvent
  private async cardLeftDown(
    cardObject: StoreUseData<CardObject>,
    event: MouseEvent
  ) {
    window.console.log("cardLeftDown");
    event.stopPropagation();
    try {
      await this.cardDeckSmallCC!.touchModify([this.docId]);
    } catch (err) {
      window.console.warn(err);
      return;
    }
    const clientRect = (event.target as any).getBoundingClientRect();
    const elmPoint = this.getPoint(createPoint(clientRect.x, clientRect.y));
    const point = getEventPoint(event);
    const planeLocateScene = this.getPoint(point);
    this.cardMoveInfo.moveDiff = createPoint(0, 0);
    this.cardMoveInfo.moveFrom = createPoint(point.x, point.y);
    this.cardMoveInfo.moveFromPlane = createPoint(
      planeLocateScene.x,
      planeLocateScene.y
    );
    this.cardMoveInfo.moveFromPlaneRelative = createPoint(
      planeLocateScene.x - elmPoint.x,
      planeLocateScene.y - elmPoint.y
    );
    this.moveCardId = cardObject.id;
    this.movingMode = "card";
    this.onChangePoint();
    this.mouseDown("left");
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;
    if (this.movingMode === "none") return;
    const point = task.value!;
    const planeLocateScene = this.getPoint(point);
    if (this.movingMode === "container") {
      const diffX = planeLocateScene.x - this.contentsMoveInfo.moveFromPlane.x;
      const diffY = planeLocateScene.y - this.contentsMoveInfo.moveFromPlane.y;
      this.contentsMoveInfo.moveDiff = createPoint(diffX, diffY);
      this.onChangePoint();
    } else if (this.movingMode === "card") {
      const diffX = planeLocateScene.x - this.cardMoveInfo.moveFromPlane.x;
      const diffY = planeLocateScene.y - this.cardMoveInfo.moveFromPlane.y;
      this.cardMoveInfo.moveDiff = createPoint(diffX, diffY);
      window.console.log(
        JSON.stringify(this.cardMoveInfo.moveDiff, null, "  ")
      );
    }
  }

  private onChangePoint() {
    if (!this.isMounted) return;
    if (this.isOtherLastModify) {
      if (this.otherLockTimeoutId !== null)
        clearTimeout(this.otherLockTimeoutId);

      this.isTransitioning = true;
      // other-player-last-modifyに設定されている「transition」の0.3sに合わせている
      this.otherLockTimeoutId = window.setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }
  }

  @VueEvent
  private get cardDeckStyle() {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    const containerRect = createRectangle(
      gridSize * deckData.address.column +
        (this.movingMode === "container"
          ? this.contentsMoveInfo.moveDiff.x
          : 0),
      gridSize * deckData.address.row +
        (this.movingMode === "container"
          ? this.contentsMoveInfo.moveDiff.y
          : 0),
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    return {
      transform: `translate(calc(${containerRect.x -
        6}px), calc(${containerRect.y - 6 - 28}px))`,
      width: `calc(${containerRect.width}px + 12px)`,
      height: `calc(${containerRect.height}px + 12px + 2em)`
    };
  }

  private get isOtherLastModify(): boolean {
    if (!this.deck) return false;
    const lastExclusionOwner = this.deck.lastExclusionOwner;
    const lastExclusionOwnerId = GameObjectManager.instance.getExclusionOwnerId(
      lastExclusionOwner
    );
    return lastExclusionOwnerId !== GameObjectManager.instance.mySelfUserId;
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

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;

    window.console.log("mouse-move-end-left-finished", param.key, param.type);
    const address = createAddress(0, 0, 0, 0);

    if (this.movingMode === "container") {
      copyAddress(this.deck.data!.address, address);

      address.x += this.contentsMoveInfo.moveDiff.x;
      address.y += this.contentsMoveInfo.moveDiff.y;

      const gridSize = CssManager.instance.propMap.gridSize;
      const relativeX = this.contentsMoveInfo.moveFromPlaneRelative.x;
      const relativeY = this.contentsMoveInfo.moveFromPlaneRelative.y;
      address.column =
        Math.floor((address.x + relativeX) / gridSize) -
        Math.floor(relativeX / gridSize) +
        1;
      address.row =
        Math.floor((address.y + relativeY) / gridSize) -
        Math.floor(relativeY / gridSize) +
        1;

      if (GameObjectManager.instance.roomData.settings.isFitGrid) {
        address.x = (address.column - 1) * gridSize;
        address.y = (address.row - 1) * gridSize;
      }

      const data: CardDeckSmall = clone(this.deck!.data)!;
      copyAddress(address, data.address);
      await this.cardDeckSmallCC!.update([this.docId], [data]);
    } else if (this.movingMode === "card") {
      const deckData = this.deck.data!;
      const gridSize = CssManager.instance.propMap.gridSize;
      const moveDiff = this.cardMoveInfo.moveDiff;
      const containerSize = createSize(
        gridSize * deckData.columns,
        gridSize * deckData.rows
      );
      const diffColumns = moveDiff.x / gridSize;
      const diffRows = moveDiff.y / gridSize;
      if (
        Math.abs(diffColumns) > deckData.columns ||
        Math.abs(diffRows) > deckData.rows
      ) {
        // カードを別の山札にわける
        const cardColumn = deckData.address.column + diffColumns;
        const cardRow = deckData.address.row + diffRows;
        const cardColumns = deckData.columns;
        const cardRows = deckData.rows;
        const cardCenterColumn = cardColumn + cardColumns / 2;
        const cardCenterRow = cardRow + cardRows / 2;
        const toDeck = this.cardDeckSmallList.reverse().filter(cds => {
          const deckColumn = cds.data!.address.column;
          const deckRow = cds.data!.address.row;
          const deckColumns = cds.data!.columns;
          const deckRows = cds.data!.rows;
          // カードの中心が移動先の山札の中に入ったら
          return (
            deckColumn <= cardCenterColumn &&
            cardCenterColumn <= deckColumn + deckColumns &&
            deckRow <= cardCenterRow &&
            cardCenterRow <= deckRow + deckRows
          );
        })[0];
        let isError = false;
        try {
          await this.cardObjectCC.touchModify([this.moveCardId!]);
        } catch (err) {
          // カードオブジェクトをタッチできなかったら処理を諦める
          isError = true;
        }
        const cardObject = this.cardObjectList.filter(
          co => co.id === this.moveCardId
        )[0];
        const cardObjectData = cardObject.data!;
        if (!isError) {
          const deckId = toDeck
            ? toDeck.id!
            : (
                await this.cardDeckSmallCC.addDirect([
                  {
                    address: createAddress(
                      0,
                      0,
                      Math.round(cardColumn),
                      Math.round(cardRow)
                    ),
                    layout: "deck",
                    cardHeightRatio: 1,
                    cardWidthRatio: 1,
                    columns: 2,
                    rows: 3,
                    layoutColumns: 1,
                    layoutRows: 1,
                    name: "",
                    tileReorderingMode: "insert",
                    width: 200,
                    layerId: this.deck.data!.layerId
                  }
                ])
              )[0];
          cardObjectData.cardDeckSmallId = deckId;
          const newOrder =
            this.cardObjectList.filter(
              co => co.data!.cardDeckSmallId === deckId
            ).length + 1;
          await this.cardObjectCC.update(
            [this.moveCardId!],
            [cardObjectData],
            [{ order: newOrder }]
          );
        }
      }
      // 後処理
      this.cardMoveInfo.moveDiff.x = 0;
      this.cardMoveInfo.moveDiff.y = 0;
      await this.cardDeckSmallCC!.releaseTouch([this.docId]);
    }
    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    this.movingMode = "none";

    task.resolve();
  }

  @VueEvent
  private getCardStyle(card: StoreUseData<CardObject>, idx: number) {
    const all = this.useCardObjectList.length;
    const isMoving = this.moveCardId === card.id;
    const arrangePoint = createPoint(0, 0);
    const transition = this.movingMode === "card" ? undefined : "all 0.5s ease";
    if (isMoving) {
      arrangePoint.x = this.cardMoveInfo.moveDiff.x;
      arrangePoint.y = this.cardMoveInfo.moveDiff.y;
    }
    if (this.viewMode === "normal") {
      return {
        transform: `translate(${arrangePoint.x}px, ${
          arrangePoint.y
        }px) translate(${idx / 3}px, ${idx / 2}px)`,
        transition
      };
    } else {
      const rotate: number = idx / (all * 1.08);
      const height = this.cardSize.height;
      const isHover =
        card && this.hoverCardObject
          ? this.hoverCardObject.id === card.id
          : false;
      let translateY: number = -height * (isHover ? 1.7 : 1.5);
      return {
        transform: `translate(${arrangePoint.x}px, ${arrangePoint.y}px) rotate(${rotate}turn) translate(0, ${translateY}px)`,
        transformOrigin: "center center",
        transition
      };
    }
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
      this.useCardObjectList.map(uco => {
        const cardObject = this.cardObjectList.filter(
          co => co.id === uco.id
        )[0];
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
    this.isTurnOffAll = false;
    // await this.updateAllCard({
    //   isTurnOff: false
    // });
  }

  @TaskProcessor("card-turn-off-finished")
  private async cardTurnOffFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do turn off!!!");
    this.isTurnOffAll = true;
    // await this.updateAllCard({
    //   isTurnOff: true
    // });
  }

  @TaskProcessor("card-spread-out-finished")
  private async cardSpreadOutFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do spread out!!!");
    this.viewMode = "spread-out";
  }

  @TaskProcessor("card-put-together-finished")
  private async cardPutTogetherFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const args = task.value.args;
    if (args.docId !== this.docId) return;
    window.console.log("Do put together!!!");
    this.viewMode = "normal";
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

  private get elm(): HTMLDivElement {
    return this.$refs.elm as HTMLDivElement;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.card-deck-small {
  @include flex-box(column, stretch, flex-start);
  -webkit-font-smoothing: subpixel-antialiased;
  position: absolute;
  top: 0;
  left: 0;
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
  background-color: var(--uni-color-skyblue);
}

.info-bar {
  position: absolute;
  top: calc(2em + 10px);
  left: 1rem;
  text-shadow: -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black,
    1px 1px 2px black;
  color: white;
  font-weight: bold;
  @include flex-box(row, center, center);
  height: 2em;
  z-index: 3;
}

.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;

  &.hover-view {
    transform: scale(2);
    transform-origin: center center;
    z-index: 4;
  }
}
</style>
