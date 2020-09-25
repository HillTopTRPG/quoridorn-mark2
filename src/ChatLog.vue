<template>
  <div id="app">
    <!-- 視点 -->
    <fieldset class="visual-block">
      <legend
        :class="{ open: isViewVisualBlock }"
        @click="onClickLegend('isViewVisualBlock')"
      >
        視点
      </legend>
      <div v-show="isViewVisualBlock">
        <label
          v-for="user in userList"
          :key="user.key"
          class="visual-check"
          :class="{ disabled: user.key !== owner && !isGm }"
        >
          <span>{{ getUserName(user.key) }}</span>
          <input
            type="checkbox"
            :checked="targetUserKeyList.some(key => key === user.key)"
            :disabled="user.key !== owner && !isGm"
            @input.stop="onCheckTargetUser(user.key, $event.target.checked)"
            @keydown.enter.stop
            @keyup.enter.stop
            @keydown.229.stop
            @keyup.229.stop
          />
        </label>
      </div>
    </fieldset>

    <!-- 出力形式 -->
    <fieldset class="save-block">
      <legend
        :class="{ open: isViewSaveBlock }"
        @click="onClickLegend('isViewSaveBlock')"
      >
        出力
      </legend>
      <div v-show="isViewSaveBlock">
        <ctrl-button @click="onClickSaveAsDodontofHTML">
          どどんとふHTML
        </ctrl-button>
        <ctrl-button @click="onClickSaveAsDodontofText">
          どどんとふText
        </ctrl-button>
        <ctrl-button @click="onClickSaveAsJson">
          Json
        </ctrl-button>
      </div>
    </fieldset>

    <!----------------
     ! チャットログ
     !--------------->
    <chat-log-viewer
      class="chat-log-viewer"
      :style="{ alignSelf: 'stretch', maxHeight: 'calc(100% - 9em)' }"
      windowKey="windowInfo"
      :isExported="true"
      :targetUserKeyList="targetUserKeyList"
      :chatList="filteredChatList"
      :userList="userList"
      :actorList="actorList"
      :actorGroupList="actorGroupList"
      :chatTabList="chatTabList"
      :groupChatTabList="groupChatTabList"
      :editedMessage="editedMessage"
      :userTypeLanguageMap="userTypeLanguageMap"
      @changeTab="value => (selectedTabKey = value)"
    />
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import moment from "moment";
import LifeCycle from "./app/core/decorator/LifeCycle";
import CtrlButton from "./app/core/component/CtrlButton.vue";
import { saveHTML, saveJson, saveText } from "./app/core/utility/FileUtility";
import ChatLogViewer from "./app/basic/chat/log/ChatLogViewer.vue";
import VueEvent from "./app/core/decorator/VueEvent";
import {
  findByKey,
  findRequireByKey,
  findRequireByOwner
} from "./app/core/utility/Utility";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import { StoreObj } from "@/@types/store";
import {
  ActorGroup,
  ChatInfo,
  ChatTabInfo,
  GroupChatTabInfo,
  UserData
} from "@/@types/room";
import { ActorStore } from "@/@types/gameObject";
import { UserType } from "@/@types/socket";
import { Watch } from "vue-property-decorator";
import { DiceResult } from "@/@types/bcdice";

@Component({ components: { CtrlButton, ChatLogViewer } })
export default class ChatLog extends Mixins<ComponentVue>(ComponentVue) {
  private targetUserKeyList: string[] = [];
  private isViewVisualBlock: boolean = true;
  private isViewSaveBlock: boolean = false;
  private selectedTabKey: string = "";

  // private borderStyleRegExp: RegExp | null = null;
  private chatStyleRegExp: RegExp | null = null;
  private chatLineRegExp: RegExp | null = null;

