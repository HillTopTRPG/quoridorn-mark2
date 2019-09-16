<template>
  <div
    :class="name"
    @mousedown.left.prevent="event => resize(event, name, true)"
    @mouseup.left.prevent="event => resize(event, name, false)"
    @touchstart.prevent="event => resize(event, name, true, true)"
    @touchend.prevent="event => resize(event, name, false, true)"
    @touchcancel.prevent="event => resize(event, name, false, true)"
    @contextmenu.prevent
  ></div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

@Component
export default class WindowFrame extends Vue {
  @Prop({ type: String, required: true })
  private name!: string;

  @Emit("resize")
  private resize(
    event: any,
    direct: string,
    flg: boolean,
    isTouch: boolean = false
  ): void {}
}
</script>
