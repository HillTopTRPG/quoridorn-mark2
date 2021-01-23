import { Mixin, Mixins } from "vue-mixin-decorator";
import { BackgroundSize, Direction } from "@/@types/store-data-optional";
import WindowVue from "./WindowVue";
import { MemoStore, SceneObjectStore } from "@/@types/store-data";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import NekostoreCollectionController from "@/app/core/api/app-server/NekostoreCollectionController";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import { parseColor } from "@/app/core/utility/ColorUtility";

// @ts-ignore
@Mixin
export default abstract class MapObjectEditWindowVue extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  protected docKey: string = "";
  private cc: NekostoreCollectionController<
    SceneObjectStore
  > = SocketFacade.instance.sceneObjectCC();
  private isProcessed: boolean = false;

  protected isMounted: boolean = false;
  protected abstract hasOtherText: boolean;
  protected abstract sizeType: "size" | "wh";

  protected actorList = GameObjectManager.instance.actorList;
  protected name: string = "";
  protected tag: string = "";
  protected otherTextList: StoreData<MemoStore>[] = [];
  protected url: string = "";
  protected mediaKey: string | null = null;
  protected mediaTag: string | null = null;
  protected direction: Direction = "none";
  protected backgroundSize: BackgroundSize = "contain";
  protected layerKey: string = "";
  protected isHideSubType: boolean = false;
  protected subTypeKey: string = "";
  protected subTypeValue: string = "";

  protected size: number = 1;
  protected width: number = 1;
  protected height: number = 1;
  protected text: string = "";
  protected color: string = "rgb(255, 0, 0, 1)";

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docKey = this.windowInfo.args!.key;
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!;

    if (this.windowInfo.status === "window") {
      // 排他チェック
      if (data.exclusionOwner) {
        this.isProcessed = true;
        await this.close();
        return;
      }

      // パーミッションチェック
      if (!permissionCheck(data, "edit")) {
        this.isProcessed = true;
        await this.close();
        return;
      }
    }

    const texture = data.data!.textures[data.data!.textureIndex];
    if (texture.type === "image") {
      this.mediaKey = texture.mediaKey;
      this.mediaTag = texture.mediaTag;
      this.backgroundSize = texture.backgroundSize;
      this.direction = texture.direction;
    }
    if (texture.type === "color") {
      this.text = texture.text;
      this.color = texture.backgroundColor;
    }
    this.tag = data.data!.tag;
    this.name = data.data!.name;
    this.layerKey = data.data!.layerKey;
    this.isHideSubType = data.data!.isHideSubType;
    this.url = data.data!.url;
    if (this.sizeType === "size") {
      this.size = data.data!.columns;
    } else {
      this.width = data.data!.columns;
      this.height = data.data!.rows;
    }

    this.otherTextList = clone(
      GameObjectManager.instance.memoList.filter(
        m => m.ownerType === "scene-object-list" && m.owner === this.docKey
      )
    )!;

    if (this.windowInfo.status === "window") {
      try {
        await this.cc.touchModify([this.docKey]);
      } catch (err) {
        console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const data = (await this.cc!.findSingle("key", this.docKey))!.data!.data!;
    const texture = data.textures[data.textureIndex];
    if (texture.type === "image") {
      texture.mediaKey = this.mediaKey!;
      texture.mediaTag = this.mediaTag!;
      texture.backgroundSize = this.backgroundSize;
      texture.direction = this.direction;
    }
    if (texture.type === "color") {
      texture.text = this.text;
      const colorObj = parseColor(this.color);
      texture.backgroundColor = colorObj.getRGBA();
      texture.fontColor = colorObj.getRGBReverse();
    }
    data.tag = this.tag;
    data.name = this.name;
    data.layerKey = this.layerKey;
    data.isHideSubType = this.isHideSubType;
    data.url = this.url;
    if (this.sizeType === "size") {
      data.rows = this.size;
      data.columns = this.size;
    } else {
      data.rows = this.height;
      data.columns = this.width;
    }
    await this.cc!.update([{ key: this.docKey, data }]);

    if (this.hasOtherText) {
      await GameObjectManager.instance.updateMemoList(
        this.otherTextList,
        "scene-object",
        this.docKey
      );
    }

    this.isProcessed = true;
    await this.close();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value !== this.windowInfo.key) return;
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.rollback();
    }
  }

  @VueEvent
  private async rollback() {
    try {
      await this.cc!.releaseTouch([this.docKey]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
  }
}