  private owner: string = "";
  private isGm: boolean = false;
  private chatList: StoreObj<ChatInfo>[] = [];
  private userList: StoreObj<UserData>[] = [];
  private userTypeLanguageMap: { [type in UserType]: string } = {
    GM: "GM",
    PL: "PL",
    VISITOR: "VISITOR"
  };
  private actorList: StoreObj<ActorStore>[] = [];
  private actorGroupList: StoreObj<ActorGroup>[] = [];
  private chatTabList: StoreObj<ChatTabInfo>[] = [];
  private groupChatTabList: StoreObj<GroupChatTabInfo>[] = [];
  private editedMessage: string = "";

  private filteredChatList: StoreObj<ChatInfo>[] = [];

  @LifeCycle
  private beforeMount() {
    /*
     * 注入データのセットアップ
     */
    const getListData = (param: string) =>
      JSON.parse((window as any)[param].replace(/&quot;/g, '"'));
    const getData = (param: string) =>
      JSON.parse((window as any)[param].replace(/&quot;/g, '"'));
    this.chatTabList = getListData("chatTabList") as StoreObj<ChatTabInfo>[];
    this.chatList = getListData("chatList") as StoreObj<ChatInfo>[];
    this.userList = getListData("userList") as StoreObj<UserData>[];
    this.actorList = getListData("actorList") as StoreObj<ActorStore>[];
    this.actorGroupList = getListData("actorGroupList") as StoreObj<
      ActorGroup
    >[];
    this.groupChatTabList = getListData("groupChatTabList") as StoreObj<
      GroupChatTabInfo
    >[];
    this.userTypeLanguageMap = getData("userTypeLanguageMap") as {
      [type in UserType]: string;
    };
    this.editedMessage = (window as any).editedMessage as string;
    this.owner = (window as any).owner as string;

    const ownerUser = findRequireByKey(this.userList, this.owner);
    this.isGm = ownerUser.data!.type === "GM";
    this.targetUserKeyList = !this.isGm ? [this.owner] : [];
    this.selectedTabKey = this.chatTabList[0].key;

    /*
     * 正規表現のセットアップ
     */
    const colorFormat = "#[0-9a-f]+|rgba? *\\([0-9., ]+\\)|[a-z]+";
    const lineStyleFormat = "solid|double|dotted|dashed|wavy";
    // this.borderStyleRegExp = new RegExp(lineStyleFormat, "gi");
    const colorAndLineFormat = `(${lineStyleFormat}|${colorFormat})`;
    const styleRegExpList = [
      `(b?c)(?: *{ *)(${colorFormat})(?: *})`,
      `([uo])(?: *{ *)${colorAndLineFormat}(?: *\\| *${colorAndLineFormat})?(?: *})`,
      "(b)",
      "(i)",
      "(lt)",
      "(r)(?: *{ *)([^}]+)(?: *})"
    ];
    const styleRegExpStr = `(?:: *)(?:${styleRegExpList.join("|")})`;
    this.chatStyleRegExp = new RegExp(styleRegExpStr, "gi");

    const regExpStr = `\\[\\[ *style((?: *${styleRegExpStr})*) *]]`;
    // window.console.log(regExpStr);
    this.chatLineRegExp = new RegExp(regExpStr, "gi");
  }

  @Watch("targetUserKeyList", { deep: true })
  private onChangeTargetUserKeyListDeep() {
    const someActor = (key: string | null): boolean => {
      const actor = findByKey(this.actorList, key);
      if (!actor) return true;
      return this.targetUserKeyList.some(key => key === actor.owner);
    };
    this.filteredChatList = this.chatList.filter(c => {
      if (!c.data!.isSecret) return true;
      if (someActor(c.data!.actorKey)) return true;
      const targetKey = c.data!.targetKey;
      switch (c.data!.targetType) {
        case "group":
          const groupChatTab = findRequireByKey(
            this.groupChatTabList,
            targetKey
          );
          const actorGroupKey = groupChatTab.data!.actorGroupKey;
          const actorGroup: StoreObj<ActorGroup> = findRequireByKey(
            this.actorGroupList,
            actorGroupKey
          );
          return actorGroup.data!.list.some(a =>
            this.targetUserKeyList.some(key => key === a.userKey)
          );
        case "actor":
          return someActor(targetKey);
        default:
          return true;
      }
    });
  }

