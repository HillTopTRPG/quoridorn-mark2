<template>
  <div class="item" @click="itemOnClick" @mouseenter="mouseEnter">
    <span class="check"><i v-show="propValue" class="icon-checkmark"></i></span>
    <span><slot /></span>
  </div>
</template>

<script lang="ts">
import { Action, Getter } from "vuex-class";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

@Component({})
export default class MenuBooleanItem extends Vue {
  @Prop({ type: String, required: true })
  private property!: string;

  @Action("reverseProperty") private reverseProperty: any;
  @Getter("isWindowOpen") private isWindowOpen: any;

  @Emit("click")
  private itemOnClick() {
    this.reverseProperty({ property: this.property });
  }

  private mouseEnter(event: any) {
    this.$emit("mouseenter", event);
  }

  private get propValue() {
    return this.isWindowOpen(this.property);
  }
}
</script>

<style scoped lang="scss">
.item {
  position: relative;
  white-space: nowrap;

  > * {
    display: inline;
    vertical-align: middle;
  }

  .check {
    width: 10px;
    height: 10px;
    min-width: 10px;
    min-height: 10px;
    margin-right: 5px;
    border: none;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
