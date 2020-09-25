<template>
  <div class="container" ref="window-container">
    <div class="card-deck-container">
      <card-deck-set-component
        class="card-deck-set"
        v-for="deck in deckList"
        :key="deck.cardDeckBig.key"
        :deck="deck"
        :size="10"
        :isSelected="selectedCardDeckBigKey === deck.cardDeckBig.key"
        @select="selectedCardDeckBigKey = deck.cardDeckBig.key"
        @dblclick="editCardDeck()"
        :style="{
          '--msg-locked': getExclusionOwnerName(deck.cardDeckBig.exclusionOwner)
        }"
      />
      <div class="card-deck-set add" @click="addCardDeck()">
        <span>＋</span>
      </div>
    </div>
    <div class="button-area">
      <ctrl-button @click="editCardDeck()" :disabled="!selectedCardDeckBigKey">
        <span v-t="'button.edit'"></span>
      </ctrl-button>
      <ctrl-button @click="chmodCardDeck()" :disabled="!selectedCardDeckBigKey">
        <span v-t="'button.chmod'"></span>
      </ctrl-button>
      <ctrl-button
        @click="deleteCardDeck()"
        :disabled="!selectedCardDeckBigKey"
      >
        <span v-t="'button.delete'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { ModeInfo } from "mode";
import LifeCycle from "../../core/decorator/LifeCycle";
import SocketFacade, {
  permissionCheck
} from "../../core/api/app-server/SocketFacade";
import TaskManager from "../../core/task/TaskManager";
import WindowVue from "../../core/window/WindowVue";
import GameObjectManager from "../GameObjectManager";
import { WindowOpenInfo } from "@/@types/window";
import CardDeckSetComponent, { DeckInfo } from "./CardDeckSetComponent.vue";
import { DataReference } from "@/@types/data";
import VueEvent from "../../core/decorator/VueEvent";
import CtrlButton from "../../core/component/CtrlButton.vue";

@Component({
  components: {
    CardDeckSetComponent,
    CtrlButton
  }
})
export default class CardDeckListWindow extends Mixins<WindowVue<void, void>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private cardDeckBigCC = SocketFacade.instance.cardDeckBigCC();
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardDeckBigList = GameObjectManager.instance.cardDeckBigList;
  private selectedCardDeckBigKey: string | null = null;

  @LifeCycle
  private async mounted() {
    await this.init();
    this.isMounted = true;
  }

  private get useCardDeckBigList() {
    return this.cardDeckBigList.filter(cd => permissionCheck(cd, "view"));
  }

  private get useCardMetaList() {
    return this.cardMetaList.filter(cm => permissionCheck(cm, "view"));
  }

  @VueEvent
  private get deckList(): DeckInfo[] {
    return this.useCardDeckBigList.map(cardDeckBig => {
      return {
        cardDeckBig,
        cardMetaList: this.useCardMetaList.filter(
          cm => cm.owner === cardDeckBig.key
        )
      };
    });
  }

  @VueEvent
  private getExclusionOwnerName(exclusionOwner: string) {
    const lockName = GameObjectManager.instance.getExclusionOwnerName(
      exclusionOwner
    );
    const editLabel = this.$t("label.editing")!.toString();
    return `${lockName}(${editLabel})`;
  }

  @VueEvent
  private async addCardDeck() {
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "view-card-deck",
        value: {
          flag: "on" as "on",
          cardDeckKey: ""
        }
      }
    });
  }

  @VueEvent
  private async editCardDeck() {
    if (!this.selectedCardDeckBigKey) return;
    await this.close();
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "card-deck-edit-window",
        args: this.selectedCardDeckBigKey
      }
    });
  }

  @VueEvent
  private async chmodCardDeck() {
    if (!this.selectedCardDeckBigKey) return;
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: "card-deck",
          key: this.selectedCardDeckBigKey
        }
      }
    });
  }

  @VueEvent
  private async deleteCardDeck() {
    if (!this.selectedCardDeckBigKey) return;
    const result = window.confirm(this.$t("message.really-delete")!.toString());
    if (!result) return;
    try {
      await this.cardDeckBigCC.deletePackage([this.selectedCardDeckBigKey]);
    } catch (err) {
      // TODO show message.
      return;
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  width: 100%;
  height: 100%;
}

.card-deck-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  flex: 1;
  border: 1px solid gray;
  padding-bottom: 0.5rem;
  padding-right: 0.5rem;
}

.card-deck-set {
  margin-left: 0.5rem;
  margin-top: 0.5rem;
  width: 10em;
  height: 10em;
  border: 2px solid gray;
  box-sizing: border-box;

  &.add {
    @include flex-box(row, center, center);
    border-style: dashed;

    span {
      @include flex-box(row, center, center);
      border-radius: 50%;
      border: 1px solid black;
      width: 2em;
      height: 2em;
      padding: 0.3rem;
      box-sizing: border-box;
      font-weight: bold;
      font-size: 2rem;
    }
  }
}

.lock-info {
  @include lock-view();
}

.lock-info:after {
  content: var(--msg-locked, "ロック中");
}
</style>
