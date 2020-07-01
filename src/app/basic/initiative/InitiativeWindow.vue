<template>
  <div ref="window-container">
    <div class="button-area space-between margin-bottom">
      <!--
      <ctrl-button @click="preview" :disabled="!selectedCutInId">
        <span v-t="'button.preview'"></span>
      </ctrl-button>
      -->
    </div>

    <table-component
      class="table-component"
      :windowInfo="windowInfo"
      :tableIndex="0"
      :status="status"
      :dataList="initiativeDataList"
      :isUseHeaderI18n="false"
      keyProp="id"
      :rowClassGetter="getRowClasses"
      v-model="selectedCutInId"
      @adjustWidth="adjustWidth"
    >
      <template #header="{ colDec }">
        {{ colDec.target }}
      </template>
      <template #contents="{ colDec, data }">
        <keep-alive>
          <template v-if="data.data[colDec.target] === null">
            <span class="none">-</span>
          </template>
          <template v-else-if="getInputType(colDec.type)">
            <initiative-input-component
              :inputType="getInputType(colDec.type)"
              :colDec="colDec"
              :data="data"
              @inputCell="inputCell"
            />
          </template>
          <template v-else>
            {{ data.data[colDec.target] }}
          </template>
        </keep-alive>
      </template>
    </table-component>

    <div class="button-area">
      <ctrl-button @click="changeSettings">
        <span v-t="'button.setting'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import BgmManager from "@/app/basic/cut-in/bgm/BgmManager";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Mixins } from "vue-mixin-decorator";
import { StoreUseData } from "@/@types/store";
import { CutInDeclareInfo } from "@/@types/room";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { WindowResizeInfo, WindowTableColumn } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { Task, TaskResult } from "task";
import LanguageManager from "@/LanguageManager";
import {
  convertNumberNull,
  listToEmpty
} from "@/app/core/utility/PrimaryDataUtility";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { DataReference } from "@/@types/data";
import InitiativeInputComponent from "@/app/basic/initiative/InitiativeInputComponent.vue";

const uuid = require("uuid");

