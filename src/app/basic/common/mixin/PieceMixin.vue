<script lang="ts">
import AddressCalcMixin from "./AddressCalcMixin.vue";
import { Prop, Watch } from "vue-property-decorator";
import { Mixin } from "vue-mixin-decorator";
import {
  copyAddress,
  createMatrix,
  createPoint,
  getEventPoint
} from "@/app/core/Coordinate";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";
import { StoreObj, StoreUseData } from "@/@types/store";
import {
  OtherTextViewInfo,
  SceneObject,
  SceneObjectType,
  VolatileMapObject
} from "@/@types/gameObject";
import { Point } from "address";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import CssManager from "@/app/core/css/CssManager";
import { ContextTaskInfo } from "context";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { clone, getSrc } from "@/app/core/Utility";
import { SceneAndObject } from "@/@types/room";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import VueEvent from "@/app/core/decorator/VueEvent";
import Unsubscribe from "nekostore/lib/Unsubscribe";

@Mixin
export default class PieceMixin<
  T extends SceneObjectType
> extends AddressCalcMixin {
  @Prop({ type: String, required: true })
  protected docId!: string;

  @Prop({ type: String, required: true })
  protected type!: string;

  protected isHover: boolean = false;
  protected isMoving: boolean = false;
  protected isFocused: boolean = false;
  protected inflateWidth: number = 0;
  protected sceneObjectCC = SocketFacade.instance.sceneObjectCC();
  protected sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
  private imageList = GameObjectManager.instance.imageList;

  protected isMounted: boolean = false;
  protected sceneObjectInfo: StoreUseData<SceneObject> | null = null;
  protected sceneAndObjectInfo: StoreUseData<SceneAndObject> | null = null;
  private otherLockTimeoutId: number | null = null;
  private isTransitioning: boolean = false;
  private roomData = GameObjectManager.instance.roomData;
  private sceneAndObjectUnsubscribe: Unsubscribe | null = null;

  private get sceneId() {
    return this.roomData.sceneId;
  }

  @Watch("sceneId")
  private async onChangeSceneId() {
    await this.resetSceneId(this.sceneId);
  }

  @VueEvent
  protected get lockMessage() {
    let result = "";
    if (this.sceneObjectInfo && this.sceneObjectInfo.exclusionOwner) {
      const userName = GameObjectManager.instance.getExclusionOwnerName(
        this.sceneObjectInfo.exclusionOwner
      );
      result = userName
        ? `<span class="icon-lock"></span>sceneObject(${escape(userName)})`
        : "";
    }

    let additional = "";
    if (this.sceneAndObjectInfo && this.sceneAndObjectInfo.exclusionOwner) {
      const userName = GameObjectManager.instance.getExclusionOwnerName(
        this.sceneAndObjectInfo.exclusionOwner
      );
      additional = userName
        ? `<span class="icon-lock"></span>sceneAndObject(${escape(userName)})`
        : "";
    }

    if (result && additional) {
      result += "<br>" + additional;
    } else if (additional) {
      result = additional;
    }

    return result;
  }

  // HTMLで参照する項目
  protected imageSrc: string = "";
  protected otherText: string = "";

  private volatileInfo: VolatileMapObject = {
    moveFrom: createPoint(0, 0),
    moveFromPlane: createPoint(0, 0),
    moveFromPlaneRelative: createPoint(0, 0),
    moveGridOffset: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };

  public get key() {
    return `${this.type}-${this.docId}`;
  }

  private async resetSceneId(sceneId: string) {
    this.sceneAndObjectInfo = (await this.sceneAndObjectCC!.find([
      {
        property: "data.sceneId",
        operand: "==",
        value: sceneId
      },
      {
        property: "data.objectId",
        operand: "==",
        value: this.docId
      }
    ]))![0];

    this.onChangePoint();

    if (this.sceneAndObjectUnsubscribe) {
      await this.sceneAndObjectUnsubscribe();
    }
    this.sceneAndObjectUnsubscribe = await this.sceneAndObjectCC!.setSnapshot(
      this.docId,
      this.sceneAndObjectInfo.id!,
      (snapshot: DocumentSnapshot<StoreObj<SceneAndObject>>) => {
        if (!snapshot.data) return;
        const status = snapshot.data.status;
        if (status === "modified" || status === "modify-touched") {
          this.sceneAndObjectInfo = getStoreObj<SceneAndObject>(snapshot);
        }
        if (status === "modified") {
          if (this.sceneAndObjectInfo!.data!.isOriginalAddress) {
            this.volatileInfo.moveDiff = createPoint(0, 0);
            this.onChangePoint();
          }
        }
      }
    );
  }

  @LifeCycle
  protected async mounted() {
    this.sceneObjectInfo = (await this.sceneObjectCC!.getData(this.docId))!;

    await this.sceneObjectCC!.setSnapshot(this.docId, this.docId, snapshot => {
      if (!snapshot.data) return;
      const status = snapshot.data.status;
      if (status === "modified" || status === "modify-touched") {
        this.sceneObjectInfo = getStoreObj<SceneObject>(snapshot);
        if (status === "modified") {
          this.isMoving = false;
          if (!this.sceneAndObjectInfo!.data!.isOriginalAddress) {
            this.volatileInfo.moveDiff = createPoint(0, 0);
            this.onChangePoint();
          }
        }
      }
    });

    await this.resetSceneId(this.sceneId);

    this.isMounted = true;
    this.onChangePoint();
  }

  private get isOtherLastModify(): boolean {
    if (!this.sceneObjectInfo) return false;
    const targetStoreObj = this.sceneAndObjectInfo!.data!.isOriginalAddress
      ? this.sceneAndObjectInfo!
      : this.sceneObjectInfo!;
    const lastExclusionOwner = targetStoreObj.lastExclusionOwner;
    const lastExclusionOwnerId = GameObjectManager.instance.getExclusionOwnerId(
      lastExclusionOwner
    );
    return lastExclusionOwnerId !== GameObjectManager.instance.mySelfId;
  }

  protected get basicClasses() {
    if (!this.isMounted || !this.sceneObjectInfo) return [];
    const result = [
      this.sceneObjectInfo.data!.isLock ? "lock" : "non-lock",
      this.isHover ? "hover" : "non-hover",
      this.isMoving ? "moving" : "non-moving",
      this.sceneObjectInfo.data!.isHideBorder ? "border-hide" : "border-view"
    ];
    if (this.isFocused) result.push("focus");
    if (this.isOtherLastModify) result.push("other-player-last-modify");
    if (this.isTransitioning) result.push("transitioning");
    return result;
  }

  protected get elm(): HTMLElement {
    return this.$refs.component as HTMLElement;
  }

  private objX: number = 0;
  private objY: number = 0;

  private onChangePoint() {
    if (!this.isMounted) return;

    // setTransform
    const angle = this.sceneObjectInfo!.data!.angle;
    const address = {
      ...createPoint(0, 0),
      ...createMatrix(0, 0)
    };
    copyAddress(this.sceneObjectInfo!.data!, address);
    if (
      this.sceneAndObjectInfo!.data!.isOriginalAddress &&
      this.sceneAndObjectInfo!.data!.originalAddress
    ) {
      copyAddress(this.sceneAndObjectInfo!.data!.originalAddress, address);
    }
    this.setTransform(address, angle);
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

    this.objX = useX - this.inflateWidth;
    this.objY = useY - this.inflateWidth;
    this.elm.style.transform = `translate(${this.objX}px,${this.objY}px) rotate(${angle}deg) translateZ(0)`;
  }

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.otherText")
  private onChangeOtherText() {
    this.otherText = this.sceneObjectInfo!.data!.otherText;
  }

  @Watch("isMounted")
  @Watch("sceneAndObjectInfo.order")
  private onChangeOrder() {
    this.elm.style.zIndex = this.sceneAndObjectInfo!.order.toString(10);
  }

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.columns")
  @Watch("inflateWidth")
  private onChangeColumns() {
    const columns = this.sceneObjectInfo!.data!.columns;
    const gridSize = CssManager.instance.propMap.gridSize;
    const objW = columns * gridSize + this.inflateWidth * 2;
    this.elm.style.width = `${objW}px`;
  }

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.rows")
  @Watch("inflateWidth")
  private onChangeRows() {
    const rows = this.sceneObjectInfo!.data!.rows;
    const gridSize = CssManager.instance.propMap.gridSize;
    const objH = rows * gridSize + this.inflateWidth * 2;
    this.elm.style.height = `${objH}px`;
  }

  private boxShadowWidth: number = 0;

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.isHideBorder")
  private onChangeIsHideBorder() {
    this.boxShadowWidth = this.sceneObjectInfo!.data!.isHideBorder ? 0 : 3;
    this.elm.style.boxShadow = `0 0 0 ${this.boxShadowWidth}px ${this.boxShadowColor}`;
  }

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.isHideHighlight")
  private onChangeIsHideHighlight() {
    const outlineWidth = this.sceneObjectInfo!.data!.isHideHighlight ? 0 : 6;
    this.elm.style.outlineOffset = `-${outlineWidth}px`;
    this.elm.style.outline = `rgb(187, 187, 255) solid ${outlineWidth}px`;
  }

  private boxShadowColor: string = "";

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.isLock")
  private onChangeIsLock() {
    this.boxShadowColor = this.sceneObjectInfo!.data!.isLock
      ? "rgb(255, 153, 153)"
      : "rgb(255, 255, 153)";
    this.elm.style.boxShadow = `0 0 0 ${this.boxShadowWidth}px ${this.boxShadowColor}`;
  }

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.angle")
  private onChangeAngle() {
    this.elm.style.transform = `translate(${this.objX}px,${
      this.objY
    }px) rotate(${this.sceneObjectInfo!.data!.angle}deg) translateZ(0)`;
  }

  @Watch("isMounted")
  @Watch("sceneObjectInfo.data.backgroundList", { deep: true })
  @Watch("sceneObjectInfo.data.textureIndex")
  private onChangeBackground() {
    if (!this.isMounted) return;
    const textures = this.sceneObjectInfo!.data!.textures;
    const textureIndex = this.sceneObjectInfo!.data!.textureIndex;
    const backInfo = textures[textureIndex];
    if (backInfo.type === "color") {
      this.elm.style.setProperty(`--image`, ``);
      this.imageSrc = "";
      this.elm.style.setProperty(`--image-direction`, ``);
      this.elm.style.setProperty(`--back-color`, backInfo.backgroundColor);
      this.elm.style.setProperty(`--font-color`, backInfo.fontColor);
      this.elm.style.setProperty(`--text`, `"${backInfo.text}"`);
    } else {
      const imageObj = this.imageList.filter(
        obj => obj.id === backInfo.imageId
      )[0];
      this.imageSrc = getSrc(imageObj.data!.data);
      this.elm.style.setProperty(`--image`, `url(${this.imageSrc})`);
      let direction = "";
      if (backInfo.direction === "horizontal") direction = "scale(-1, 1)";
      if (backInfo.direction === "vertical") direction = "scale(1, -1)";
      if (backInfo.direction === "180") direction = "rotate(180deg)";
      let backgroundSize = "";
      let backgroundPosition = "center";
      if (backInfo.backgroundSize === "contain") backgroundSize = "contain";
      if (backInfo.backgroundSize === "cover-start") {
        backgroundSize = "cover";
        backgroundPosition = "top left";
      }
      if (backInfo.backgroundSize === "cover-center") {
        backgroundSize = "cover";
      }
      if (backInfo.backgroundSize === "cover-end") {
        backgroundSize = "cover";
        backgroundPosition = "bottom right";
      }
      if (backInfo.backgroundSize === "100%") backgroundSize = "100% 100%";
      this.elm.style.setProperty(`--image-background-size`, backgroundSize);
      this.elm.style.setProperty(
        `--image-background-position`,
        backgroundPosition
      );
      this.elm.style.setProperty(`--image-direction`, direction);
      this.elm.style.setProperty(`--back-color`, "transparent");
      this.elm.style.setProperty(`--font-color`, "transparent");
      this.elm.style.setProperty(`--text`, `''`);
    }
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

  @TaskProcessor("change-focus-scene-object-finished")
  private async changeFocusSceneObjectFinished(
    task: Task<{ id: string; isFocus: boolean }, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.id !== this.docId) return;
    this.isFocused = task.value!.isFocus;
  }

  @TaskProcessor("change-highlight-view-finished")
  private async changeHighlightViewFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const args = task.value.args;
    if (args.type !== this.type || args.docId !== this.docId) return;

    window.console.log(
      `【highlight:${task.value.value}】 type: ${this.type}, docId: ${this.docId}`
    );
    try {
      await this.sceneObjectCC!.touchModify(this.docId);
      const data = (await this.sceneObjectCC!.getData(this.docId))!;
      data.data!.isHideHighlight = task.value.value;
      await this.sceneObjectCC!.update(this.docId, data.data!);
    } catch (err) {
      window.console.warn(err);
    }
  }

  @TaskProcessor("change-border-view-finished")
  private async changeBorderViewFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const args = task.value.args;
    if (args.type !== this.type || args.docId !== this.docId) return;

    window.console.log(
      `【border:${task.value.value}】 type: ${this.type}, docId: ${this.docId}`
    );
    try {
      await this.sceneObjectCC!.touchModify(this.docId);
      const data = (await this.sceneObjectCC!.getData(this.docId))!;
      data.data!.isHideBorder = task.value.value;
      await this.sceneObjectCC!.update(this.docId, data.data!);
    } catch (err) {
      window.console.warn(err);
    }
  }

  @TaskProcessor("lock-object-finished")
  private async lockObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const args = task.value.args;
    if (args.type !== this.type || args.docId !== this.docId) return;

    window.console.log(
      `【lock:${task.value.value}】 type: ${this.type}, docId: ${this.docId}`
    );
    try {
      await this.sceneObjectCC!.touchModify(this.docId);
      const data = (await this.sceneObjectCC!.getData(this.docId))!;
      data.data!.isLock = task.value.value;
      await this.sceneObjectCC!.update(this.docId, data.data!);
    } catch (err) {
      window.console.warn(err);
    }
  }

  @TaskProcessor("copy-object-finished")
  private async copyObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const args = task.value.args;
    if (args.type !== this.type || args.docId !== this.docId) return;

    window.console.log(
      `【copy:${task.value.value}】 type: ${this.type}, docId: ${this.docId}`
    );

    const data = (await this.sceneObjectCC!.getData(this.docId))!.data!;
    await GameObjectManager.instance.addSceneObject(data);
  }

  @TaskProcessor("delete-object-finished")
  private async deleteObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    const args = task.value.args;
    if (args.type !== this.type || args.docId !== this.docId) return;

    window.console.log(
      `【delete:${task.value.value}】 type: ${this.type}, docId: ${this.docId}`
    );

    await GameObjectManager.instance.deleteSceneObject(this.docId);
  }

  private getPoint(point: Point) {
    const currentAngle = CssManager.instance.propMap.currentAngle;
    const calcResult = this.calcCoordinate(point, currentAngle);
    return calcResult.planeLocateScene;
  }

  protected async leftDown(event: MouseEvent): Promise<void> {
    if (this.sceneObjectInfo!.data!.isLock) return;
    event.stopPropagation();
    if (this.sceneAndObjectInfo!.data!.isOriginalAddress) {
      try {
        await this.sceneAndObjectCC!.touchModify(this.sceneAndObjectInfo!.id!);
      } catch (err) {
        window.console.warn(err);
        return;
      }
    } else {
      try {
        await this.sceneObjectCC!.touchModify(this.docId);
      } catch (err) {
        window.console.warn(err);
        return;
      }
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
    this.inflateWidth = 2;
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

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;

    window.console.log("mouse-move-end-left-finished", param.key, param.type);
    const address = {
      ...createPoint(0, 0),
      ...createMatrix(0, 0)
    };

    copyAddress(this.sceneObjectInfo!.data!, address);

    if (
      this.sceneAndObjectInfo!.data!.isOriginalAddress &&
      this.sceneAndObjectInfo!.data!.originalAddress
    ) {
      copyAddress(this.sceneAndObjectInfo!.data!.originalAddress, address);
    }

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

    if (this.sceneAndObjectInfo!.data!.isOriginalAddress) {
      const data: SceneAndObject = clone(this.sceneAndObjectInfo!.data)!;
      if (!data.originalAddress)
        data.originalAddress = {
          ...createPoint(0, 0),
          ...createMatrix(0, 0)
        };
      copyAddress(address, data.originalAddress);
      await this.sceneAndObjectCC!.update(this.sceneAndObjectInfo!.id!, data);
    } else {
      const data: SceneObject = clone(this.sceneObjectInfo!.data)!;
      copyAddress(address, data);
      await this.sceneObjectCC!.update(this.docId, data);
    }
    this.inflateWidth = 0;
    TaskManager.instance.setTaskParam("mouse-moving-finished", null);
    TaskManager.instance.setTaskParam("mouse-move-end-left-finished", null);

    task.resolve();
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
          type: this.type,
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

  protected rollStart() {
    // const angle = this.getAngle(this.mouseOnTable);
    // this.setProperty({
    //   property: `map.rollObj`,
    //   value: {
    //     key: this.objKey,
    //     isRolling: true
    //   },
    //   logOff: true
    // });
    // this.changeListObj({
    //   key: this.objKey,
    //   angle: {
    //     dragStart: arrangeAngle(angle - this.angle.total)
    //   }
    // });
  }

  protected rollEnd() {
    // // window.console.log(`rollEnd`, event.pageX, event.pageY)
    // const mapObj: any = {
    //   rollObj: {
    //     isRolling: false
    //   }
    // };
    // if (event.button === 2) mapObj.isOverEvent = true;
    // this.setProperty({ property: `map`, value: mapObj, logOff: true });
    // const planeAngle = arrangeAngle(this.angle.dragging + this.angle.total);
    // this.changeListObj({
    //   key: this.objKey,
    //   angle: {
    //     total: arrangeAngle(Math.round(planeAngle / 30) * 30),
    //     dragging: 0
    //   }
    // });
  }

  protected rightUp(): void {
    // this.setProperty({ property: `map.isOverEvent`, value: true });
    // this.$emit("rightUp", event);
  }

  protected openContext(): void {
    // this.setProperty({
    //   property: contextProperty,
    //   value: {
    //     objKey: this.objKey,
    //     x: event.pageX,
    //     y: event.pageY
    //   },
    //   logOff: true
    // }).then(() => this.windowOpenDeprecated(contextProperty));
  }

  protected async mouseover(): Promise<void> {
    this.isHover = true;
    const data = this.sceneObjectInfo!.data!;
    if (!data.otherText) return;
    await TaskManager.instance.ignition<OtherTextViewInfo, never>({
      type: "other-text-view",
      owner: "Quoridorn",
      value: {
        type: this.type,
        docId: this.docId,
        text: data.otherText,
        point: createPoint(data.x, data.y),
        columns: data.columns,
        rows: data.rows
      }
    });
  }

  protected async mouseout(): Promise<void> {
    this.isHover = false;
    const data = this.sceneObjectInfo!.data!;
    if (!data.otherText) return;
    setTimeout(async () => {
      await TaskManager.instance.ignition<string, never>({
        type: "other-text-hide",
        owner: "Quoridorn",
        value: this.docId
      });
    });
  }
}
</script>
