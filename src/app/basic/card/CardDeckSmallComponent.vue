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
        class="card hover-view"
        :size="cardSize"
        :cardMeta="getCardMeta(hoverCardObject)"
        :isTurnOff="hoverCardObject.data.isTurnOff"
        @leftDown="leftDown"
        @rightDown="rightDown"
        v-if="viewMode === 'spread-out' && hoverCardObject"
      />
      <card-component
        class="card"
        v-for="(cardObject, idx) in useCardObjectList"
        :key="cardObject.id"
        :size="cardSize"
        :cardMeta="getCardMeta(cardObject)"
        :isTurnOff="cardObject.data.isTurnOff"
        @leftDown="leftDown"
        @rightDown="rightDown"
        @hover="value => hoverCard(cardObject, value)"
        :style="getCardStyle(cardObject, idx)"
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

  private volatileInfo: VolatileMapObject = {
    moveFrom: createPoint(0, 0),
    moveFromPlane: createPoint(0, 0),
    moveFromPlaneRelative: createPoint(0, 0),
    moveGridOffset: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };
  protected isMoving: boolean = false;
  private objX: number = 0;
  private objY: number = 0;
  private otherLockTimeoutId: number | null = null;
  private isTransitioning: boolean = false;

  private cardObjectList = GameObjectManager.instance.cardObjectList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardObjectCC = SocketFacade.instance.cardObjectCC();
  private cardDeckSmallCC = SocketFacade.instance.cardDeckSmallCC();

  private viewMode: "normal" | "spread-out" = "normal";
  private hoverCardObject: StoreUseData<CardObject> | null = null;
  private isMounted: boolean = false;

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

  @VueEvent
  private async leftDown(event: MouseEvent) {
    window.console.log("leftDown");
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
    this.volatileInfo.moveDiff = createPoint(0, 0);
    this.volatileInfo.moveFrom = createPoint(point.x, point.y);
    this.volatileInfo.moveFromPlane = createPoint(
      planeLocateScene.x,
      planeLocateScene.y
    );
    const relativeX = planeLocateScene.x - elmPoint.x;
    const relativeY = planeLocateScene.y - elmPoint.y;
    this.volatileInfo.moveFromPlaneRelative = createPoint(relativeX, relativeY);
    this.isMoving = true;
    this.onChangePoint();
    this.mouseDown("left");
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;
    if (!this.isMoving) return;
    const point = task.value!;
    const planeLocateScene = this.getPoint(point);
    const diffX = planeLocateScene.x - this.volatileInfo.moveFromPlane.x;
    const diffY = planeLocateScene.y - this.volatileInfo.moveFromPlane.y;
    this.volatileInfo.moveDiff = createPoint(diffX, diffY);
    this.onChangePoint();
  }

  private onChangePoint() {
    if (!this.isMounted) return;

    // setTransform
    const address = createAddress(0, 0, 0, 0);
    copyAddress(this.deck!.data!.address, address);
    this.setTransform(address, 0);
  }

  private setTransform(point: Point, angle: number) {
    const x = point.x;
    const useX = this.isMoving ? x + this.volatileInfo.moveDiff.x : x;
    const y = point.y;
    const useY = this.isMoving ? y + this.volatileInfo.moveDiff.y : y;

    if (this.isOtherLastModify) {
      if (this.otherLockTimeoutId !== null)
        clearTimeout(this.otherLockTimeoutId);

      this.isTransitioning = true;
      // other-player-last-modifyに設定されている「transition」の0.3sに合わせている
      this.otherLockTimeoutId = window.setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }

    this.objX = useX;
    this.objY = useY;
    // this.elm.style.transform = `translate(${this.objX}px, calc(${this.objY}px - 2em)) rotate(${angle}deg) translateZ(0)`;
  }

  @VueEvent
  private get cardDeckStyle() {
    const deckData = this.deck.data!;
    const gridSize = CssManager.instance.propMap.gridSize;
    const containerRect = createRectangle(
      gridSize * deckData.address.column +
        (this.isMoving ? this.volatileInfo.moveDiff.x : 0),
      gridSize * deckData.address.row +
        (this.isMoving ? this.volatileInfo.moveDiff.y : 0),
      gridSize * deckData.columns,
      gridSize * deckData.rows
    );
    return {
      left: `calc(${containerRect.x}px - 6px)`,
      top: `calc(${containerRect.y}px - 6px - 2em)`,
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

    copyAddress(this.deck.data!.address, address);

    address.x += this.volatileInfo.moveDiff.x;
    address.y += this.volatileInfo.moveDiff.y;

    const gridSize = CssManager.instance.propMap.gridSize;
    const relativeX = this.volatileInfo.moveFromPlaneRelative.x;
    const relativeY = this.volatileInfo.moveFromPlaneRelative.y;
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
    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    this.isMoving = false;

    task.resolve();
  }

  @VueEvent
  private getCardStyle(card: StoreUseData<CardObject>, idx: number) {
    const all = this.useCardObjectList.length;
    if (this.viewMode === "normal") {
      return {
        left: `${idx}px`,
        top: `${idx}px`,
        transition: "all 0.5s ease"
      };
    } else {
      const rotate: number = idx / (all * 1.08);
      const height = this.cardSize.height;
      const isHover =
        card && this.hoverCardObject
          ? this.hoverCardObject.id === card.id
          : false;
      let tranlateY: number = -height * (isHover ? 1.7 : 1.5);
      return {
        transform: `rotate(${rotate}turn) translate(0, ${tranlateY}px)`,
        transformOrigin: "center center",
        transition: "all 0.5s ease"
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
  background-color: var(--uni-color-skyblue);
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
  z-index: 2;

  &.hover-view {
    transform: scale(2);
    transform-origin: center center;
    z-index: 3;
  }
}
</style>