@Component({
  components: { InitiativeInputComponent, TableComponent, CtrlButton },
  filters: {
    icon: (data: StoreUseData<CutInDeclareInfo>) => {
      if (!data.data!.url) return "icon-stop2";
      if (BgmManager.isYoutube(data.data!)) return "icon-youtube2";
      if (BgmManager.isDropbox(data.data!)) return "icon-dropbox";
      return "icon-file-music";
    },
    time: (data: StoreUseData<CutInDeclareInfo>) => {
      if (!data.data!.url) return "-";
      if (data.data!.start && data.data!.end)
        return `${data.data!.start}〜${data.data!.end}`;
      if (data.data!.start) return `${data.data!.start}〜`;
      if (data.data!.end) return `〜${data.data!.end}`;
      return "All";
    },
    isRepeat: (data: StoreUseData<CutInDeclareInfo>) =>
      data.data!.url && data.data!.isRepeat ? "" : "-",
    volume: (data: StoreUseData<CutInDeclareInfo>) =>
      data.data!.url ? data.data!.volume : "-",
    fade: (data: StoreUseData<CutInDeclareInfo>) => {
      if (!data.data!.url) return "-";
      if (data.data!.fadeIn > 0 && data.data!.fadeOut > 0) return "in/out";
      if (data.data!.fadeIn > 0 && data.data!.fadeOut === 0) return "in";
      if (data.data!.fadeIn === 0 && data.data!.fadeOut > 0) return "out";
      return "-";
    }
  }
})
export default class InitiativeWindow extends Mixins<WindowVue<number, never>>(
  WindowVue
) {
  private selectedCutInId: string | null = null;
  private propertyList = GameObjectManager.instance.propertyList;
  private actorList = GameObjectManager.instance.actorList;
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
  private propertyCC = SocketFacade.instance.propertyCC();
  private fontSize: number = 12;
  private inputtingElmId: string | null = null;
  private updateDbCounter: number = 0;

  private initiativeColumnList =
    GameObjectManager.instance.initiativeColumnList;
  private resourceMasterList = GameObjectManager.instance.resourceMasterList;
  private resourceList = GameObjectManager.instance.resourceList;

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private getInputType(colDecType: string): string | null {
    switch (colDecType) {
      case "input-text":
        return "text";
      case "number":
        return "number";
      case "check":
        return "checkbox";
      case "color":
        return "color";
      default:
        return null;
    }
  }

  /**
   * イニシアティブ表で表示する行（データ持ちコマorアクターのリスト）
   */
  private get dataOwnerList(): DataReference[] {
    const getOwnerActor = (owner: string, ownerType: string) => {
      let actorId = owner;
      if (ownerType !== "actor") {
        const obj = this.sceneObjectList.filter(so => so.id === owner)[0];
        actorId = obj.data!.actorId!;
      }
      return this.actorList.filter(a => a.id === actorId)[0];
    };

    const getRef = (owner: string, ownerType: string) => {
      if (ownerType !== "actor") {
        return this.sceneObjectList.filter(so => so.id === owner)[0];
      }
      return this.actorList.filter(a => a.id === owner)[0];
    };

    const initiativeResourceMasterId: string = this.resourceMasterList.filter(
      rm => rm.data!.isInitiative
    )[0]!.id!;

    return this.resourceList
      .filter(r => r.data!.masterId === initiativeResourceMasterId)
      .sort((r1, r2) => {
        const r1Val = convertNumberNull(r1.data!.value);
        const r2Val = convertNumberNull(r2.data!.value);

        // イニシアティブ値で比較できる場合は最優先
        if (r1Val !== null && r2Val !== null) {
          if (r1Val < r2Val) return -1;
          if (r1Val > r2Val) return 1;
        }

        // イニシアティブ値が片方だけ null の場合はnullを後ろへ
        if (r1Val === null) return 1;
        if (r2Val === null) return -1;

        // アクターツリーが異なる場合はアクターで並べ替え
        const r1Actor = getOwnerActor(r1.owner!, r1.ownerType!);
        const r2Actor = getOwnerActor(r2.owner!, r2.ownerType!);
        if (r1Actor.order < r2Actor.order) return -1;
        if (r1Actor.order > r2Actor.order) return 1;

        // イニシアティブ値もアクターツリーも同一の場合
        const r1Ref = getRef(r1.owner!, r1.ownerType!);
        const r2Ref = getRef(r2.owner!, r2.ownerType!);

        // アクターツリーの階層によって並び替え
        if (r1Ref.ownerType !== r2Ref.ownerType) {
          if (r1.ownerType === "actor") return -1;
          if (r2.ownerType === "actor") return 1;
        }

        // アクターツリーの同階層の場合はorderで並び替え
        if (r1Ref.order < r2Ref.order) return -1;
        if (r1Ref.order > r2Ref.order) return 1;

        return 0;
      })
      .map(r => ({
        type: r.ownerType!,
        docId: r.owner!
      }));
  }

  private get initiativeDataList(): StoreUseData<any>[] {
    const resultList: StoreUseData<any>[] = [];

    this.dataOwnerList.forEach((df, ind) => {
      const resultData: StoreUseData<any> = {
        id: uuid.v4(),
        ownerType: df.type,
        owner: df.docId,
        order: ind,
        exclusionOwner: null,
        lastExclusionOwner: null,
        permission: GameObjectManager.PERMISSION_DEFAULT,
        status: "added",
        createTime: new Date(),
        updateTime: null,
        data: {}
      };
      this.initiativeColumnList
        // 使用列一覧からリソースマスターに変換
        .map(
          ic =>
            this.resourceMasterList.filter(
              rm => rm.id === ic.data!.resourceMasterId
            )[0]
        )
        // リソースマスターからリソース一覧に変換
        .map(rm => ({
          resourceMaster: rm,
          resource: this.resourceList.filter(
            r =>
              r.data!.masterId === rm.id &&
              r.owner === df.docId &&
              r.ownerType === df.type
          )[0]
        }))
        .forEach(obj => {
          resultData.data[obj.resourceMaster.data!.label] = obj.resource
            ? obj.resource.data!.value
            : null;
        });
      resultList.push(resultData);
    });
    return resultList;
  }

  @Watch("initiativeDataList", { deep: true })
  private onChangeInitiativeList() {
    if (!this.inputtingElmId) return;

    if (!this.updateDbCounter) {
      this.updateDbCounter++;
      return;
    }

    setTimeout(() => {
      const inputtingElm = document.getElementById(this.inputtingElmId!);
      inputtingElm!.focus();
      this.inputtingElmId = null;
      this.updateDbCounter = 0;
    });
  }

  @VueEvent
  private async inputCell(data: any, target: string, elmId: string) {
    const elm: HTMLInputElement = document.getElementById(
      elmId
    ) as HTMLInputElement;
    const newValue = elm.value;

    this.inputtingElmId = elmId;
    // window.console.log(JSON.stringify(data, null, "  "));
    // window.console.log(target, newValue);

    const property = this.propertyList.filter(
      p => p.owner === data.owner && p.data!.label === target
    )[0];
    if (!property) {
      window.console.error(`${target}のプロパティがありません。`);
      return;
    }
    property.data!.value = newValue;
    await this.propertyCC.updatePackage([property.id!], [property.data!]);
  }

  // private get commonPropertyListAll(): StoreUseData<PropertyStore>[] {
  //   return this.propertyList.filter(p => !p.owner);
  // }
  //
  // @Watch("commonPropertyListAll", { immediate: true, deep: true })
  // private onChangeCommonPropertyListAll() {
  //   const columnList = this.windowInfo.declare.tableInfoList[0].columnList;
  //   const newColumnList: WindowTableColumn[] = [];
  //   this.commonPropertyListAll.forEach(cp => {
  //     const column: WindowTableColumn = columnList.filter(
  //       c => c.target === cp.data!.label
  //     )[0] || {
  //       width: 50,
  //       type: cp.data!.type,
  //       align: "center",
  //       target: cp.data!.label
  //     };
  //     const columnIndex = columnList.findIndex(
  //       c => c.target === cp.data!.label
  //     );
  //     if (columnIndex >= 0) {
  //       column.width = this.windowInfo.tableInfoList[0].columnWidthList[
  //         columnIndex
  //       ];
  //     }
  //     newColumnList.push(column);
  //   });
  //   listToEmpty(columnList);
  //   columnList.push(...newColumnList);
  //   this.windowInfo.tableInfoList[0].columnWidthList = columnList.map(
  //     c => c.width
  //   );
  // }

  /**
   * イニシアティブ表の列を自動更新する
   */
  @Watch("initiativeColumnList", { immediate: true, deep: true })
  @Watch("resourceMasterList", { deep: true })
  private onChangeInitiativeColumnList() {
    const columnList = this.windowInfo.declare.tableInfoList[0].columnList;
    const newColumnList: WindowTableColumn[] = [];
    this.initiativeColumnList
      .map(
        ic =>
          this.resourceMasterList.filter(
            rm => rm.id === ic.data!.resourceMasterId
          )[0]
      )
      .forEach(rm => {
        const column: WindowTableColumn = columnList.filter(
          c => c.target === rm.data!.label
        )[0] || {
          width: 50,
          type: rm.data!.type,
          align: "center",
          target: rm.data!.label
        };
        const columnIndex = columnList.findIndex(
          c => c.target === rm.data!.label
        );
        if (columnIndex >= 0) {
          column.width = this.windowInfo.tableInfoList[0].columnWidthList[
            columnIndex
          ];
        }
        newColumnList.push(column);
      });
    listToEmpty(columnList);
    columnList.push(...newColumnList);
    this.windowInfo.tableInfoList[0].columnWidthList = columnList.map(
      c => c.width
    );
  }

  // private get initiativeList(): StoreUseData<any>[] {
  //   const resultList: StoreUseData<any>[] = [];
  //   const dataList = this.propertyList.filter(p => p.owner);
  //   const ownerList = dataList
  //     .map(d => d.owner)
  //     .filter((d, i, self) => self.indexOf(d) === i);
  //
  //   ownerList.forEach((owner, ownerInd) => {
  //     const actor = this.actorList.filter(a => a.id === owner)[0];
  //     const resultData: StoreUseData<any> = {
  //       id: uuid.v4(),
  //       ownerType: "actor",
  //       owner: actor.id,
  //       order: ownerInd,
  //       exclusionOwner: null,
  //       lastExclusionOwner: null,
  //       permission: GameObjectManager.PERMISSION_DEFAULT,
  //       status: "added",
  //       createTime: new Date(),
  //       updateTime: null,
  //       data: {}
  //     };
  //     dataList
  //       .filter(d => d.owner === owner)
  //       .forEach(d => {
  //         resultData.data[d.data!.label] = d.data!.value;
  //       });
  //     resultList.push(resultData);
  //   });
  //   return resultList;
  // }

  @VueEvent
  private async changeSettings() {
    window.console.log("changeSettings");
  }

  @VueEvent
  private getRowClasses(
    data: StoreUseData<CutInDeclareInfo>,
    trElm: HTMLTableRowElement | null
  ): string[] {
    const classList: string[] = [];
    if (data.exclusionOwner) {
      classList.push("isEditing");
      const name = GameObjectManager.instance.getExclusionOwnerName(
        data.exclusionOwner
      );

      if (trElm) {
        trElm.style.setProperty(
          "--msg-locked",
          `"${LanguageManager.instance.getText("label.editing")}(${name})"`
        );
      }
    }
    return classList;
  }

  @Emit("adjustWidth")
  private adjustWidth(totalWidth: number) {
    if (this.windowInfo.declare.minSize)
      this.windowInfo.declare.minSize.widthPx = totalWidth;
    if (this.windowInfo.declare.maxSize)
      this.windowInfo.declare.maxSize.widthPx = totalWidth;
  }

  @TaskProcessor("window-font-size-finished")
  private async windowFontSizeFinished(
    task: Task<{ key: string; size: number }, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.key !== this.windowInfo.key) return;
    this.fontSize = task.value!.size;
  }

  @TaskProcessor("window-resize-finished")
  private async windowResizeFinished(
    task: Task<WindowResizeInfo, never>
  ): Promise<TaskResult<never> | void> {
    if (task.value!.key !== this.windowKey) return;
    const fontSize = this.fontSize;
    const heightPx = this.windowInfo.heightPx;
    const heightDiffPx = this.windowInfo.diffRect.height;
    const initHeightPx = this.windowInfo.declare.size.heightPx;
    let rowNum = (heightPx + heightDiffPx - initHeightPx) / (fontSize * 2);
    rowNum = Math.floor(rowNum) + 10;
    this.windowInfo.declare.tableInfoList[0].height = rowNum;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
