<template>
  <div class="chat-tab-info-form">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 基本タブ -->
      <div class="basic-block" v-if="currentTabInfo.target === 'basic'">
        <table>
          <tr>
            <tr-string-input-component
              labelName="label.name"
              width="100%"
              :placeholder="$t('label.require-text')"
              v-model="tabNameVolatile"
            />
          </tr>
        </table>
      </div>
      <div
        class="read-aloud-block"
        v-if="currentTabInfo.target === 'read-aloud'"
      >
        <table>
          <tr>
            <tr-checkbox-component
              labelName="label.read-aloud"
              cLabel=""
              nLabel=""
              v-model="useReadAloudVolatile"
            />
          </tr>
          <tr>
            <tr-number-input-component
              labelName="label.read-aloud-volume"
              inputWidth="5em"
              v-model="readAloudVolumeVolatile"
              :min="0"
              :max="1"
              :step="0.1"
            />
          </tr>
        </table>
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { Task, TaskResult } from "task";
import { TabInfo } from "@/@types/window";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

@Component({
  components: {
    TrCheckboxComponent,
    TrNumberInputComponent,
    TrStringInputComponent,
    SimpleTabComponent
  }
})
export default class ChatTabInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: "basic" })
  private initTabTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;

  @Prop({ type: String, required: true })
  private tabName!: string;
  private tabNameVolatile: string = "";
  @Watch("tabName", { immediate: true })
  private onChangeTabName(value: string) {
    this.tabNameVolatile = value;
  }
  @Watch("tabNameVolatile")
  private onChangeTabNameVolatile(value: string) {
    this.$emit("update:tabName", value);
  }

  @Prop({ type: Number, required: true })
  private readAloudVolume!: number;
  private readAloudVolumeVolatile: number = 0;
  @Watch("readAloudVolume", { immediate: true })
  private onChangeReadAloudVolume(value: number) {
    this.readAloudVolumeVolatile = value;
  }
  @Watch("readAloudVolumeVolatile")
  private onChangeReadAloudVolumeVolatile(value: number) {
    this.$emit("update:readAloudVolume", value);
  }

  @Prop({ type: Boolean, required: true })
  private useReadAloud!: boolean;
  private useReadAloudVolatile: boolean = false;
  @Watch("useReadAloud", { immediate: true })
  private onChangeUseReadAloud(value: boolean) {
    this.useReadAloudVolatile = value;
  }
  @Watch("useReadAloudVolatile")
  private onChangeUseReadAloudVolatile(value: boolean) {
    this.$emit("update:useReadAloud", value);
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "basic", text: "", isDisabled: false },
    { key: "2", target: "read-aloud", text: "", isDisabled: false }
  ];
  private currentTabInfo: TabInfo = this.tabList[0];

  @TaskProcessor("language-change-finished")
  private async languageChangeFinished(
    task: Task<never, never>
  ): Promise<TaskResult<never> | void> {
    this.createTabInfoList();
    task.resolve();
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList.forEach(t => {
      t.text = this.$t(`label.${t.target}`)!.toString();
    });
  }

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.currentTabInfo = this.tabList.find(
      t => t.target === this.initTabTarget
    )!;
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chat-tab-info-form {
  display: contents;
}

.simple-tab-component {
  width: 100%;
  height: 100%;

  > * {
    border: solid 1px gray;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0.2rem;
  }
}
</style>
