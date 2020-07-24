<template>
  <ctrl-select
    v-model="localValue"
    :optionInfoList="optionInfoList"
    :multiple="multiple"
    :disabled="disabled"
    ref="component"
  />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import { Component, Mixins } from "vue-mixin-decorator";
import { HtmlOptionInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import GameObjectManager from "@/app/basic/GameObjectManager";
import CtrlSelect from "@/app/core/component/CtrlSelect.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop, Watch } from "vue-property-decorator";

interface MultiMixin extends SelectMixin, ComponentVue {}

@Component({
  components: { CtrlSelect }
})
export default class SceneObjectSelect extends Mixins<MultiMixin>(
  SelectMixin,
  ComponentVue
) {
  @Prop({ type: String, default: null })
  private actorId!: string;

  @Prop({ type: Boolean, default: false })
  private nullable!: boolean;

  private optionInfoList: HtmlOptionInfo[] = [];

  @LifeCycle
  private async created() {
    this.createOptionInfoList();
  }

  @Watch("actorId")
  private onChangeActorId() {
    this.createOptionInfoList();
  }

  private createOptionInfoList() {
    this.optionInfoList = GameObjectManager.instance.sceneObjectList
      .filter(so => so.data!.actorId === this.actorId)
      .map(c => ({
        key: c.id!,
        value: c.id!,
        text: c.data!.name,
        disabled: false
      }));
    if (this.nullable) {
      this.optionInfoList.unshift({
        key: null,
        value: "null",
        text: this.$t("label.non-select")!.toString(),
        disabled: false
      });
    }
    this.optionInfoList.unshift({
      key: "",
      value: "",
      text: this.$t("type.piece")!.toString(),
      disabled: true
    });
  }
}
</script>
