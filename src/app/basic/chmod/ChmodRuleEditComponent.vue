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
        <span v-t="'type.actor'"></span>
        <actor-select
          v-model="actorListInput"
          :multiple="true"
          :disabled="permissionRule.type === 'none'"
        />
      </label>
      <label class="use-owner">
        <span v-t="'label.owner'"></span>
        <s-check
          v-model="isUseOwner"
          colorStyle="skyblue"
          c-icon="checkmark"
          c-label=""
          n-icon=""
          n-label=""
        />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import LifeCycle from "../../core/decorator/LifeCycle";
import { listToEmpty } from "../../core/utility/PrimaryDataUtility";
import {
  PermissionNodeType,
  PermissionRule,
  PermissionRuleType
} from "../../../@types/store";
import PermissionNodeTypeSelect from "../common/components/select/PermissionNodeTypeSelect.vue";
import CtrlButton from "../../core/component/CtrlButton.vue";
import ActorGroupSelect from "../common/components/select/ActorGroupSelect.vue";
import SCheck from "../common/components/SCheck.vue";
import ActorSelect from "../common/components/select/ActorSelect.vue";
import PermissionTypeSelect from "../common/components/select/PermissionTypeSelect.vue";

@Component({
  components: {
    SCheck,
    CtrlButton,
    ActorGroupSelect,
    ActorSelect,
    PermissionNodeTypeSelect,
    PermissionTypeSelect
  }
})
export default class ChmodRuleEditComponent extends Vue {
  @Prop({ type: Object, required: true })
  private permissionRule!: PermissionRule;

  private isMounted: boolean = false;

  private groupListInput: string[] = [];
  private actorListInput: string[] = [];
  private isUseOwner: boolean = false;

  public key: string = "ChmodRuleEditComponent";

  @LifeCycle
  private async mounted() {
    this.isMounted = true;

    listToEmpty(this.groupListInput);
    listToEmpty(this.actorListInput);
    this.permissionRule.list.forEach(pr => {
      if (pr.type === "owner") {
        this.isUseOwner = true;
        return;
      }
      let list: string[] = [];
      if (pr.type === "group") list = this.groupListInput;
      else if (pr.type === "actor") list = this.actorListInput;
      if (pr.id) list.push(pr.id);
    });
  }

  @Watch("permissionRule.type")
  private onChangePermissionType(type: PermissionRuleType) {
    if (type === "none") {
      listToEmpty(this.permissionRule.list);
      listToEmpty(this.groupListInput);
      listToEmpty(this.actorListInput);
      this.isUseOwner = false;
    }
  }

  @Watch("groupListInput", { deep: true })
  @Watch("actorListInput", { deep: true })
  @Watch("isUseOwner")
  private mergeInputList() {
    listToEmpty(this.permissionRule.list);
    const addList = (list: string[], type: PermissionNodeType) => {
      this.permissionRule.list.push(...list.map(id => ({ type, id })));
    };
    addList(this.groupListInput, "group");
    addList(this.actorListInput, "actor");
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
