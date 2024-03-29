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
              v-model="linkageResourceKeyVolatile"
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
import { TabInfo } from "@/@types/window";
import TrActorNumberResourceSelectComponent from "@/app/basic/common/components/table-item/TrActorNumberResourceSelectComponent.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";

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

  // linkageResourceKey
  @Prop({ type: String, default: null })
  private linkageResourceKey!: string | null;
  private linkageResourceKeyVolatile: string | null = null;
  @Watch("linkageResourceKey", { immediate: true })
  private onChangeLinkageResourceKey(value: string | null) {
    this.linkageResourceKeyVolatile = value;
  }
  @Watch("linkageResourceKeyVolatile")
  private onChangeLinkageResourceKeyVolatile(value: string | null) {
    this.$emit("update:linkageResourceKey", value);
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "basic", text: "", isDisabled: false }
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
