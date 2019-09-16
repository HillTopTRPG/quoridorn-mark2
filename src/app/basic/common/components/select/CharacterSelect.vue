<template>
  <ctrl-select v-model="localValue" :optionInfoList="optionInfoList" />
</template>

<script lang="ts">
import SelectMixin from "./base/SelectMixin";
import CtrlSelect from "@/components/parts/CtrlSelect.vue";

import { Getter } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";
import { Prop } from "vue-property-decorator";

@Component({
  components: { CtrlSelect }
})
export default class CharacterSelect extends Mixins<SelectMixin>(SelectMixin) {
  @Getter("getMapObjectList") private getMapObjectList: any;

  @Prop({ type: Array, default: [] })
  private placeList!: string[];

  private get useCharacterList(): any[] {
    const resultList: any[] = [];

    // 配置場所の絞り込み
    if (this.placeList.length) {
      this.placeList.forEach(place =>
        Array.prototype.push.apply(
          resultList,
          this.getMapObjectList({
            kind: "character",
            place: place
          })
        )
      );
    } else {
      Array.prototype.push.apply(
        resultList,
        this.getMapObjectList({
          kind: "character"
        })
      );
    }

    return resultList;
  }

  private get optionInfoList(): any[] {
    const resultList = this.useCharacterList.map(character => ({
      key: character.key,
      value: character.key,
      text: character.name,
      disabled: false
    }));

    resultList.unshift({
      key: "",
      value: "",
      text: "未指定",
      disabled: false
    });

    if (this.useCharacterList.length === 0)
      resultList.unshift({
        key: null,
        value: null,
        text: "キャラクターが居ません",
        disabled: true
      });

    return resultList;
  }
}
</script>
