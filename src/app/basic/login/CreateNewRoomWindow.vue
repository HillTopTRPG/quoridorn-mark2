<template>
  <div>
    <div class="base-area">
      <div>新規プレイルームを作成します。</div>
      <label>
        <span>プレイルーム名：</span>
        <base-input type="text" placeholder="仮プレイルーム（削除可能）" />
      </label>
      <label>
        <span>パスワード(空ならパスワードなし)：</span>
        <base-input type="password" />
      </label>
      <dice-bot-select
        :labelText="'ゲームシステム'"
        ref="diceBot"
        v-model="currentDiceBotSystem"
        class="diceBotSystem"
      />
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
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";

@Component({
  components: { DiceBotSelect, BaseInput, TableComponent, CtrlButton }
})
export default class CreateNewRoomWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  /** 選択されているシステム */
  private currentDiceBotSystem: string = "DiceBot";
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.base-area {
  @include flex-box(column, stretch, center);
  label {
    @include flex-box(row, flex-start, center);

    span {
      color: gray;
      font-size: 80%;
    }

    input {
      flex: 1;
      width: 10px;
    }
  }
}
.button-area {
  @include flex-box(row, flex-start, center);

  .margin-left-auto {
    margin-left: auto;
  }
}
</style>
