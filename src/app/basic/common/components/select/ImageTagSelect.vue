<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :id="id"
    ref="select"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import GameObjectManager from "@/app/basic/GameObjectManager";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";

@Component({ components: { CtrlSelect } })
export default class ImageTagSelect extends Mixins<SelectMixin>(SelectMixin) {
  private imageTagList = GameObjectManager.instance.imageTagList;

  @Prop({ type: String, default: "画像タグ" })
  protected defaultLabel!: string;

  @VueEvent
  private get optionInfoList(): any[] {
    const resultList = this.imageTagList.map(tagObj => ({
      key: tagObj.id,
      value: tagObj.data,
      text: tagObj.data,
      disabled: false
    }));
    if (this.defaultLabel) {
      resultList.unshift({
        key: null,
        value: "",
        text: this.defaultLabel,
        disabled: true
      });
    }
    return resultList;
  }
}
</script>
