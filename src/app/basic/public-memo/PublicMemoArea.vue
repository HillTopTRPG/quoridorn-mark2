<template>
  <div id="public-memo-area" @contextmenu.prevent>
    <public-memo-icon
      v-for="(publicMemo, index) in usePublicMemoList"
      :key="publicMemo.key"
      :publicMemo="publicMemo"
      :index="index"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import GameObjectManager from "@/app/basic/GameObjectManager";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import PublicMemoIcon from "@/app/basic/public-memo/PublicMemoIcon.vue";
import { PublicMemoStore } from "@/@types/store-data";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: { PublicMemoIcon }
})
export default class PublicMemoArea extends Mixins<ComponentVue>(ComponentVue) {
  private publicMemoList = GameObjectManager.instance.publicMemoList;
  private memoList = GameObjectManager.instance.memoList;

  private usePublicMemoList: StoreData<PublicMemoStore>[] = [];

  @Watch("publicMemoList", { immediate: true, deep: true })
  @Watch("memoList", { deep: true })
  private onChangePublicMemoList() {
    // 全く見える権限の無いものはリストに含めない
    this.usePublicMemoList = this.publicMemoList.filter(pm => {
      if (!permissionCheck(pm, "view")) return false;
      return !!this.memoList.some(m => {
        if (pm.key !== m.owner) return false;
        return permissionCheck(m, "view", 1);
      });
    });
  }
}
</script>
