<template>
  <div
    class="db-record-component"
    :class="[index % 2 === 0 ? 'even' : 'odd']"
    @click="isSingle = !isSingle"
  >
    {{ dataStr }}
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop } from "vue-property-decorator";
import { clone } from "@/app/core/utility/PrimaryDataUtility";
import * as moment from "moment";

@Component
export default class DbRecordComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private data!: StoreUseData<any>;
  @Prop({ type: Number, required: true })
  private index!: number;
  @Prop({ type: Array, required: true })
  private metaPropList!: (keyof StoreUseData<any>)[];
  @Prop({ type: Array, required: true })
  private dataPropList!: string[];

  private isSingle: boolean = true;

  private get dataStr(): string {
    let data: any = {};
    this.metaPropList.forEach(p => {
      data[p] = clone(this.data[p]);
      if (p === "createTime" || p === "updateTime") {
        if (data[p]) data[p] = moment(data[p]).format("YYYY/MM/DD HH:mm:ss");
      }
    });
    if ("data" in data) {
      Object.keys(data.data)
        .filter(p => !this.dataPropList.some(dp => dp === p))
        .forEach(p => {
          delete data.data[p];
        });
    }
    return JSON.stringify(data, null, this.isSingle ? "" : "  ");
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.db-record-component {
  @include flex-box(row, flex-start, center);
  white-space: pre;

  &.even {
    background-color: lightyellow;
  }

  &.odd {
    background-color: lightcyan;
  }
}
</style>
