<template>
  <div
    class="card-deck-small"
    :style="cardDeckStyle"
    @mousedown.right.stop="openCardDeckSmallContext"
    ref="elm"
  >
    <!-- タイトルバー -->
    <div
      class="name-bar"
      @mousedown.left.stop="contentsLeftDown"
      @touchstart.stop="contentsLeftDown"
    >
      <!-- タイトル文言 -->
      <div class="name">{{ deck.data.name }}</div>
      <div>{{ viewCardObjectList.length }}/{{ deck.data.total }}</div>
      <s-button
        class="s-button"
        icon="bin"
        colorStyle="skyblue"
        :disabled="!!useCardObjectList.length"
        @click="deleteDeck()"
      />
    </div>
    <div class="card-container" v-if="isMounted">
      <card-component
        class="card hover-view"
        :class="deck.data.layout"
        :size="cardSize"
        :cardMeta="getCardMeta(hoverCardObject)"
        :isTurnOff="hoverCardObject.data.isTurnOff"
        @leftDown="event => cardLeftDown(hoverCardObject, event)"
        @rightDown="event => rightDown(hoverCardObject, event)"
        v-if="deck.data.isUseHoverView && hoverCardObject && !moveCardKey"
      />
      <card-component
        class="card"
        v-for="cardObject in viewCardObjectList"
        :id="cardObject.key"
        :key="cardObject.key"
        :size="cardSize"
        :cardMeta="getCardMeta(cardObject)"
        :isTurnOff="cardObject.data.isTurnOff"
        @leftDown="event => cardLeftDown(cardObject, event)"
        @rightDown="event => rightDown(cardObject, event)"
        @hover="value => hoverCard(cardObject, value)"
        :style="getCardStyle(cardObject, cardObject.order)"
      />
    </div>
    <!--
    <div class="info-bar">
      <div class="num">{{ useCardObjectList.length }}</div>
    </div>
    -->
    <!--
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
    -->
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";
import { ContextTaskInfo } from "context";
import { Task, TaskResult } from "task";
import LifeCycle from "../../core/decorator/LifeCycle";
import TaskProcessor from "../../core/task/TaskProcessor";
import {
  copyAddress,
  createAddress,
  createPoint,
  createRectangle,
  createSize,
  getEventPoint,
  isContain
} from "../../core/utility/CoordinateUtility";
import { CardDeckSmallStore, CardObjectStore } from "@/@types/store-data";
import TaskManager, { MouseMoveParam } from "../../core/task/TaskManager";
import SButton from "../common/components/SButton.vue";
import CardComponent from "./CardComponent.vue";
import CssManager from "../../core/css/CssManager";
import ResizeKnob from "../../core/window/ResizeKnob.vue";
import GameObjectManager from "../GameObjectManager";
import { findRequireByKey, shuffleOrder } from "../../core/utility/Utility";
import ComponentVue from "../../core/window/ComponentVue";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import VueEvent from "../../core/decorator/VueEvent";
import { clone } from "../../core/utility/PrimaryDataUtility";
import { WindowOpenInfo } from "@/@types/window";
import AddressCalcMixin from "../common/mixin/AddressCalcMixin.vue";
import {
  CardDeckLayout,
  ObjectMoveInfo,
  Point,
  Rectangle,
  Size
} from "@/@types/store-data-optional";

interface MultiMixin extends AddressCalcMixin, ComponentVue {}

