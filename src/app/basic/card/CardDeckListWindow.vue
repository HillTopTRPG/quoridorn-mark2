<template>
  <div class="container" ref="window-container">
    <div class="button-area space-between margin-bottom">
      <ctrl-button @click="send()" :disabled="!selectedCardDeckBigId">
        <span v-t="'button.send'"></span>
      </ctrl-button>
      <ctrl-button @click="preview" :disabled="!selectedCardDeckBigId">
        <span v-t="'button.preview'"></span>
      </ctrl-button>
    </div>
    <div class="card-deck-container">
      <div
        class="card-deck"
        :class="{
          selected: selectedCardDeckBigId === cardDeck.id,
          'lock-info': cardDeck.exclusionOwner
        }"
        v-for="cardDeck in useCardDeckBigList"
        :key="cardDeck.id"
        @click="selectCardDeckBig(cardDeck)"
        @dblclick="editCardDeck()"
        ref="cardDeck"
      >
        <div class="title">{{ cardDeck.data.name }}</div>
        <div class="card-set">
          <div
            class="card"
            v-for="(style, idx) in getDeckStyleList(cardDeck)"
            :key="idx"
            :style="style"
          ></div>
        </div>
      </div>
      <div class="card-deck add" @click="addCardDeck()">
        <span>＋</span>
      </div>
    </div>
    <div class="button-area">
      <ctrl-button @click="editCardDeck()" :disabled="!selectedCardDeckBigId">
        <span v-t="'button.edit'"></span>
      </ctrl-button>
      <ctrl-button @click="chmodCardDeck()" :disabled="!selectedCardDeckBigId">
        <span v-t="'button.chmod'"></span>
      </ctrl-button>
      <ctrl-button
        @click="deleteCardDeck()"
        :disabled="!selectedCardDeckBigId || useCardDeckList.length <= 1"
      >
        <span v-t="'button.delete'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import SeekBarComponent from "@/app/basic/cut-in/bgm/SeekBarComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import SocketFacade, {
  permissionCheck
} from "@/app/core/api/app-server/SocketFacade";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import { StoreUseData } from "@/@types/store";
import { Texture } from "@/@types/room";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";
import VueEvent from "@/app/core/decorator/VueEvent";
import { DataReference } from "@/@types/data";
import LanguageManager from "@/LanguageManager";
import { getSrc, getTextureStyle } from "@/app/core/Utility";
import { ModeInfo } from "mode";
import { CardMeta, CardDeckBig } from "@/@types/gameObject";

