<template>
  <div class="chat-log-container">
    <!----------------
     ! タブ
     !--------------->
    <tabs-component
      :tabIndex="0"
      :tabList="useTabList"
      :activeChatTab="activeChatTab"
      :hoverChatTab="hoverChatTab"
      :isVertical="isVertical"
      :textFunc="textFunc"
      :viewOption="viewOption"
      @onSelect="onSelect"
      @onHover="onHover"
      @editTab="editTab"
    />

    <!----------------
     ! チャットログ
     !--------------->
    <div id="chatLog" class="selectable" @wheel.stop>
      <chat-log-line-component
        v-for="(chatLog, index) in chatLogList"
        :key="index"
        :chatLog="chatLog"
        :activeChatTab="activeChatTab"
        :isViewTime="isViewTime"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import { Emit, Prop, Watch } from "vue-property-decorator";
import { Component } from "vue-mixin-decorator";
import TabsComponent from "../../common/components/tab-component/TabsComponent.vue";
import ChatLogLineComponent from "./ChatLogLineComponent.vue";

@Component({
  components: { ChatLogLineComponent, TabsComponent }
})
export default class ChatLogViewerOrg extends Vue {
  @Prop({ type: Array, required: true })
  private tabList!: any[];

  private get useTabList() {
    if (this.isViewTotalTab) return this.tabList;
    return this.tabList.filter((tab: any) => !tab.isTotal);
  }

  @Prop({ type: String, required: true })
  private activeChatTab!: string;

  @Prop({ type: String, required: true })
  private hoverChatTab!: string;

  @Prop({ type: Boolean, required: true })
  private isVertical!: boolean;

  @Prop({ type: Boolean, required: true })
  private isViewTime!: boolean;

  @Prop({ type: Boolean, required: true })
  private isViewTotalTab!: boolean;

  @Prop({ type: Number, required: true })
  private tabIndex!: number;

  @Prop({ type: Function, required: true })
  private textFunc!: Function;

  @Prop({ type: Array, required: true })
  private chatLogList!: any[];

  @Prop({ type: Object, required: true })
  private colorMap!: any;

  @Prop({ type: Boolean, required: true })
  private viewOption!: boolean;

  /**
   * チャットログ表示タブを選択されたときの挙動
   * @param key タブのkey
   */
  @Emit("onSelect")
  private onSelect(key: string): void {}

  /**
   * チャットログ表示タブをホバーされたときの挙動
   * @param key タブのkey
   */
  @Emit("onHover")
  private onHover(key: string): void {}

  /**
   * チャットタブ追加ボタンクリックイベントハンドラ
   */
  @Emit("editTab")
  private editTab(): void {}

  @Watch("colorMap", { immediate: true, deep: true })
  private onChangeColorMap(colorMap: any) {
    for (const colorKey in colorMap) {
      if (!colorMap.hasOwnProperty(colorKey)) continue;
      document.documentElement.style.setProperty(
        `--${colorKey}`,
        colorMap[colorKey]
      );
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chat-log-container {
  @include flex-box(column, normal, normal);
  position: relative;
  flex: 1;
  height: 100%;
}

#chatLog {
  @include flex-box(column, stretch, flex-start);
  background-color: white;
  flex: 1;
  border: 1px solid gray;
  overflow-y: scroll;
  overflow-x: auto;
  margin: 0;
  padding-left: 2px;
  list-style: none;
  min-height: 70px;
  position: relative;
  z-index: 10;
  white-space: normal;
  word-break: break-all;
}
</style>
