<template>
  <div class="other-text-container selectable" ref="component">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
      :v-if="currentTabInfo"
    >
      <div class="html" :class="{ useScroll }">
        <template v-if="isJsonError || isRawText">
          <div class="raw-text">
            {{ rawText }}
          </div>
        </template>
        <template v-else>
          <template v-for="(block, blockIndex) in json">
            <!-- RAW-BLOCK -->
            <template v-if="block.type === 'RAW-BLOCK'">
              <template v-for="(line, lineIndex) in block.value">
                <template v-if="line.type === 'line'">
                  <other-text-span-component
                    :key="`${blockIndex}-${lineIndex}`"
                    tag="div"
                    :spans="line.value"
                    :cell="line"
                    :disabled="!isEditable"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
                    @click-button="onClickButton"
                  />
                </template>
                <pre
                  :key="`${blockIndex}-${lineIndex}`"
                  class="block"
                  v-else-if="line.type === '```'"
                  >{{ line.value }}</pre
                >
                <textarea
                  :key="`${blockIndex}-${lineIndex}`"
                  v-else-if="line.type === ':::'"
                  :style="{ width: line.width, height: line.height }"
                  :value="line.value"
                  :data-index="line.index"
                  @input.stop.prevent="onChangeInput(line.index)"
                  @change.stop.prevent
                  @keydown.enter.stop
                  ref="textareas"
                >
                </textarea>
                <hr
                  :key="`${blockIndex}-${lineIndex}`"
                  v-else-if="line.type === 'hr'"
                />
                <div
                  :key="`${blockIndex}-${lineIndex}`"
                  v-else-if="line.type === 'nl'"
                >
                  <br />
                </div>
                <blockquote
                  :key="`${blockIndex}-${lineIndex}`"
                  v-else-if="line.type === '>'"
                >
                  <other-text-span-component
                    tag="div"
                    :spans="line.value"
                    :cell="line"
                    :disabled="!isEditable"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
                    @click-button="onClickButton"
                  />
                </blockquote>
                <div
                  :key="`${blockIndex}-${lineIndex}`"
                  v-else-if="/h[1-6]/.test(line.type)"
                >
                  <component v-bind:is="line.type">
                    <other-text-span-component
                      tag="div"
                      v-if="typeof line.value !== 'string'"
                      :spans="line.value"
                      :cell="line"
                      :disabled="!isEditable"
                      @check="onChangeCheck"
                      @select="onChangeSelect"
                      @click-button="onClickButton"
                    />
                    <template v-else>{{ line.value }}</template>
                  </component>
                </div>
                <component
                  :key="`${blockIndex}-${lineIndex}`"
                  v-bind:is="line.type"
                  v-else
                >
                  <other-text-span-component
                    tag="div"
                    v-if="typeof line.value !== 'string'"
                    :spans="line.value"
                    :cell="line"
                    :disabled="!isEditable"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
                    @click-button="onClickButton"
                  />
                  <template v-else>{{ line.value }}</template>
                </component>
                <div
                  :key="`${blockIndex}-${lineIndex}-space`"
                  v-if="line.nlCount > 1"
                  v-html="new Array(line.nlCount).fill().join('<br />')"
                ></div>
              </template>
            </template>

            <!-- UL-BLOCK -->
            <template v-if="block.type === 'UL-BLOCK'">
              <ul :key="blockIndex">
                <template v-for="(line, lineIndex) in block.value">
                  <other-text-span-component
                    :key="lineIndex"
                    tag="li"
                    :spans="line.value"
                    :cell="line"
                    :disabled="!isEditable"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
                    @click-button="onClickButton"
                  />
                </template>
              </ul>
              <div
                :key="`${blockIndex}-space`"
                v-if="block.nlCount > 1"
                v-html="new Array(block.nlCount).fill().join('<br>')"
              ></div>
            </template>

            <!-- OL-BLOCK -->
            <template v-if="block.type === 'OL-BLOCK'">
              <ol :key="blockIndex">
                <template v-for="(line, lineIndex) in block.value">
                  <other-text-span-component
                    :key="lineIndex"
                    tag="li"
                    :spans="line.value"
                    :cell="line"
                    :disabled="!isEditable"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
                    @click-button="onClickButton"
                  />
                </template>
              </ol>
              <div
                :key="`${blockIndex}-space`"
                v-if="block.nlCount > 1"
                v-html="new Array(block.nlCount).fill().join('<br>')"
              ></div>
            </template>

            <!-- TABLE-BLOCK -->
            <template v-if="block.type === 'TABLE-BLOCK'">
              <table :key="blockIndex">
                <thead v-if="isEmptyTh(block.value[0].value)">
                  <tr>
                    <other-text-span-component
                      v-for="(cell, cellIndex) in block.value[0].value"
                      :key="cellIndex"
                      tag="th"
                      :spans="cell.value"
                      :cell="cell"
                      :disabled="!isEditable"
                      :class="[cell.align]"
                      @check="onChangeCheck"
                      @select="onChangeSelect"
                      @click-button="onClickButton"
                    />
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(tr, trIndex) in block.value">
                    <tr v-if="trIndex > 0" :key="trIndex">
                      <other-text-span-component
                        v-for="(cell, cellIndex) in tr.value"
                        :key="cellIndex"
                        tag="td"
                        :spans="cell.value"
                        :cell="cell"
                        :disabled="!isEditable"
                        :class="[cell.align]"
                        @check="onChangeCheck"
                        @select="onChangeSelect"
                        @click-button="onClickButton"
                      />
                    </tr>
                  </template>
                </tbody>
              </table>
              <div
                :key="`${blockIndex}-space`"
                v-if="block.nlCount > 1"
                v-html="new Array(block.nlCount).fill().join('<br>')"
              ></div>
            </template>
          </template>
        </template>
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { MemoStore } from "@/@types/store-data";
import { markdown } from "@/app/core/markdown/markdown";
import OtherTextSpanComponent from "@/app/basic/other-text/OtherTextSpanComponent.vue";
import { TabInfo } from "@/@types/window";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import TaskManager from "@/app/core/task/TaskManager";
import { OtherTextUpdateInfo } from "task-info";
import { convertNumberZero } from "@/app/core/utility/PrimaryDataUtility";
import ResizeObserver from "resize-observer-polyfill";
import { getCssPxNum } from "@/app/core/css/Css";
import { sendChatLog } from "@/app/core/utility/ChatUtility";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({
  components: { SimpleTabComponent, OtherTextSpanComponent }
})
export default class OtherTextComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private docType!: string;

  @Prop({ type: String, required: true })
  private docKey!: string;

  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Array, required: true })
  private value!: StoreData<MemoStore>[];

  @Prop({ type: Boolean, required: true })
  private isRawText!: boolean;

  @Prop({ type: Boolean, default: false })
  private useScroll!: boolean;

  private readonly checkRegExp: RegExp = new RegExp(
    "\\[[ x]](\\([^\\r\\n]*\\))?",
    "g"
  );
  private readonly selectRegExp: RegExp = /\[([^\]]+?)\]\(([^)]*?)\)/g;
  private readonly textareaRegExp: RegExp = new RegExp(
    ":::([0-9]+px):([0-9]+px)\\r?\\n((?:(?!\:\:\:END\;\;\;).|\\s)*):::END;;;",
    "g"
  );
  private resizeObserver: ResizeObserver | null = null;

  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  @VueEvent
  private isEmptyTh(block: any[]) {
    return block.some(b => (b.value as any[]).length);
  }

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  @LifeCycle
  private async mounted() {
    this.remakeResizeObserver();
  }

  @Watch("currentTabInfo", { deep: true })
  private onChangeCurrentTabInfo() {
    this.remakeResizeObserver();
  }

  private remakeResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.resizeObserver = new ResizeObserver((entries: any) => {
      entries.forEach(
        ({
          target,
          contentRect
        }: {
          target: HTMLElement;
          contentRect: { width: number; height: number };
        }) => {
          const currentValue = this.value.find(
            lv => lv.key === this.currentTabInfo!.target
          )!;
          if (!permissionCheck(currentValue, "edit")) return;

          let { width, height } = contentRect;
          const scrollBarWidth = getCssPxNum("--scroll-bar-width");
          const w = Math.max(width, 50);
          const h = Math.max(height, 30);

          let index: number = convertNumberZero(target.dataset.index || "");
          currentValue.data!.text = currentValue.data!.text.replace(
            this.textareaRegExp,
            (m, p1, p2, p3) =>
              index-- ? m : `:::${w + scrollBarWidth}px:${h}px\n${p3}:::END;;;`
          );
        }
      );
    });
    const textareaElmList: HTMLElement[] = this.$refs
      .textareas as HTMLElement[];
    if (!textareaElmList) return;
    setTimeout(() => {
      textareaElmList.forEach(elm => this.resizeObserver!.observe(elm));
    });
  }

  @VueEvent
  private onChangeInput(index: number) {
    this.$emit("inputTextArea");
    const textareaElmList: HTMLTextAreaElement[] = this.$refs
      .textareas as HTMLTextAreaElement[];
    if (!textareaElmList) return;
    const value = textareaElmList[index].value;
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!permissionCheck(currentValue, "edit")) return;
    currentValue.data!.text = currentValue.data!.text.replace(
      this.textareaRegExp,
      (m, p1, p2) => (index-- ? m : `:::${p1}:${p2}\n${value}:::END;;;`)
    );
  }

  @LifeCycle
  private beforeDestroy() {
    const textareaElmList: HTMLElement[] = this.$refs
      .textareas as HTMLElement[];
    if (!textareaElmList) return;
    textareaElmList.forEach(elm => {
      this.resizeObserver!.unobserve(elm);
      this.resizeObserver!.disconnect();
    });
  }

  private createTabInfoList() {
    this.tabList = this.value
      .filter(lv => permissionCheck(lv, "view"))
      .map(lv => ({
        key: lv.key,
        target: lv.key,
        text: lv.data!.tab || this.$t("label.non-name").toString(),
        isDisabled: false
      }));
    this.currentTabInfo = this.tabList[0] || null;
  }

  public input(value: StoreData<MemoStore>[]) {
    this.$emit("input", value);
  }

  @VueEvent
  private get rawText(): string {
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!currentValue) return "";
    return currentValue.data!.text;
  }

  private isJsonError: boolean = false;

  @VueEvent
  private get json(): any[] {
    this.isJsonError = false;
    if (!this.rawText) return [];
    try {
      return markdown(this.rawText);
    } catch (err) {
      this.isJsonError = true;
      return [];
    }
  }

  @VueEvent
  private onChangeCheck(index: number, value: boolean) {
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!permissionCheck(currentValue, "edit")) return;
    currentValue.data!.text = currentValue.data!.text.replace(
      this.checkRegExp,
      (m, p1) => {
        if (p1) return m;
        return index-- ? m : `[${value ? "x" : " "}]`;
      }
    );
    this.onClickButton("RELOAD-CHARACTER-SHEET");
  }

  @VueEvent
  private onChangeSelect(index: number, value: string) {
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!permissionCheck(currentValue, "edit")) return;
    currentValue.data!.text = currentValue.data!.text.replace(
      this.selectRegExp,
      (m, p1) => {
        return index-- ? m : `[${p1}](${value})`;
      }
    );
    this.onClickButton("RELOAD-CHARACTER-SHEET");
  }

  @VueEvent
  private get isEditable(): boolean {
    const otherText = this.value.find(
      v => v.key === this.currentTabInfo!.target
    )!;
    return permissionCheck(otherText, "edit");
  }

  @VueEvent
  private async onClickButton(type: string): Promise<void> {
    if (type.startsWith("CHAT-CMD:")) {
      const matchResult = type.match(/CHAT-CMD:(?:\[(.*?)(?:¦(.*))?])?(.*)/);
      if (!matchResult) return;
      const command = matchResult[3].replaceAll("<br>", "");
      const updateInfo = matchResult[2];

      if (command) {
        await sendChatLog({
          chatType: "chat",
          actorKey: GameObjectManager.instance.chatPublicInfo.actorKey,
          text: command,
          tabKey: null,
          statusKey: null,
          targetKey: null,
          system: null,
          isSecret: false,
          bcdiceServer: null,
          bcdiceVersion: null
        });
      }
      if (updateInfo) {
        await TaskManager.instance.ignition<OtherTextUpdateInfo, never>({
          type: "other-text-update",
          owner: "Quoridorn",
          value: {
            docType: this.docType,
            docKey: this.docKey,
            target: this.currentTabInfo!.target.toString(),
            updateInfo
          }
        });
      }
      return;
    }
    switch (type) {
      case "RELOAD-CHARACTER-SHEET":
        await TaskManager.instance.ignition<OtherTextUpdateInfo, never>({
          type: "other-text-update",
          owner: "Quoridorn",
          value: {
            docType: this.docType,
            docKey: this.docKey,
            target: this.currentTabInfo!.target.toString()
          }
        });
        break;
      case "RELOAD-CHARACTER-SHEET-ALL":
        await TaskManager.instance.ignition<OtherTextUpdateInfo, never>({
          type: "other-text-update",
          owner: "Quoridorn",
          value: {
            docType: this.docType,
            docKey: this.docKey,
            target: null
          }
        });
        break;
      default:
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.other-text-container {
  @include flex-box(column, stretch, stretch);
  background-color: white;
  width: 100%;
  height: calc(100% - 2em);
  box-sizing: border-box;

  > .simple-tab-component {
    width: 100%;
    height: 100%;
  }

  .html {
    position: relative;
    border-top: 1px solid gray;
    padding: 0.2rem;
    box-sizing: border-box;
    flex: 1;

    &.useScroll {
      overflow-y: scroll;
    }

    .raw-text {
      display: inline-block;
      width: 100%;
      height: 100%;
      white-space: pre-wrap;
    }
  }

  .line {
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  select {
    height: 2em;
  }

  table {
    table-layout: fixed;
    border: 1px solid gray;

    th {
      white-space: nowrap !important;
      background-color: var(--uni-color-light-green);

      span {
        white-space: nowrap !important;
      }
    }

    th,
    td {
      border: 1px solid gray;
      padding: 0.2rem;
      vertical-align: middle;
      white-space: nowrap !important;
    }

    .left {
      text-align: left;
    }

    .right {
      text-align: right;
    }

    .center {
      text-align: center;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @include inline-flex-box(row, flex-start, center);
    margin: 0.2rem 0;
  }

  h1,
  h4 {
    border-style: solid;
    border-width: 2px 0;
    font-size: 1.4em;
    padding: 0 5em 0 0.5em;
  }

  h2,
  h5 {
    border-style: solid;
    border-width: 0 0 0 5px;
    font-size: 1.2em;
    padding: 0 5em 0 0.5em;
  }

  h3,
  h6 {
    border-radius: 0.2em;
    font-size: 1em;
    padding: 0 5em 0 0.5em;
  }

  h1,
  h2,
  h3 {
    border-color: var(--uni-color-blue);
    background-color: var(--uni-color-light-skyblue);
  }

  h4,
  h5,
  h6 {
    border-color: var(--uni-color-pink);
    background-color: var(--uni-color-light-pink);
  }

  pre {
    background-color: lightgray;
    border-radius: 0.2em;
    box-sizing: border-box;
    padding: 0.1rem;
  }

  ul,
  ol {
    margin: 0;
    padding-left: 20px;
  }
}

blockquote {
  position: relative;
  padding: 0 0.5rem;
  box-sizing: border-box;
  font-style: italic;
  background: #efefef;
  border-left: 3px solid darkgray;
  color: #555;
  margin: 0;
}

textarea {
  display: block;
  overflow-y: scroll;
  margin-right: 10px !important;
  margin-bottom: 10px !important;
}
</style>
