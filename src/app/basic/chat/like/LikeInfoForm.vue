<template>
  <div class="like-info-form">
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
              labelName="label.char"
              inputWidth="5em"
              :placeholder="$t('label.require-text')"
              v-model="charVolatile"
            />
          </tr>
          <tr>
            <tr-checkbox-component
              labelName=""
              :cLabel="$t('label.throw')"
              :nLabel="$t('label.non-throw')"
              v-model="isThrowLinkageVolatile"
            />
          </tr>
          <tr>
            <tr-actor-number-resource-select-component
              labelName="label.resource"
              v-model="linkageResourceIdVolatile"
            />
          </tr>
          <tr>
            <td
              class="text"
              colspan="2"
              v-t="'like-info-form.label.resource-restriction'"
            ></td>
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
import TaskProcessor from "../../../core/task/TaskProcessor";
import LifeCycle from "../../../core/decorator/LifeCycle";
import ComponentVue from "../../../core/window/ComponentVue";
import TrCheckboxComponent from "../../common/components/TrCheckboxComponent.vue";
import TrStringInputComponent from "../../common/components/TrStringInputComponent.vue";
import { TabInfo } from "@/@types/window";
import SimpleTabComponent from "../../../core/component/SimpleTabComponent.vue";
import TrActorNumberResourceSelectComponent from "@/app/basic/common/components/TrActorNumberResourceSelectComponent.vue";

@Component({
  components: {
    TrActorNumberResourceSelectComponent,
    TrCheckboxComponent,
    TrStringInputComponent,
    SimpleTabComponent
  }
})
export default class LikeInfoForm extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: "basic" })
  private initTabTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;

  // char
  @Prop({ type: String, required: true })
  private char!: string;
  private charVolatile: string = "";
  @Watch("char", { immediate: true })
  private onChangeChar(value: string) {
    this.charVolatile = value;
  }
  @Watch("charVolatile")
  private onChangeCharVolatile(value: string) {
    this.$emit("update:char", value);
  }

  // isThrowLinkage
  @Prop({ type: Boolean, required: true })
  private isThrowLinkage!: boolean;
  private isThrowLinkageVolatile: boolean = true;
  @Watch("isThrowLinkage", { immediate: true })
  private onChangeIsThrowLinkage(value: boolean) {
    this.isThrowLinkageVolatile = value;
  }
  @Watch("isThrowLinkageVolatile")
  private onChangeIsThrowLinkageVolatile(value: boolean) {
    this.$emit("update:isThrowLinkage", value);
  }

  // linkageResourceId
  @Prop({ type: String, default: null })
  private linkageResourceId!: string | null;
  private linkageResourceIdVolatile: string | null = null;
  @Watch("linkageResourceId", { immediate: true })
  private onChangeLinkageResourceId(value: string | null) {
    this.linkageResourceIdVolatile = value;
  }
  @Watch("linkageResourceIdVolatile")
  private onChangeLinkageResourceIdVolatile(value: string | null) {
    this.$emit("update:linkageResourceId", value);
  }

  private tabList: TabInfo[] = [{ key: "1", target: "basic", text: "" }];
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
    this.currentTabInfo = this.tabList.filter(
      t => t.target === this.initTabTarget
    )[0];
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.like-info-form {
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

table {
  table-layout: fixed;

  th,
  td {
    label {
      @include inline-flex-box(row, flex-start, center);
    }
  }

  th {
    text-align: right;
    padding: 0;
    white-space: nowrap;
    width: 1px;
  }

  td {
    text-align: left;
    padding: 0;

    &.text {
      white-space: pre-line;
      line-height: 1.5em;
    }

    input {
      margin: 0;
    }
  }
}
</style>
