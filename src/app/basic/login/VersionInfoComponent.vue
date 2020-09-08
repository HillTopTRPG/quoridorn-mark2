<template>
  <div ref="container">
    <div class="message">
      <span class="label-input" v-t="'label.version-compatible'"></span>
      <span v-t="`label.${usable ? '' : 'in'}adequate`"></span>
    </div>
    <fieldset>
      <legend v-t="'label.client'"></legend>
      <div class="selectable">
        <div class="version">
          <span class="label-input" v-t="'label.version'"></span>
          {{ clientVersion }}
        </div>
        <div class="target" v-if="targetServer">
          <span class="label-input" v-t="'label.adequate-server'"></span>
          <template v-if="targetServer.from">
            <span>{{ targetServer.from }} &lt;=</span>
            VERSION
            <span v-if="targetServer.to">&lt; {{ targetServer.to }}</span>
          </template>
          <span v-else v-t="'label.not-exist'"></span>
        </div>
      </div>
    </fieldset>
    <fieldset>
      <legend v-t="'label.server'"></legend>
      <div class="selectable">
        <div class="version">
          <span class="label-input" v-t="'label.version'"></span>
          {{ serverVersion }}
        </div>
        <div class="target" v-if="targetClient">
          <span class="label-input" v-t="'label.adequate-client'"></span>
          <template v-if="targetClient.from">
            <span>{{ targetClient.from }} &lt;=</span>
            VERSION
            <span v-if="targetClient.to">&lt; {{ targetClient.to }}</span>
          </template>
          <span v-else v-t="'label.not-exist'"></span>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script lang="ts">
import { Prop } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import { TargetVersion } from "../../core/api/Github";
import LifeCycle from "../../core/decorator/LifeCycle";
import { ServerTestResult } from "@/@types/socket";
import ComponentVue from "@/app/core/window/ComponentVue";

@Component({ components: {} })
export default class VersionInfoComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private serverTestResult!: ServerTestResult;

  private clientVersion: string = process.env.VUE_APP_VERSION!;
  private serverVersion: string | null = null;
  private usable: boolean = false;
  private targetServer: TargetVersion | null = null;
  private targetClient: TargetVersion | null = null;

  @LifeCycle
  public async mounted() {
    this.serverVersion = this.serverTestResult.serverVersion.replace(
      "Quoridorn ",
      ""
    );
    this.usable = this.serverTestResult.usable;
    this.targetServer = this.serverTestResult.targetServer;
    this.targetClient = this.serverTestResult.targetClient;
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.message {
  @include flex-box(row, flex-start, center);
  padding: 0.5rem;
}

fieldset {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin: 0.5rem 0 0;
  padding: 0 0.5rem 0.5rem;
  background-color: white;

  legend {
    background-color: inherit;
    border: inherit;
    line-height: 2em;
    box-sizing: border-box;
  }

  div {
    line-height: 2em;
  }
}
</style>
