<template>
  <div class="container" ref="window-container">
    <!-- 内容 -->
    <table class="info-table">
      <tr>
        <tr-string-input-component
          labelName="name"
          width="100%"
          v-model="name"
        />
      </tr>
      <tr>
        <tr-scene-layer-select-component labelName="layer" v-model="layerId" />
      </tr>
      <tr>
        <tr-card-deck-layout-select-component
          labelName="layout"
          v-model="layout"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="hand-card-area-width"
          inputWidth="5em"
          v-model="width"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-columns"
          inputWidth="3em"
          v-model="columns"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-rows"
          inputWidth="3em"
          v-model="rows"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-width-ratio"
          inputWidth="3em"
          v-model="cardWidthRatio"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-height-ratio"
          inputWidth="3em"
          v-model="cardHeightRatio"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-layout-columns"
          inputWidth="3em"
          v-model="layoutColumns"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-layout-rows"
          inputWidth="3em"
          v-model="layoutRows"
          :min="1"
        />
      </tr>
      <tr>
        <tr-checkbox-component
          labelName="hover-view"
          :readonly="false"
          :cLabel="$t('label.exist')"
          :nLabel="$t('label.not-exist')"
          v-model="isUseHoverView"
        />
      </tr>
    </table>

    <div class="button-area">
      <ctrl-button @click="commit()">
        <span v-t="'button.modify'"></span>
      </ctrl-button>
      <ctrl-button @click="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { DataReference } from "@/@types/data";
import { Task, TaskResult } from "task";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import VueEvent from "@/app/core/decorator/VueEvent";
import TrNumberInputComponent from "@/app/basic/common/components/TrNumberInputComponent.vue";
import TrStringInputComponent from "@/app/basic/common/components/TrStringInputComponent.vue";
import TrSceneLayerSelectComponent from "@/app/basic/common/components/TrSceneLayerSelectComponent.vue";
import TrCardDeckLayoutSelectComponent from "@/app/basic/common/components/TrCardDeckLayoutSelectComponent.vue";
import { CardDeckLayout } from "@/@types/gameObject";
import TrCheckboxComponent from "@/app/basic/common/components/TrCheckboxComponent.vue";

@Component({
  components: {
    TrCheckboxComponent,
    TrCardDeckLayoutSelectComponent,
    TrSceneLayerSelectComponent,
    TrStringInputComponent,
    TrNumberInputComponent,
    CtrlButton
  }
})
export default class CardDeckSmallEditWindow extends Mixins<
  WindowVue<DataReference, never>
>(WindowVue) {
  private docId: string = "";
  private cardDeckSmallCC = SocketFacade.instance.cardDeckSmallCC();
  private isMounted: boolean = false;
  private isProcessed: boolean = false;

  private name: string = "";
  private layout: CardDeckLayout = "pile-up";
  private width: number = 20; // 手札の表示幅
  private rows: number = 1; // フィールドの設置高さ
  private columns: number = 1; // フィールドの設置幅
  private tileReorderingMode: "substitute" | "insert" = "substitute"; // タイルの並べ替え方式(substitute: 置換, insert: 挿入)
  private cardWidthRatio: number = 1; // 置き場の大きさに収まるカードの枚数（幅）
  private cardHeightRatio: number = 1; // 置き場の大きさに収まるカードの枚数（高さ）
  private layoutRows: number = 1; // 置き場に対して何行使ってカードを配置するか
  private layoutColumns: number = 1; // 置き場に対して何列使ってカードを配置するか
  private layerId: string = ""; // 配置するシーンレイヤー
  private isUseHoverView: boolean = true;

  @LifeCycle
  public async mounted() {
    await this.init();
    this.docId = this.windowInfo.args!.docId;
    const data = (await this.cardDeckSmallCC!.getData(this.docId))!;

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

    this.name = data.data!.name;
    this.layout = data.data!.layout;
    this.width = data.data!.width;
    this.rows = data.data!.rows;
    this.columns = data.data!.columns;
    this.tileReorderingMode = data.data!.tileReorderingMode;
    this.cardWidthRatio = data.data!.cardWidthRatio;
    this.cardHeightRatio = data.data!.cardHeightRatio;
    this.layoutRows = data.data!.layoutRows;
    this.layoutColumns = data.data!.layoutColumns;
    this.layerId = data.data!.layerId;
    this.isUseHoverView = data.data!.isUseHoverView;

    if (this.windowInfo.status === "window") {
      try {
        await this.cardDeckSmallCC.touchModify([this.docId]);
      } catch (err) {
        window.console.warn(err);
        this.isProcessed = true;
        await this.close();
      }
    }
    this.isMounted = true;
  }

  @VueEvent
  private async commit() {
    const data = (await this.cardDeckSmallCC!.getData(this.docId))!.data!;
    data.name = this.name;
    data.layout = this.layout;
    data.width = this.width;
    data.rows = this.rows;
    data.columns = this.columns;
    data.tileReorderingMode = this.tileReorderingMode;
    data.cardWidthRatio = this.cardWidthRatio;
    data.cardHeightRatio = this.cardHeightRatio;
    data.layoutRows = this.layoutRows;
    data.layoutColumns = this.layoutColumns;
    data.layerId = this.layerId;
    data.isUseHoverView = this.isUseHoverView;
    await this.cardDeckSmallCC!.update([this.docId], [data]);
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
      await this.cardDeckSmallCC!.releaseTouch([this.docId]);
    } catch (err) {
      // nothing
    }
    if (!this.isProcessed) {
      this.isProcessed = true;
      await this.close();
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  width: 100%;
  height: 100%;
}
</style>
