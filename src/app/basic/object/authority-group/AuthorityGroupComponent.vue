<template>
  <div class="authority-group-component">
    <div class="name">{{ authorityGroup.data.name }}</div>
    <div class="operation-box">
      <s-button
        class="s-button"
        icon="pencil"
        colorStyle="pink"
        :disabled="!isEditable"
        @hover="value => $emit('hoverEdit', value)"
        @click="$emit('edit')"
      />
      <s-button
        class="s-button"
        icon="user-tie"
        colorStyle="pink"
        :disabled="!isChmodAble"
        @hover="value => $emit('hoverChmod', value)"
        @click="$emit('chmod')"
      />
      <s-button
        class="s-button"
        icon="bin"
        colorStyle="pink"
        :disabled="!isDeletable"
        @hover="value => $emit('hoverDelete', value)"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import { AuthorityGroupStore } from "@/@types/store-data";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import ComponentVue from "@/app/core/window/ComponentVue";
import SButton from "@/app/basic/common/components/SButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";

@Component({ components: { SButton } })
export default class AuthorityGroupComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private authorityGroup!: StoreData<AuthorityGroupStore>;

  @VueEvent
  private get isEditable() {
    return (
      permissionCheck(this.authorityGroup, "edit") &&
      !this.authorityGroup.data!.isSystem
    );
  }

  @VueEvent
  private get isChmodAble() {
    return (
      permissionCheck(this.authorityGroup, "chmod") &&
      !this.authorityGroup.data!.isSystem
    );
  }

  @VueEvent
  private get isDeletable() {
    return (
      permissionCheck(this.authorityGroup, "edit") &&
      !this.authorityGroup.data!.isSystem
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.authority-group-component {
  @include flex-box(row, flex-start, center);
  align-self: stretch;
  border: 1px solid gray;
  border-top: none;
  box-sizing: content-box;

  &:first-child {
    border-top: 1px solid gray;
  }

  .name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
  }

  &:hover {
    background-color: var(--uni-color-light-skyblue);
  }
}

.s-button {
  &:not(:first-child) {
    margin-left: 0.3rem;
  }
}
</style>
