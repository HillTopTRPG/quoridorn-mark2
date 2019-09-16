<template>
  <div class="actor-status-tab-container">
    <!-- タブ -->
    <div class="actor-status-tabs" @contextmenu.prevent>
      <label class="tab">
        <actor-status-combo
          :statusList="actor.statusList"
          :selectedStatusList="statusList"
          v-model="selectStatus"
        />
      </label>
      <label
        class="tab"
        v-for="(status, index) in statusList"
        :key="status.name"
        @click="selectTab(status.name)"
        :class="{ active: activeTabIndex === index }"
      >
        {{ status.name }}
        <span class="icon-cross" @click.stop="delTab(status.name)"></span>
      </label>
    </div>

    <!-- 内容 -->
    <div class="actor-status-contents">
      <slot :status="status"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import ActorStatusCombo from "../ActorStatusCombo.vue";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";

@Component({
  components: {
    ActorStatusCombo
  }
})
export default class ActorStatusTabComponent extends Vue {
  @Prop({ type: Object, required: true })
  private actor!: any;

  @Action("addActorStatus") private addActorStatus: any;
  @Getter("getObj") private getObj: any;

  private statusList: any[] = [];
  private activeTabIndex: number = -1;
  private selectStatus: string = "";

  selectTab(statusName: string) {
    this.activeTabIndex = this.statusList.findIndex(
      (status: any) => status.name === statusName
    );
  }

  public deleteTab(index: number = this.activeTabIndex): string | null {
    this.activeTabIndex--;
    if (this.activeTabIndex < 0) this.activeTabIndex = 0;
    this.statusList.splice(index, 1);
    const status = this.statusList[this.activeTabIndex];
    return status ? status.name : null;
  }

  delTab(statusName: string) {
    const index = this.statusList.findIndex(
      (status: any) => status.name === statusName
    );
    this.deleteTab(index);
  }

  @Watch("actor")
  onChangeActor(actor: any) {
    this.statusList.splice(0, this.statusList.length);
  }

  @Emit("change")
  public change(value: string) {}

  @Watch("activeTabIndex")
  onChangeActiveTabIndex(value: number) {
    const status: any = this.status;
    this.change(status ? status.name : null);
  }

  @Watch("selectStatus")
  onChangeSelectStatus(selectStatus: string) {
    if (selectStatus) {
      const index = this.actor.statusList.findIndex(
        (status: any) => status.name === selectStatus
      );

      const func = (index: number) => {
        const findIndex = this.statusList.findIndex(
          (status: any) => status.name === selectStatus
        );
        if (findIndex === -1) {
          const status = this.actor.statusList[index];
          this.statusList.unshift(status);
          this.activeTabIndex++;
          setTimeout(() => {
            this.selectStatus = "";
            this.activeTabIndex = 0;
          }, 0);
        } else {
          this.activeTabIndex++;
          setTimeout(() => {
            this.selectStatus = "";
            this.activeTabIndex = findIndex;
          }, 0);
        }
      };

      if (index === -1) {
        this.addActorStatus({
          key: this.actor.key,
          name: selectStatus,
          standImage: {
            ref: "◆",
            base: "",
            baseTag: "imgTag-4",
            autoResize: true,
            animationLength: 1,
            locate: 1,
            diffList: [],
            isSystemLock: false
          }
        }).then(() => {
          func.call(this, this.actor.statusList.length - 1);
        });
      } else {
        func(index);
      }
    }
  }

  get status(): any {
    if (this.activeTabIndex === -1) return null;
    return this.statusList[this.activeTabIndex];
  }
}
</script>

<style scoped lang="scss">
$backColor: rgba(230, 230, 255, 1);
.actor-status-tab-container {
  flex: 1;
  box-sizing: border-box;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  margin: 0.5em 0.5em 0.5em 1em;
}
.actor-status-tabs {
  display: inline-flex;
  flex-direction: row;
  margin-bottom: -1px;
  box-sizing: border-box;
  z-index: 1;

  label.tab {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #777777;
    border-radius: 5px 5px 0 0;
    padding: 0.2em 0.5em 0;
    background-color: #cccccc;
    margin-top: 0.5em;

    span[class^="icon-"] {
      visibility: hidden;
      margin-left: 0.2em;
    }
    &:first-child {
      margin-left: 1em;
    }
    &:not(:first-child) {
      margin-left: -1px;
    }
    &:hover span[class^="icon-"] {
      visibility: visible;
    }
    &.active {
      background-color: $backColor;
      border-bottom-color: transparent;
      margin-top: 0;
    }
  }
}
.actor-status-contents {
  background-color: $backColor;
  border: 1px solid #777777;
  height: 100px;
  z-index: 0;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