  @VueEvent
  private getUserName(userKey: string): string {
    const user = this.userList.find(u => u.key === userKey);
    return user ? user.data!.name : "???";
  }

  @VueEvent
  private onClickLegend(target: string) {
    switch (target) {
      case "isViewVisualBlock":
        this.isViewVisualBlock = !this.isViewVisualBlock;
        break;
      case "isViewSaveBlock":
        this.isViewSaveBlock = !this.isViewSaveBlock;
        break;
      default:
    }
  }

  @VueEvent
  private onCheckTargetUser(userKey: string, check: boolean) {
    if (userKey !== this.owner && !this.isGm) return;
    const index = this.targetUserKeyList.findIndex(key => key === userKey);
    if (check && index < 0) this.targetUserKeyList.push(userKey);
    else if (!check && index >= 0) this.targetUserKeyList.splice(index, 1);
  }

  @VueEvent
  private onClickSaveAsDodontofHTML() {
    const replaceFunc: Function = (text: string) => text;

    const dateStr = (moment() as any).format("YYYYMMDD_HHmmss");

    const title = `chatLog_${dateStr}`;

    saveHTML(
      title,
      [
        "<?xml version='1.0' encoding='UTF-8'?>",
        "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>",
        "<html xmlns='http://www.w3.org/1999/xhtml' lang='ja'>",
        `<head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /><title>${title}</title></head>`,
        "<body>",
        this.jsonData
          .map(j => {
            const tabName = `[${j.tabName}]`;
            const targetText = j.isTargetAll ? "" : `＞＞${j.targetName}`;
            const botResult = j.customDiceBotResult || j.diceRollResult;
            const botResultFormatted = botResult ? ` → ${botResult}` : "";
            const likeText = Object.keys(j.like)
              .map(c => `${c}: ${j.like[c]}`)
              .join(", ");
            return [
              tabName,
              `<font color="${j.color}">`,
              "<b>",
              j.actorName,
              targetText,
              "</b>",
              "：",
              replaceFunc(j.text),
              botResultFormatted,
              "</font>",
              likeText ? `(${likeText})` : "",
              "<br>"
            ].join("");
          })
          .join("\n"),
        "</body>",
        "</html>"
      ].join("\n")
    );
  }

  @VueEvent
  private onClickSaveAsDodontofText() {
    const replaceFunc: Function = (text: string) =>
      text.replace(/<br ?\/>/g, "\n");

    const dateStr = (moment() as any).format("YYYYMMDD_HHmmss");

    saveText(
      `chatLog_${dateStr}`,
      this.jsonData
        .map(j => {
          const tabName = `[${j.tabName}]`;
          const targetText = j.isTargetAll ? "" : `＞＞${j.targetName}`;
          const botResult = j.customDiceBotResult || j.diceRollResult;
          const botResultFormatted = botResult ? ` → ${botResult}` : "";
          const likeText = Object.keys(j.like)
            .map(c => `${c}: ${j.like[c]}`)
            .join(", ");
          return [
            tabName,
            j.actorName,
            targetText,
            "：",
            replaceFunc(j.text),
            botResultFormatted,
            likeText ? `(${likeText})` : ""
          ].join("");
        })
        .join("\n")
    );
  }

  @VueEvent
  private onClickSaveAsJson() {
    const dateStr = (moment() as any).format("YYYYMMDD_HHmmss");
    saveJson(`chatLog_${dateStr}`, "chat-log", this.jsonData);
  }

