<template>
  <div class="original-table-info-form">
    <table>
      <tr>
        <tr-bcdice-system-input-component
          labelName="label.system"
          v-model="obj.system"
          :url.sync="obj.bcdiceServer"
          :bcdice-version.sync="obj.bcdiceVersion"
          :window-info="windowInfo"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="label.title"
          inputWidth="100%"
          :placeholder="$t('label.require-text')"
          v-model="obj.tableTitle"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="label.command"
          inputWidth="100%"
          :placeholder="$t('label.require-text')"
          v-model="obj.commandName"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="label.dice-roll"
          inputWidth="100%"
          :placeholder="$t('label.require-text')"
          v-model="obj.diceRoll"
        />
      </tr>
      <tr style="height: 100%;">
        <tr-string-input-component
          labelName="label.contents"
          inputWidth="100%"
          inputHeight="100%"
          :placeholder="$t('label.require-text')"
          v-model="inputText"
          :multiline="true"
          :resizable="false"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { WindowInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import { OriginalTableStore } from "@/@types/room";
import TrBcdiceSystemInputComponent from "@/app/basic/common/components/table-item/TrBcdiceSystemInputComponent.vue";

@Component({
  components: {
    TrBcdiceSystemInputComponent,
    TrStringInputComponent
  }
})
export default class OriginalTableInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  @Prop({ type: Object, required: true })
  private obj!: OriginalTableStore;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;
  private inputText: string = "";

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
    this.inputText = Object.keys(this.obj.tableContents)
      .map(key => `${key}:${this.obj.tableContents[key].replace(/\n/g, "\\n")}`)
      .join("\n");
  }

  @Watch("inputText")
  private onChangeInputText() {
    this.obj.tableContents = {};
    const lineList = this.inputText.split("\n").map(l => {
      const matchResult = l.match(/^([^:：]*)[:：]?(.*)$/)!;
      matchResult.shift();
      return matchResult;
    });
    lineList
      .filter(line => line[0])
      .forEach(line => {
        this.obj.tableContents[line[0].trim()] = line[1]
          .trim()
          .replace("\\n", "\n");
      });
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.original-table-info-form {
  display: contents;
}

table {
  width: 100%;
  height: calc(100% - 2em - 0.5rem);
}
</style>
