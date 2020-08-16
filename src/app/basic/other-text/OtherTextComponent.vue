<template>
  <div
    class="other-text-container selectable"
    :class="{ useScroll }"
    ref="component"
  >
    <div class="html">
      <template v-for="(block, blockIdx) in json">
        <!-- RAW-BLOCK -->
        <template v-if="block.type === 'RAW-BLOCK'">
          <template v-for="(line, lineIdx) in block.value">
            <template v-if="line.type === 'line'">
              <other-text-span-component
                :key="`${blockIdx}-${lineIdx}`"
                tag="div"
                :spans="line.value"
                @check="onChangeCheck"
                @select="onChangeSelect"
              />
            </template>
            <pre
              :key="`${blockIdx}-${lineIdx}`"
              class="block"
              v-else-if="line.type === '```'"
              >{{ line.value }}</pre
            >
            <hr
              :key="`${blockIdx}-${lineIdx}`"
              v-else-if="line.type === 'hr'"
            />
            <div :key="`${blockIdx}-${lineIdx}`" v-else-if="line.type === 'nl'">
              <br />
            </div>
            <blockquote
              :key="`${blockIdx}-${lineIdx}`"
              v-else-if="line.type === '>'"
            >
              <other-text-span-component
                tag="div"
                :spans="line.value"
                @check="onChangeCheck"
                @select="onChangeSelect"
              />
            </blockquote>
            <component
              :key="`${blockIdx}-${lineIdx}`"
              v-bind:is="line.type"
              v-else
            >
              <other-text-span-component
                tag="div"
                v-if="typeof line.value !== 'string'"
                :spans="line.value"
                @check="onChangeCheck"
                @select="onChangeSelect"
              />
              <template v-else>{{ line.value }}</template>
            </component>
            <div
              :key="`${blockIdx}-${lineIdx}-space`"
              v-if="line.nlCount > 1"
              v-html="new Array(line.nlCount).fill().join('<br />')"
            ></div>
          </template>
        </template>

        <!-- UL-BLOCK -->
        <template v-if="block.type === 'UL-BLOCK'">
          <ul :key="blockIdx">
            <template v-for="(line, lineIdx) in block.value">
              <other-text-span-component
                :key="lineIdx"
                tag="li"
                :spans="line.value"
                @check="onChangeCheck"
                @select="onChangeSelect"
              />
            </template>
          </ul>
          <div
            :key="`${blockIdx}-space`"
            v-if="block.nlCount > 1"
            v-html="new Array(block.nlCount).fill().join('<br>')"
          ></div>
        </template>

        <!-- OL-BLOCK -->
        <template v-if="block.type === 'OL-BLOCK'">
          <ol :key="blockIdx">
            <template v-for="(line, lineIdx) in block.value">
              <other-text-span-component
                :key="lineIdx"
                tag="li"
                :spans="line.value"
                @check="onChangeCheck"
                @select="onChangeSelect"
              />
            </template>
          </ol>
          <div
            :key="`${blockIdx}-space`"
            v-if="block.nlCount > 1"
            v-html="new Array(block.nlCount).fill().join('<br>')"
          ></div>
        </template>

        <!-- TABLE-BLOCK -->
        <template v-if="block.type === 'TABLE-BLOCK'">
          <table :key="blockIdx">
            <thead>
              <tr>
                <other-text-span-component
                  v-for="(cell, cellIdx) in block.value[0].value"
                  :key="cellIdx"
                  tag="th"
                  :spans="cell.value"
                  :class="[cell.align]"
                  @check="onChangeCheck"
                  @select="onChangeSelect"
                />
              </tr>
            </thead>
            <tbody>
              <template v-for="(tr, trIdx) in block.value">
                <tr v-if="trIdx > 0" :key="trIdx">
                  <other-text-span-component
                    v-for="(cell, cellIdx) in tr.value"
                    :key="cellIdx"
                    tag="td"
                    :spans="cell.value"
                    :class="[cell.align]"
                    @check="onChangeCheck"
                    @select="onChangeSelect"
                  />
                </tr>
              </template>
            </tbody>
          </table>
          <div
            :key="`${blockIdx}-space`"
            v-if="block.nlCount > 1"
            v-html="new Array(block.nlCount).fill().join('<br>')"
          ></div>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import VueEvent from "../../core/decorator/VueEvent";
import { markdown } from "../../core/markdown/markdown";
import OtherTextSpanComponent from "./OtherTextSpanComponent.vue";

@Component({
  components: { OtherTextSpanComponent }
})
export default class OtherTextComponent extends Vue {
  @Prop({ type: String, required: true })
  private value!: string;

  @Prop({ type: Boolean, default: false })
  private useScroll!: boolean;

  private json: any[] = [];
  private readonly checkRegExp: RegExp = new RegExp(
    "\\[[ x]](\\([^\\r\\n]*\\))?",
    "g"
  );
  private readonly selectRegExp: RegExp = new RegExp(
    "(\\[[^\\r\\n]+])\\([^\\r\\n]*\\)",
    "g"
  );

  public input(value: string) {
    this.$emit("input", value);
  }

  private get localValue(): string {
    return this.value;
  }

  private set localValue(value: string) {
    this.input(value);
  }

  @Watch("localValue", { immediate: true })
  private onChangeRawText() {
    this.json = markdown(this.localValue);
  }

  @VueEvent
  private onChangeCheck(index: number, value: boolean) {
    this.localValue = this.localValue.replace(this.checkRegExp, (m, p1) => {
      if (p1) return m;
      return index-- ? m : `[${value ? "x" : " "}]`;
    });
  }

  @VueEvent
  private onChangeSelect(index: number, value: string) {
    this.localValue = this.localValue.replace(this.selectRegExp, (m, p1) => {
      return index-- ? m : `${p1}(${value})`;
    });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.other-text-container {
  @include flex-box(row, flex-start, center);
  background-color: white;
  width: 100%;
  height: 100%;

  &.useScroll {
    overflow-y: scroll;
  }

  > * {
    width: 100%;
    height: 100%;
  }

  .html {
    padding: 0.2rem;
    box-sizing: border-box;
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
