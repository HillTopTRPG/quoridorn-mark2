<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :maxWidth="7"
    ref="select"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Prop } from "vue-property-decorator";
import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";

@Component({
  components: { CtrlSelect }
})
export default class SelfActorSelect extends Mixins<SelectMixin>(SelectMixin) {
  @Getter("getSelfActors") private getSelfActors: any;

  @Prop({ type: String, default: "アクター" })
  protected defaultLabel!: string;

  @Prop({ type: Array, required: true })
  private selectedActorList!: any[];

  private get selectActors(): any[] {
    return this.getSelfActors.filter(
      (actor: any) =>
        this.selectedActorList.findIndex(
          standActor => standActor.key === actor.key
        ) === -1
    );
  }

  private get optionInfoList(): any[] {
    const resultList = this.selectActors.map((actor: any) => ({
      key: actor.key,
      value: actor.key,
      text: actor.name,
      disabled: false
    }));
    resultList.unshift({
      key: null,
      value: "",
      text: this.defaultLabel,
      disabled: true
    });
    return resultList;
  }
}
</script>
