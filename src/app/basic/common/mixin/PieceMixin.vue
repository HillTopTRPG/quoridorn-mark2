<script lang="ts">
import AddressCalcMixin from "./AddressCalcMixin.vue";

import { Prop, Watch } from "vue-property-decorator";
import { Mixin } from "vue-mixin-decorator";
import { createPoint, getEventPoint } from "@/app/core/Coordinate";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SocketFacade, {
  getStoreObj
} from "@/app/core/api/app-server/SocketFacade";
import { StoreUseData } from "@/@types/store";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import {
  MapObject,
  OtherTextViewInfo,
  VolatileMapObject
} from "@/@types/gameObject";
import { Point } from "@/@types/address";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "@/@types/task";
import TaskManager, { MouseMoveParam } from "@/app/core/task/TaskManager";
import CssManager from "@/app/core/css/CssManager";
import { getCssPxNum } from "@/app/core/Css";
import { ContextTaskInfo } from "@/@types/context";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Mixin
export default class PieceMixin<T extends MapObject> extends AddressCalcMixin {
  @Prop({ type: String, required: true })
  protected docId!: string;

  @Prop({ type: String, required: true })
  protected type!: string;

  protected isHover: boolean = false;
  protected isMoving: boolean = false;
  protected inflateWidth: number = 0;
  protected cc: NekostoreCollectionController<T> | null = null;
  private imageList = GameObjectManager.instance.imageList;

  protected isMounted: boolean = false;
  protected storeInfo: StoreUseData<T> | null = null;

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

  private async getStoreInfo(): Promise<StoreUseData<T> | null> {
    try {
      this.cc = SocketFacade.instance.getCC(this.type);
    } catch (err) {
      window.console.warn(err);
      return null;
    }
    return (await this.cc!.getData(this.docId)) as StoreUseData<T>;
  }

  @LifeCycle
  protected async mounted() {
    this.storeInfo = await this.getStoreInfo();
    await this.cc!.setSnapshot(this.docId, this.docId, snapshot => {
      if (!snapshot.data) return;
      if (snapshot.data.status === "modified") {
        this.isMoving = false;
        this.storeInfo = getStoreObj<T>(snapshot);
        this.onChangePoint();
      }
    });
    this.isMounted = true;
  }

  protected get basicClasses() {
    if (!this.isMounted) return [];
    return [
      this.storeInfo!.data!.isLock ? "lock" : "non-lock",
      this.isHover ? "hover" : "non-hover",
      this.isMoving ? "moving" : "non-moving",
      this.storeInfo!.data!.isHideBorder ? "border-hide" : "border-view"
    ];
  }

  protected get elm(): HTMLElement {
    return this.$refs.component as HTMLElement;
  }

  private setCssProperty(property: string, failValue?: any, trueValue?: any) {
    if (!this.isMounted) return;
    const propertyValue = (this.storeInfo!.data! as any)[property];
    const useValue = propertyValue
      ? trueValue !== undefined
        ? trueValue
        : propertyValue
      : failValue !== undefined
      ? failValue
      : propertyValue;
    this.elm.style.setProperty(`--${property}`, useValue.toString());
  }

