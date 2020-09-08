<template>
  <div class="other-text-edit-component">
    <div class="operation-block">
      <template v-if="mode === 'edit'">
        <span class="btn icon-bold" @click="onCLickBold()"></span>
        <span class="btn icon-italic" @click="onCLickItalic()"></span>
        <span class="btn icon-table2" @click="onCLickTable()"></span>
        <span class="btn icon-list2" @click="onCLickList(false)"></span>
        <span class="btn icon-list-numbered" @click="onCLickList(true)"></span>
        <span class="btn icon-checkmark" @click="onCLickCheck()"></span>
        <span class="btn icon-circle-down" @click="onCLickSelect()"></span>
        <span class="btn icon-pagebreak" @click="onCLickHorizontal()"></span>
        <span class="btn" @click="onCLickHeader(1)">h1</span>
        <span class="btn" @click="onCLickHeader(2)">h2</span>
        <span class="btn" @click="onCLickHeader(3)">h3</span>
        <span class="btn" @click="onCLickHeader(4)">h4</span>
        <span class="btn" @click="onCLickHeader(5)">h5</span>
        <span class="btn" @click="onCLickHeader(6)">h6</span>
        <!--
        <span class="space"></span>
        <ctrl-button @click="onCLickAddTab()">
          <span v-t="'button.add-tab'"></span>
        </ctrl-button>
        <ctrl-button @click="onCLickEditTab()">
          <span v-t="'button.edit-tab'"></span>
        </ctrl-button>
        <ctrl-button @click="onCLickChmodTab()">
          <span v-t="'button.chmod-tab'"></span>
        </ctrl-button>
        <ctrl-button
          @click="onCLickDeleteTab()"
          :disabled="localValue.length <= 1"
        >
          <span v-t="'button.delete-tab'"></span>
        </ctrl-button>
        -->
      </template>
      <other-text-edit-mode-radio v-model="mode" />
    </div>
    <simple-tab-component
      v-if="currentTabInfo"
      v-show="mode === 'edit'"
      v-model="currentTabInfo"
      :windowKey="windowKey"
      :tabList="tabList"
      :hasSetting="true"
      @settingOpen="onSettingOpen()"
    >
      <label>
        <textarea
          v-model="
            localValue.find(lv => lv.id === currentTabInfo.target).data.text
          "
          ref="textarea"
        ></textarea>
      </label>
    </simple-tab-component>
    <other-text-component
      v-if="mode === 'preview'"
      :value="localValue"
      :windowKey="windowKey"
      :useScroll="true"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "../../core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";
import { MemoStore } from "@/@types/gameObject";
import CtrlRadio from "@/app/core/component/CtrlRadio.vue";
import OtherTextComponent from "@/app/basic/other-text/OtherTextComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { Permission, StoreUseData } from "@/@types/store";
import OtherTextEditModeRadio from "@/app/basic/common/components/radio/OtherTextEditModeRadio.vue";
import TaskManager from "@/app/core/task/TaskManager";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import { TabInfo, WindowOpenInfo } from "@/@types/window";
import { createEmptyStoreUseData } from "@/app/core/utility/Utility";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
const uuid = require("uuid");

