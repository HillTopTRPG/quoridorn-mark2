<template>
  <div
    id="other-text-frame"
    @mouseover="onMouseOver"
    @mouseleave="onMouseOut"
    @wheel.stop
    ref="elm"
  >
    <div class="title" v-if="otherTextViewInfo.title">
      {{ otherTextViewInfo.title }}
    </div>
    <other-text-component
      v-if="useMemoList.length"
      :value="useMemoList"
      :docType="docType"
      :docKey="docKey"
      :windowKey="windowKey"
      @inputTextArea="inputTextArea"
      :is-raw-text="otherTextViewInfo.isRawText"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { MemoStore, SceneObjectStore } from "@/@types/store-data";
import {
  createPoint,
  createRectangle,
  createSize
} from "@/app/core/utility/CoordinateUtility";
import ComponentVue from "@/app/core/window/ComponentVue";
import OtherTextComponent from "@/app/basic/other-text/OtherTextComponent.vue";
import { MouseMoveParam } from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import CssManager from "@/app/core/css/CssManager";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { Task, TaskResult } from "task";
import {
  OtherTextViewInfo,
  Point,
  Rectangle,
  Size
} from "@/@types/store-data-optional";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { OtherTextUpdateInfo } from "task-info";
import { warningDialog } from "@/app/core/utility/Utility";
import { getTrpgSystemHelper } from "@/app/core/utility/trpg_system/TrpgSystemFasade";

