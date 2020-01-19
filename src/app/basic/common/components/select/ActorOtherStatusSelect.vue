<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :disabled="disabled"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import ComponentVue from "@/app/core/window/ComponentVue";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class ActorOtherStatusSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private actor!: any;

  @Prop({ type: String, required: true })
  private statusName!: any;

  private get useStatusList(): any[] {
    return this.actor.statusList.filter(
      (status: any) => !status.standImage.ref && status.name !== this.statusName
    );
  }

  @VueEvent
  private get optionInfoList(): any[] {
    const resultList = this.useStatusList.map(status => ({
      key: status.name,
      value: status.name,
      text: status.name,
      disabled: false
    }));
    resultList.unshift({
      key: null,
      value: "",
      text: "個別設定",
      disabled: false
    });
    return resultList;
  }
}
</script>
