<template>
  <div class="public-memo-info-form">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
    >
      <!-- 基本情報タブ -->
      <div class="layer-block" v-if="currentTabInfo.target === 'basic'">
        <table>
          <tr>
            <tr-string-input-component
              labelName="label.name"
              width="100%"
              v-model="nameVolatile"
            />
          </tr>
        </table>
      </div>

      <!-- アイコンタブ -->
      <image-picker-component
        v-if="currentTabInfo.target === 'icon'"
        v-model="mediaKeyVolatile"
        :windowKey="key"
        :mediaTag.sync="mediaTagVolatile"
        :direction.sync="directionVolatile"
        ref="imagePicker"
      />

      <!-- コンテンツタブ -->
      <other-text-edit-component
        v-if="currentTabInfo.target === 'contents'"
        v-model="otherTextListVolatile"
        :windowKey="windowKey"
      />
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
import { MemoStore } from "@/@types/store-data";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import TrStringInputComponent from "@/app/basic/common/components/TrStringInputComponent.vue";
import OtherTextEditComponent from "@/app/basic/other-text/OtherTextEditComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { Direction } from "@/@types/store-data-optional";

@Component({
  components: {
    CtrlButton,
    OtherTextEditComponent,
    ImagePickerComponent,
    SimpleTabComponent,
    TrStringInputComponent
  }
})
export default class PublicMemoInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, default: "basic" })
  private initTabTarget!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;

  // name
  @Prop({ type: String, required: true })
  private name!: string;
  private nameVolatile: string = "";
  @Watch("name", { immediate: true })
  private onChangeName(value: string) {
    this.nameVolatile = value;
  }
  @Watch("nameVolatile")
  private onChangeNameVolatile(value: string) {
    this.$emit("update:name", value);
  }

  @Prop({ type: Array, required: true })
  private otherTextList!: StoreData<MemoStore>[];
  private otherTextListVolatile: StoreData<MemoStore>[] = [];
  @Watch("otherTextList", { immediate: true })
  private onChangeOtherTextList(value: StoreData<MemoStore>[]) {
    this.otherTextListVolatile = value;
  }
  @Watch("otherTextListVolatile")
  private onChangeOtherTextListVolatile(value: StoreData<MemoStore>[]) {
    this.$emit("update:otherTextList", value);
  }

  // mediaKey
  @Prop({ type: String, default: null })
  private mediaKey!: string | null;
  private mediaKeyVolatile: string | null = null;
  @Watch("mediaKey", { immediate: true })
  private onChangeImageDocKey(value: string | null) {
    this.mediaKeyVolatile = value;
  }
  @Watch("mediaKeyVolatile")
  private onChangeImageDocKeyVolatile(value: string | null) {
    this.$emit("update:mediaKey", value);
  }

  // mediaTag
  @Prop({ type: String, default: null })
  private mediaTag!: string | null;
  private mediaTagVolatile: string | null = null;
  @Watch("mediaTag", { immediate: true })
  private onChangeImageTag(value: string | null) {
    this.mediaTagVolatile = value;
  }
  @Watch("mediaTagVolatile")
  private onChangeImageTagVolatile(value: string | null) {
    this.$emit("update:mediaTag", value);
  }

  // direction
  @Prop({ type: String, required: true })
  private direction!: Direction;
  private directionVolatile: Direction = "none";
  @Watch("direction", { immediate: true })
  private onChangeDirection(value: Direction) {
    this.directionVolatile = value;
  }
  @Watch("directionVolatile")
  private onChangeDirectionVolatile(value: Direction) {
    this.$emit("update:direction", value);
  }

  private tabList: TabInfo[] = [
    { key: "1", target: "basic", text: "" },
    { key: "2", target: "icon", text: "" },
    { key: "3", target: "contents", text: "" }
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
@import "../../../assets/common";

.public-memo-info-form {
  display: contents;
}

.simple-tab-component {
  @include flex-box(column, stretch, flex-start);
  position: relative;
  flex: 1;
  height: calc(100% - 2em - 0.5rem);

  > *:not(:first-child) {
    width: 100%;
    height: calc(100% - 2em);
    flex: 1;
  }

  > div:not(.image-picker-container) {
    border: solid 1px gray;
    box-sizing: border-box;
    padding: 0.2rem;
  }
}

table {
  table-layout: fixed;
  align-self: flex-end;

  th,
  td {
    label {
      @include inline-flex-box(row, flex-start, center);
    }
  }

  th {
    text-align: left;
    width: 1px;
    white-space: nowrap;

    :first-child {
      display: inline-block;
      width: calc(100% - 1em);
    }
  }

  td {
    text-align: left;
    padding: 0;
  }
}
</style>
