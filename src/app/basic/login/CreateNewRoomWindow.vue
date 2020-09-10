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
        <span class="label-input" v-t="'label.room-password'"></span>
        <input-password-component
          :comp-key="`${key}-password`"
          v-model="password"
          :setting="true"
          :isPending="!name"
          :placeholder="$t('label.password-placeholder')"
        />
      </label>
      <label>
        <span class="label-input" v-t="'label.game-system-input'"></span>
        <bcdice-system-input
          v-model="system"
          :url.sync="url"
          :isPending="!name"
          :windowInfo="windowInfo"
          @onMouseEnterUrl="onMouseEnterUrl"
        />
      </label>
      <label v-if="isNeedRoomCreatePassword">
        <span class="label-input" v-t="'label.room-create-password'"></span>
        <input-password-component
          :comp-key="`${key}-room-create-password`"
          v-model="roomCreatePassword"
          :setting="false"
          :placeholder="$t('message.room-create-password')"
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
import { Mixins } from "vue-mixin-decorator";
import CtrlButton from "../../core/component/CtrlButton.vue";
import BcdiceSystemInput from "../common/components/BcdiceSystemInput.vue";
import LifeCycle from "../../core/decorator/LifeCycle";
import WindowVue from "../../core/window/WindowVue";
import { CreateRoomInput, RoomInfoExtend } from "../../../@types/socket";
import SocketFacade from "../../core/api/app-server/SocketFacade";
import LanguageManager from "../../../LanguageManager";
import BaseInput from "../../core/component/BaseInput.vue";
import InputPasswordComponent from "../../core/component/InputPasswordComponent.vue";
import VueEvent from "../../core/decorator/VueEvent";

@Component({
  components: {
    CtrlButton,
    BcdiceSystemInput,
    InputPasswordComponent,
    BaseInput
  }
})
export default class CreateNewRoomWindow extends Mixins<
  WindowVue<boolean, CreateRoomInput>
>(WindowVue) {
  private name: string = "";
  private password: string = "";
  private roomCreatePassword: string = "";
  private isNeedRoomCreatePassword: boolean = false;
  /** 選択されているシステム */
  private system: string = "DiceBot";
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
    this.isNeedRoomCreatePassword = this.windowInfo.args!;
    this.inputEnter(".base-area select", this.commit);
    this.inputEnter(".base-area input:not([type='button'])", this.commit);
    if (this.isNeedRoomCreatePassword) {
      this.windowInfo.heightEm += 2;
      this.windowInfo.declare.size.heightEm += 2;
      this.windowInfo.declare.minSize!.heightEm += 2;
      this.windowInfo.declare.maxSize!.heightEm += 2;
    }
  }

  @Watch("url")
  private onChangeUrl() {
    this.system = "DiceBot";
  }

  @VueEvent
  private async commit() {
    await this.finally({
      name: this.name || LanguageManager.instance.getText(""),
      bcdiceServer: this.url,
      system: this.system,
      roomPassword: this.password,
      extend: this.extendInfo,
      roomCreatePassword: this.isNeedRoomCreatePassword
        ? this.roomCreatePassword
        : undefined
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
