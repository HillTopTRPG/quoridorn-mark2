<template>
  <div>
    <div class="base-area"></div>
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
import { UserLoginInput, UserType, VersionWindowInfo } from "@/@types/socket";
import UserTypeSelect from "@/app/basic/common/components/select/UserTypeSelect.vue";
import LanguageManager from "@/LanguageManager";
import InputPasswordComponent from "@/app/core/component/InputPasswordComponent.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import { CommitHistory } from "@/app/core/api/Github";

type ServerVersionInfo = {
  commit: CommitHistory;
  requireClientVersion: string;
};

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
export default class VersionInfoWindow extends Mixins<
  WindowVue<VersionWindowInfo>
>(WindowVue) {
  private name: string = "";
  private password: string = "";
  private userType: UserType = "PL";
  private isSetting: boolean = false;

  @LifeCycle
  public async mounted() {
    await this.init();
    // const clientVersion = process.env.VUE_APP_VERSION as string;
    // const clientRowList = await getCurrentVersionSource(
    //   "quoridorn-mark2",
    //   ".env",
    //   clientVersion
    // );
    // window.console.log(clientRowList);
    // const args = this.windowInfo.args!;
    // const serverVersion = args.version;
    // const serverRequireClientVersion = args.requireClientVersion;
    // const serverRowList = await getCurrentVersionSource(
    //   "quoridorn-server",
    //   ".env",
    //   serverVersion
    // );
    // const getServerRequireClientVersion = (serverRow: string) => {
    //   const propMap: any = {};
    //   serverRow.split("\n").forEach(line => {
    //     const matchResult = line.match(/([0-9a-zA-Z_]) *= *"([^"]+)"/);
    //     if (!matchResult) return;
    //     propMap[matchResult[1]] = matchResult[2];
    //   });
    //   return propMap["REQUIRE_CLIENT_VERSION"];
    // };
    // const serverVersionInfoList: ServerVersionInfo[] = [];
    // serverRowList.forEach(info => {
    //   serverVersionInfoList.push({
    //     commit: info.commit,
    //     requireClientVersion: getServerRequireClientVersion(info.row)
    //   });
    // });
    //
    // if (!serverVersionInfoList.length) {
    //   alert("対応するサーバのバージョンが無いです。");
    // }
    // const startPoint = serverVersionInfoList[0];
    // let endPoint: ServerVersionInfo | null = null;
    // const clientVersionInfo = stringToVersion(clientVersion);
    // for (const info of serverVersionInfoList) {
    //   const compResult = compareVersion(clientVersionInfo, info.commit.version);
    //   if (compResult < 0) {
    //     endPoint = info;
    //     return;
    //   }
    // }
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