  private get jsonData(): {
    tabName: string;
    userName: string;
    actorName: string;
    targetName: string | null;
    isTargetAll: boolean;
    rawText: string;
    text: string;
    diceRollResult: string | null;
    dices: DiceResult[];
    customDiceBotResult: string | null;
    color: string | null;
    like: { [char: string]: number };
    createTime: Date;
    updateTime: Date | null;
  }[] {
    return this.filteredChatList.map(c => {
      const actor = findByKey(this.actorList, c.data!.actorKey);
      const user = actor ? findRequireByKey(this.userList, actor.owner!) : null;
      const targetType = c.data!.targetType;
      let targetName: string | null = null;
      let isTargetAll: boolean = false;
      if (targetType === "actor") {
        const target = findRequireByKey(this.actorList, c.data!.targetKey);
        targetName = target.data!.name;
      }
      if (targetType === "group") {
        const target = findRequireByKey(
          this.groupChatTabList,
          c.data!.targetKey
        );
        isTargetAll = target.data!.isSystem;
        targetName = target.data!.name;
      }
      const like: { [char: string]: number } = {};
      c.data!.like.forEach(l => {
        like[l.char] = (like[l.char] || 0) + l.count;
      });

      return {
        tabName: findRequireByKey(this.chatTabList!, c.data!.tabKey).data!.name,
        userName: user ? user.data!.name : "System",
        actorName: actor ? actor.data!.name : "Quoridorn",
        targetName,
        isTargetAll,
        rawText: c.data!.text,
        text: this.formatRuby(c.data!.text),
        diceRollResult: c.data!.diceRollResult,
        dices: c.data!.dices,
        customDiceBotResult: c.data!.customDiceBotResult,
        color: this.getColor(c.data!.actorKey),
        like,
        createTime: c.createTime,
        updateTime: c.updateTime
      };
    });
  }

  private formatRuby(text: string) {
    text = text.replace(/\[\[quot]]/g, '"');

    const matchInfoList: any[] = [];
    let matchResult: RegExpExecArray | null;
    while ((matchResult = this.chatLineRegExp!.exec(text)) !== null) {
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

      let rubyText: string = "";
      let matchResult = null;
      while ((matchResult = this.chatStyleRegExp!.exec(styleStr)) !== null) {
        if (matchResult[9] === "r") rubyText = matchResult[10];
      }

      let contentsText: string = contentsStr;
      if (rubyText) {
        contentsText = `${contentsText}[${rubyText}]`;
      }
      resultTexts.push(contentsText);
    }
    return resultTexts.join("");
  }

  private getColor(actorKey: string | null): string | null {
    if (!actorKey) return null;
    let cActor: StoreObj<ActorStore> = findRequireByKey(
      this.actorList,
      actorKey
    );
    if (cActor.data!.chatFontColorType !== "original") {
      const cActorOwner = findRequireByKey(this.userList, cActor.owner);
      cActor = findRequireByOwner(this.actorList, cActorOwner.key);
    }
    return cActor.data!.chatFontColor;
  }
}
</script>

<style lang="scss">
@import "assets/common";

html,
body {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  @include flex-box(column, flex-start, normal);
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

fieldset {
  display: inline-block;
  margin-bottom: 0.5em;
  background-color: lightcyan;
  border: 1px solid black;
  padding: 0.5em;
  user-select: none;

  legend {
    background-color: inherit;
    border: 1px solid black;
    cursor: pointer;
    user-select: none;
    padding: 0 0.5em;
    position: relative;

    &.open:after {
      content: "(+)";
    }

    &:after {
      content: "(-)";
    }

    &:hover:before {
      content: "";
      background-color: rgba(0, 0, 0, 0.1);
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }
  }

  > div {
    @include inline-flex-box(row, flex-start, normal);
    flex-wrap: wrap;

    > label {
      @include inline-flex-box(row, flex-start, center);

      &:not(:first-child) {
        margin-left: 0.5em;
      }
    }
  }
}
</style>
