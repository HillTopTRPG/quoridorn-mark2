<template>
  <password
    :id="`${compKey}-password`"
    v-model="localValue"
    :secureLength="10"
    :toggle="true"
    :required="false"
    title=""
    :placeholder="$t('label.passwordPlaceholder')"
    @score="showScore"
    @feedback="showFeedback"
  />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Emit, Prop } from "vue-property-decorator";
import VueEvent from "@/app/core/decorator/VueEvent";
import Password from "vue-password-strength-meter";

@Component({
  components: { Password }
})
export default class InputPasswordComponent extends Vue {
  @Prop({ type: String, required: true })
  public value!: string;
  @Prop({ type: String, required: true })
  public compKey!: string;

  @Emit("input")
  public input(password: string) {}

  public get localValue(): string {
    return this.value;
  }

  public set localValue(password: string) {
    this.input(password);
  }

  @VueEvent
  showFeedback({
    suggestions,
    warning
  }: {
    suggestions: string;
    warning: string;
  }) {
    window.console.log("🙏", suggestions);
    window.console.log("⚠", warning);
  }

  @VueEvent
  showScore(score: string) {
    window.console.log("💯", score);
  }
}
</script>

<style lang="scss">
@import "../../../assets/common";

.Password {
  height: 2.5em;
  flex: 1;
  max-width: inherit;
  margin: 0;

  .Password__field {
    padding: 0;
    font-size: inherit;
    height: 2em;
    background-color: white;
    border: solid 1px gray;
  }

  .Password__strength-meter {
    height: 0.5em;
    margin: 0;
  }
}
</style>