@Component({
  components: { SButton, ResizeKnob, CardComponent }
})
export default class CardDeckSmallComponent extends Mixins<MultiMixin>(
  AddressCalcMixin,
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private deck!: StoreData<CardDeckSmallStore>;

  private contentsMoveInfo: ObjectMoveInfo = {
    fromPoint: createPoint(0, 0),
    fromAbsPoint: createPoint(0, 0),
    fromAbsRelPoint: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    cardCenter: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };

  private cardMoveInfo: ObjectMoveInfo = {
    fromPoint: createPoint(0, 0),
    fromAbsPoint: createPoint(0, 0),
    fromAbsRelPoint: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    cardCenter: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };
  protected movingMode: "container" | "card" | "none" = "none";
  private otherLockTimeoutKey: number | null = null;
  private isTransitioning: boolean = false;

  private cardObjectList = GameObjectManager.instance.cardObjectList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardDeckSmallList = GameObjectManager.instance.cardDeckSmallList;
  private cardObjectCC = SocketFacade.instance.cardObjectCC();
  private cardDeckSmallCC = SocketFacade.instance.cardDeckSmallCC();

  private hoverCardObject: StoreData<CardObjectStore> | null = null;
  private isMounted: boolean = false;
  private moveCardKey: string | null = null;

  @VueEvent
  private get useCardObjectList() {
    return this.cardObjectList.filter(co => co.owner === this.docKey);
  }

  @VueEvent
  private get viewCardObjectList() {
    // タイル状のレイアウトの時は最大表示数が決まる
    const total = this.deck.data!.layoutRows * this.deck.data!.layoutColumns;
    return this.useCardObjectList.filter(
      co => this.deck.data!.layout !== "tile" || co.order < total
    );
  }

  private get elm(): HTMLElement {
    return this.$el as HTMLElement;
  }

  private get docKey(): string {
    return this.deck.key;
  }

  @VueEvent
  private getCardMeta(cardObject: StoreData<CardObjectStore>) {
    return this.cardMetaList.find(
      cm => cm.key === cardObject.data!.cardMetaKey
    );
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

  @LifeCycle
  private mounted() {
    this.isMounted = true;
  }

  @VueEvent
  private hoverCard(card: StoreData<CardObjectStore>, isHover: boolean) {
    this.hoverCardObject = isHover ? card : null;
  }

  private getPoint(point: Point) {
    const currentAngle = CssManager.instance.propMap.currentAngle;
    const calcResult = this.calcCoordinate(point, currentAngle);
    return calcResult.planeLocateScene;
  }

  @VueEvent
  private async openCardDeckSmallContext(event: MouseEvent) {
    console.log("openCardDeckSmallContext");
    const point = getEventPoint(event);
    // const planePoint = this.getPoint(point);
    await TaskManager.instance.ignition<ContextTaskInfo, never>({
      type: "context-open",
      owner: "Quoridorn",
      value: {
        type: "card-deck-small",
        target: this.docKey,
        x: point.x,
        y: point.y
      }
    });
  }

  private onChangePoint() {
    if (!this.isMounted) return;
    if (this.isOtherLastModify) {
      if (this.otherLockTimeoutKey !== null)
        clearTimeout(this.otherLockTimeoutKey);

      this.isTransitioning = true;
      // other-player-last-modifyに設定されている「transition」の0.3sに合わせている
      this.otherLockTimeoutKey = window.setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }
  }

  /**
   * 山札のスタイル
   */
  @VueEvent
  private get cardDeckStyle() {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    const cardSize = this.cardSize;
    const containerRect = createRectangle(
      gridSize * deckData.address.column,
      gridSize * deckData.address.row,
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    if (this.movingMode === "container") {
      containerRect.x += this.contentsMoveInfo.moveDiff.x;
      containerRect.y += this.contentsMoveInfo.moveDiff.y;
    }
    const layout = this.deck.data!.layout;
    if (layout === "spread-out") {
      containerRect.width = cardSize.width;
      containerRect.height = cardSize.height;
    }
    if (layout === "line" || layout === "hand") {
      containerRect.height = cardSize.height;
    }
    return {
      transform: `translate(${containerRect.x}px, calc(${containerRect.y}px - 2em)) translateZ(0)`,
      width: `${containerRect.width}px`,
      height: `calc(${containerRect.height}px + 2em)`
    };
  }

  /**
   * カードのスタイル
   */
  @VueEvent
  private getCardStyle(card: StoreData<CardObjectStore>, index: number) {
    const isMoving = this.moveCardKey === card.key;
    const arrangePoint = createPoint(0, 0);
    const transition = this.movingMode === "card" ? undefined : "all 0.5s ease";
    const zIndex = isMoving ? 9999999 : card.order;
    if (isMoving) {
      arrangePoint.x = this.cardMoveInfo.moveDiff.x;
      arrangePoint.y = this.cardMoveInfo.moveDiff.y;
    }
    const layout = this.deck.data!.layout;
    if (layout === "spread-out") {
      const isHover =
        card && this.hoverCardObject
          ? this.hoverCardObject.key === card.key
          : false;
      const rotate: number = index / (this.deck.data!.total * 1.08);
      const lastRotate = isMoving ? -rotate : 0;
      const height = this.cardSize.height;
      let translateY: number = -height * (isHover ? 1.7 : 1.5);
      return {
        transform: `translate(${arrangePoint.x}px, ${arrangePoint.y}px) rotate(${rotate}turn) translate(0, ${translateY}px) translateZ(0) rotate(${lastRotate}turn)`,
        transformOrigin: "center center",
        transition,
        zIndex
      };
    }
    if (!this.elm) return {};
    const gridSize = CssManager.instance.propMap.gridSize;
    const cardSize = this.cardSize;
    const columns = this.deck.data!.columns;
    const rows = this.deck.data!.rows;
    const containerSize = createSize(gridSize * columns, gridSize * rows);
    let layoutColumns = this.deck.data!.layoutColumns;
    let layoutRows = this.deck.data!.layoutRows;
    if (layout === "line" || layout === "hand") {
      layoutRows = 1;
      layoutColumns = this.deck.data!.total;
    }
    const xDiff =
      (containerSize.width - cardSize.width) / Math.max(layoutColumns - 1, 1);
    const yDiff =
      (containerSize.height - cardSize.height) / Math.max(layoutRows - 1, 1);
    const pileUpCount = Math.floor(card.order / layoutColumns / layoutRows);
    const cardColumn = card.order % layoutColumns;
    const cardRow = Math.floor(card.order / layoutColumns) % layoutRows;
    const point = createPoint(
      cardColumn * xDiff + pileUpCount,
      cardRow * yDiff + pileUpCount
    );
    return {
      transform: ` translate(${arrangePoint.x + point.x}px, ${arrangePoint.y +
        point.y}px) translateZ(0)`,
      transition,
      zIndex
    };
  }

  private get isOtherLastModify(): boolean {
    if (!this.deck) return false;
    const lastExclusionOwner = this.deck.lastExclusionOwner;
    const lastExclusionOwnerKey = GameObjectManager.instance.getExclusionOwnerKey(
      lastExclusionOwner
    );
    return lastExclusionOwnerKey !== SocketFacade.instance.userKey;
  }

  @VueEvent
  private async contentsLeftDown(event: MouseEvent) {
    console.log("contentsLeftDown");
    event.stopPropagation();
    try {
      await this.cardDeckSmallCC!.touchModify([this.docKey]);
    } catch (err) {
      console.warn(err);
      return;
    }
    const clientRect = (event.target as any).getBoundingClientRect();
    const elmPoint = this.getPoint(createPoint(clientRect.x, clientRect.y));
    const point = getEventPoint(event);
    const planeLocateScene = this.getPoint(point);
    this.contentsMoveInfo.moveDiff = createPoint(0, 0);
    this.contentsMoveInfo.fromPoint = createPoint(point.x, point.y);
    this.contentsMoveInfo.fromAbsPoint = createPoint(
      planeLocateScene.x,
      planeLocateScene.y
    );
    this.contentsMoveInfo.fromAbsRelPoint = createPoint(
      planeLocateScene.x - elmPoint.x,
      planeLocateScene.y - elmPoint.y
    );
    this.movingMode = "container";
    this.onChangePoint();
    this.mouseDown("left");
  }

  private static getCardRect(cardKey: string): Rectangle {
    const cardRect: any = document
      .getElementById(cardKey)!
      .getBoundingClientRect();
    const gameTableRect: any = document
      .getElementById("map-canvas-container")!
      .getBoundingClientRect();
    cardRect.x -= gameTableRect.x;
    cardRect.y -= gameTableRect.y;
    return cardRect;
  }

  private static getCardCenter(cardKey: string): Point {
    const cardRect = this.getCardRect(cardKey);
    const wheel = CssManager.instance.propMap.wheel;
    const zoom = (1000 - wheel) / 1000;
    return createPoint(
      (cardRect.x + cardRect.width / 2) * zoom,
      (cardRect.y + cardRect.height / 2) * zoom
    );
  }

  /**
   * マウス左押下
   */
  @VueEvent
  private async cardLeftDown(
    cardObject: StoreData<CardObjectStore>,
    event: MouseEvent
  ) {
    console.log("cardLeftDown");
    event.stopPropagation();
    try {
      await this.cardDeckSmallCC!.touchModify([this.docKey]);
    } catch (err) {
      console.warn(err);
      return;
    }
    const point = getEventPoint(event);
    const cardRect = CardDeckSmallComponent.getCardRect(cardObject.key);
    const cardCenter = CardDeckSmallComponent.getCardCenter(cardObject.key);
    const planeLocateScene = this.getPoint(point);
    this.cardMoveInfo.moveDiff = createPoint(0, 0);
    this.cardMoveInfo.cardCenter = cardCenter;
    this.cardMoveInfo.fromPoint = createPoint(point.x, point.y);
    this.cardMoveInfo.fromAbsPoint = createPoint(
      planeLocateScene.x,
      planeLocateScene.y
    );
    this.cardMoveInfo.fromAbsRelPoint = createPoint(
      planeLocateScene.x - cardRect.x,
      planeLocateScene.y - cardRect.y
    );
    this.moveCardKey = cardObject.key;
    this.movingMode = "card";
    this.onChangePoint();
    this.mouseDown("left");
  }

  /**
   * マウス右押下
   */
  @VueEvent
  protected rightDown(): void {
    console.log("rightDown");
    this.mouseDown("right");
  }

  /**
   * マウスダウン
   */
  private mouseDown(button: string) {
    TaskManager.instance.setTaskParam<MouseMoveParam>("mouse-moving-finished", {
      key: this.docKey,
      type: `button-${button}`
    });
    TaskManager.instance.setTaskParam<MouseMoveParam>(
      button === "right"
        ? "mouse-move-end-right-finished"
        : `mouse-move-end-left-finished`,
      {
        key: this.docKey,
        type: `${button}-click`
      }
    );
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docKey) return;
    if (this.movingMode === "none") return;
    const point = task.value!;
    const planeLocateScene = this.getPoint(point);
    if (this.movingMode === "container") {
      const diffX = planeLocateScene.x - this.contentsMoveInfo.fromAbsPoint.x;
      const diffY = planeLocateScene.y - this.contentsMoveInfo.fromAbsPoint.y;
      this.contentsMoveInfo.moveDiff = createPoint(diffX, diffY);
      // this.onChangePoint();
    } else if (this.movingMode === "card") {
      const diffX = planeLocateScene.x - this.cardMoveInfo.fromAbsPoint.x;
      const diffY = planeLocateScene.y - this.cardMoveInfo.fromAbsPoint.y;
      this.cardMoveInfo.moveDiff = createPoint(diffX, diffY);
      this.cardMoveInfo.cardCenter = CardDeckSmallComponent.getCardCenter(
        this.moveCardKey!
      );
    }
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docKey) return;

    console.log("mouse-move-end-left-finished", param.key, param.type);

    if (this.movingMode === "container") {
      await this.fixDeckLocate();
    } else if (this.movingMode === "card") {
      await this.fixCardLocate();
      // 後処理
      this.cardMoveInfo.moveDiff.x = 0;
      this.cardMoveInfo.moveDiff.y = 0;
    }
    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);
    this.movingMode = "none";
    task.resolve();
  }

  /**
   * 移動中の山札の位置を確定させる。
   */
  private async fixDeckLocate() {
    const address = createAddress(0, 0, 0, 0);
    copyAddress(this.deck.data!.address, address);

    address.x += this.contentsMoveInfo.moveDiff.x;
    address.y += this.contentsMoveInfo.moveDiff.y;

    const gridSize = CssManager.instance.propMap.gridSize;
    const relativeX = this.contentsMoveInfo.fromAbsRelPoint.x;
    const relativeY = this.contentsMoveInfo.fromAbsRelPoint.y;
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

    const data: CardDeckSmallStore = clone(this.deck!.data)!;
    copyAddress(address, data.address);
    await this.cardDeckSmallCC!.update([
      {
        key: this.docKey,
        data: data
      }
    ]);
  }

  /**
   * 移動中のカードの位置を確定させる。
   */
  private async fixCardLocate() {
    const gridSize = CssManager.instance.propMap.gridSize;
    const cCenter = this.cardMoveInfo.cardCenter;
    const cardSize = this.cardSize;

    const getDeckRectangle = (deck: StoreData<CardDeckSmallStore>) => {
      return createRectangle(
        gridSize * deck.data!.address.column,
        gridSize * deck.data!.address.row,
        gridSize * deck.data!.columns,
        gridSize * deck.data!.rows
      );
    };

    // カードの今の位置が山札と被っていたら新しい山札は作らないので処理を抜ける
    if (isContain(getDeckRectangle(this.deck), cCenter)) {
      // TODO
    } else {
      const toDeck = this.cardDeckSmallList
        .reverse()
        .find(cds => isContain(getDeckRectangle(cds), cCenter));

      const cardObject = this.cardObjectList.find(
        co => co.key === this.moveCardKey
      );
      if (!cardObject) return;

      try {
        await this.cardObjectCC.touchModify([this.moveCardKey!]);
      } catch (err) {
        // カードオブジェクトをタッチできなかったら処理を諦める
        return;
      }

      let deckKey: string;
      if (toDeck) {
        deckKey = toDeck.key;
        await this.updateDeck(toDeck, {
          total: toDeck.data!.total + 1
        });
      } else {
        const column = Math.round((cCenter.x - cardSize.width / 2) / gridSize);
        const row = Math.round((cCenter.y - cardSize.height / 2) / gridSize);
        const address = createAddress(
          column * gridSize,
          row * gridSize,
          column,
          row
        );
        deckKey = (
          await this.cardDeckSmallCC.addDirect([
            {
              data: {
                address,
                layout: "pile-up",
                cardHeightRatio: 1,
                cardWidthRatio: 1,
                columns: 2,
                rows: 3,
                layoutColumns: 1,
                layoutRows: 1,
                name: this.deck.data!.name,
                isUseHoverView: this.deck.data!.isUseHoverView,
                tileReorderingMode: this.deck.data!.tileReorderingMode,
                width: 200,
                layerKey: this.deck.data!.layerKey,
                total: 1
              }
            }
          ])
        )[0];
      }

      const lastCard = this.useCardObjectList[
        this.useCardObjectList.length - 1
      ];
      await this.cardDeckSmallCC!.releaseTouch([this.docKey]);
      if (cardObject.key === lastCard.key) {
        try {
          await this.updateDeck(this.deck, {
            total: this.deck.data!.total - 1
          });
        } catch (err) {
          console.error(err);
        }
      }

      let newOrder: number = 0;
      this.cardObjectList
        .filter(co => co.owner === deckKey)
        .forEach(co => {
          if (co.order >= newOrder) newOrder = co.order + 1;
        });
      await this.cardObjectCC.update([
        {
          key: this.moveCardKey!,
          data: cardObject.data!,
          order: newOrder,
          owner: deckKey
        }
      ]);
    }

    this.moveCardKey = null;
    this.hoverCardObject = null;
  }

  @VueEvent
  private consoleButton() {
    console.log(
      JSON.stringify(
        this.useCardObjectList.map(co => {
          const cardMeta = findRequireByKey(
            this.cardMetaList,
            co.data!.cardMetaKey
          );
          return {
            order: co.order,
            name: cardMeta.data!.name
          };
        }),
        null,
        "  "
      )
    );
  }

  @VueEvent
  private async deleteDeck() {
    if (this.useCardObjectList.length) return;
    const msg = this.$t("message.delete-deck")!.toString();
    if (!window.confirm(msg)) return;
    try {
      await this.cardDeckSmallCC.deletePackage([this.docKey]);
    } catch (err) {
      // Nothing.
      return;
    }
  }

  private async updateDeck(
    deck: StoreData<CardDeckSmallStore>,
    info: Partial<CardDeckSmallStore>,
    option?: Partial<StoreData<CardDeckSmallStore>>
  ) {
    Object.assign(deck.data!, info);
    if (option) {
      await this.cardDeckSmallCC.updatePackage([
        {
          ...option,
          key: deck.key,
          data: deck.data!
        }
      ]);
    } else {
      await this.cardDeckSmallCC.updatePackage([
        {
          key: deck.key,
          data: deck.data!
        }
      ]);
    }
  }

  private async updateAllCard(info: Partial<CardObjectStore>) {
    await this.cardObjectCC.updatePackage(
      this.useCardObjectList.map(co => {
        const cardObject = findRequireByKey(this.cardObjectList, co.key);
        const data = cardObject.data!;
        Object.assign(data, info);
        return {
          key: co.key,
          data
        };
      })
    );
  }

  private getTaskCardObject(
    task: Task<any, never>
  ): StoreData<CardObjectStore> | null {
    const cardKey = task.value.args.docKey;
    const cardObject = this.cardObjectList.find(co => co.key === cardKey);
    if (!cardObject) return null;
    if (cardObject.owner !== this.docKey) return null;
    return cardObject;
  }

  private checkTaskDeckObject(
    task: Task<any, never>,
    isFromDeck: boolean
  ): boolean {
    if (isFromDeck) return !!this.getTaskCardObject(task);
    const deckKey = task.value.args.docKey;
    return deckKey === this.docKey;
  }

  @TaskProcessor("card-draw-finished")
  private async cardDrawFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    console.log("Do draw!!!");
  }

  @TaskProcessor("card-turn-on-finished")
  private async cardTurnOnFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    cardObject.data!.isTurnOff = false;
    await this.cardObjectCC.updatePackage([
      {
        key: cardObject.key,
        data: cardObject.data!
      }
    ]);
  }

  @TaskProcessor("card-turn-off-finished")
  private async cardTurnOffFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    cardObject.data!.isTurnOff = true;
    await this.cardObjectCC.updatePackage([
      {
        key: cardObject.key,
        data: cardObject.data!
      }
    ]);
  }

  @TaskProcessor("card-placement-reset-from-card-finished")
  private async cardPlacementResetFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.cardPlacementReset();
  }

  @TaskProcessor("card-placement-reset-from-deck-finished")
  private async cardPlacementResetFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.cardPlacementReset();
  }

  private async cardPlacementReset() {
    performance.mark("start");
    try {
      await this.cardObjectCC.updatePackage(
        this.useCardObjectList.map((co, index) => ({
          key: co.key,
          data: co.data!,
          order: index
        }))
      );
    } catch (err) {
      // TODO Error Message
      // return;
    }
    await this.updateDeck(this.deck, {
      total: this.useCardObjectList.length
    });
    performance.mark("end");
    performance.measure("time", "start", "end");
    const durationMs = performance.getEntriesByName("time")[0].duration;
    const durationS = Math.round(durationMs / 100) / 10;
    console.log(`経過時間：${durationS}秒`);
  }

  @TaskProcessor("card-shuffle-from-card-finished")
  private async cardShuffleFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.cardShuffle();
  }

  @TaskProcessor("card-shuffle-from-deck-finished")
  private async cardShuffleFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.cardShuffle();
  }

  private async cardShuffle() {
    const cardObjList = clone(this.useCardObjectList)!;
    shuffleOrder(cardObjList);
    await this.cardObjectCC.updatePackage(
      this.useCardObjectList.map(co => ({
        key: co.key,
        data: co.data!,
        order: co.order
      }))
    );
  }

  @TaskProcessor("card-turn-on-all-from-card-finished")
  private async cardTurnOnAllFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.updateAllCard({ isTurnOff: false });
  }

  @TaskProcessor("card-turn-on-all-from-deck-finished")
  private async cardTurnOnAllFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.updateAllCard({ isTurnOff: false });
  }

  @TaskProcessor("card-turn-off-all-from-card-finished")
  private async cardTurnOffFAllFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.updateAllCard({ isTurnOff: true });
  }

  @TaskProcessor("card-turn-off-all-from-deck-finished")
  private async cardTurnOffFAllFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.updateAllCard({ isTurnOff: true });
  }

  @TaskProcessor("card-layout-spread-out-from-card-finished")
  private async cardLayoutSpreadOutFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.changeLayout("spread-out");
  }

  @TaskProcessor("card-layout-spread-out-from-deck-finished")
  private async cardLayoutSpreadOutFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.changeLayout("spread-out");
  }

  @TaskProcessor("card-layout-pile-up-from-card-finished")
  private async cardLayoutPileUpFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.changeLayout("pile-up");
  }

  @TaskProcessor("card-layout-pile-up-from-deck-finished")
  private async cardLayoutPileUpFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.changeLayout("pile-up");
  }

  @TaskProcessor("card-layout-tile-from-card-finished")
  private async cardLayoutTileFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.changeLayout("tile");
  }

  @TaskProcessor("card-layout-tile-from-deck-finished")
  private async cardLayoutTileFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.changeLayout("tile");
  }

  @TaskProcessor("card-layout-line-from-card-finished")
  private async cardLayoutLineFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.changeLayout("line");
  }

  @TaskProcessor("card-layout-line-from-deck-finished")
  private async cardLayoutLineFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.changeLayout("line");
  }

  @TaskProcessor("card-layout-hand-from-card-finished")
  private async cardLayoutHandFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.changeLayout("hand");
  }

  @TaskProcessor("card-layout-hand-from-deck-finished")
  private async cardLayoutHandFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.changeLayout("hand");
  }

  private async changeLayout(layout: CardDeckLayout) {
    this.deck.data!.layout = layout;
    const option: Partial<StoreData<CardDeckSmallStore>> = {
      owner: layout === "hand" ? SocketFacade.instance.userKey : null
    };
    await this.updateDeck(this.deck, { layout }, option);
  }

  @TaskProcessor("card-setting-change-from-card-finished")
  private async cardSettingChangeFromCardFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, true)) return;
    await this.cardSettingChange();
  }

  @TaskProcessor("card-setting-change-from-deck-finished")
  private async cardSettingChangeFromDeckFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (!this.checkTaskDeckObject(task, false)) return;
    await this.cardSettingChange();
  }

  private async cardSettingChange() {
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "card-deck-small-edit-window",
        args: {
          type: "card-deck-small",
          key: this.docKey
        }
      }
    });
  }

  @TaskProcessor("mouse-move-end-right-finished")
  private async mouseRightUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docKey) return;
    console.log("mouse-move-end-right-finished", param.key, param.type);
    const point: Point = task.value!;

    const eventType = param ? param.type!.split("-")[1] : "";
    if (eventType === "click") {
      //
    }

    // 右クリックメニュー表示
    setTimeout(async () => {
      if (this.hoverCardObject) {
        await TaskManager.instance.ignition<ContextTaskInfo, never>({
          type: "context-open",
          owner: "Quoridorn",
          value: {
            type: "card-object",
            target: this.hoverCardObject.key,
            x: point.x,
            y: point.y
          }
        });
      }
    });

    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-right-finished", null);

    task.resolve();
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
  box-sizing: initial;
  outline: blue 3px solid;
  will-change: contents;
}

.card-container {
  background-color: rgba(255, 0, 0, 0.5);
  position: relative;
  flex: 1;
}

.name-bar {
  @include flex-box(row, space-between, center);
  height: 2em;
  padding: 0 0.5rem;
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
  z-index: 2147483646;
}

.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &.hover-view {
    z-index: 2147483647;
    transform-origin: right bottom;
    transform: translateX(-100%) scale(2);

    &.spread-out {
      transform: scale(2);
      transform-origin: center center;
    }

    &.tile,
    &.pile-up {
      transform-origin: right top;
    }
  }
}
</style>