@Component({
  components: {
    CtrlButton,
    SimpleTabComponent,
    OtherTextEditModeRadio,
    CtrlRadio,
    OtherTextComponent
  }
})
export default class OtherTextEditComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  public windowKey!: string;

  @Prop({ type: Array, required: true })
  public value!: StoreUseData<MemoStore>[];

  private mode: "edit" | "preview" = "edit";

  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList = this.localValue.map(lv => ({
      key: lv.id!,
      target: lv.id!,
      text: lv.data!.tab || this.$t("label.non-name").toString()
    }));
    this.currentTabInfo = this.tabList[0];
  }

  public input(value: StoreUseData<MemoStore>[]) {
    this.$emit("input", value);
  }

  public get localValue(): StoreUseData<MemoStore>[] {
    return this.value;
  }

  public set localValue(value: StoreUseData<MemoStore>[]) {
    this.input(value);
  }

  private getTextAreaElm(): HTMLTextAreaElement {
    return this.$refs["textarea"] as HTMLTextAreaElement;
  }

  private insertText(payload: {
    before: string;
    after: string;
    isHasContent: boolean;
    contentsDefault: string;
    isBlock: boolean;
  }): void {
    if (!payload.before && !payload.after) return;
    const textareaElm = this.getTextAreaElm();
    const selectionStart = textareaElm.selectionStart;
    const selectionEnd = textareaElm.selectionEnd;
    const middleLength = selectionEnd - selectionStart;

    const currentValue = this.localValue.find(
      lv => lv.id === this.currentTabInfo!.target
    )!;
    const text = currentValue.data!.text;

    const beforeText = text.substr(0, selectionStart);
    const middleText = text
      .substr(selectionStart, middleLength)
      .replace(/(^\r?\n)|(\r?\n$)/, "");
    const afterText = text.substr(selectionEnd);

    let newCaretStartIndex = -1;
    let newCaretEndIndex = -1;

    const strList: string[] = [];

    strList.push(beforeText);

    if (payload.isBlock && beforeText && !beforeText.match(/\n$/)) {
      strList.push("\n");
    }

    strList.push(payload.before);

    newCaretStartIndex = strList.join("").length;
    if (payload.isHasContent)
      strList.push(middleText || payload.contentsDefault);
    newCaretEndIndex = strList.join("").length;

    strList.push(payload.after);

    if (!payload.isHasContent && middleText) {
      if (payload.isBlock && !middleText.match(/^\n/)) {
        strList.push("\n");
      }
      strList.push(middleText);
    } else {
      if (payload.isBlock && afterText && !afterText.match(/^\n/)) {
        strList.push("\n");
      }
    }

    strList.push(afterText);

    currentValue.data!.text = strList.join("");

    setTimeout(() => {
      textareaElm.selectionStart = newCaretStartIndex;
      textareaElm.selectionEnd = newCaretEndIndex;
      textareaElm.focus();
    });
  }

  @VueEvent
  private onCLickTable() {
    this.insertText({
      before: [
        "|column01|column02|column03|",
        "|:---|:---:|---:|",
        "|value01|value02|value03|"
      ].join("\n"),
      after: "",
      isBlock: true,
      isHasContent: false,
      contentsDefault: ""
    });
  }

  @VueEvent
  private onCLickBold() {
    this.insertText({
      before: "**",
      after: "**",
      isBlock: false,
      isHasContent: true,
      contentsDefault: "bold"
    });
  }

  @VueEvent
  private onCLickItalic() {
    this.insertText({
      before: "*",
      after: "*",
      isBlock: false,
      isHasContent: true,
      contentsDefault: "italic"
    });
  }

  @VueEvent
  private onCLickHeader(level: number) {
    const before = new Array(level).fill("#").join("") + " ";
    this.insertText({
      before,
      after: "",
      isBlock: true,
      isHasContent: true,
      contentsDefault: "header"
    });
  }

  @VueEvent
  private onCLickHorizontal() {
    this.insertText({
      before: "---",
      after: "",
      isBlock: true,
      isHasContent: false,
      contentsDefault: ""
    });
  }

  @VueEvent
  private onCLickCheck() {
    this.insertText({
      before: "[x]",
      after: "",
      isBlock: false,
      isHasContent: false,
      contentsDefault: ""
    });
  }

  @VueEvent
  private onCLickSelect() {
    this.insertText({
      before: "{title}[item01|item02|item03](item01)",
      after: "",
      isBlock: false,
      isHasContent: false,
      contentsDefault: ""
    });
  }

  @VueEvent
  private async onSettingOpen() {
    const result = (
      await TaskManager.instance.ignition<
        WindowOpenInfo<StoreUseData<MemoStore>[]>,
        StoreUseData<MemoStore>[]
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "memo-tab-setting-window",
          args: this.localValue
        }
      })
    )[0];
    if (result) {
      listToEmpty(this.localValue);
      this.localValue.push(...result);
      const oldTarget = this.currentTabInfo!.target;
      this.createTabInfoList();
      const newTab = this.tabList.find(t => t.target === oldTarget);
      if (newTab) {
        this.currentTabInfo = newTab;
      }
    }
  }

  @VueEvent
  private async onCLickAddTab() {
    const target = this.currentTabInfo!.target;
    const idx = this.localValue.findIndex(lv => lv.id === target);
    const tabText = await this.getInputTab("");
    if (tabText === undefined) return;
    this.localValue.splice(
      idx + 1,
      0,
      createEmptyStoreUseData(uuid.v4(), {
        tab: tabText,
        text: ""
      })
    );
    this.createTabInfoList();
    this.currentTabInfo = this.tabList[idx + 1];
  }

  @VueEvent
  private async onCLickEditTab() {
    const target = this.currentTabInfo!.target;
    const currentValue = this.localValue.find(lv => lv.id === target)!;
    const text = await this.getInputTab(currentValue.data!.tab);
    if (text === undefined) return;
    currentValue.data!.tab = text;
    this.createTabInfoList();
  }

  @VueEvent
  private async onCLickChmodTab() {
    const target = this.currentTabInfo!.target;
    const currentValue = this.localValue.find(lv => lv.id === target)!;
    currentValue.permission = (
      await TaskManager.instance.ignition<
        WindowOpenInfo<Permission>,
        Permission
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "chmod-input-window",
          args: currentValue.permission!
        }
      })
    )[0];
  }

  @VueEvent
  private onCLickDeleteTab() {
    const target = this.currentTabInfo!.target;
    const idx = this.localValue.findIndex(lv => lv.id === target);
    this.localValue.splice(idx, 1);
    this.createTabInfoList();
    this.currentTabInfo = this.tabList[
      this.localValue.length <= idx ? this.localValue.length - 1 : idx
    ];
  }

  private async getInputTab(tab: string): Promise<string | undefined> {
    return (
      await TaskManager.instance.ignition<
        WindowOpenInfo<{ title: string; label: string; text: string }>,
        string
      >({
        type: "window-open",
        owner: "Quoridorn",
        value: {
          type: "simple-text-input-window",
          args: {
            text: tab,
            label: this.$t("label.tab").toString(),
            title: this.$t("label.input-tab").toString()
          }
        }
      })
    )[0];
  }

  @VueEvent
  private onCLickList(isNumbered: boolean) {
    const textareaElm = this.getTextAreaElm();
    const selectionStart = textareaElm.selectionStart;
    const selectionEnd = textareaElm.selectionEnd;

    const currentValue = this.localValue.find(
      lv => lv.id === this.currentTabInfo!.target
    )!;
    const text = currentValue.data!.text;

    const beforeText = text.substr(0, selectionStart).replace(/\r?\n$/, "");
    const middleText = text
      .substr(selectionStart, selectionEnd - selectionStart)
      .replace(/(^\r?\n)|(\r?\n$)/, "");
    const afterText = text.substr(selectionEnd).replace(/^\r?\n/, "");

    let newCaretStartIndex = -1;
    let newCaretEndIndex = -1;

    const strList: string[] = [];
    if (beforeText) strList.push(beforeText);

    let isEditItem: boolean = false;

    const middleSplit = middleText.split(/\r?\n/);
    for (let i = 0; i < Math.max(2, middleSplit.length); i++) {
      const prefixText = `${isNumbered ? "1." : "-"} `;
      `${
        middleSplit.length > i && middleSplit[i].trim()
          ? middleSplit[i]
          : `item0${i + 1}`
      }`;
      if (middleSplit.length > i && middleSplit[i].trim()) {
        const itemText = `${prefixText}${middleSplit[i]}`;
        strList.push(itemText);
      } else {
        const itemText = `${prefixText}item0${i + 1}`;
        strList.push(itemText);
        if (!isEditItem) {
          newCaretEndIndex = strList.join("\n").length;
          newCaretStartIndex = newCaretEndIndex - 6;
        }
        isEditItem = true;
      }
    }

    if (!isEditItem) {
      newCaretStartIndex = strList.join("\n").length + 1;
      newCaretEndIndex = strList.join("\n").length + 1;
    }

    strList.push(afterText);
    currentValue.data!.text = strList.join("\n");

    setTimeout(() => {
      textareaElm.selectionStart = newCaretStartIndex;
      textareaElm.selectionEnd = newCaretEndIndex;
      textareaElm.focus();
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.other-text-edit-component {
  @include flex-box(column, stretch, flex-start);
  margin: 0;
  padding: 0 !important;
}

.simple-tab-component {
  flex: 1;

  > label {
    @include flex-box(column, stretch, stretch);
    align-self: stretch;
    flex: 1;
    border-top: 1px solid gray;
  }
}

textarea {
  resize: none;
  flex: 1;
  padding: 0.2em;
  margin: 0;
  border: none;
  outline: none;
  box-sizing: border-box;
}

.operation-block {
  @include inline-flex-box(row, flex-start, stretch, wrap);
  background-color: var(--uni-color-cream);

  > .ctrl-radio {
    flex: 1;
    @include inline-flex-box(row, flex-end, center);
  }

  > .space {
    flex: 1;
    flex-flow: revert;
  }

  > .btn {
    @include inline-flex-box(row, center, center);
    background-color: white;
    border: 1px solid black;
    margin: 0.1em;
    border-radius: 0.2rem;
    min-width: 1.8em;
    height: 1.8em;
    cursor: pointer;
    box-sizing: border-box;

    &:hover {
      background-color: var(--uni-color-light-skyblue);
    }
  }
}
</style>
