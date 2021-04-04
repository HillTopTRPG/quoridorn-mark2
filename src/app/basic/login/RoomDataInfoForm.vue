<template>
  <div class="room-data-info-form">
    <table>
      <tr>
        <tr-string-input-component
          labelName="label.name"
          inputWidth="100%"
          :disabled="!isGm"
          :placeholder="$t('label.require-text')"
          v-model="roomData.name"
        />
      </tr>
      <tr>
        <tr-bcdice-system-input-component
          labelName="label.system"
          v-model="roomData.system"
          :disabled="!isGm"
          :url.sync="roomData.bcdiceServer"
          :bcdice-version.sync="roomData.bcdiceVersion"
          :window-info="windowInfo"
        />
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { WindowInfo } from "@/@types/window";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import TrCheckboxComponent from "@/app/basic/common/components/table-item/TrCheckboxComponent.vue";
import TrGeneralTypeSelectComponent from "@/app/basic/common/components/table-item/TrGeneralTypeSelectComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { RoomDataStore } from "@/@types/store-data";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import TrBcdiceSystemInputComponent from "@/app/basic/common/components/table-item/TrBcdiceSystemInputComponent.vue";

const uuid = require("uuid");

@Component({
  components: {
    TrBcdiceSystemInputComponent,
    TrStringInputComponent,
    TrGeneralTypeSelectComponent,
    TrCheckboxComponent,
    SimpleTabComponent
  }
})
export default class RoomDataInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private windowInfo!: WindowInfo<any>;

  @Prop({ type: Object, required: true })
  private roomData!: RoomDataStore;

  private isMounted: boolean = false;

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }

  private get isGm() {
    return GameObjectManager.instance.isGm;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.room-data-info-form {
  display: contents;
}

table {
  width: 100%;
}
</style>