  @Watch("isMounted")
  @Watch("volatileInfo.moveDiff", { deep: true })
  private onChangePoint() {
    if (!this.isMounted) return;
    const x = this.storeInfo!.data!.x;
    const useX = this.isMoving ? x + this.volatileInfo.moveDiff.x : x;
    this.elm.style.setProperty(`--x`, `${useX}px`);
    const y = this.storeInfo!.data!.y;
    const useY = this.isMoving ? y + this.volatileInfo.moveDiff.y : y;
    this.elm.style.setProperty(`--y`, `${useY}px`);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.otherText")
  private onChangeOtherText() {
    this.otherText = this.storeInfo!.data!.otherText;
  }

  @Watch("isMounted")
  @Watch("storeInfo.order")
  private onChangeOrder() {
    this.elm.style.setProperty(`--order`, `${this.storeInfo!.order}`);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.columns")
  private onChangeColumns() {
    this.setCssProperty("columns", 0);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.rows")
  private onChangeRows() {
    this.setCssProperty("rows", 0);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.isHideBorder")
  private onChangeIsHideBorder() {
    this.setCssProperty("isHideBorder", 0, 1);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.isHideHighlight")
  private onChangeIsHideHighlight() {
    this.setCssProperty("isHideHighlight", 0, 1);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.isLock")
  private onChangeIsLock() {
    this.setCssProperty("isLock", "rgb(255, 255, 153)", "rgb(255, 153, 153)");
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.angle")
  private onChangeAngle() {
    this.setCssProperty("angle", "0deg", `${this.storeInfo!.data!.angle}deg`);
  }

  @Watch("isMounted")
  @Watch("storeInfo.data.backgroundList", { deep: true })
  @Watch("storeInfo.data.useBackGround")
  private onChangeBackground() {
    if (!this.isMounted) return;
    const backgroundList = this.storeInfo!.data!.backgroundList;
    const useBackGround = this.storeInfo!.data!.useBackGround;
    const backInfo = backgroundList[useBackGround];
    if (backInfo.backgroundType === "color") {
      this.elm.style.setProperty(`--image`, ``);
      this.imageSrc = "";
      this.elm.style.setProperty(`--image-direction`, ``);
      this.elm.style.setProperty(`--back-color`, backInfo.backgroundColor);
      this.elm.style.setProperty(`--font-color`, backInfo.fontColor);
      this.elm.style.setProperty(`--text`, `"${backInfo.text}"`);
    } else {
      // TODO 画像設定
      const imageObj = this.imageList.filter(
        obj => obj.id === backInfo.imageId
      )[0];
      this.elm.style.setProperty(`--image`, `url(${imageObj.data!.data})`);
      this.imageSrc = imageObj.data!.data;
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
      this.elm.style.setProperty(`--text`, `""`);
    }
    this.setCssProperty("angle", 0);
  }

  @Watch("isMounted")
  @Watch("inflateWidth")
  private onChangeInflateWidth() {
    if (!this.isMounted) return;
    this.elm.style.setProperty(`--inflate-width`, `${this.inflateWidth}px`);
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docId) return;
    if (!this.isMoving) return;
    const point = task.value!;
    const planeLocateScreen = this.getPoint(point);
    const diffX = planeLocateScreen.x - this.volatileInfo.moveFromPlane.x;
    const diffY = planeLocateScreen.y - this.volatileInfo.moveFromPlane.y;
    this.volatileInfo.moveDiff = createPoint(diffX, diffY);
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
      await this.cc!.touchModify(this.docId);
      const data = (await this.cc!.getData(this.docId))!;
      data.data!.isHideHighlight = task.value.value;
      await this.cc!.update(this.docId, data.data!);
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
      await this.cc!.touchModify(this.docId);
      const data = (await this.cc!.getData(this.docId))!;
      data.data!.isHideBorder = task.value.value;
      await this.cc!.update(this.docId, data.data!);
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
      await this.cc!.touchModify(this.docId);
      const data = (await this.cc!.getData(this.docId))!;
      data.data!.isLock = task.value.value;
      await this.cc!.update(this.docId, data.data!);
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
    try {
      const newDocId = await this.cc!.touch();
      const data = (await this.cc!.getData(this.docId))!;
      await this.cc!.add(newDocId, data.data!);
    } catch (err) {
      window.console.warn(err);
    }
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
    try {
      await this.cc!.touchModify(this.docId);
      await this.cc!.delete(this.docId);
    } catch (err) {
      window.console.warn(err);
    }
  }

  private getPoint(point: Point) {
    const currentAngleStr = CssManager.getCss(
      "--currentAngle",
      document.getElementById("gameTable")!
    );
    const currentAngle = parseInt(currentAngleStr.replace("deg", ""), 10);
    const calcResult = this.calcCoordinate(point, currentAngle);
    return calcResult.planeLocateScreen;
  }

  protected async leftDown(event: MouseEvent): Promise<void> {
    if (this.storeInfo!.data!.isLock) return;
    event.stopPropagation();
    try {
      await this.cc!.touchModify(this.docId);
    } catch (err) {
      window.console.warn(err);
      return;
    }
    const clientRect = (event.target as any).getBoundingClientRect();
    const elmPoint = this.getPoint(createPoint(clientRect.x, clientRect.y));
    const point = getEventPoint(event);
    const planeLocateScreen = this.getPoint(point);
    this.volatileInfo.moveDiff = createPoint(0, 0);
    this.volatileInfo.moveFrom = createPoint(point.x, point.y);
    this.volatileInfo.moveFromPlane = createPoint(
      planeLocateScreen.x,
      planeLocateScreen.y
    );
    const relativeX = planeLocateScreen.x - elmPoint.x;
    const relativeY = planeLocateScreen.y - elmPoint.y;
    this.volatileInfo.moveFromPlaneRelative = createPoint(relativeX, relativeY);
    this.isMoving = true;
    this.inflateWidth = 2;
    this.mouseDown("left");
  }

  protected rightDown(event: MouseEvent): void {
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
    const data = JSON.parse(JSON.stringify(this.storeInfo!.data)) as T;
    data.x += this.volatileInfo.moveDiff.x;
    data.y += this.volatileInfo.moveDiff.y;

    const isGridFit = true;
    if (isGridFit) {
      const gridSize = getCssPxNum(
        "--gridSize",
        document.getElementById("gameTable")!
      );
      const relativeX = this.volatileInfo.moveFromPlaneRelative.x;
      const relativeY = this.volatileInfo.moveFromPlaneRelative.y;
      data.x =
        (Math.floor((data.x + relativeX) / gridSize) -
          Math.floor(relativeX / gridSize)) *
        gridSize;
      data.y =
        (Math.floor((data.y + relativeY) / gridSize) -
          Math.floor(relativeY / gridSize)) *
        gridSize;
    }
    await this.cc!.update(this.docId, data);
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

  protected rollEnd(event: any) {
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

  protected rightUp(this: any, event: any): void {
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
    // }).then(() => this.windowOpen(contextProperty));
  }

  protected async mouseover(): Promise<void> {
    this.isHover = true;
    const data = this.storeInfo!.data!;
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
    const data = this.storeInfo!.data!;
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
