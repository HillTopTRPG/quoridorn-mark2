<template>
  <div class="secret-dice-component">
    <textarea :value="viewText" readonly></textarea>
    <ctrl-button @click.stop="openSecretDice()">
      <span v-t="'button.open-dice-roll-result'"></span>
    </ctrl-button>
    <ctrl-button @click.stop="deleteSecretDice()">
      <span v-t="'button.delete'"></span>
    </ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { KeepBcdiceDiceRollResultStore } from "@/@types/store-data";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({ components: { CtrlButton } })
export default class SecretDiceRollComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private secretDiceRoll!: StoreData<KeepBcdiceDiceRollResultStore>;

  @VueEvent
  private get viewText() {
    return `${this.secretDiceRoll.data!.text}\n${this.secretDiceRoll.data!
      .originalTableResult ||
      this.secretDiceRoll.data!.bcdiceDiceRollResult.result}`;
  }

  @VueEvent
  private openSecretDice() {
    this.$emit("open", this.secretDiceRoll.key);
  }

  @VueEvent
  private deleteSecretDice() {
    this.$emit("delete", this.secretDiceRoll.key);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.secret-dice-component {
  @include flex-box(row, flex-start, stretch);
  height: 4em;
}

textarea {
  flex: 1;
  resize: none;
  padding: 0;
  box-sizing: border-box;
}
</style>
