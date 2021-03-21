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
          :placeholder="
            $t('create-new-room-window.label.room-name-placeholder')
          "
        />
      </label>
      <label>
        <span
          class="label-input"
          v-t="'create-new-room-window.label.room-password'"
        ></span>
        <input-password-component
          :comp-key="`${key}-password`"
          v-model="password"
          :setting="true"
          :isPending="!name"
          :placeholder="$t('label.password-placeholder')"
        />
      </label>
      <label>
        <span
          class="label-input"
          v-t="'create-new-room-window.label.game-system-input'"
        ></span>
        <bcdice-system-input
          v-model="system"
          :url.sync="bcdiceServer"
          :bcdice-version.sync="bcdiceVersion"
          :isPending="!name"
          :windowInfo="windowInfo"
          @onMouseEnterUrl="onMouseEnterUrl"
        />
      </label>
      <label v-if="isNeedRoomCreatePassword">
        <span
          class="label-input"
          v-t="'create-new-room-window.label.room-create-password'"
        ></span>
        <input-password-component
          :comp-key="`${key}-room-create-password`"
          v-model="roomCreatePassword"
          :setting="false"
          :placeholder="$t('message.room-create-password')"
        />
      </label>
    </div>

    <button-area
      :is-commit-able="isCommitAble"
      commit-text="next"
      @commit="commit()"
      @rollback="rollback()"
    />
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { CreateRoomInput } from "@/@types/socket";
import { RoomInfoExtend } from "@/@types/store-data-optional";
import BcdiceSystemInput from "@/app/basic/common/components/BcdiceSystemInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import BaseInput from "@/app/core/component/BaseInput.vue";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";

@Component({
  components: {
    ButtonArea,
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
  private bcdiceServer = SocketFacade.instance.connectInfo.bcdiceServer;
  private bcdiceVersion = "";
  private system = "DiceBot";
  private extendInfo: RoomInfoExtend = {
    visitable: true,
    isFitGrid: true,
    isViewDice: true,
    isViewCutIn: true,
    isDrawGridId: true,
    mapRotatable: true,
    isShowStandImage: true,
    standImageGridNum: 12,
    isShowRotateMarker: true,
    windowSettings: {
      chat: "free",
      initiative: "free",
      "chat-palette": "free",
      "counter-remocon": "free"
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

  @Watch("bcdiceServer")
  private onChangeUrl() {
    this.system = "DiceBot";
  }

  private get isCommitAble() {
    return !!this.name;
  }

  @VueEvent
  private async commit() {
    const resultInfo: CreateRoomInput = {
      name: this.name || "",
      bcdiceServer: this.bcdiceServer,
      bcdiceVersion: this.bcdiceVersion,
      system: this.system,
      extend: this.extendInfo,
      roomPassword: this.password,
      roomCreatePassword: this.isNeedRoomCreatePassword
        ? this.roomCreatePassword
        : undefined
    };
    await this.finally(resultInfo);
  }

  @VueEvent
  private async rollback() {
    await this.finally();
  }

  private onMouseEnterUrl(isHover: boolean) {
    this.windowInfo.message = isHover
      ? this.$t("label.input-bcdice-url")!.toString()
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
