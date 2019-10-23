<template>
  <div>
    <div class="base-area">
      <div>ユーザ情報を入力してください。</div>
      <label>
        <span>ユーザ名：</span>
        <base-input
          type="text"
          :value="name"
          @input="name = $event.target.value"
          placeholder="ななしさん"
        />
      </label>
      <label>
        <span>パスワード(空ならパスワードなし)：</span>
        <base-input
          type="password"
          :value="password"
          @input="password = $event.target.value"
        />
      </label>
      <label>
        <span>ユーザ種別：</span>
        <user-type-select v-model="userType" />
      </label>
    </div>
    <div class="button-area">
      <ctrl-button @click.stop="commit()">ログイン</ctrl-button>
      <ctrl-button @click.stop="rollback()">キャンセル</ctrl-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import WindowVue from "@/app/core/window/WindowVue";
import TableComponent from "@/app/core/component/table/SimpleTableComponent.vue";
import { Mixins } from "vue-mixin-decorator";
import BaseInput from "@/app/core/component/BaseInput.vue";
import DiceBotSelect from "@/app/basic/common/components/select/DiceBotSelect.vue";
import TaskManager from "@/app/core/task/TaskManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import { UserLoginInput, UserType } from "@/@types/room";
import UserTypeSelect from "@/app/basic/common/components/select/UserTypeSelect.vue";

@Component({
  components: {
    UserTypeSelect,
    DiceBotSelect,
    BaseInput,
    TableComponent,
    CtrlButton
  }
})
export default class UserLoginWindow extends Mixins<WindowVue<never>>(
  WindowVue
) {
  private name: string = "";
  private password: string = "";
  private userType: UserType = "GM";

  @Watch("currentDiceBotSystem")
  private onChangeCurrentDiceBotSystem(system: string) {
    window.console.log(system);
  }

  @VueEvent
  private async commit() {
    this.finally({
      userName: this.name,
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
  label {
    @include flex-box(row, flex-start, center);

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
.button-area {
  @include flex-box(row, flex-start, center);

  .margin-left-auto {
    margin-left: auto;
  }
}
</style>
