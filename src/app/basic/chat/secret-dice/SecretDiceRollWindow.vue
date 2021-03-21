<template>
  <div class="container" ref="window-container">
    <div class="secret-dice-container">
      <secret-dice-roll-component
        v-for="secretDiceInfo in secretDiceInfoList"
        :key="secretDiceInfo.key"
        :secretDiceRoll="secretDiceInfo"
        @open="openSecretDice"
        @delete="deleteSecretDice"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import WindowVue from "@/app/core/window/WindowVue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import SecretDiceRollComponent from "@/app/basic/chat/secret-dice/SecretDiceRollComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { findRequireByKey } from "@/app/core/utility/Utility";
import { sendChatLog } from "@/app/core/utility/ChatUtility";

@Component({ components: { SecretDiceRollComponent } })
export default class SecretDiceRollWindow extends Mixins<
  WindowVue<void, never>
>(WindowVue) {
  private keepBcdiceDiceRollResultList =
    GameObjectManager.instance.keepBcdiceDiceRollResultList;
  private keepBcdiceDiceRollResultListCC = SocketFacade.instance.keepBcdiceDiceRollResultListCC();
  @LifeCycle
  public async mounted() {
    await this.init();
  }

  @VueEvent
  private get secretDiceInfoList() {
    return this.keepBcdiceDiceRollResultList.filter(
      kbdrr =>
        kbdrr.data!.type === "secret-dice-roll" &&
        kbdrr.owner === SocketFacade.instance.userKey
    );
  }

  @VueEvent
  private async openSecretDice(key: string) {
    const keepBcdiceDiceRollResult = findRequireByKey(
      this.keepBcdiceDiceRollResultList,
      key
    );
    const bcdiceDiceRollResult = keepBcdiceDiceRollResult.data!
      .bcdiceDiceRollResult;
    const text = `${this.$t("message.open-secret-dice").toString()} ${
      keepBcdiceDiceRollResult.data!.text
    }`;
    await sendChatLog({
      chatType: "system-message",
      text,
      tabKey: null,
      targetKey: null,
      statusKey: null,
      system: keepBcdiceDiceRollResult.data!.system,
      isSecret: false,
      diceRollResult: bcdiceDiceRollResult.result,
      originalTableResult: keepBcdiceDiceRollResult.data!.originalTableResult,
      dices: bcdiceDiceRollResult.dices,
      bcdiceServer: keepBcdiceDiceRollResult.data!.bcdiceServer,
      bcdiceVersion: keepBcdiceDiceRollResult.data!.bcdiceVersion
    });
    await this.deleteSecretDice(key);
  }

  @VueEvent
  private async deleteSecretDice(key: string) {
    if (this.keepBcdiceDiceRollResultList.length === 1) {
      await this.close();
    }
    await this.keepBcdiceDiceRollResultListCC.deletePackage([key]);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;
}

.secret-dice-container {
  @include flex-box(column, stretch, flex-start);
  overflow-y: scroll;

  > *:not(:first-child) {
    margin-top: 0.5rem;
  }
}
</style>
