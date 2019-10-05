<template>
  <span>{{ data[property] }}</span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class SimpleTextComponent extends Vue {
  @Prop({ type: Object, default: true })
  private data!: any;
  @Prop({ type: String, default: true })
  private property!: string;
}
</script>
