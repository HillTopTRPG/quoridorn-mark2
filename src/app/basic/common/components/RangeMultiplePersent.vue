<template>
  <vue-slider
    v-model="localValue"
    :width="'100%'"
    :dotSize="10"
    :min="0"
    :max="100"
    :use-keyboard="true"
    :piecewiseLabel="true"
    :enableCross="false"
    tooltip="always"
    :tooltipDir="'top'"
    formatter="{value}%"
    mergeFormatter="{value1}% ~ {value2}%"
    :tooltipStyle="{
      backgroundColor: '#666666',
      borderColor: '#666666',
      fontSize: '1em'
    }"
    :bgStyle="{
      backgroundColor: '#aadddd',
      borderTop: '1px solid #666666',
      borderBottom: '1px solid #666666',
      borderRadius: 0
    }"
    @contextmenu.prevent
  >
    <template slot="label" slot-scope="{ label, active, index }">
      <span
        :class="['custom-label', { active }, { line: index % 50 !== 0 }]"
        v-if="index % 10 === 0"
      >
        {{ index % 50 === 0 ? label : "" }}
      </span>
    </template>
  </vue-slider>
</template>

<script lang="ts">
import vueSlider from "vue-slider-component";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

@Component({
  components: {
    vueSlider
  }
})
export default class RangeMultiplePersent extends Vue {
  @Prop({ type: Array, default: [20, 80] })
  private value!: number[];

  @Emit("input")
  public input(value: number[]) {}

  private get localValue(): number[] {
    return this.value;
  }

  private set localValue(value: number[]) {
    this.input(value);
  }
}
</script>

<style scoped lang="scss">
.vue-slider-component {
  margin: 2em 0 0;
}
.custom-label {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-left: 3px;
  overflow: visible;
  transform: translate(-50%, -1em);
  color: #666666;
  font-weight: bold;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 1.5em);
    margin-bottom: -1px;
    width: 2px;
    height: 1.6em;
    background-color: #666666;
  }

  &.line:after {
    height: 1.3em;
  }
}
</style>
