import { Mixin } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import { ModeInfo } from "mode";
import { Mixins } from "vue-mixin-decorator";
import {
  BackgroundSize,
  Direction,
  Matrix,
  Point,
  SceneObjectType,
  Texture
} from "@/@types/store-data-optional";
import TaskManager from "@/app/core/task/TaskManager";
import WindowVue from "./WindowVue";
import { MemoStore, SceneObjectStore } from "@/@types/store-data";
import LanguageManager from "@/LanguageManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import { AddObjectInfo } from "@/@types/data";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { parseColor } from "@/app/core/utility/ColorUtility";

const uuid = require("uuid");

// @ts-ignore
@Mixin
export default abstract class MapObjectAddWindowVue extends Mixins<
  WindowVue<SceneObjectStore, boolean>
>(WindowVue) {
  protected abstract type: SceneObjectType;
  protected abstract textureType: "color" | "image";
  protected abstract hasOtherText: boolean;
  protected abstract sizeType: "size" | "wh";

  protected isMounted: boolean = false;

  protected name: string = "";
  protected tag: string = "";
  protected actorList = GameObjectManager.instance.actorList;
  protected otherTextList: StoreData<MemoStore>[] = [
    createEmptyStoreUseData(uuid.v4(), {
      tab: "",
      type: "normal",
      text: ""
    })
  ];
  protected url: string = "";
  protected mediaKey: string | null = null;
  protected mediaTag: string | null = null;
  protected direction: Direction = "none";
  protected backgroundSize: BackgroundSize = "contain";
  protected layerKey: string = "";
  protected isHideSubType: boolean = false;
  protected height: number = 1;
  protected width: number = 1;
  protected size: number = 1;
  protected subTypeKey: string = "";
  protected subTypeValue: string = "";

  protected text: string = "";
  protected color: string = "rgba(255, 0, 0, 1)";

  public async initExtend(layerType: SceneObjectType = this.type) {
    await this.init();
    this.name = LanguageManager.instance.getText("type." + this.type);
    this.layerKey = GameObjectManager.instance.sceneLayerList.find(
      ml => ml.data!.type === layerType
    )!.key;
  }

  @VueEvent
  protected async dragStart(event: DragEvent) {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "drop-piece",
        value: "on" as "on"
      }
    });
    event.dataTransfer!.setData("dropType", this.type!.toString());
    event.dataTransfer!.setData("dropWindow", this.key);
  }

  @VueEvent
  protected async dragEnd() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "drop-piece",
        value: "off" as "off"
      }
    });
  }

  @TaskProcessor("added-object-finished")
  private async addedObjectFinished(
    task: Task<AddObjectInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.dropWindow !== this.key) return;
    const point = task.value!.point;
    const matrix = task.value!.matrix;

    const sceneObjectKey: string = (
      await SocketFacade.instance
        .sceneObjectCC()
        .addDirect([{ data: this.makeSceneObjectData(point, matrix) }])
    )[0];

    if (this.hasOtherText) {
      await SocketFacade.instance.memoCC().addDirect(
        this.otherTextList.map(data => ({
          ownerType: "scene-object-list",
          owner: sceneObjectKey,
          permission: data.permission,
          data: data.data!
        }))
      );
    }

    task.resolve();
  }

  private makeSceneObjectData(point: Point, matrix: Matrix): SceneObjectStore {
    const colorObj = parseColor(this.color);
    let texture: Texture;
    if (this.textureType === "color") {
      texture = {
        type: "color",
        backgroundColor: colorObj.getRGBA(),
        fontColor: colorObj.getRGBReverse(),
        text: this.text
      };
    } else {
      texture = {
        type: "image",
        mediaTag: this.mediaTag!,
        mediaKey: this.mediaKey!,
        direction: this.direction,
        backgroundSize: this.backgroundSize!
      };
    }
    return {
      type: this.type,
      tag: this.tag,
      name: this.name,
      x: point.x,
      y: point.y,
      row: matrix.row,
      column: matrix.column,
      rows: this.sizeType === "size" ? this.size : this.height,
      columns: this.sizeType === "size" ? this.size : this.width,
      actorKey: null,
      place: "field",
      isHideBorder: false,
      isHideHighlight: false,
      isLock: false,
      layerKey: this.layerKey,
      textures: [texture],
      textureIndex: 0,
      angle: 0,
      url: this.url,
      subTypeKey: this.subTypeKey,
      subTypeValue: this.subTypeValue,
      isHideSubType: this.isHideSubType
    };
  }
}
