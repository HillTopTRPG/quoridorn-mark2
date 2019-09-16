<template>
  <td
    class="divider"
    :class="{ isHover: hoverDevIndex === index }"
    @dblclick.stop="doubleClick()"
    @mouseover="hoverDev(index)"
    @mouseout="hoverDev()"
    @mousedown="event => moveDevStart(event, index)"
    @contextmenu.prevent
  ></td>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import { Action } from "vuex-class";

@Component
export default class Divider extends Vue {
  @Prop({ type: Number, required: true })
  private index!: number;

  @Prop({ type: String, required: true })
  private prop!: string;

  @Action("setProperty") private setProperty: any;

  hoverDev(index: number): void {
    if (this.movingIndex === -1) {
      this.setProperty({
        property: `private.display.${this.prop}.hoverDevIndex`,
        value: index !== undefined ? index : -1,
        logOff: true
      });
    }
  }
  moveDevStart(event: any, index: number): void {
    this.setProperty({
      property: `private.display.${this.prop}`,
      value: {
        movingIndex: index,
        movedIndex: index,
        startX: event.clientX,
        startLeftWidth: this.widthList[index],
        startRightWidth: this.widthList[index + 1]
      },
      logOff: true
    });
  }

  @Emit("doubleClick")
  doubleClick(): void {}

  get widthList() {
    return this.$store.state.private.display[this.prop].widthList;
  }
  get hoverDevIndex() {
    return this.$store.state.private.display[this.prop].hoverDevIndex;
  }
  get movingIndex() {
    return this.$store.state.private.display[this.prop].movingIndex;
  }
}
</script>

<style scoped lang="scss">
.divider {
  background-color: rgb(183, 186, 188);
  cursor: col-resize;
  position: relative;
  width: 1px;

  &:after {
    position: absolute;
    height: 100%;
    top: 0;
    left: -3px;
    content: "";
    width: 7px;
  }
}
</style>