@Component({
  components: {
    SceneLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class CardDeckListWindow extends Mixins<WindowVue<void, void>>(
  WindowVue
) {
  private isMounted: boolean = false;
  private cardMetaCC = SocketFacade.instance.cardMetaCC();
  private cardDeckBigCC = SocketFacade.instance.cardDeckBigCC();
  private imageList = GameObjectManager.instance.imageList;
  private cardMetaList = GameObjectManager.instance.cardMetaList;
  private cardDeckBigList = GameObjectManager.instance.cardDeckBigList;
  private selectedCardDeckBigId: string | null = null;

  @LifeCycle
  private async mounted() {
    await this.init();
    this.isMounted = true;
  }

  private get useCardDeckBigList() {
    return this.cardDeckBigList.filter(cd => permissionCheck(cd, "view"));
  }

  @Watch("isMounted")
  @Watch("useCardDeckBigList", { deep: true })
  private onChangeCardDeckList() {
    const elmList: HTMLElement[] = this.$refs.cardDeck as HTMLElement[];
    if (this.useCardDeckBigList.findIndex(s => !s.data) > -1) return;
    setTimeout(() => {
      this.useCardDeckBigList.forEach(async (cd, index) => {
        const elm = elmList[index];

        const texture = cd.data!.name;

        const cardList = this.cardMetaList.filter(c => c.owner === cd.id);
        const textureInfoList: { count: number; cardMeta: CardMeta }[] = [];
        cardList.forEach(c => {
          const textureInfo = textureInfoList.filter(
            t => JSON.stringify(t.cardMeta) === JSON.stringify(texture)
          )[0];
          if (textureInfo) textureInfo.count++;
          else textureInfoList.push({ count: 1, cardMeta: c.data! });
        });
        textureInfoList.sort((t1, t2) => {
          if (t1.count < t2.count) return -1;
          if (t1.count > t2.count) return 1;
          return 0;
        });
        window.console.log(JSON.stringify(textureInfoList, null, "  "));

        let lockName = "";
        if (cd.exclusionOwner) {
          lockName = GameObjectManager.instance.getExclusionOwnerName(
            cd.exclusionOwner
          );
          elm.style.setProperty(
            "--msg-locked",
            `'${LanguageManager.instance.getText(
              "label.editing"
            )}(${lockName})'`
          );
        }
      });
    });
  }

  @VueEvent
  private getDeckStyleList(cardDeckBig: StoreUseData<CardDeckBig>): any[] {
    return [];
    // const cardList = this.cardMetaList.filter(c => c.owner === cardDeckBig.id);
    // if (cardList.length === 0) return [];
    // const textureInfoList: { count: number; cardMeta: CardMeta }[] = [];
    // cardList.forEach(c => {
    //   const texture = c.data!.backImage;
    //   const textureInfo = textureInfoList.filter(
    //     t => JSON.stringify(t.cardMeta.backImage) === JSON.stringify(texture)
    //   )[0];
    //   if (textureInfo) textureInfo.count++;
    //   else textureInfoList.push({ count: 1, cardMeta: c.data });
    // });
    // textureInfoList.sort((t1, t2) => {
    //   if (t1.count < t2.count) return -1;
    //   if (t1.count > t2.count) return 1;
    //   return 0;
    // });
    // window.console.log(JSON.stringify(textureInfoList, null, "  "));
    //
    // if (textureInfoList.length === 1) {
    //   const s = getSrc(textureInfoList[0].cardMeta.backImage);
    //   return [s, s, s];
    // }
    // if (textureInfoList.length === 2) {
    //   const s1 = getSrc(textureInfoList[0].cardMeta.backImage);
    //   const s2 = getSrc(textureInfoList[1].cardMeta.backImage);
    //   return [s1, s1, s2];
    // }
    // const s1 = getSrc(textureInfoList[0].cardMeta.backImage);
    // const s2 = getSrc(textureInfoList[1].cardMeta.backImage);
    // const s3 = getSrc(textureInfoList[2].cardMeta.backImage);
    // return [s1, s2, s3];
  }

  private selectCardDeckBig(cardDeckBig: StoreUseData<CardDeckBig>) {
    this.selectedCardDeckBigId = cardDeckBig.id;
  }

  @VueEvent
  private async send() {
    if (!this.selectedCardDeckBigId) return;
    window.console.log("まだ何も決まってない");
  }

  @VueEvent
  private async preview() {
    if (!this.selectedCardDeckBigId) return;
    GameObjectManager.instance.roomData.sceneId = this.selectedCardDeckBigId;
    await TaskManager.instance.ignition<ModeInfo, never>({
      type: "mode-change",
      owner: "Quoridorn",
      value: {
        type: "view-card-deck",
        value: {
          flag: "on",
          cardDeckId: this.selectedCardDeckBigId
        }
      }
    });
  }

  @VueEvent
  private async editCardDeck() {
    if (!this.selectedCardDeckBigId) return;
    await this.close();
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "card-deck-edit-window",
        args: this.selectedCardDeckBigId
      }
    });
  }

  @VueEvent
  private async chmodCardDeck() {
    if (!this.selectedCardDeckBigId) return;
    await TaskManager.instance.ignition<WindowOpenInfo<DataReference>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "chmod-window",
        args: {
          type: "card-deck",
          docId: this.selectedCardDeckBigId
        }
      }
    });
  }

  @VueEvent
  private async deleteCardDeck() {
    if (!this.selectedCardDeckBigId) return;
    const result = window.confirm(
      LanguageManager.instance.getText("label.really-delete")
    );
    if (!result) return;
    try {
      await this.cardDeckBigCC.touchModify(this.selectedCardDeckBigId);
    } catch (err) {
      // TODO show message.
      return;
    }
    await this.cardDeckBigCC.delete(this.selectedCardDeckBigId);
  }

  private async addCardDeck() {
    await TaskManager.instance.ignition<WindowOpenInfo<string>, never>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "card-deck-add-window",
        args: this.selectedCardDeckBigId!
      }
    });
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

.lock-info {
  @include lock-view();
}

.lock-info:after {
  content: var(--msg-locked, "ロック中");
}

.title {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-block;
  background-color: white;
  border: 1px solid gray;
  border-top-width: 0;
  border-left-width: 0;
  padding: 0 0.2rem;
}

.area-map-container {
  @include flex-box(row, flex-start, flex-start, wrap);
  padding-top: 0.5rem;
  padding-left: 0.5rem;
  border: 1px solid black;
  box-sizing: border-box;
  overflow-y: scroll;
  flex: 1;

  .area-map {
    position: relative;
    width: 10em;
    height: 10em;
    border: 2px solid gray;
    background-image: var(--background-image);
    background-color: var(--background-color);
    background-size: cover;
    background-position: center;
    transform: var(--image-direction);
    box-sizing: border-box;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    overflow-x: hidden;

    &.selected {
      border-color: red;
    }

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
}
</style>
