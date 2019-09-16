<template>
  <div class="chatLogLine">
    <span v-if="activeChatTab === 'chatTab-0'"
      >[{{ getViewName(chatLog.tab) }}]
    </span>
    <span :style="{ color: `var(--${chatLog.color}, #000)` }">
      <b>{{ chatLog.name }}</b
      ><span v-if="chatLog.target !== 'groupTargetTab-0'"
        >＞＞<b>{{ getViewName(chatLog.target) }}</b></span
      >：<span v-html="transText(chatLog.text)"></span></span
    ><span class="time" v-if="isViewTime">{{
      getTime(chatLog.processTime)
    }}</span>
  </div>
</template>

<style scoped lang="scss">
@import "../../../assets/common";

.chatLogLine {
  display: inline-block;
  width: 100%;
  position: relative;
  line-height: 1.7em;

  .time {
    flex: 1;
    @include inline-flex-box(row, flex-end, center);
    position: absolute;
    right: 0;
  }

  rt {
    font-size: 80%;
    line-height: 1em;
  }
}
</style>

<script lang="ts">
import Vue from "vue";

import { Prop } from "vue-property-decorator";
import { Component } from "vue-mixin-decorator";
import TabsComponent from "@/app/basic/common/components/tab-component/TabsComponent.vue";
import { Getter } from "vuex-class";
import moment from "moment";

@Component({
  components: { TabsComponent }
})
export default class ChatLogLineComponent extends Vue {
  @Getter("getViewName") private getViewName: any;
  @Getter("chatLineRegExp") private chatLineRegExp: any;
  @Getter("borderStyleRegExp") private borderStyleRegExp: any;
  @Getter("chatStyleRegExp") private chatStyleRegExp: any;

  @Prop({ type: Object, required: true })
  private chatLog!: any;

  @Prop({ type: String, required: true })
  private activeChatTab!: string;

  @Prop({ type: Boolean, required: true })
  private isViewTime!: boolean;

  private getTime(timeNum: number) {
    return timeNum
      ? moment(String(timeNum), "YYYYMMDDHHmmss").format("HH:mm:ss")
      : "";
  }

  private transText(text: string) {
    text = text
      .replace(/\[\[quot]]/g, "&quot;")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br />");

    const matchInfoList: any[] = [];
    let matchResult = null;
    while ((matchResult = this.chatLineRegExp.exec(text)) !== null) {
      const styleStr = matchResult[1];
      const startIndex = matchResult.index;
      const contentsIndex = matchResult.index + matchResult[0].length;
      matchInfoList.push({
        styleStr,
        startIndex,
        contentsIndex
      });
    }

    if (!matchInfoList.length) return text;

    matchInfoList.push({ startIndex: text.length });
    const resultTexts: string[] = [];
    resultTexts.push(text.substring(0, matchInfoList[0].startIndex));

    for (let i = 0; i < matchInfoList.length - 1; i++) {
      const styleStr: string = matchInfoList[i]!.styleStr;
      const startIndex: number = matchInfoList[i]!.contentsIndex;
      const endIndex: number = matchInfoList[i + 1]!.startIndex;
      const contentsStr = text.substring(startIndex, endIndex);

      const style: string[] = [];
      const textDecoration: string[] = [];
      let rubyText: string = "";
      let matchResult = null;
      while ((matchResult = this.chatStyleRegExp.exec(styleStr)) !== null) {
        if (matchResult[1] === "c") style.push(`color: ${matchResult[2]}`);
        if (matchResult[1] === "bc")
          style.push(`background-color: ${matchResult[2]}`);
        if (matchResult[3] === "u" || matchResult[3] === "o") {
          const lineObj: any = {
            type: matchResult[3] === "u" ? "underline" : "overline",
            style: "",
            color: ""
          };
          const setFunc: Function = (str: string): void => {
            if (str) {
              if (this.borderStyleRegExp.test(str)) lineObj.style = ` ${str}`;
              else lineObj.color = ` ${str}`;
            }
          };
          setFunc(matchResult[4]);
          setFunc(matchResult[5]);

          textDecoration.push(
            `${lineObj.type}${lineObj.style}${lineObj.color}`
          );
        }
        if (matchResult[6] === "b") style.push("font-weight: bold");
        if (matchResult[7] === "i") style.push("font-style: italic");
        if (matchResult[8] === "lt") textDecoration.push("line-through");
        if (matchResult[9] === "r") rubyText = matchResult[10];
      }
      if (textDecoration.length) {
        style.push(`text-decoration: ${textDecoration.join(" ")}`);
      }

      const styleText: string = style.join(";");
      const styleAttrStr: string = styleText ? ` style="${styleText};"` : "";
      let contentsText: string = contentsStr;
      if (rubyText) {
        contentsText = `<ruby><rb${styleAttrStr}>${contentsText}</rb><rp>（</rp><rt${styleAttrStr}>${rubyText}</rt><rp>）</rp></ruby>`;
      } else {
        if (styleText) {
          contentsText = `<span${styleAttrStr}>${contentsText}</span>`;
        }
      }
      resultTexts.push(contentsText);
    }
    return resultTexts.join("");
  }
}
</script>
