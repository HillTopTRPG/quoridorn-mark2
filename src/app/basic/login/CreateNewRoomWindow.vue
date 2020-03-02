<template>
  <div ref="window-container">
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <label>
        <span class="label-input" v-t="'label.room-name'"></span>
        <base-input
          type="text"
          :value="name"
          @input="name = $event.target.value"
          :class="{ pending: !name }"
          :placeholder="$t('label.room-name-placeholder')"
        />
      </label>
      <label>
        <span class="label-input" v-t="'label.password'"></span>
        <input-password-component
          :comp-key="`${key}-password`"
          v-model="password"
          :setting="true"
          :isPending="!name"
        />
      </label>
      <label>
        <span class="label-input" v-t="'label.game-system-input'"></span>
        <dice-bot-input
          v-model="system"
          :url.sync="url"
          :isPending="!name"
          :windowInfo="windowInfo"
          @onMouseEnterUrl="onMouseEnterUrl"
        />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()" :disabled="!name">
        <span v-t="'button.next'"></span>
      </ctrl-button>
      <ctrl-button @click.stop="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import { CreateRoomInput, RoomInfoExtend } from "@/@types/socket";
import LanguageManager from "@/LanguageManager";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import DiceBotInput from "@/app/basic/common/components/DiceBotInput.vue";
import { DiceSystem } from "@/@types/bcdice";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";

@Component({
  components: {
    DiceBotInput,
    InputPasswordComponent,
    DiceBotSelect,
    BaseInput,
    TableComponent,
    CtrlButton
  }
})
export default class CreateNewRoomWindow extends Mixins<
  WindowVue<never, CreateRoomInput>
>(WindowVue) {
  private name: string = "";
  private password: string = "";
  /** 選択されているシステム */
  private system: DiceSystem = { system: "DiceBot", name: "DiceBot" };
  private url: string = SocketFacade.instance.connectInfo.bcdiceServer;
  private extendInfo: RoomInfoExtend = {
    visitable: true,
    isFitGrid: true,
    isViewDice: true,
    isViewCutIn: true,
    isDrawGridId: true,
    mapRotatable: true,
    isDrawGridLine: true,
    isShowStandImage: true,
    isShowRotateMarker: true,
    windowSettings: {
      chat: "free",
      resource: "free",
      initiative: "free",
      chatPalette: "free",
      counterRemocon: "free"
    }
  };

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter(".base-area select", this.commit);
    this.inputEnter(".base-area input:not([type='button'])", this.commit);
  }

  @Watch("url")
  private onChangeUrl() {
    this.system = { system: "DiceBot", name: "DiceBot" };
  }

  @VueEvent
  private async commit() {
    await this.finally({
      name: this.name || LanguageManager.instance.getText(""),
      bcdiceServer: this.url,
      system: this.system.system,
      roomPassword: this.password,
      extend: this.extendInfo
    });
  }

  @VueEvent
  private async rollback() {
    await this.finally();
  }

  private onMouseEnterUrl(isHover: boolean) {
    this.windowInfo.message = isHover
      ? LanguageManager.instance.getText("label.input-bcdice-url")
      : "";
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.base-area {
  @include flex-box(column, stretch, center);
  line-height: 1.5;

  label {
    @include flex-box(row, flex-start, center);
    margin-top: 0.2rem;

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
</style>