@Component({ components: { OtherTextComponent } })
export default class OtherTextFrame extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Object, default: null })
  private otherTextViewInfo!: OtherTextViewInfo;

  private static DEFAULT_FONT_SIZE = 14;

  private useMemoList: Partial<StoreData<MemoStore>>[] = [];
  private docKey: string | null = null;
  private docType: string | null = null;
  private isMounted: boolean = false;

  private isHover: boolean = false;
  private isHoverCover: boolean = false;
  private isChanged: boolean = false;

  private wheel = 0;
  private translateX = 0;
  private translateY = 0;

  private maxSize: Size = createSize(0, 0);

  private fontSize = OtherTextFrame.DEFAULT_FONT_SIZE;

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.wheel = CssManager.instance.propMap.wheel;
  }

  @TaskProcessor("action-wheel-finished")
  private async actionWheelFinished(): Promise<TaskResult<never> | void> {
    if (this.otherTextViewInfo.isFix) return;
    setTimeout(() => {
      this.wheel = CssManager.instance.propMap.wheel;
      this.elm.style.transform = `translate(${this.translateX}px, ${this.translateY}px) translateZ(${this.wheel}px)`;
    });
  }

  @Watch("isMounted")
  @Watch("otherTextViewInfo", { deep: true })
  private onChangeInfo() {
    const ws = createSize(window.innerWidth, window.innerHeight);

    this.useMemoList = this.otherTextViewInfo.dataList;
    if (!this.isMounted) return;
    const gridSize = CssManager.instance.propMap.gridSize;
    const info = this.otherTextViewInfo;
    const x = info.rect.x;
    const y = info.rect.y;

    const marginColumns = CssManager.instance.propMap.marginColumn;
    const marginRows = CssManager.instance.propMap.marginRow;
    const totalLeftX = CssManager.instance.propMap.totalLeftX;
    const totalLeftY = CssManager.instance.propMap.totalLeftY;
    const marginBorderWidth = CssManager.instance.propMap.marginBorderWidth;

    const mapPoint = createPoint(
      totalLeftX + marginBorderWidth,
      totalLeftY + marginBorderWidth
    );

    const translateZ = info.isFix ? 0 : this.wheel;

    this.translateX = x + info.rect.width - 3;
    this.translateY = y;
    if (!info.isFix) {
      this.translateX += marginColumns * gridSize + mapPoint.x;
      this.translateY += marginRows * gridSize + mapPoint.y;
    }
    this.maxSize.width = ws.width - this.translateX;
    this.maxSize.height = ws.height - this.translateY;
    this.elm.style.maxWidth = `auto`;
    this.elm.style.maxHeight = `auto`;
    this.elm.style.transform = `translate(${this.translateX}px, ${this.translateY}px) translateZ(${translateZ}px)`;
    this.fontSize = OtherTextFrame.DEFAULT_FONT_SIZE;
    this.elm.style.fontSize = `${this.fontSize}px`;

    setTimeout(() => {
      const rect = this.getRectangle();
      const ratioH = rect.height / ws.height;
      let fontSizeH = OtherTextFrame.DEFAULT_FONT_SIZE;
      let fontSizeW = OtherTextFrame.DEFAULT_FONT_SIZE;
      if (ratioH > 1) {
        fontSizeH = Math.floor(OtherTextFrame.DEFAULT_FONT_SIZE / ratioH);
      }
      if (rect.x + rect.width > ws.width) {
        const useSpace = Math.max(
          info.rect.x,
          ws.width - info.rect.x - info.rect.width
        );
        this.maxSize.width = useSpace;
        this.elm.style.maxWidth = `${this.maxSize.width}px`;
        const ratioW = rect.width / useSpace;
        if (ratioW > 1) {
          fontSizeW = Math.floor(OtherTextFrame.DEFAULT_FONT_SIZE / ratioW);
        }
      }
      this.fontSize = Math.min(this.fontSize, fontSizeH, fontSizeW);
      this.elm.style.fontSize = `${this.fontSize}px`;

      setTimeout(() => {
        const rect = this.getRectangle();
        if (rect.x + rect.width > ws.width) {
          if (rect.x - info.rect.width - rect.width > 0) {
            rect.x = rect.x - info.rect.width - rect.width;
          }
        }
        if (rect.y + rect.height > ws.height)
          rect.y = Math.max(ws.height - rect.height, 0);
        this.maxSize.width = ws.width - rect.x;
        this.maxSize.height = ws.height - rect.y;
        this.elm.style.maxWidth = `${this.maxSize.width}px`;
        this.elm.style.maxHeight = `${this.maxSize.height}px`;
        this.elm.style.transform = `translate(${rect.x}px, ${rect.y}px) translateZ(${translateZ}px)`;
      });
    });
  }

  private getRectangle(): Rectangle {
    const rect: any = this.elm.getBoundingClientRect();
    return createRectangle(rect.x, rect.y, rect.width, rect.height);
  }

  @Watch("useMemoList", { deep: true })
  private async onChangeUseMemoList() {
    if (this.docKey) {
      if (this.docKey !== this.otherTextViewInfo.key) {
        this.isChanged = true;
      } else {
        const type = this.otherTextViewInfo.type;
        const docKey = this.otherTextViewInfo.key;
        await GameObjectManager.instance.updateMemoList(
          this.useMemoList,
          type,
          docKey
        );
      }
    }
    this.docType = this.otherTextViewInfo.type;
    this.docKey = this.otherTextViewInfo.key;
  }

  private get elm(): HTMLElement {
    return this.$refs.elm as HTMLElement;
  }

  @VueEvent
  private onMouseOver() {
    this.isHover = true;
  }

  private inputTextAreaTimeoutKey: number | null = null;

  @VueEvent
  private inputTextArea() {
    this.isHoverCover = true;
    if (this.inputTextAreaTimeoutKey !== null) {
      clearTimeout(this.inputTextAreaTimeoutKey);
    }
    this.inputTextAreaTimeoutKey = window.setTimeout(() => {
      this.isHoverCover = false;
    }, 50);
  }

  @VueEvent
  private onMouseOut() {
    if (!this.isHoverCover) this.isHover = false;
    if (!this.isHover) this.$emit("hide");
  }

  @TaskProcessor("other-text-hide-finished")
  private async otherTextHide(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    setTimeout(() => {
      if (!this.isHover && !this.isChanged) this.$emit("hide");
      this.isChanged = false;
    });
    task.resolve();
  }

  @TaskProcessor("mouse-moving-finished")
  private async mouseLeftUpFinished(
    _task: Task<Point, never>,
    param: MouseMoveParam
  ): Promise<TaskResult<never> | void> {
    if (!param || param.key !== this.otherTextViewInfo.key) return;
    this.$emit("hide");
  }

  @TaskProcessor("other-text-update-finished")
  private async otherTextUpdateFinished(
    task: Task<OtherTextUpdateInfo, never>
  ): Promise<TaskResult<never> | void> {
    const docKey = task.value!.docKey;
    const targetTabKey = task.value!.target;
    const updateInfo = task.value!.updateInfo;

    const sceneObjectData: StoreData<SceneObjectStore> = (await SocketFacade.instance
      .sceneObjectCC()
      .findSingle("key", docKey))!.data!;

    const url = sceneObjectData.data!.url;
    if (!url) return;

    const helper = await getTrpgSystemHelper(url);
    if (!helper) {
      return await warningDialog({
        title: "外部参照URLがキャラシのURLではありません。",
        text: ""
      });
    }
    if (!helper.isSupportedOtherText) {
      return await warningDialog({
        title: "このシステムはその他欄の生成に対応していません。",
        text: ""
      });
    }

    const memoList = await helper.createOtherText(this.useMemoList, updateInfo);
    if (!memoList) return;

    // 対象タブが指定されていたら、そのタブだけ更新
    if (targetTabKey) {
      const targetData = this.useMemoList.find(d => d.key === targetTabKey);
      if (targetData) {
        const otherTextData = memoList.find(
          otd => otd.data!.tab === targetData.data!.tab
        );
        if (otherTextData) {
          targetData.data!.text = otherTextData.data!.text;
        }
      }
      return;
    }

    // タブ名が重複するものは上書き、そうでないものは追加
    memoList.forEach(otd => {
      const duplicateList = this.useMemoList.filter(
        m => m.data!.tab === otd.data!.tab
      );
      if (!duplicateList.length) {
        // 重複が無かったらそのまま追加
        this.useMemoList.push(otd);
      } else {
        // 重複があったら、タイプがURLだったら更新
        if (otd.data!.type === "url") {
          const duplicate = duplicateList.find(d => d.data!.type === "url");
          if (duplicate) {
            duplicate.data!.text = otd.data!.text;
          } else {
            this.useMemoList.push(otd);
          }
        }
      }
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#other-text-frame {
  @include inline-flex-box(column, stretch, flex-start);
  position: fixed;
  background-color: white;
  overflow: auto;
  left: 0;
  top: 0;
  border: 2px solid gray;
  min-width: 10em;
  /* JavaScriptで設定されるプロパティ
  transform
  */
}

.title {
  @include flex-box(row, center, center);
  white-space: nowrap;
  font-weight: bold;
  font-size: 120%;
}
</style>
