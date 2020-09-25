<script lang="ts">
import AddressCalcMixin from "./AddressCalcMixin.vue";
import { Prop, Watch } from "vue-property-decorator";
import { Mixin, Mixins } from "vue-mixin-decorator";
import { Point } from "address";
import { Task, TaskResult } from "task";
import { ContextTaskInfo } from "context";
import DocumentSnapshot from "nekostore/lib/DocumentSnapshot";
import Unsubscribe from "nekostore/lib/Unsubscribe";
import SocketFacade, {
  permissionCheck
} from "../../../core/api/app-server/SocketFacade";
import LifeCycle from "../../../core/decorator/LifeCycle";
import TaskProcessor from "../../../core/task/TaskProcessor";
import {
  KeepBcdiceDiceRollResult,
  MemoStore,
  ObjectMoveInfo,
  OtherTextViewInfo,
  SceneObject,
  SceneObjectType
} from "@/@types/gameObject";
import { StoreObj, StoreUseData } from "@/@types/store";
import {
  copyAddress,
  createAddress,
  createPoint,
  createRectangle,
  getEventPoint
} from "@/app/core/utility/CoordinateUtility";
import { findRequireByKey } from "@/app/core/utility/Utility";
import TaskManager, { MouseMoveParam } from "../../../core/task/TaskManager";
import VueEvent from "../../../core/decorator/VueEvent";
import { SceneAndObject } from "@/@types/room";
import CssManager from "../../../core/css/CssManager";
import GameObjectManager from "../../GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import { DataReference } from "@/@types/data";
import { sendChatLog } from "@/app/core/utility/ChatUtility";
import BcdiceManager from "@/app/core/api/bcdice/BcdiceManager";
const uuid = require("uuid");
import { exportData } from "@/app/core/utility/ExportUtility";

@Mixin
export default class PieceMixin<T extends SceneObjectType> extends Mixins<
  AddressCalcMixin
