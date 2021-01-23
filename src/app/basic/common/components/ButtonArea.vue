<template>
  <div class="button-area">
    <ctrl-button @click="$emit('commit')" :disabled="!isCommitAble">
      <span v-t="`button.${commitText}`"></span>
    </ctrl-button>
    <ctrl-button @click="$emit('rollback')">
      <span v-t="`button.${rollbackText}`"></span>
    </ctrl-button>
    <ctrl-button @click="$emit('preview')" v-if="usePreview">
      <span v-t="'button.preview'"></span>
    </ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-mixin-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Prop } from "vue-property-decorator";

@Component({ components: { CtrlButton } })
export default class ButtonArea extends Mixins<ComponentVue>(ComponentVue) {
  @Prop({ type: Boolean, required: true })
  private isCommitAble!: boolean;

  @Prop({ type: String, required: true })
  private commitText!: string;

  @Prop({ type: String, default: "reject" })
  private rollbackText!: string;

  @Prop({ type: Boolean, default: false })
  private usePreview!: boolean;
}
</script>

<style scoped lang="scss">
.button-area {
  align-self: center;
}
</style>
