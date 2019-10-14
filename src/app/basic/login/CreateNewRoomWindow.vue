<template>
  <div>
    <div class="base-area">
      <div>新規プレイルームを作成します。</div>
      <label></label>
    </div>
    <div class="button-area">
      <ctrl-button>新規作成</ctrl-button>
      <ctrl-button>ログイン</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/TableComponent.vue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: { TableComponent, CtrlButton }
})
export default class CreateNewRoomWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.button-area {
  @include flex-box(row, flex-start, center);

  .margin-left-auto {
    margin-left: auto;
  }
}
</style>