>(AddressCalcMixin) {
  @Prop({ type: String, required: true })
  protected docKey!: string;

  @Prop({ type: String, required: true })
  protected type!: string;

  private pieceKey = uuid.v4();

  protected isHover: boolean = false;
  protected isMoving: boolean = false;
  protected isFocused: boolean = false;
  protected inflateWidth: number = 0;
  protected sceneObjectCC = SocketFacade.instance.sceneObjectCC();
  protected sceneAndObjectCC = SocketFacade.instance.sceneAndObjectCC();
  private mediaList = GameObjectManager.instance.mediaList;
  private memoList = GameObjectManager.instance.memoList;

  protected isMounted: boolean = false;
  protected sceneObjectInfo: StoreObj<SceneObject> | null = null;
  protected sceneAndObjectInfo: StoreObj<SceneAndObject> | null = null;
  private otherLockTimeoutKey: number | null = null;
  private isTransitioning: boolean = false;
  private roomData = GameObjectManager.instance.roomData;
  private sceneAndObjectUnsubscribe: Unsubscribe | null = null;

  private get sceneKey() {
    return this.roomData.sceneKey;
  }

  @Watch("sceneKey")
  private async onChangeSceneKey() {
    await this.resetSceneKey(this.sceneKey);
  }

  @VueEvent
  protected get lockMessage() {
    let result = "";
    if (this.sceneObjectInfo && this.sceneObjectInfo.exclusionOwner) {
      const name = GameObjectManager.instance.getExclusionOwnerName(
        this.sceneObjectInfo.exclusionOwner
      );
      result = name
        ? `<span class="icon-lock"></span>sceneObject(${escape(name)})`
        : "";
    }

    let additional = "";
    if (this.sceneAndObjectInfo && this.sceneAndObjectInfo.exclusionOwner) {
      const name = GameObjectManager.instance.getExclusionOwnerName(
        this.sceneAndObjectInfo.exclusionOwner
      );
      additional = name
        ? `<span class="icon-lock"></span>sceneAndObject(${escape(name)})`
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
  protected otherTextList: StoreUseData<MemoStore>[] = [];

  private volatileInfo: ObjectMoveInfo = {
    fromPoint: createPoint(0, 0),
    fromAbsPoint: createPoint(0, 0),
    fromAbsRelPoint: createPoint(0, 0),
    moveDiff: createPoint(0, 0),
    cardCenter: createPoint(0, 0),
    angleFrom: 0,
    angleDiff: 0
  };

  public get key() {
    return `${this.type}-${this.docKey}`;
  }

  private async resetSceneKey(sceneKey: string) {
    this.sceneAndObjectInfo = (await this.sceneAndObjectCC!.findList([
      {
        property: "data.sceneKey",
        operand: "==",
        value: sceneKey
      },
      {
        property: "data.objectKey",
        operand: "==",
        value: this.docKey
      }
    ]))![0].data!;

    this.onChangePoint();

    if (this.sceneAndObjectUnsubscribe) {
      await this.sceneAndObjectUnsubscribe();
    }
    this.sceneAndObjectUnsubscribe = await this.sceneAndObjectCC!.setSnapshot(
      this.docKey,
      this.sceneAndObjectInfo.key,
      (snapshot: DocumentSnapshot<StoreObj<SceneAndObject>>) => {
        if (!snapshot.data) return;
        const status = snapshot.data.status;
        if (status === "modified" || status === "modify-touched") {
          this.sceneAndObjectInfo = snapshot.data!;
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
    this.sceneObjectInfo = (await this.sceneObjectCC!.findSingle(
      "key",
      this.docKey
    ))!.data!;

    await this.sceneObjectCC!.setSnapshot(
      this.pieceKey,
      this.docKey,
      snapshot => {
        if (!snapshot.data) return;
        const status = snapshot.data.status;
        if (status === "modified" || status === "modify-touched") {
          this.sceneObjectInfo = snapshot.data!;
          if (status === "modified") {
            this.isMoving = false;
            if (!this.sceneAndObjectInfo!.data!.isOriginalAddress) {
              this.volatileInfo.moveDiff = createPoint(0, 0);
              this.onChangePoint();
            }
          }
        }
      }
    );

    await this.resetSceneKey(this.sceneKey);

    this.isMounted = true;
    this.onChangePoint();
  }

  private get isOtherLastModify(): boolean {
    if (!this.sceneObjectInfo) return false;
    const targetStoreObj = this.sceneAndObjectInfo!.data!.isOriginalAddress
      ? this.sceneAndObjectInfo!
      : this.sceneObjectInfo!;
    const lastExclusionOwner = targetStoreObj.lastExclusionOwner;
    const lastExclusionOwnerKey = GameObjectManager.instance.getExclusionOwnerKey(
      lastExclusionOwner
    );
    return (
      !!lastExclusionOwnerKey &&
      lastExclusionOwnerKey !== GameObjectManager.instance.mySelfUserKey
    );
  }

  protected get basicClasses() {
    if (!this.isMounted || !this.sceneObjectInfo) return [];
    const result = [
      this.sceneObjectInfo.data!.isLock ? "lock" : "non-lock",
      this.isHover ? "hover" : "non-hover",
      this.isMoving ? "moving" : "non-moving",
      this.sceneObjectInfo.data!.isHideBorder ? "border-hide" : "border-view",
      permissionCheck(this.sceneObjectInfo, "edit")
        ? "editable"
        : "non-editable",
      this.sceneObjectInfo.owner === GameObjectManager.instance.mySelfUserKey
        ? "owners"
        : "non-owners"
    ];
    if (this.isFocused) result.push("focus");
    if (this.isOtherLastModify) result.push("other-player-last-modify");
    if (this.isTransitioning) result.push("transitioning");
    if (this.sceneObjectInfo.data!.isHideSubType) result.push("hide-sub-type");

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
    const address = createAddress(0, 0, 0, 0);
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
      if (this.otherLockTimeoutKey !== null)
        clearTimeout(this.otherLockTimeoutKey);

      this.isTransitioning = true;
      // other-player-last-modifyに設定されている「transition」の0.3sに合わせている
      this.otherLockTimeoutKey = window.setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }

    this.objX = useX - this.inflateWidth;
    this.objY = useY - this.inflateWidth;
    this.elm.style.transform = `translate(${this.objX}px,${this.objY}px) rotate(${angle}deg) translateZ(0)`;
  }

  @Watch("isMounted")
  @Watch("memoList", { deep: true })
  private onChangeOtherText() {
    this.otherTextList = this.memoList.filter(
      m => m.ownerType === "scene-object" && m.owner === this.docKey
    );
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
  @Watch("sceneObjectInfo.data.subTypeKey")
  private onChangeBackground() {
    if (!this.isMounted) return;
    const textures = this.sceneObjectInfo!.data!.textures;
    const textureIndex = this.sceneObjectInfo!.data!.textureIndex;
    const backInfo = textures[textureIndex];
    if (backInfo.type === "color") {
      this.elm.style.setProperty(`--image`, ``);
      this.elm.style.setProperty(`--image-direction`, ``);
      this.elm.style.setProperty(`--back-color`, backInfo.backgroundColor);
      this.elm.style.setProperty(`--font-color`, backInfo.fontColor);
      this.elm.style.setProperty(`--text`, `"${backInfo.text}"`);
    } else {
      const media = findRequireByKey(this.mediaList, backInfo.mediaKey);
      this.elm.style.setProperty(`--image`, `url('${media.data!.url}')`);
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
    if (this.sceneObjectInfo!.data!.type === "dice-symbol") {
      const diceTypeKey = this.sceneObjectInfo!.data!.subTypeKey;
      const pips = this.sceneObjectInfo!.data!.subTypeValue;
      const pipsInfo = GameObjectManager.instance.diceAndPipsList.find(
        dap => dap.data!.diceTypeKey === diceTypeKey && dap.data!.pips === pips
      );
      const media = findRequireByKey(this.mediaList, pipsInfo!.data!.mediaKey);
      this.elm.style.setProperty(`--image`, `url('${media.data!.url}')`);
      this.elm.style.setProperty(`--image-background-size`, "contain");
      return;
    }
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseMoveFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docKey) return;
    if (!this.isMoving) return;
    const point = task.value!;
    const planeLocateScene = this.getPoint(point);
    const diffX = planeLocateScene.x - this.volatileInfo.fromAbsPoint.x;
    const diffY = planeLocateScene.y - this.volatileInfo.fromAbsPoint.y;
    this.volatileInfo.moveDiff = createPoint(diffX, diffY);
    this.onChangePoint();
  }

  @TaskProcessor("change-focus-scene-object-finished")
  private async changeFocusSceneObjectFinished(
    task: Task<{ key: string; isFocus: boolean }, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.key !== this.docKey) return;
    this.isFocused = task.value!.isFocus;
  }

  private isNotThisTask(task: Task<any, never>): boolean {
    const args = task.value.args;
    return (
      args.type !== this.type ||
      args.key !== this.docKey ||
      args.pieceKey !== this.pieceKey
    );
  }

  @TaskProcessor("change-highlight-view-finished")
  private async changeHighlightViewFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    console.log(
      `【highlight:${task.value.value}】 type: ${this.type}, docKey: ${this.docKey}`
    );
    try {
      const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
        .data!;
      data.data!.isHideHighlight = task.value.value;
      await this.sceneObjectCC!.updatePackage([
        { key: this.docKey, data: data.data! }
      ]);
    } catch (err) {
      console.warn(err);
    }
  }

  @TaskProcessor("change-border-view-finished")
  private async changeBorderViewFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    console.log(
      `【border:${task.value.value}】 type: ${this.type}, docKey: ${this.docKey}`
    );
    try {
      const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
        .data!;
      data.data!.isHideBorder = task.value.value;
      await this.sceneObjectCC!.updatePackage([
        { key: this.docKey, data: data.data! }
      ]);
    } catch (err) {
      console.warn(err);
    }
  }

  @TaskProcessor("lock-object-finished")
  private async lockObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    console.log(
      `【lock:${task.value.value}】 type: ${this.type}, docKey: ${this.docKey}`
    );
    try {
      const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
        .data!;
      data.data!.isLock = task.value.value;
      await this.sceneObjectCC!.updatePackage([
        { key: this.docKey, data: data.data! }
      ]);
    } catch (err) {
      console.warn(err);
    }
  }

  @TaskProcessor("copy-object-finished")
  private async copyObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    console.log(
      `【copy:${task.value.value}】 type: ${this.type}, docKey: ${this.docKey}`
    );

    const data: SceneObject = (await this.sceneObjectCC!.findSingle(
      "key",
      this.docKey
    ))!.data!.data!;
    const sceneObjectKey: string = (
      await SocketFacade.instance.sceneObjectCC().addDirect([{ data }])
    )[0];

    if (this.otherTextList.length) {
      await SocketFacade.instance.memoCC().addDirect(
        this.otherTextList.map(data => ({
          ownerType: "scene-object",
          owner: sceneObjectKey,
          data: data.data!
        }))
      );
    }
  }

  @TaskProcessor("export-object-finished")
  private async exportObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;

    const sceneObject = (await this.sceneObjectCC!.findSingle(
      "key",
      this.docKey
    ))!.data!;

    const memoList = (await SocketFacade.instance.memoCC().findList([
      {
        property: "owner",
        operand: "==",
        value: this.docKey
      }
    ]))!.map(doc => doc.data!);

    const exportList: StoreObj<any>[] = [];
    exportList.push(sceneObject);
    if (memoList.length) {
      exportList.push(...memoList);
    }
    console.log(exportList);
    await exportData(exportList);
  }

  @TaskProcessor("delete-object-finished")
  private async deleteObjectFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    console.log(
      `【delete:${task.value.value}】 type: ${this.type}, docKey: ${this.docKey}`
    );

    await GameObjectManager.deleteSceneObject(this.docKey);
  }

  @TaskProcessor("open-ref-url-finished")
  private async openRefUrlFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
      .data!;
    window.open(data.data!.url, "_blank");
  }

  @TaskProcessor("edit-actor-finished")
  private async editActorFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
      .data!;
    const actorKey = data.data!.actorKey!;
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "actor-edit-window",
        args: {
          type: "actor",
          key: actorKey
        }
      }
    });
  }

  @TaskProcessor("dice-roll-finished")
  private async diceRollFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;
    const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
      .data!;
    const pipsList = GameObjectManager.instance.diceAndPipsList
      .filter(dap => dap.data!.diceTypeKey === data.data!.subTypeKey)
      .map(dap => dap.data!.pips);
    const pipsLength = pipsList.filter(p => p && p !== "0").length;
    let pips: string = "";

    if (data.data!.isHideSubType) {
      // ダイスを隠しているなら
      const command = `1D${pipsLength}`;
      const resultJson = await BcdiceManager.sendBcdiceServer({
        system: "DiceBot",
        command
      });

      if (resultJson.ok) {
        // bcdiceとして結果が取れた
        const keepBcdiceDiceRollResultListCC = SocketFacade.instance.keepBcdiceDiceRollResultListCC();
        const keepBcdiceDiceRollResult = await this.getKeepBcdiceDiceRollResult();
        if (!keepBcdiceDiceRollResult) {
          // 新規追加
          await keepBcdiceDiceRollResultListCC.addDirect([
            {
              data: {
                type: "hide-dice-symbol-roll",
                text: command,
                targetKey: data.key,
                bcdiceDiceRollResult: resultJson
              }
            }
          ]);
        } else {
          // 更新
          keepBcdiceDiceRollResult.data!.bcdiceDiceRollResult = resultJson;
          await keepBcdiceDiceRollResultListCC.updatePackage([
            {
              key: keepBcdiceDiceRollResult.key,
              data: keepBcdiceDiceRollResult.data!
            }
          ]);
        }
        pips = resultJson.dices![0]!.value.toString();
        await sendChatLog(
          {
            chatType: "system-message",
            text: this.$t("message.dice-roll-dice-symbol-hide").toString(),
            tabKey: null,
            targetKey: null,
            statusKey: null,
            system: null,
            isSecret: false
          },
          []
        );
      } else {
        // bcdiceとして結果は取れなかった
        await sendChatLog(
          {
            chatType: "system-message",
            text: `System error!!. dice roll failure. command: ${command}`,
            tabKey: null,
            targetKey: null,
            statusKey: null,
            system: null,
            isSecret: false
          },
          []
        );
        return;
      }
    } else {
      // ダイスを隠していないなら
      const command = `1D${pipsLength} ${this.$t(
        "type.dice-symbol"
      )!.toString()} ${this.$t("context.dice-roll")!.toString()}`;
      const diceRollResult = await sendChatLog(
        {
          chatType: "system-message",
          text: command,
          tabKey: null,
          targetKey: null,
          statusKey: null,
          system: null,
          isSecret: false
        },
        []
      );
      if (!diceRollResult) {
        // bcdiceとして結果は取れなかった
        await sendChatLog(
          {
            chatType: "system-message",
            text: `System error!!. dice roll failure. command: ${command}`,
            tabKey: null,
            targetKey: null,
            statusKey: null,
            system: null,
            isSecret: false
          },
          []
        );
        return;
      }
      pips = diceRollResult!.dices![0]!.value.toString();
    }
    try {
      data.data!.subTypeValue = pips;
      await this.sceneObjectCC!.updatePackage([
        { key: this.docKey, data: data.data! }
      ]);
    } catch (err) {
      console.warn(err);
    }
  }

  @TaskProcessor("dice-pips-change-finished")
  private async dicePipsChangeFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;

    const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
      .data!;
    const faceNum = GameObjectManager.instance.diceTypeList.find(
      dt => dt.key === data.data!.subTypeKey
    )!.data!.faceNum;
    const oldPips: string = data.data!.subTypeValue;
    const isHideSubType = data.data!.isHideSubType;
    const pips = task.value.value;
    data.data!.subTypeValue = pips;
    await this.sceneObjectCC!.updatePackage([
      { key: this.docKey, data: data.data! }
    ]);

    const msgTarget = isHideSubType
      ? "change-pips-dice-symbol-hide"
      : "change-pips-dice-symbol";
    await sendChatLog(
      {
        chatType: "system-message",
        text: this.$t(`message.${msgTarget}`)
          .toString()
          .replace("{0}", `D${faceNum}`)
          .replace("{1}", oldPips)
          .replace("{2}", pips),
        tabKey: null,
        targetKey: null,
        statusKey: null,
        system: null,
        isSecret: false
      },
      []
    );
    const keepBcdiceDiceRollResultListCC = SocketFacade.instance.keepBcdiceDiceRollResultListCC();
    const keepBcdiceDiceRollResult = await this.getKeepBcdiceDiceRollResult();
    if (keepBcdiceDiceRollResult) {
      await keepBcdiceDiceRollResultListCC.deletePackage([
        keepBcdiceDiceRollResult.key
      ]);
    }
  }

  private async getKeepBcdiceDiceRollResult(): Promise<StoreObj<
    KeepBcdiceDiceRollResult
  > | null> {
    const keepBcdiceDiceRollResultListCC = SocketFacade.instance.keepBcdiceDiceRollResultListCC();
    const list = await keepBcdiceDiceRollResultListCC.findList([
      { property: "data.type", operand: "==", value: "hide-dice-symbol-roll" },
      { property: "data.targetKey", operand: "==", value: this.docKey }
    ]);
    return list ? list[0].data! : null;
  }

  @TaskProcessor("change-dice-view-finished")
  private async changeDiceViewFinished(
    task: Task<any, never>
  ): Promise<TaskResult<never> | void> {
    if (this.isNotThisTask(task)) return;

    const data = (await this.sceneObjectCC!.findSingle("key", this.docKey))!
      .data!;
    const faceNum = GameObjectManager.instance.diceTypeList.find(
      dt => dt.key === data.data!.subTypeKey
    )!.data!.faceNum;
    const isHideSubType = task.value.value;
    const pips = data.data!.subTypeValue;
    data.data!.isHideSubType = isHideSubType;
    await this.sceneObjectCC!.updatePackage([
      { key: this.docKey, data: data.data! }
    ]);

    let msgTarget = isHideSubType ? "hide-dice-symbol" : "view-dice-symbol";

    let diceRollResult: string = "";

    const keepBcdiceDiceRollResult = await this.getKeepBcdiceDiceRollResult();
    if (!isHideSubType && keepBcdiceDiceRollResult) {
      const bcdiceDiceRollResult = keepBcdiceDiceRollResult.data!
        .bcdiceDiceRollResult;
      diceRollResult = bcdiceDiceRollResult.result || "";

      const keepBcdiceDiceRollResultListCC = SocketFacade.instance.keepBcdiceDiceRollResultListCC();
      await keepBcdiceDiceRollResultListCC.deletePackage([
        keepBcdiceDiceRollResult.key
      ]);
      msgTarget = "view-dice-symbol-dice-roll";
    }

    await sendChatLog(
      {
        chatType: "system-message",
        text: this.$t(`message.${msgTarget}`)
          .toString()
          .replace("{0}", `D${faceNum}`)
          .replace("{1}", pips)
          .replace("{2}", diceRollResult),
        tabKey: null,
        targetKey: null,
        statusKey: null,
        system: null,
        isSecret: false
      },
      []
    );
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
        await this.sceneAndObjectCC!.touchModify([
          this.sceneAndObjectInfo!.key
        ]);
      } catch (err) {
        console.warn(err);
        return;
      }
    } else {
      try {
        await this.sceneObjectCC!.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        return;
      }
    }
    const clientRect = (event.target as any).getBoundingClientRect();
    const elmPoint = this.getPoint(createPoint(clientRect.x, clientRect.y));
    const point = getEventPoint(event);
    const planeLocateScene = this.getPoint(point);
    this.volatileInfo.moveDiff = createPoint(0, 0);
    this.volatileInfo.fromPoint = createPoint(point.x, point.y);
    this.volatileInfo.fromAbsPoint = createPoint(
      planeLocateScene.x,
      planeLocateScene.y
    );
    this.volatileInfo.fromAbsRelPoint = createPoint(
      planeLocateScene.x - elmPoint.x,
      planeLocateScene.y - elmPoint.y
    );
    this.isMoving = true;
    this.inflateWidth = 2;
    this.onChangePoint();
    this.mouseDown("left");
  }

  protected rightDown(): void {
    console.log("rightDown");
    // if (this.isRolling) {
    //   this.$emit("rightDown");
    // }
    this.mouseDown("right");
  }

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
        type: `${button}-click`,
        pieceKey: this.pieceKey
      }
    );
  }

  @TaskProcessor("mouse-move-end-left-finished")
  private async mouseLeftUpFinished(
    task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.docKey || param.pieceKey !== this.pieceKey)
      return;

    console.log("mouse-move-end-left-finished", param.key, param.type);
    const address = createAddress(0, 0, 0, 0);

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
    const relativeX = this.volatileInfo.fromAbsRelPoint.x;
    const relativeY = this.volatileInfo.fromAbsRelPoint.y;
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
        data.originalAddress = createAddress(0, 0, 0, 0);
      copyAddress(address, data.originalAddress);
      await this.sceneAndObjectCC!.update([
        {
          key: this.sceneAndObjectInfo!.key,
          data
        }
      ]);
    } else {
      const data: SceneObject = clone(this.sceneObjectInfo!.data)!;
      copyAddress(address, data);
      await this.sceneObjectCC!.update([
        {
          key: this.docKey,
          data
        }
      ]);
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
    if (!param || param.key !== this.docKey || param.pieceKey !== this.pieceKey)
      return;
    console.log("mouse-move-end-right-finished", param.key, param.type);
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
          target: this.docKey,
          pieceKey: this.pieceKey,
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

  @VueEvent
  protected rollEnd() {
    // // console.log(`rollEnd`, event.pageX, event.pageY)
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

  @VueEvent
  protected async mouseover(): Promise<void> {
    this.isHover = true;
    const data = this.sceneObjectInfo!.data!;
    if (!this.otherTextList.length) return;
    const rect = this.elm.getBoundingClientRect();
    await TaskManager.instance.ignition<OtherTextViewInfo, never>({
      type: "other-text-view",
      owner: "Quoridorn",
      value: {
        type: this.type,
        key: this.docKey,
        dataList: this.otherTextList,
        rect: createRectangle(data.x, data.y, rect.width, rect.height),
        isFix: false
      }
    });
  }

  @VueEvent
  protected async mouseout(): Promise<void> {
    this.isHover = false;
    if (!this.otherTextList.length) return;
    await TaskManager.instance.ignition<string, never>({
      type: "other-text-hide",
      owner: "Quoridorn",
      value: this.docKey
    });
  }
}
</script>
