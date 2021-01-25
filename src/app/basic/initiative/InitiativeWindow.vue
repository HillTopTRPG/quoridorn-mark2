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
      keyProp="key"
      :rowClassGetter="getRowClasses"
      v-model="selectedTargetKey"
      @adjustWidth="adjustWidth"
    >
      <template #header="{ colDec }">
        {{ colDec.target }}
      </template>
      <template #contents="{ colDec, data }">
        <keep-alive>
          <template v-if="data.data[colDec.target] === undefined">
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
              :elmId="`prop-${data.owner}-${colDec.target}`"
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
          <template v-else-if="colDec.type === 'combo'">
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
          </template>
          <template v-else>
            {{ (__staticValue = getStaticValue(colDec, data, "-")) && null }}
            <input
              v-if="isColorText(__staticValue)"
              type="color"
              :value="__staticValue"
              disabled="disabled"
            />
            <template v-else>{{ __staticValue }}</template>
          </template>
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

    <!--
    <div class="button-area">
      <ctrl-button @click="changeSettings">
        <span v-t="'button.setting'"></span>
      </ctrl-button>
    </div>
    -->
  </div>
</template>

<script lang="ts">
import { Component, Emit, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { WindowResizeInfo, WindowTableColumn } from "@/@types/window";
import {
  ActorStore,
  SceneObjectStore,
  CutInStore,
  UserStore
} from "@/@types/store-data";
import { RefProperty } from "@/@types/store-data-optional";
import InitiativeInputComponent from "@/app/basic/initiative/InitiativeInputComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import App from "@/views/App.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import {
  findByKey,
  findRequireByKey,
  findRequireByOwner
} from "@/app/core/utility/Utility";
import {
  convertNumberNull,
  listToEmpty
} from "@/app/core/utility/PrimaryDataUtility";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { parseColor } from "@/app/core/utility/ColorUtility";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SelectionValueSelect from "@/app/basic/common/components/select/SelectionValueSelect.vue";

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
  private selectedTargetKey: string | null = null;
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

    const resourceMaster = this.resourceMasterList.find(
      rm => rm.data!.label === target
    );

    if (!resourceMaster)
      return data.data![target] === null ? nullText : data.data![target];
    const refProperty = resourceMaster.data!.refProperty;

    const getPropValue = (
      resourceType: "ref-normal" | "ref-owner",
      dataType: "scene-object-list" | "actor-list",
      refProperty: string,
      sceneObject: StoreData<SceneObjectStore> | null,
      actor: StoreData<ActorStore>
    ): string => {
      const owner = findRequireByKey(
        this.userList,
        dataType === "scene-object-list" ? sceneObject!.owner : actor.owner
      );

      const actorVolatile: StoreData<ActorStore> | undefined =
        resourceType === "ref-normal"
          ? actor
          : this.actorList.find(
              a => a.owner === owner.key && a.data!.type === "user"
            );

      if (!actorVolatile) return "";
      actor = actorVolatile;

      const status = findByKey(this.actorStatusList, actor.data!.statusKey);

      const layer = sceneObject
        ? findByKey(this.sceneLayerList, sceneObject.data!.layerKey)
        : null;

      let base: StoreData<SceneObjectStore | ActorStore | UserStore> = owner;
      let isBaseActor: boolean = false;
      if (resourceType !== "ref-owner") {
        if (dataType === "actor-list") {
          base = actor;
          isBaseActor = true;
        } else {
          base = sceneObject!;
        }
      }

      const getTypeStr = (
        isActor: boolean,
        d: StoreData<SceneObjectStore | ActorStore | UserStore>
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
          return status!.data!.name;
        case "actor-chat-text-color": {
          let cActor: StoreData<ActorStore> = actor;
          if (cActor.data!["chatFontColorType"] !== "original") {
            const cActorOwner = findRequireByKey(this.userList, cActor.owner);
            cActor = findRequireByOwner(this.actorList, cActorOwner.key);
          }
          return cActor!.data!["chatFontColor"];
        }
        case "actor-stand-image-position":
          return actor.data!.standImagePosition.toString(10);
        default:
          return nullText;
      }
    };

    let sceneObject: StoreData<SceneObjectStore> | null = null;
    let actorKey: string = data.owner;
    if (data.ownerType === "scene-object-list") {
      sceneObject = this.sceneObjectList.filter(so => so.key === data.owner)[0];
      if (!sceneObject) return "";
      actorKey = sceneObject.data!.actorKey!;
    }
    const actor = this.actorList.filter(a => a.key === actorKey)[0];

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
    type SortableTargetInfo = {
      type: "scene-object-list" | "actor-list";
      userKey: string;
      userOrder: number;
      actorKey: string;
      actorOrder: number;
      sceneObjectKey: string | null;
      sceneObjectOrder: number | null;
      actorName: string;
      initiative: number | null;
    };
    const sortableTargetInfoList: SortableTargetInfo[] = [];

    this.resourceList.forEach(r => {
      const resourceMaster = findByKey(
        this.resourceMasterList,
        r.data!.resourceMasterKey
      );

      if (
        !resourceMaster ||
        (!resourceMaster.data!.isAutoAddActor &&
          !resourceMaster.data!.isAutoAddMapObject)
      )
        return;

      // actorの時の値で初期化
      let sceneObjectKey: string | null = null;
      let sceneObjectOrder: number | null = null;

      let actorKey: string = r.owner!;

      let userKey: string = "";

      const initiative: number | null =
        resourceMaster.data!.systemColumnType === "initiative"
          ? convertNumberNull(r.data!.value)
          : null;

      if (r.ownerType === "actor-list") {
        actorKey = r.owner!;
      } else {
        sceneObjectKey = r.owner;
        const sceneObject = findByKey(this.sceneObjectList, sceneObjectKey);
        if (!sceneObject) {
          return;
        }
        sceneObjectOrder = sceneObject.order;
        actorKey = sceneObject.data!.actorKey!;
        userKey = sceneObject.owner!;
      }
      const actor = findByKey(this.actorList, actorKey);
      if (!actor) return;
      const actorOrder = actor.order;
      const actorName = actor.data!.name;
      if (r.ownerType === "actor-list") {
        userKey = actor.owner!;
      }

      const user = findByKey(this.userList, userKey);
      if (!user) return;
      const userOrder = user.order;

      let sortableTargetInfo = sortableTargetInfoList.find(
        sti =>
          sti.sceneObjectKey === sceneObjectKey && sti.actorKey === actorKey
      );
      if (!sortableTargetInfo) {
        sortableTargetInfo = {
          type:
            r.ownerType === "actor-list" ? "actor-list" : "scene-object-list",
          userKey,
          userOrder,
          actorKey,
          actorOrder,
          sceneObjectKey,
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
          if (sti1.initiative > sti2.initiative) return -1;
          if (sti1.initiative < sti2.initiative) return 1;
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
        if (sti1.sceneObjectOrder !== null && sti2.sceneObjectOrder !== null) {
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
        type: sti.type,
        key: sti.type === "actor-list" ? sti.actorKey : sti.sceneObjectKey!
      }));
  }

  @VueEvent
  private get initiativeDataList(): StoreData<any>[] {
    const resultList: StoreData<any>[] = [];

    this.dataOwnerList.forEach((df, ind) => {
      const resultData: StoreData<any> = {
        collection: "initiative-volatile",
        key: uuid.v4(),
        order: ind,
        ownerType: df.type,
        owner: df.key,
        exclusionOwner: null,
        lastExclusionOwner: null,
        permission: GameObjectManager.PERMISSION_DEFAULT,
        status: "added",
        createTime: new Date(),
        updateTime: null,
        refList: [],
        data: {}
      };
      this.initiativeColumnList
        // 使用列一覧からリソースマスターに変換
        .map(
          ic =>
            this.resourceMasterList.find(
              rm => rm.key === ic.data!.resourceMasterKey
            )!
        )
        // リソースマスターからリソース一覧に変換
        .map(rm => ({
          resourceMaster: rm,
          resource: this.resourceList.find(
            r =>
              r.data!.resourceMasterKey === rm.key &&
              r.owner === df.key &&
              r.ownerType === df.type
          )
        }))
        .forEach(obj => {
          if (df.type === "actor" && !obj.resourceMaster.data!.isAutoAddActor)
            return;
          if (
            df.type === "scene-object" &&
            !obj.resourceMaster.data!.isAutoAddMapObject
          )
            return;
          const type = obj.resourceMaster.data!.type;
          if (type === "select" || type === "combo") {
            resultData.data[obj.resourceMaster.data!.label] = {
              value: obj.resource ? obj.resource.data!.value : null,
              selection: obj.resourceMaster.data!.selectionStr,
              elmId: `${this.windowInfo.key}-selection-list-${obj.resourceMaster.key}`
            };
          } else {
            resultData.data[obj.resourceMaster.data!.label] = obj.resource
              ? obj.resource.data!.value
              : null;
          }
        });
      if (!Object.keys(resultData.data).length) return;
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

    const resourceMaster = this.resourceMasterList.find(
      rm => rm.data!.label === target
    );
    if (!resourceMaster) {
      console.error(`Not found resource(${target}).`);
      return;
    }

    const resource = this.resourceList.filter(
      r =>
        r.data!.resourceMasterKey === resourceMaster.key &&
        r.ownerType === data.ownerType &&
        r.owner === data.owner
    )[0];
    resource.data!.value = newValue;
    await SocketFacade.instance.resourceCC().updatePackage([
      {
        key: resource.key,
        data: resource.data!
      }
    ]);
  }

  @VueEvent
  private get selectionInfoList(): { elmId: string; optionList: string[] }[] {
    return this.initiativeColumnList
      .map(
        ic =>
          this.resourceMasterList.filter(
            rm => rm.key === ic.data!.resourceMasterKey
          )[0]
      )
      .filter(rm => rm.data!.type === "select" || rm.data!.type === "combo")
      .map(rm => ({
        elmId: `${this.windowInfo.key}-selection-list-${rm.key}`,
        optionList: rm
          .data!.selectionStr!.split(",")
          .map(s => s.trim())
          .filter((s, index, self) => self.indexOf(s) === index)
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
            rm => rm.key === ic.data!.resourceMasterKey
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

  // @VueEvent
  // private async changeSettings() {
  //   console.log("changeSettings");
  // }

  @VueEvent
  private getRowClasses(
    data: StoreData<CutInStore>,
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
    rowNum = Math.floor(rowNum) + 12;
    this.windowInfo.declare.tableInfoList[0].height = rowNum;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
</style>
