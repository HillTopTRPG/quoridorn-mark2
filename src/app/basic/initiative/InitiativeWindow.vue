<template>
  <div ref="window-container">
    <div class="button-area space-between margin-bottom">
      <ctrl-button @click="openResourceMasterListWindow">
        <span v-t="'resource-master-list-window.window-title'"></span>
      </ctrl-button>
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
      v-model="selectedTargetId"
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
              :dataObj="data"
              @inputCell="inputCell"
            />
          </template>
          <template v-else-if="colDec.type === 'select'">
            <selection-value-select
              :id="`prop-${data.owner}-${colDec.target}`"
              :value="data.data[colDec.target].value"
              :selection="data.data[colDec.target].selection"
              @input="
                inputCell(
                  data,
                  colDec.target,
                  `prop-${data.owner}-${colDec.target}`
                )
              "
            />
          </template>
          <label v-else-if="colDec.type === 'combo'">
            <input
              :id="`prop-${data.owner}-${colDec.target}`"
              type="text"
              :value="data.data[colDec.target].value"
              :list="data.data[colDec.target].elmId"
              @input="
                inputCell(
                  data,
                  colDec.target,
                  `prop-${data.owner}-${colDec.target}`
                )
              "
            />
          </label>
          <label v-else>
            {{ (__staticValue = getStaticValue(colDec, data, "-")) && null }}
            <input
              type="color"
              v-if="isColorText(__staticValue)"
              :value="__staticValue"
              disabled="disabled"
            />
            <span v-else>
              {{ __staticValue }}
            </span>
          </label>
        </keep-alive>
      </template>
    </table-component>

    <datalist
      v-for="selectionInfo in selectionInfoList"
      :key="selectionInfo.elmId"
      :id="selectionInfo.elmId"
    >
      <option
        v-for="option in selectionInfo.optionList"
        :key="option"
        :value="option"
      ></option>
    </datalist>

    <div class="button-area">
      <ctrl-button @click="changeSettings">
        <span v-t="'button.setting'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import InitiativeInputComponent from "./InitiativeInputComponent.vue";
import LifeCycle from "../../core/decorator/LifeCycle";
import TaskProcessor from "../../core/task/TaskProcessor";
import {
  convertNumberNull,
  listToEmpty
} from "../../core/utility/PrimaryDataUtility";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import TableComponent from "../../core/component/table/TableComponent.vue";
import { WindowResizeInfo, WindowTableColumn } from "../../../@types/window";
import VueEvent from "../../core/decorator/VueEvent";
import { StoreUseData } from "../../../@types/store";
import WindowVue from "../../core/window/WindowVue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import GameObjectManager from "../GameObjectManager";
import LanguageManager from "../../../LanguageManager";
import { CutInDeclareInfo, UserData } from "../../../@types/room";
import { DataReference } from "../../../@types/data";
import {
  ActorStore,
  RefProperty,
  SceneObject
} from "../../../@types/gameObject";
import {
  findRequireById,
  findRequireByOwner
} from "../../core/utility/Utility";
import { parseColor } from "../../core/utility/ColorUtility";
import App from "../../../views/App.vue";
import SelectionValueSelect from "../common/components/select/SelectionValueSelect.vue";

const uuid = require("uuid");

