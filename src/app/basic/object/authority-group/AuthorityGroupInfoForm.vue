<template>
  <div class="authority-group-info-form">
    <table class="info-table">
      <!-- 名前 -->
      <tr>
        <tr-string-input-component
          labelName="label.name"
          v-model="nameVolatile"
          :placeholder="$t('label.require-text')"
        />
      </tr>
    </table>

    <div class="select-group-block">
      <label class="select-label">
        <span v-t="'label.user'"></span>
        <user-select
          :isUseAll="false"
          :multiple="true"
          v-model="userListInput"
        />
      </label>

      <label class="select-label">
        <span v-t="'label.actor'"></span>
        <actor-select
          :multiple="true"
          v-model="actorListInput"
          :view-user="true"
        />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import TrRangeComponent from "@/app/basic/common/components/table-item/TrRangeComponent.vue";
import TrChatColorInputComponent from "@/app/basic/common/components/table-item/TrChatColorInputComponent.vue";
import { GroupRef } from "@/@types/store-data-optional";
import UserSelect from "@/app/basic/common/components/select/UserSelect.vue";
import ActorSelect from "@/app/basic/common/components/select/ActorSelect.vue";
import { findRequireByKey } from "@/app/core/utility/Utility";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({
  components: {
    ActorSelect,
    UserSelect,
    TrRangeComponent,
    TrChatColorInputComponent,
    TrStringInputComponent
  }
})
export default class AuthorityGroupInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  // isSystem
  @Prop({ type: Boolean, required: true })
  private isSystem!: boolean;

  // name
  @Prop({ type: String, required: true })
  private name!: string;
  private nameVolatile: string = "";
  @Watch("name", { immediate: true })
  private onChangeName(value: string) {
    this.nameVolatile = value;
  }
  @Watch("nameVolatile")
  private onChangeNameVolatile(value: string) {
    this.$emit("update:name", value);
  }

  // list
  @Prop({ type: Array, required: true })
  private list!: GroupRef[];
  private listVolatile: GroupRef[] = [];
  private userListInput: string[] = [];
  private actorListInput: string[] = [];
  @Watch("list", { immediate: true, deep: true })
  private onChangeList(value: GroupRef[]) {
    this.userListInput.splice(
      0,
      this.userListInput.length,
      ...value.filter(item => item.type === "user").map(item => item.userKey)
    );
    this.actorListInput.splice(
      0,
      this.actorListInput.length,
      ...value.filter(item => item.type === "actor").map(item => item.actorKey)
    );
  }
  @Watch("listVolatile")
  private onChangeListVolatile(value: GroupRef[]) {
    this.$emit("update:list", value);
  }

  @Watch("userListInput")
  @Watch("actorListInput")
  private updateList() {
    const list: GroupRef[] = [
      ...this.userListInput.map(u => ({
        type: "user" as "user",
        userKey: u,
        actorKey:
          GameObjectManager.instance.actorList.find(
            a => a.owner === u && a.data!.type === "user"
          )?.key || ""
      })),
      ...this.actorListInput.map(a => ({
        type: "actor" as "actor",
        actorKey: a,
        userKey:
          findRequireByKey(GameObjectManager.instance.actorList, a).owner || ""
      }))
    ];
    if (JSON.stringify(this.listVolatile) !== JSON.stringify(list)) {
      this.listVolatile = list;
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.authority-group-info-form {
  display: contents;
}

.select-group-block {
  @include flex-box(row, flex-start, stretch);
  flex: 1;
}

.select-label {
  @include flex-box(column, stretch, flex-start);
  position: relative;
  height: 100%;
  flex-grow: 1;

  > div {
    @include flex-box(row, stretch, stretch);
    flex: 1;

    > select {
      overflow-y: scroll;
    }
  }
}
</style>
