<template>
  <div class="card-deck-small" :style="cardDeckStyle">
    <!-- タイトルバー -->
    <div
      class="name-bar"
      @mousedown.left.stop="contentsLeftDown"
      @touchstart.stop="contentsLeftDown"
      @contextmenu.prevent
    >
      <!-- タイトル文言 -->
      <div class="name">{{ deck.data.name }}</div>
      <s-button
        class="s-button"
        icon="bin"
        colorStyle="skyblue"
        :disabled="!!useCardObjectList.length"
        @click="deleteDeck()"
      />
    </div>
    <div class="card-container">
      <div class="background"></div>
      <card-component
        class="card hover-view"
        :size="cardSize"
        :cardMeta="getCardMeta(hoverCardObject)"
        :isTurnOff="hoverCardObject.data.isTurnOff"
        @leftDown="event => cardLeftDown(hoverCardObject, event)"
        @rightDown="event => rightDown(hoverCardObject, event)"
        v-if="deck.data.layout === 'spread-out' && hoverCardObject"
      />
      <card-component
        class="card"
        v-for="cardObject in useCardObjectList"
        :id="cardObject.id"
        :key="cardObject.id"
        :size="cardSize"
        :cardMeta="getCardMeta(cardObject)"
        :isTurnOff="cardObject.data.isTurnOff"
        @leftDown="event => cardLeftDown(cardObject, event)"
        @rightDown="event => rightDown(cardObject, event)"
        @hover="value => hoverCard(cardObject, value)"
        :style="getCardStyle(cardObject, cardObject.order)"
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
import { CardDeckSmall, CardObject, ObjectMoveInfo } from "@/@types/gameObject";
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
  getEventPoint,
  isContain
} from "@/app/core/utility/CoordinateUtility";
import { Point, Rectangle, Size } from "address";
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
import LanguageManager from "@/LanguageManager";
import { shuffleOrder } from "@/app/core/utility/Utility";

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
  private otherLockTimeoutId: number | null = null;
  private isTransitioning: boolean = false;

  private cardObjectList = GameObjectManager.instance.cardObjectList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardDeckSmallList = GameObjectManager.instance.cardDeckSmallList;
  private cardObjectCC = SocketFacade.instance.cardObjectCC();
  private cardDeckSmallCC = SocketFacade.instance.cardDeckSmallCC();

  private hoverCardObject: StoreUseData<CardObject> | null = null;
  private isMounted: boolean = false;
  private moveCardId: string | null = null;

  @VueEvent
  private get useCardObjectList() {
    return this.cardObjectList.filter(co => co.owner === this.deck.id);
  }

  @LifeCycle
  private mounted() {
    this.isMounted = true;
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
        6}px), calc(${containerRect.y - 6 - 28}px)) translateZ(0)`,
      width: `calc(${containerRect.width}px + 12px)`,
      height: `calc(${containerRect.height}px + 12px + 2em)`
    };
  }

  @VueEvent
  private getCardStyle(card: StoreUseData<CardObject>, idx: number) {
    const isMoving = this.moveCardId === card.id;
    const arrangePoint = createPoint(0, 0);
    const transition = this.movingMode === "card" ? undefined : "all 0.5s ease";
    if (isMoving) {
      arrangePoint.x = this.cardMoveInfo.moveDiff.x;
      arrangePoint.y = this.cardMoveInfo.moveDiff.y;
    }
    if (this.deck.data!.layout === "spread-out") {
      const isHover =
        card && this.hoverCardObject
          ? this.hoverCardObject.id === card.id
          : false;
      const rotate: number = idx / (this.deck.data!.total * 1.08);
      const lastRotate = isMoving ? -rotate : 0;
      const height = this.cardSize.height;
      let translateY: number = -height * (isHover ? 1.7 : 1.5);
      return {
        transform: `translate(${arrangePoint.x}px, ${arrangePoint.y}px) rotate(${rotate}turn) translate(0, ${translateY}px) translateZ(0) rotate(${lastRotate}turn)`,
        transformOrigin: "center center",
        transition
      };
    } else {
      return {
        transform: ` translate(${arrangePoint.x + idx / 3}px, ${arrangePoint.y +
          idx / 2}px) translateZ(0)`,
        transition
      };
    }
  }

  private get isOtherLastModify(): boolean {
    if (!this.deck) return false;
    const lastExclusionOwner = this.deck.lastExclusionOwner;
    const lastExclusionOwnerId = GameObjectManager.instance.getExclusionOwnerId(
      lastExclusionOwner
    );
    return lastExclusionOwnerId !== GameObjectManager.instance.mySelfUserId;
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

  private static getCardRect(cardId: string): Rectangle {
    const cardRect = document.getElementById(cardId)!.getBoundingClientRect();
    const gameTableRect = document
      .getElementById("map-canvas-container")!
      .getBoundingClientRect();
    cardRect.x -= gameTableRect.x;
    cardRect.y -= gameTableRect.y;
    return cardRect;
  }

  private static getCardCenter(cardId: string): Point {
    const cardRect = this.getCardRect(cardId);
    return createPoint(
      cardRect.x + cardRect.width / 2,
      cardRect.y + cardRect.height / 2
    );
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
    const point = getEventPoint(event);
    const cardRect = CardDeckSmallComponent.getCardRect(cardObject.id!);
    const cardCenter = CardDeckSmallComponent.getCardCenter(cardObject.id!);
    window.console.log("touch point:", JSON.stringify(point));
    window.console.log("card center:", JSON.stringify(cardCenter));
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
    this.moveCardId = cardObject.id;
    this.movingMode = "card";
    this.onChangePoint();
    this.mouseDown("left");
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
      const diffX = planeLocateScene.x - this.contentsMoveInfo.fromAbsPoint.x;
      const diffY = planeLocateScene.y - this.contentsMoveInfo.fromAbsPoint.y;
      this.contentsMoveInfo.moveDiff = createPoint(diffX, diffY);
      // this.onChangePoint();
    } else if (this.movingMode === "card") {
      const diffX = planeLocateScene.x - this.cardMoveInfo.fromAbsPoint.x;
      const diffY = planeLocateScene.y - this.cardMoveInfo.fromAbsPoint.y;
      this.cardMoveInfo.moveDiff = createPoint(diffX, diffY);
      this.cardMoveInfo.cardCenter = CardDeckSmallComponent.getCardCenter(
        this.moveCardId!
      );
    }
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;

    window.console.log("mouse-move-end-left-finished", param.key, param.type);

    if (this.movingMode === "container") {
      await this.fixDeckLocate();
    } else if (this.movingMode === "card") {
      await this.fixCardLocate();
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

    const data: CardDeckSmall = clone(this.deck!.data)!;
    copyAddress(address, data.address);
    await this.cardDeckSmallCC!.update([this.docId], [data]);
  }

  /**
   * 移動中のカードの位置を確定させる。
   */
  private async fixCardLocate() {
    const gridSize = CssManager.instance.propMap.gridSize;
    const cCenter = this.cardMoveInfo.cardCenter;
    const cSize = createSize(
      this.deck.data!.columns * gridSize,
      this.deck.data!.rows * gridSize
    );
    window.console.log(JSON.stringify(cCenter, null, "  "));

    const getDeckRectangle = (deck: StoreUseData<CardDeckSmall>) => {
      return createRectangle(
        gridSize * deck.data!.address.column,
        gridSize * deck.data!.address.row,
        gridSize * deck.data!.columns,
        gridSize * deck.data!.rows
      );
    };

    // カードの今の位置が山札と被っていたら新しい山札は作らないので処理を抜ける
    if (isContain(getDeckRectangle(this.deck), cCenter)) return;

    const toDeck = this.cardDeckSmallList
      .reverse()
      .filter(cds => isContain(getDeckRectangle(cds), cCenter))[0];

    try {
      await this.cardObjectCC.touchModify([this.moveCardId!]);
    } catch (err) {
      // カードオブジェクトをタッチできなかったら処理を諦める
      return;
    }

    const cardObject = this.cardObjectList.filter(
      co => co.id === this.moveCardId
    )[0];
    if (!cardObject) return;

    let deckId: string;
    if (toDeck) {
      deckId = toDeck.id!;
      await this.updateDeck(toDeck, {
        total: toDeck.data!.total + 1
      });
    } else {
      const column = Math.round((cCenter.x - cSize.width / 2) / gridSize);
      const row = Math.round((cCenter.y - cSize.height / 2) / gridSize);
      const address = createAddress(
        column * gridSize,
        row * gridSize,
        column,
        row
      );
      deckId = (
        await this.cardDeckSmallCC.addDirect([
          {
            address,
            layout: "deck",
            cardHeightRatio: 1,
            cardWidthRatio: 1,
            columns: 2,
            rows: 3,
            layoutColumns: 1,
            layoutRows: 1,
            name: this.deck.data!.name + "_",
            tileReorderingMode: "insert",
            width: 200,
            layerId: this.deck.data!.layerId,
            total: 1
          }
        ])
      )[0];
    }
    let newOrder: number = 0;
    this.cardObjectList
      .filter(co => co.owner === deckId)
      .forEach(co => {
        if (co.order >= newOrder) newOrder = co.order + 1;
      });
    window.console.log(newOrder);
    await this.cardObjectCC.update(
      [this.moveCardId!],
      [cardObject.data!],
      [{ order: newOrder, owner: deckId }]
    );
    this.moveCardId = null;
    this.hoverCardObject = null;
  }

  @VueEvent
  private consoleButton() {
    window.console.log(
      JSON.stringify(
        this.useCardObjectList.map(co => {
          const cardMeta = this.cardMetaList.filter(
            cm => cm.id === co.data!.cardMetaId
          )[0];
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
    const msg = LanguageManager.instance.getText("message.delete-deck");
    if (!window.confirm(msg)) return;
    await this.cardDeckSmallCC.touchModify([this.deck.id!]);
    await this.cardDeckSmallCC.delete([this.deck.id!]);
  }

  private async updateDeck(
    deck: StoreUseData<CardDeckSmall>,
    info: Partial<CardDeckSmall>
  ) {
    Object.assign(deck.data!, info);
    await this.cardDeckSmallCC.updatePackage([deck.id!], [deck.data!]);
  }

  private async updateAllCard(info: Partial<CardObject>) {
    await this.cardObjectCC.updatePackage(
      this.useCardObjectList.map(co => co.id!),
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

  private getTaskCardObject(
    task: Task<any, never>
  ): StoreUseData<CardObject> | null {
    const args = task.value.args;
    const cardId = args.docId;
    const cardObject = this.cardObjectList.filter(co => co.id === cardId)[0];
    if (!cardObject) return null;
    if (cardObject.owner !== this.docId) return null;
    return cardObject;
  }

  @TaskProcessor("card-shuffle-finished")
  private async cardShuffleFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;

    const cardObjList = clone(this.useCardObjectList)!;
    shuffleOrder(cardObjList);
    await this.cardObjectCC.updatePackage(
      this.useCardObjectList.map(co => co.id!),
      this.useCardObjectList.map(co => co.data!),
      cardObjList.map(co => ({
        order: co.order
      }))
    );
  }

  @TaskProcessor("card-draw-finished")
  private async cardDrawFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    window.console.log("Do draw!!!");
  }

  @TaskProcessor("card-turn-on-all-finished")
  private async cardTurnOnAllFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    window.console.log("Do turn on!!!");
    await this.updateAllCard({
      isTurnOff: false
    });
  }

  @TaskProcessor("card-turn-off-all-finished")
  private async cardTurnOffFAllFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    window.console.log("Do turn off!!!");
    await this.updateAllCard({
      isTurnOff: true
    });
  }

  @TaskProcessor("card-turn-on-finished")
  private async cardTurnOnFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    cardObject.data!.isTurnOff = false;
    await this.cardObjectCC.updatePackage([cardObject.id!], [cardObject.data!]);
  }

  @TaskProcessor("card-turn-off-finished")
  private async cardTurnOffFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    cardObject.data!.isTurnOff = true;
    await this.cardObjectCC.updatePackage([cardObject.id!], [cardObject.data!]);
  }

  @TaskProcessor("card-layout-spread-out-finished")
  private async cardLayoutSpreadOutFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    await this.changeLayout(task, "spread-out");
  }

  @TaskProcessor("card-layout-pile-up-finished")
  private async cardLayoutPileUpFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    await this.changeLayout(task, "deck");
  }

  @TaskProcessor("card-layout-tile-finished")
  private async cardLayoutTileFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    await this.changeLayout(task, "tile");
  }

  private async changeLayout(
    task: Task<any, never>,
    layout: "deck" | "spread-out" | "tile"
  ) {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    this.deck.data!.layout = layout;
    await this.updateDeck(this.deck, { layout });
  }

  @TaskProcessor("card-setting-change-finished")
  private async cardSettingChangeFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    // TODO
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    window.console.log("Do setting change!!!");
  }

  @TaskProcessor("card-placement-reset-finished")
  private async cardPlacementResetFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const cardObject = this.getTaskCardObject(task);
    if (!cardObject) return;
    performance.mark("start");
    const idList = this.useCardObjectList.map(co => co.id!);
    try {
      await this.cardObjectCC.updatePackage(
        idList,
        this.useCardObjectList.map(co => co.data!),
        this.useCardObjectList.map((_o, idx) => ({
          order: idx
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
    window.console.log(`経過時間：${durationS}秒`);
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
      if (this.hoverCardObject) {
        await TaskManager.instance.ignition<ContextTaskInfo, never>({
          type: "context-open",
          owner: "Quoridorn",
          value: {
            type: "card-object",
            target: this.hoverCardObject.id!,
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
  will-change: contents;
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