@Component({
  components: {
    SelectionValueSelect,
    InitiativeInputComponent,
    TableComponent,
    CtrlButton
  }
})
export default class InitiativeWindow extends Mixins<WindowVue<number, never>>(
  WindowVue
) {
  private selectedTargetId: string | null = null;
  private userList = GameObjectManager.instance.userList;
  private actorList = GameObjectManager.instance.actorList;
  private actorStatusList = GameObjectManager.instance.actorStatusList;
  private sceneLayerList = GameObjectManager.instance.sceneLayerList;
  private sceneObjectList = GameObjectManager.instance.sceneObjectList;
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
  private async openResourceMasterListWindow() {
    await App.openSimpleWindow("resource-master-list-window");
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

  @VueEvent
  private isColorText(text: string | null): boolean {
    if (!text) return false;
    try {
      parseColor(text);
      return true;
    } catch (err) {
      return false;
    }
  }

  @VueEvent
  private getStaticValue(
    colDec: WindowTableColumn,
    data: any,
    nullText: string = "-"
  ): string {
    const type = colDec.type;
    const target = colDec.target;

    const resourceMaster = this.resourceMasterList.filter(
      rm => rm.data!.label === target
    )[0];

    if (!resourceMaster)
      return data.data![target] === null ? nullText : data.data![target];
    const refProperty = resourceMaster.data!.refProperty;

    const getPropValue = (
      resourceType: "ref-normal" | "ref-owner",
      dataType: "scene-object" | "actor",
      refProperty: string,
      sceneObject: StoreUseData<SceneObject> | null,
      actor: StoreUseData<ActorStore>
    ): string => {
      const owner = findRequireById(
        this.userList,
        dataType === "scene-object" ? sceneObject!.owner : actor.owner
      );

      actor =
        resourceType === "ref-normal"
          ? actor
          : this.actorList.filter(
              a => a.owner === owner.id && a.data!.type === "user"
            )[0];

      const status = this.actorStatusList.filter(
        as => as.id === actor.data!.statusId
      )[0];

      const layer = sceneObject
        ? this.sceneLayerList.filter(
            sl => sl.id === sceneObject.data!.layerId
          )[0]
        : null;

      let base: StoreUseData<SceneObject | ActorStore | UserData> = owner;
      let isBaseActor: boolean = false;
      if (resourceType !== "ref-owner") {
        if (dataType === "actor") {
          base = actor;
          isBaseActor = true;
        } else {
          base = sceneObject!;
        }
      }

      const getTypeStr = (
        isActor: boolean,
        d: StoreUseData<SceneObject | ActorStore | UserData>
      ): string => {
        const typeText = this.$t(`type.${d.data!.type}`)!.toString();
        if (!isActor) return typeText;
        const actorText = this.$t(`type.actor`)!.toString();
        return `${actorText}(${typeText})`;
      };

      switch (refProperty) {
        case "name":
          return base.data!.name;
        case "type":
          return getTypeStr(isBaseActor, base);
        case "tag":
          return (base.data! as any).tag === undefined
            ? nullText
            : (base.data! as any).tag;
        case "actor-name":
          return actor.data!.name;
        case "actor-type":
          return getTypeStr(true, actor);
        case "actor-tag":
          return actor.data!.tag;
        case "owner-name":
          return owner.data!.name;
        case "owner-type":
          return owner.data!.type;
        case "object-layer": {
          if (!layer) return nullText;
          if (!layer.data!.isSystem) return layer.data!.name!;
          return this.$t(`type.${layer.data!.type}`)!.toString();
        }
        case "actor-status-name":
          return status.data!.name;
        case "actor-chat-text-color": {
          let cActor: StoreUseData<ActorStore> = actor;
          if (cActor.data!["chatFontColorType"] !== "original") {
            const cActorOwner = findRequireById(this.userList, cActor.owner);
            cActor = findRequireByOwner(this.actorList, cActorOwner.id);
          }
          return cActor!.data!["chatFontColor"];
        }
        case "actor-stand-image-position":
          return actor.data!.standImagePosition.toString(10);
        default:
          return nullText;
      }
    };

    let sceneObject: StoreUseData<SceneObject> | null = null;
    let actorId: string = data.owner;
    if (data.ownerType === "scene-object") {
      sceneObject = this.sceneObjectList.filter(so => so.id === data.owner)[0];
      actorId = sceneObject.data!.actorId!;
    }
    const actor = this.actorList.filter(a => a.id === actorId)[0];

    if (type === "ref-normal" || type === "ref-owner") {
      return getPropValue(
        type as "ref-normal" | "ref-owner",
        data.ownerType,
        refProperty as RefProperty,
        sceneObject,
        actor
      );
    }
    return data.data[target];
  }

  /**
   * イニシアティブ表で表示する行（データ持ちコマorアクターのリスト）
   */
  private get dataOwnerList(): DataReference[] {
    try {
      type SortableTargetInfo = {
        type: "scene-object" | "actor";
        userId: string;
        userOrder: number;
        actorId: string;
        actorOrder: number;
        sceneObjectId: string | null;
        sceneObjectOrder: number | null;
        actorName: string;
        initiative: number | null;
      };
      const sortableTargetInfoList: SortableTargetInfo[] = [];

      this.resourceList.forEach(r => {
        const resourceMaster = this.resourceMasterList.filter(
          rm => rm.id === r.data!.masterId
        )[0];

        // actorの時の値で初期化
        let sceneObjectId: string | null = null;
        let sceneObjectOrder: number | null = null;

        let actorId: string = r.owner!;

        let userId: string = "";

        const initiative: number | null =
          resourceMaster.data!.systemColumnType === "initiative"
            ? convertNumberNull(r.data!.value)
            : null;

        if (r.ownerType === "actor") {
          actorId = r.owner!;
        } else {
          sceneObjectId = r.owner;
          const sceneObject = findRequireById(
            this.sceneObjectList,
            sceneObjectId
          );
          sceneObjectOrder = sceneObject.order;
          actorId = sceneObject.data!.actorId!;
          userId = sceneObject.owner!;
        }
        const actor = findRequireById(this.actorList, actorId);
        const actorOrder = actor.order;
        const actorName = actor.data!.name;
        if (r.ownerType === "actor") {
          userId = actor.owner!;
        }

        const user = this.userList.filter(u => u.id === userId)[0];
        const userOrder = user.order;

        let sortableTargetInfo = sortableTargetInfoList.filter(
          sti => sti.sceneObjectId === sceneObjectId && sti.actorId === actorId
        )[0];
        if (!sortableTargetInfo) {
          sortableTargetInfo = {
            type: r.ownerType === "actor" ? "actor" : "scene-object",
            userId,
            userOrder,
            actorId,
            actorOrder,
            sceneObjectId,
            sceneObjectOrder,
            initiative,
            actorName
          };
          sortableTargetInfoList.push(sortableTargetInfo);
        } else {
          if (initiative !== null) {
            if (
              sortableTargetInfo.initiative === null ||
              sortableTargetInfo.initiative > initiative
            ) {
              sortableTargetInfo.initiative = initiative;
            }
          }
        }
      });

      // console.log(JSON.stringify(sortableTargetInfoList, null, "  "));

      return sortableTargetInfoList
        .sort((sti1, sti2) => {
          if (sti1.initiative !== null && sti2.initiative !== null) {
            // イニシアティブ値が null でないのが2つ
            if (sti1.initiative < sti2.initiative) return -1;
            if (sti1.initiative > sti2.initiative) return 1;
          } else if (sti1.initiative !== null || sti2.initiative !== null) {
            // イニシアティブ値が null でないのが1つ
            // nullは下の方へ
            if (sti1.initiative === null) return 1;
            if (sti2.initiative === null) return -1;
          }
          // イニシアティブ値が同値
          if (sti1.userOrder < sti2.userOrder) return -1;
          if (sti1.userOrder > sti2.userOrder) return 1;
          if (sti1.actorOrder < sti2.actorOrder) return -1;
          if (sti1.actorOrder > sti2.actorOrder) return 1;
          if (
            sti1.sceneObjectOrder !== null &&
            sti2.sceneObjectOrder !== null
          ) {
            if (sti1.sceneObjectOrder < sti2.sceneObjectOrder) return -1;
            if (sti1.sceneObjectOrder > sti2.sceneObjectOrder) return 1;
          } else if (
            sti1.sceneObjectOrder !== null ||
            sti2.sceneObjectOrder !== null
          ) {
            if (sti1.sceneObjectOrder === null) return 1;
            if (sti2.sceneObjectOrder === null) return -1;
          }
          return 0;
        })
        .map(sti => ({
          type: sti.type === "actor" ? "actor" : "scene-object",
          docId: sti.type === "actor" ? sti.actorId : sti.sceneObjectId!
        }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  @VueEvent
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
          const type = obj.resourceMaster.data!.type;
          if (type === "select" || type === "combo") {
            resultData.data[obj.resourceMaster.data!.label] = {
              value: obj.resource ? obj.resource.data!.value : null,
              selection: obj.resourceMaster.data!.selectionStr,
              elmId: `${this.windowInfo.key}-selection-list-${obj.resourceMaster.id}`
            };
          } else {
            resultData.data[obj.resourceMaster.data!.label] = obj.resource
              ? obj.resource.data!.value
              : null;
          }
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
    const newValue =
      elm.type === "checkbox" ? elm.checked.toString() : elm.value;

    console.log(target, elm.type, newValue);

    this.inputtingElmId = elmId;

    const resourceMaster = this.resourceMasterList.filter(
      rm => rm.data!.label === target
    )[0];
    if (!resourceMaster) {
      console.error(`Not found resource(${target}).`);
      return;
    }

    const resource = this.resourceList.filter(
      r =>
        r.data!.masterId === resourceMaster.id &&
        r.ownerType === data.ownerType &&
        r.owner === data.owner
    )[0];
    resource.data!.value = newValue;
    await SocketFacade.instance
      .resourceCC()
      .updatePackage([resource.id!], [resource.data!]);
  }

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

  @VueEvent
  private get selectionInfoList(): { elmId: string; optionList: string[] }[] {
    return this.initiativeColumnList
      .map(
        ic =>
          this.resourceMasterList.filter(
            rm => rm.id === ic.data!.resourceMasterId
          )[0]
      )
      .filter(rm => rm.data!.type === "select" || rm.data!.type === "combo")
      .map(rm => ({
        elmId: `${this.windowInfo.key}-selection-list-${rm.id}`,
        optionList: rm
          .data!.selectionStr!.split(",")
          .map(s => s.trim())
          .filter((s, idx, self) => self.indexOf(s) === idx)
      }));
  }

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
    // console.log(JSON.stringify(this.initiativeColumnList, null, "  "));
    // console.log(JSON.stringify(columnList, null, "  "));
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
    console.log("changeSettings");
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
          `"${this.$t("label.editing")}(${name})"`
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
