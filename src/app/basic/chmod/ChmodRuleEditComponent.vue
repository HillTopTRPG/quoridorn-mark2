<template>
  <div class="container" ref="window">
    <permission-type-select v-model="permissionRule.type" />

    <div
      class="permission-node"
      v-for="(pn, idx) in permissionRule.list"
      :key="idx"
    >
      <div class="permission-node-type">
        {{ getSelectedNodeInfo(pn.type, pn.id).type }}
      </div>
      <div class="permission-node-name">
        {{ getSelectedNodeInfo(pn.type, pn.id).name }}
      </div>
      <div class="permission-node-id">
        {{ getSelectedNodeInfo(pn.type, pn.id).id }}
      </div>
      <ctrl-button @click="deletePermissionNode(idx)">
        削除
      </ctrl-button>
    </div>

    <permission-node-type-select v-model="addNodeType" />
    <character-select
      v-model="selectedNodeId"
      :placeList="[]"
      v-if="addNodeType === 'character'"
    />
    <user-select v-model="selectedNodeId" v-if="addNodeType === 'user'" />
    <actor-group-select
      v-model="selectedNodeId"
      v-if="addNodeType === 'group'"
    />
    <div
      class="permission-node-add"
      v-if="getSelectedNodeInfo(addNodeType, selectedNodeId)"
    >
      {{ getSelectedNodeInfo(addNodeType, selectedNodeId).name }}
    </div>
    <ctrl-button @click="addPermissionNode" :disabled="!addable">
      追加
    </ctrl-button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  PermissionNodeType,
  PermissionRule,
  StoreUseData
} from "@/@types/store";
import PermissionTypeSelect from "@/app/basic/common/components/select/PermissionTypeSelect.vue";
import PermissionNodeTypeSelect from "@/app/basic/common/components/select/PermissionNodeTypeSelect.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import CharacterSelect from "@/app/basic/common/components/select/CharacterSelect.vue";
import UserSelect from "@/app/basic/common/components/select/UserSelect.vue";
import ActorGroupSelect from "@/app/basic/common/components/select/ActorGroupSelect.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import VueEvent from "@/app/core/decorator/VueEvent";
import LanguageManager from "@/LanguageManager";

@Component({
  components: {
    CtrlButton,
    ActorGroupSelect,
    UserSelect,
    CharacterSelect,
    PermissionNodeTypeSelect,
    PermissionTypeSelect
  }
})
export default class ChmodRuleEditComponent extends Vue {
  @Prop({ type: Object, required: true })
  private permissionRule!: PermissionRule;

  private isMounted: boolean = false;
  private addNodeType: PermissionNodeType | null = null;
  private selectedNodeId: string | null = null;

  private actorGroupList = GameObjectManager.instance.actorGroupList;
  private userList = GameObjectManager.instance.userList;
  private characterList = GameObjectManager.instance.characterList;

  public key: string = "ChmodRuleEditComponent";

  @LifeCycle
  private async mounted() {
    this.isMounted = true;
    window.console.log(this.permissionRule);
  }

  @Watch("permissionRule", { immediate: true, deep: true })
  private onChangePermissionRule() {
    window.console.log(this.permissionRule);
  }

  private getSelectedNodeInfo(
    type: PermissionNodeType,
    id: string
  ): { type: PermissionNodeType; name: any; id: string | null } | null {
    if (type === "owner") {
      return {
        type,
        name: LanguageManager.instance.getText("label.owner"),
        id: null
      };
    }
    const func = <T extends {}, U extends keyof T>(
      list: StoreUseData<T>[],
      paramName: U
    ): { type: PermissionNodeType; name: string; id: string } | null => {
      const obj = list.filter(i => i.id === id)[0];
      if (!obj) return null;
      return {
        type,
        name: String(obj.data![paramName]!),
        id: obj.id!
      };
    };

    if (type === "group") return func(this.actorGroupList, "name");
    if (type === "user") return func(this.userList, "userName");
    if (type === "character") return func(this.characterList, "name");

    return null;
  }

  private get addable() {
    const type = this.addNodeType;
    if (type === "owner") return true;
    return (
      (type === "group" || type === "user" || type === "character") &&
      this.selectedNodeId
    );
  }

  @VueEvent
  private addPermissionNode() {
    this.permissionRule.list.push({
      type: this.addNodeType!,
      id: this.selectedNodeId!
    });
    this.$emit("update");
  }

  @VueEvent
  private deletePermissionNode(idx: number) {
    this.permissionRule.list.splice(idx, 1);
    this.$emit("update");
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.container {
  @include flex-box(column, stretch, center);
  overflow-y: auto;
}
.permission-node {
  @include flex-box(row, flex-start, center);

  > *:not(:first-child) {
    margin-left: 0.5rem;
  }
}
</style>
