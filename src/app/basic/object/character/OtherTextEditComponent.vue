<template>
  <div class="other-text-edit-component">
    <textarea
      v-show="mode === 'edit'"
      v-model="localValue"
      ref="textarea"
    ></textarea>
    <other-text-component
      v-show="mode === 'preview'"
      v-model="localValue"
      :useScroll="true"
    />
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
      </template>
      <other-text-edit-mode-radio v-model="mode" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import OtherTextComponent from "@/app/basic/other-text/OtherTextComponent.vue";
import CtrlRadio from "@/app/core/component/CtrlRadio.vue";
import OtherTextEditModeRadio from "@/app/basic/common/components/radio/OtherTextEditModeRadio.vue";
@Component({
  components: { OtherTextEditModeRadio, CtrlRadio, OtherTextComponent }
})
export default class OtherTextEditComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ default: "" })
  public value!: string;

  private mode: "edit" | "preview" = "edit";

  public input(value: string) {
    this.$emit("input", value);
  }

  public get localValue(): string {
    return this.value;
  }

  public set localValue(value: string) {
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

    const beforeText = this.localValue.substr(0, selectionStart);
    const middleText = this.localValue
      .substr(selectionStart, middleLength)
      .replace(/(^\r?\n)|(\r?\n$)/, "");
    const afterText = this.localValue.substr(selectionEnd);

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

    this.localValue = strList.join("");

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
  private onCLickList(isNumbered: boolean) {
    const textareaElm = this.getTextAreaElm();
    const selectionStart = textareaElm.selectionStart;
    const selectionEnd = textareaElm.selectionEnd;

    const beforeText = this.localValue
      .substr(0, selectionStart)
      .replace(/\r?\n$/, "");
    const middleText = this.localValue
      .substr(selectionStart, selectionEnd - selectionStart)
      .replace(/(^\r?\n)|(\r?\n$)/, "");
    const afterText = this.localValue
      .substr(selectionEnd)
      .replace(/^\r?\n/, "");

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
    this.localValue = strList.join("\n");

    setTimeout(() => {
      textareaElm.selectionStart = newCaretStartIndex;
      textareaElm.selectionEnd = newCaretEndIndex;
      textareaElm.focus();
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.other-text-edit-component {
  @include flex-box(column, stretch, stretch);
  margin: 0;
  padding: 0 !important;
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

  > .btn {
    @include flex-box(row, center, center);
    background-color: white;
    border: 1px solid black;
    margin: 0.1em;
    border-radius: 0.2rem;
    width: 1.8em;
    height: 1.8em;
    cursor: pointer;
    box-sizing: border-box;

    &:hover {
      background-color: var(--uni-color-light-skyblue);
    }
  }
}
</style>
