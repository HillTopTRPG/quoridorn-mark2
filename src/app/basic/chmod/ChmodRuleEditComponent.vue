<template>
  <div class="chmod-rule-edit-component" ref="window">
    <label>
      <span v-t="'label.permission-type'"></span>
      <permission-type-select v-model="permissionRule.type" />
    </label>

    <div class="chmod-container" v-if="permissionRule.type !== 'none'">
      <label class="select-label">
        <span v-t="'label.group'"></span>
        <actor-group-select
          v-model="groupListInput"
          :multiple="true"
          :disabled="permissionRule.type === 'none'"
        />
      </label>
      <label class="select-label">
        <span v-t="'label.user'"></span>
        <user-select
          v-model="userListInput"
          :multiple="true"
          :disabled="permissionRule.type === 'none'"
        />
      </label>
      <label class="select-label">
        <span v-t="'label.character'"></span>
        <character-select
          v-model="characterListInput"
          :placeList="[]"
          :multiple="true"
          :disabled="permissionRule.type === 'none'"
        />
      </label>
      <label class="use-owner">
        <span v-t="'label.owner'"></span>
        <base-input
          type="checkbox"
          :value="isUseOwner"
          @input="isUseOwner = $event.target.value"
          :disabled="permissionRule.type === 'none'"
        />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  PermissionNodeType,
  PermissionRule,
  PermissionRuleType
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
import { listToEmpty } from "@/app/core/Utility";
import BaseInput from "@/app/core/component/BaseInput.vue";

@Component({
  components: {
    BaseInput,
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

  private groupListInput: string[] = [];
  private userListInput: string[] = [];
  private characterListInput: string[] = [];
  private isUseOwner: boolean = false;

  private actorGroupList = GameObjectManager.instance.actorGroupList;
  private userList = GameObjectManager.instance.userList;
  private characterList = GameObjectManager.instance.characterList;

  public key: string = "ChmodRuleEditComponent";

  @LifeCycle
  private async mounted() {
    this.isMounted = true;

    listToEmpty(this.groupListInput);
    listToEmpty(this.userListInput);
    listToEmpty(this.userListInput);
    this.permissionRule.list.forEach(pr => {
      if (pr.type === "owner") {
        this.isUseOwner = true;
        return;
      }
      let list: string[] = [];
      if (pr.type === "group") list = this.groupListInput;
      else if (pr.type === "user") list = this.userListInput;
      else if (pr.type === "character") list = this.characterListInput;
      if (pr.id) list.push(pr.id);
    });
  }

  @Watch("permissionRule.type")
  private onChangePermissionType(type: PermissionRuleType) {
    if (type === "none") {
      listToEmpty(this.permissionRule.list);
      listToEmpty(this.groupListInput);
      listToEmpty(this.userListInput);
      listToEmpty(this.userListInput);
      this.isUseOwner = false;
    }
  }

  @Watch("groupListInput", { deep: true })
  @Watch("userListInput", { deep: true })
  @Watch("characterListInput", { deep: true })
  @Watch("isUseOwner")
  private mergeInputList() {
    listToEmpty(this.permissionRule.list);
    const addList = (list: string[], type: PermissionNodeType) => {
      this.permissionRule.list.push(...list.map(id => ({ type, id })));
    };
    addList(this.groupListInput, "group");
    addList(this.userListInput, "user");
    addList(this.characterListInput, "character");
    if (this.isUseOwner) {
      this.permissionRule.list.push({
        type: "owner"
      });
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.chmod-rule-edit-component {
  @include flex-box(column, flex-start, flex-start);
  overflow-y: auto;
  flex: 1;
  width: 100%;

  > label {
    @include flex-box(row, flex-start, center);
  }

  .chmod-container {
    @include flex-box(row, stretch, flex-start);
    flex: 1;
    width: 100%;

    > *:not(:first-child) {
      margin-left: 0.5rem;
    }

    .select-label {
      @include flex-box(column, stretch, flex-start);
      height: 100%;
      flex: 1;

      > div {
        @include flex-box(row, stretch, stretch);
        flex: 1;
      }
    }

    > label {
      @include flex-box(column, center, center);
    }
  }
}
</style>
