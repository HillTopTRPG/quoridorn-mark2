<template>
  <details class="db-collection-component" :class="{ empty: !dataList.length }">
    <summary>{{ ccName }}({{ dataList.length }})</summary>
    <div class="options" v-if="metaPropList.some(m => m === 'data')">
      <meta-property-check
        v-for="dataInfo in dataInfoList"
        :key="dataInfo.name"
        @click="onClickCheck"
        :property="dataInfo.name"
        :default-value="dataInfo.use"
      />
    </div>
    <db-record-component
      v-for="(data, ind) in dataList"
      :index="ind"
      :key="data.key"
      :data="data"
      :meta-prop-list="metaPropList"
      :data-prop-list="dataPropList"
    />
  </details>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop, Watch } from "vue-property-decorator";
import DbRecordComponent from "@/app/core/window/db-viewer/DbRecordComponent.vue";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";
import MetaPropertyCheck from "@/app/core/window/db-viewer/MetaPropertyCheck.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { MetaPropertyCheck, DbRecordComponent } })
export default class DbCollectionComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private ccName!: string;

  @Prop({ type: Array, required: true })
  private dataList!: StoreUseData<any>[];

  @Prop({ type: Array, required: true })
  private metaPropList!: (keyof StoreUseData<any>)[];

  private dataInfoList: { name: string; use: boolean }[] = [];

  private get dataPropList() {
    return this.dataInfoList.filter(dp => dp.use).map(dp => dp.name);
  }

  @VueEvent
  private onClickCheck(flg: boolean, propName: string) {
    const dataProp = this.dataInfoList.find(dp => dp.name === propName)!;
    dataProp.use = flg;
  }

  @Watch("dataList", { immediate: true, deep: true })
  private onChangeDataList() {
    listToEmpty(this.dataInfoList);
    const dataInfoList: { name: string; use: boolean }[] = [];
    this.dataList.forEach(data => {
      if (!data.data) return;

      let lastName: string | null = null;
      const keys = Object.keys(data.data);
      keys.forEach(name => {
        if (!dataInfoList.some(dp => dp.name === name)) {
          // 見つからないので追加したい
          const obj: { name: string; use: boolean } = { name, use: true };

          const lastPropIndex = dataInfoList.findIndex(
            dp => dp.name === lastName
          );
          if (lastPropIndex < 0) {
            dataInfoList.push(obj);
          } else {
            dataInfoList.splice(lastPropIndex + 1, 0, obj);
          }
        }
      });
    });
    this.dataInfoList.push(...dataInfoList);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.db-collection-component {
  @include flex-box(row, flex-start, center);
  cursor: pointer;

  &.empty {
    background-color: gray;
    cursor: no-drop;
  }

  summary {
    font-weight: bold;
  }

  .options {
    @include flex-box(row, flex-start, flex-start, wrap);
    margin-left: 1em;
  }

  .db-record-component {
    margin-left: 1em;
  }
}
</style>
