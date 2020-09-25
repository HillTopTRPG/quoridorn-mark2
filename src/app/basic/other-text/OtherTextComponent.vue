<template>
  <div class="other-text-container selectable" ref="component">
    <simple-tab-component
      :windowKey="windowKey"
      :tabList="tabList"
      v-model="currentTabInfo"
      :v-if="currentTabInfo"
    >
      <div class="html" :class="{ useScroll }">
        <template v-for="(block, blockIndex) in json">
          <!-- RAW-BLOCK -->
          <template v-if="block.type === 'RAW-BLOCK'">
            <template v-for="(line, lineIndex) in block.value">
              <template v-if="line.type === 'line'">
                <other-text-span-component
                  :key="`${blockIndex}-${lineIndex}`"
                  tag="div"
                  :spans="line.value"
                  :disabled="!isEditable"
                  @check="onChangeCheck"
                  @select="onChangeSelect"
                />
              </template>
              <pre
                :key="`${blockIndex}-${lineIndex}`"
                class="block"
                v-else-if="line.type === '```'"
                >{{ line.value }}</pre
              >
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
                  :disabled="!isEditable"
                  @check="onChangeCheck"
                  @select="onChangeSelect"
                />
              </blockquote>
              <component
                :key="`${blockIndex}-${lineIndex}`"
                v-bind:is="line.type"
                v-else
              >
                <other-text-span-component
                  tag="div"
                  v-if="typeof line.value !== 'string'"
                  :spans="line.value"
                  :disabled="!isEditable"
                  @check="onChangeCheck"
                  @select="onChangeSelect"
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
                  :disabled="!isEditable"
                  @check="onChangeCheck"
                  @select="onChangeSelect"
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
                  :disabled="!isEditable"
                  @check="onChangeCheck"
                  @select="onChangeSelect"
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
              <thead>
                <tr>
                  <other-text-span-component
                    v-for="(cell, cellIndex) in block.value[0].value"
                    :key="cellIndex"
                    tag="th"
                    :spans="cell.value"
                    :disabled="!isEditable"
                    :class="[cell.align]"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
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
                      :disabled="!isEditable"
                      :class="[cell.align]"
                      @check="onChangeCheck"
                      @select="onChangeSelect"
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
      </div>
    </simple-tab-component>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import VueEvent from "../../core/decorator/VueEvent";
import { StoreObj } from "@/@types/store";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { MemoStore } from "@/@types/gameObject";
import { markdown } from "@/app/core/markdown/markdown";
import OtherTextSpanComponent from "@/app/basic/other-text/OtherTextSpanComponent.vue";
import { TabInfo } from "@/@types/window";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: { SimpleTabComponent, OtherTextSpanComponent }
})
export default class OtherTextComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Array, required: true })
  private value!: StoreObj<MemoStore>[];

  @Prop({ type: Boolean, default: false })
  private useScroll!: boolean;

  private readonly checkRegExp: RegExp = new RegExp(
    "\\[[ x]](\\([^\\r\\n]*\\))?",
    "g"
  );
  private readonly selectRegExp: RegExp = new RegExp(
    "(\\[[^\\r\\n]+])\\([^\\r\\n]*\\)",
    "g"
  );

  private tabList: TabInfo[] = [];
  private currentTabInfo: TabInfo | null = null;

  @LifeCycle
  private async created() {
    this.createTabInfoList();
  }

  private createTabInfoList() {
    this.tabList = this.value
      .filter(lv => permissionCheck(lv, "view", 1))
      .map(lv => ({
        key: lv.key,
        target: lv.key,
        text: lv.data!.tab || this.$t("label.non-name").toString()
      }));
    this.currentTabInfo = this.tabList[0] || null;
  }

  public input(value: StoreObj<MemoStore>[]) {
    this.$emit("input", value);
  }

  @VueEvent
  private get json(): any[] {
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!currentValue) return [];
    const text = currentValue.data!.text;
    return markdown(text);
  }

  @VueEvent
  private onChangeCheck(index: number, value: boolean) {
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!permissionCheck(currentValue, "edit", 1)) return;
    currentValue.data!.text = currentValue.data!.text.replace(
      this.checkRegExp,
      (m, p1) => {
        if (p1) return m;
        return index-- ? m : `[${value ? "x" : " "}]`;
      }
    );
  }

  @VueEvent
  private get isEditable(): boolean {
    const otherText = this.value.find(
      v => v.key === this.currentTabInfo!.target
    )!;
    return permissionCheck(otherText, "edit", 1);
  }

  @VueEvent
  private onChangeSelect(index: number, value: string) {
    const currentValue = this.value.find(
      lv => lv.key === this.currentTabInfo!.target
    )!;
    if (!permissionCheck(currentValue, "edit", 1)) return;
    currentValue.data!.text = currentValue.data!.text.replace(
      this.selectRegExp,
      (m, p1) => (index-- ? m : `${p1}(${value})`)
    );
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
    border-top: 1px solid gray;
    padding: 0.2rem;
    box-sizing: border-box;
    flex: 1;

    &.useScroll {
      overflow-y: scroll;
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
    border: 1px solid gray;

    th {
      background-color: var(--uni-color-light-green);
    }

    th,
    td {
      border: 1px solid gray;
      padding: 0.2rem;
      vertical-align: middle;
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
</style>
