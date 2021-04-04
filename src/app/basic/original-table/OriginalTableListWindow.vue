<template>
  <div class="container" ref="window-container">
    <label class="bcdice-system">
      <bcdice-system-input
        v-model="selectedSystem"
        :url.sync="bcdiceServer"
        :bcdice-version.sync="bcdiceVersion"
        :windowInfo="windowInfo"
        @onMouseEnterUrl="onMouseEnterUrl"
      />
    </label>
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <div class="tab-container scroll" v-if="currentTabInfo.target === ''">
        <div class="grid-container">
          <div class="th command" v-t="'label.command'"></div>
          <div class="th table-name" v-t="'label.title'"></div>
          <div class="th icon"></div>
          <template v-if="tableList.length">
            <template v-for="ot in tableList">
              <original-table-line-component
                :key="ot.key"
                :tab="ot"
                :view-command="true"
                @hover="onHover"
              />
            </template>
          </template>
          <div v-else v-t="'label.none'"></div>
        </div>
      </div>
      <!-- タブリスト -->
      <original-table-component
        v-if="currentOriginalTable"
        :tab="currentOriginalTable"
        @hover="onHover"
      />
    </simple-tab-component>

    <div class="button-area">
      <ctrl-button @click="addOriginalTable()">
        <span v-t="'button.add'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Getter, Mutation } from "vuex-class";
import { TabInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import App from "@/views/App.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import WindowVue from "@/app/core/window/WindowVue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import OriginalTableComponent from "@/app/basic/original-table/OriginalTableComponent.vue";
import { OriginalTableStore } from "@/@types/room";
import BcdiceSystemInput from "@/app/basic/common/components/BcdiceSystemInput.vue";
import OriginalTableLineComponent from "@/app/basic/original-table/OriginalTableLineComponent.vue";

@Component({
  components: {
    OriginalTableLineComponent,
    BcdiceSystemInput,
    OriginalTableComponent,
    SimpleTabComponent,
    CtrlButton
  }
})
export default class OriginalTableListWindow extends Mixins<
  WindowVue<void, never>
>(WindowVue) {
  @Mutation("setUseReadAloud")
  private setUseReadAloud!: (useReadAloud: boolean) => void;

  @Getter("useReadAloud")
  private useReadAloud!: boolean;

  private originalTableList = GameObjectManager.instance.originalTableList;

  private selectedSystem: string =
    GameObjectManager.instance.chatPublicInfo.system;
  private currentTabInfo: TabInfo | null = null;

  private bcdiceServer = GameObjectManager.instance.roomData.bcdiceServer;
  private bcdiceVersion = GameObjectManager.instance.roomData.bcdiceVersion;

  @VueEvent
  private onMouseEnterUrl(flg: boolean) {
    this.windowInfo.message = flg ? "aaa" : "";
  }

  private get currentOriginalTable(): StoreData<OriginalTableStore> | null {
    if (!this.currentTabInfo) return null;
    return (
      this.originalTableList.find(
        ot => ot.key === this.currentTabInfo!.target
      ) || null
    );
  }

  private get tableList(): StoreData<OriginalTableStore>[] {
    return this.originalTableList.filter(
      ot => ot.data!.system === this.selectedSystem
    );
  }

  private get tabList(): TabInfo[] {
    const resultList: TabInfo[] = this.originalTableList
      .filter(ot => ot.data!.system === this.selectedSystem)
      .map(ot => ({
        key: ot.key,
        target: ot.key,
        text: ot.data!.commandName,
        isDisabled: false
      }));
    resultList.unshift({
      key: "",
      target: "",
      text: this.$t("label.list").toString(),
      isDisabled: false
    });
    return resultList;
  }

  @VueEvent
  private async addOriginalTable() {
    await App.openSimpleWindow("original-table-add-window");
  }

  @LifeCycle
  private async created() {
    this.onUpdateTabInfo();
  }

  @Watch("selectedSystem")
  @Watch("originalTableList", { deep: true })
  private onUpdateTabInfo() {
    this.currentTabInfo = this.tabList[0] || null;
  }

  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private onHover(messageType: string, isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t(`chat-setting-window.message-list.${messageType}`)!.toString()
      : "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

label.bcdice-system {
  @include flex-box(row, flex-start, center);
}

.simple-tab-component {
  @include flex-box(column, stretch, flex-start);
  margin-top: 0.5rem;
  height: calc(100% - 4em - 1rem);
}

.tab-container {
  @include flex-box(column, stretch, flex-start);
  background-color: white;
  border: solid 1px gray;
  flex: 1;

  &.scroll {
    overflow-y: scroll;
  }

  .grid-container {
    display: grid;
    grid-template-columns: auto minmax(5em, 1fr) auto;
    grid-auto-rows: 2em;

    .th,
    .td {
      @include flex-box(row, flex-start, center);
      border-bottom: dashed 1px gray;
    }

    .th {
      font-weight: bold;
      background-color: var(--uni-color-cream);
    }

    .command {
      justify-content: center;
      padding-right: 0.3rem;
    }
  }
}
</style>
