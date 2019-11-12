<template>
  <div>
    <div class="base-area">
      <div v-t="`${windowInfo.type}.message`"></div>
      <label>
        <span class="label-input" v-t="'label.user-name'"></span>
        <base-input
          type="text"
          :value="name"
          @input="name = $event.target.value"
          :placeholder="$t('label.nameless')"
          :list="`${key}-user-list`"
          ref="firstFocus"
        />
        <datalist :id="`${key}-user-list`">
          <option
            :value="userName"
            v-for="userName in userNameList"
            :key="userName"
          >
            {{ userName }}
          </option>
        </datalist>
      </label>
      <label>
        <span class="label-input" v-t="'label.password'"></span>
        <input-password-component
          :comp-key="`${key}-password`"
          v-model="password"
          :setting="isSetting"
        />
      </label>
      <label>
        <span class="label-input" v-t="'label.user-type'"></span>
        <user-type-select v-model="userType" />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">
        <span v-t="'button.login'"></span>
      </ctrl-button>
      <ctrl-button @click.stop="rollback()">
        <span v-t="'button.reject'"></span>
      </ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Component, Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import {
  UserLoginInput,
  UserLoginWindowInput,
  UserType
} from "@/@types/socket";
import UserTypeSelect from "@/app/basic/common/components/select/UserTypeSelect.vue";
import LanguageManager from "@/LanguageManager";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";

@Component({
  components: {
    InputPasswordComponent,
    UserTypeSelect,
    DiceBotSelect,
    BaseInput,
    TableComponent,
    CtrlButton
  }
})
export default class UserLoginWindow extends Mixins<
  WindowVue<UserLoginWindowInput>
>(WindowVue) {
  private name: string = "";
  private password: string = "";
  private userType: UserType = "PL";
  private isSetting: boolean = false;
  private userNameList: string[] = [];

  @LifeCycle
  public async mounted() {
    await this.init();
    this.inputEnter(`${this.key}-password`, this.commit);
    this.inputEnter(this.$refs.firstFocus, this.commit);
    this.isSetting = this.windowInfo.args!.isSetting;
    this.userNameList = this.windowInfo.args!.userNameList;
    if (!this.isSetting) {
      this.windowInfo.heightEm = 9.5;
      this.windowInfo.declare.size.heightEm = 9.5;
      this.windowInfo.declare.minSize!.heightEm = 9.5;
      this.windowInfo.declare.maxSize!.heightEm = 9.5;
    }
  }

  @Watch("currentDiceBotSystem")
  private onChangeCurrentDiceBotSystem(system: string) {
    window.console.log(system);
  }

  @VueEvent
  private async commit() {
    this.finally({
      userName: this.name || LanguageManager.instance.getText("label.nameless"),
      userType: this.userType,
      userPassword: this.password
    });
    await this.close();
  }

  @VueEvent
  private async rollback() {
    this.finally();
    await this.close();
  }

  @VueEvent
  private async beforeDestroy() {
    this.finally();
  }

  private finally(userInfo?: UserLoginInput) {
    const task = TaskManager.instance.getTask<UserLoginInput>(
      "window-open",
      this.windowInfo.taskKey
    );
    if (task) task.resolve(userInfo ? [userInfo] : []);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";
.base-area {
  @include flex-box(column, stretch, center);
  line-height: 1.5;

  label {
    @include flex-box(row, flex-start, center);
    margin-top: 0.2rem;

    span {
      color: gray;
      font-size: 80%;
    }

    input {
      flex: 1;
      width: 10px;
    }
  }
}
</style>
