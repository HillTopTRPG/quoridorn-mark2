<template>
  <div class="container" ref="window-container">
    <!-- 内容 -->
    <table class="info-table">
      <tr>
        <tr-string-input-component
          labelName="label.name"
          width="100%"
          v-model="name"
        />
      </tr>
      <tr>
        <tr-scene-layer-select-component
          labelName="label.layer"
          v-model="layerKey"
        />
      </tr>
      <tr>
        <tr-card-deck-layout-select-component
          labelName="label.layout"
          v-model="layout"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.hand-card-area-width"
          inputWidth="5em"
          v-model="width"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.card-deck-columns"
          inputWidth="3em"
          v-model="columns"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.card-deck-rows"
          inputWidth="3em"
          v-model="rows"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.card-width-ratio"
          inputWidth="3em"
          v-model="cardWidthRatio"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.card-height-ratio"
          inputWidth="3em"
          v-model="cardHeightRatio"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.card-layout-columns"
          inputWidth="3em"
          v-model="layoutColumns"
          :min="1"
        />
      </tr>
      <tr>
        <tr-number-input-component
          labelName="card-deck-small-edit-window.label.card-layout-rows"
          inputWidth="3em"
          v-model="layoutRows"
          :min="1"
        />
      </tr>
      <tr>
        <tr-checkbox-component
          labelName="card-deck-small-edit-window.label.hover-view"
          :readonly="false"
          :cLabel="$t('label.exist')"
          :nLabel="$t('label.not-exist')"
          v-model="isUseHoverView"
        />
      </tr>
    </table>

    <button-area
      :is-commit-able="isCommitAble()"
      commit-text="modify"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { CardDeckLayout } from "@/@types/store-data-optional";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import TrSceneLayerSelectComponent from "@/app/basic/common/components/table-item/TrSceneLayerSelectComponent.vue";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import TrCardDeckLayoutSelectComponent from "@/app/basic/common/components/table-item/TrCardDeckLayoutSelectComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { CardDeckSmallStore } from "@/@types/store-data";
import EditWindowDelegator, {
  EditWindow
} from "@/app/core/window/EditWindowDelegator";

@Component({
  components: {
    ButtonArea,
    TrCheckboxComponent,
    TrCardDeckLayoutSelectComponent,
    TrSceneLayerSelectComponent,
    TrStringInputComponent,
    TrNumberInputComponent
  }
})
export default class CardDeckSmallEditWindow
  extends Mixins<WindowVue<DataReference, never>>(WindowVue)
  implements EditWindow<CardDeckSmallStore> {
  private editWindowDelegator = new EditWindowDelegator<CardDeckSmallStore>(
    this
  );

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
  private layerKey: string = ""; // 配置するシーンレイヤー
  private isUseHoverView: boolean = true;

  @LifeCycle
  public async mounted() {
    await this.editWindowDelegator.init();
    this.inputEnter("input:not([type='button'])", this.commit);
  }

  public isCommitAble(): boolean {
    return true;
  }

  @VueEvent
  private async commit() {
    await this.editWindowDelegator.commit();
  }

  @TaskProcessor("window-close-closing")
  private async windowCloseClosing2(
    task: Task<string, never>
  ): Promise<TaskResult<never> | void> {
    return await this.editWindowDelegator.windowCloseClosing(task);
  }

  @VueEvent
  private async rollback() {
    await this.editWindowDelegator.rollback();
  }

  public pullStoreData(data: StoreData<CardDeckSmallStore>): void {
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
    this.layerKey = data.data!.layerKey;
    this.isUseHoverView = data.data!.isUseHoverView;
  }

  public async pushStoreData(
    data: StoreData<CardDeckSmallStore>
  ): Promise<void> {
    data.data!.name = this.name;
    data.data!.layout = this.layout;
    data.data!.width = this.width;
    data.data!.rows = this.rows;
    data.data!.columns = this.columns;
    data.data!.tileReorderingMode = this.tileReorderingMode;
    data.data!.cardWidthRatio = this.cardWidthRatio;
    data.data!.cardHeightRatio = this.cardHeightRatio;
    data.data!.layoutRows = this.layoutRows;
    data.data!.layoutColumns = this.layoutColumns;
    data.data!.layerKey = this.layerKey;
    data.data!.isUseHoverView = this.isUseHoverView;
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
