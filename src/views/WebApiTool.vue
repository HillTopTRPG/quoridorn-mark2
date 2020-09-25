<template>
  <div id="web-api-tool">
    <div class="line">
      <label
        >Server url：<input
          type="text"
          class="server-url"
          v-model="apiUrlBase"
          placeholder="{BaseUrl}/{server.yaml.webApiPathBase}/"
      /></label>
      <ctrl-button @click="onClickTest()">Test</ctrl-button>
      {{ urlTestResult }}
    </div>

    <div class="block">
      <div class="line">
        <label
          >Server password：<input
            type="text"
            class="server-password"
            v-model="serverPassword"
        /></label>
        <ctrl-button @click="onClickGetToken()">Get Token</ctrl-button>
        ※ server.yaml.webApiPassword
      </div>
      <span>Server token：{{ serverToken }}</span>
      <span>Server token-expires：{{ serverTokenExpires | moment() }}</span>
    </div>

    <table class="room-list">
      <caption>
        <div>
          <span>Room list</span>
          <ctrl-button @click="onClickGetRooms()">Get room list</ctrl-button>
          <label>
            <span>standard</span>
            <input
              type="radio"
              name="roomInfoListAuthType"
              v-model="roomInfoListAuthType"
              value="standard"
            />
          </label>
          <label>
            <span>admin</span>
            <input
              type="radio"
              name="roomInfoListAuthType"
              v-model="roomInfoListAuthType"
              value="admin"
            />
          </label>
          <span>{{ roomInfoListGetTime | moment() }}</span>
        </div>
      </caption>
      <thead>
        <tr>
          <th class="radio"></th>
          <th class="room-no">room-no</th>
          <th class="name">name</th>
          <template v-if="roomInfoListAuthType === 'admin'">
            <th class="member-num">member-num</th>
            <th class="bcdice-server">bcdice-server</th>
            <th class="system">system</th>
            <th class="room-collection-prefix">room-collection-prefix</th>
            <th class="storage-id">storage-id</th>
            <th class="create-time">create-time</th>
            <th class="update-time">update-time</th>
            <th class="delete-room">delete-room</th>
          </template>
          <th class="get-token">Get token</th>
          <th class="room-password" v-if="roomInfoListAuthType === 'standard'">
            room-password
          </th>
          <th class="token">token</th>
          <th class="token-expires">token-expires</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in roomInfoList"
          :key="r.roomNo"
          @click="onClickRoomRow(r.roomNo)"
          :class="{ selected: selectedRoomNo === r.roomNo }"
        >
          <td class="radio">
            <label>
              <input
                type="radio"
                name="room"
                :value="r.roomNo"
                v-model="selectedRoomNo"
              />
            </label>
          </td>
          <td class="room-no">{{ r.roomNo }}</td>
          <td class="name">{{ r.name }}</td>
          <template v-if="roomInfoListAuthType === 'admin'">
            <td class="member-num">{{ r.memberNum }}</td>
            <td class="bcdice-server">{{ r.bcdiceServer }}</td>
            <td class="system">{{ r.system }}</td>
            <td class="room-collection-prefix">{{ r.roomCollectionPrefix }}</td>
            <td class="storage-id">{{ r.storageId }}</td>
            <td class="create-time">{{ r.createTime | moment() }}</td>
            <td class="update-time">{{ r.updateTime | moment() }}</td>
            <th class="delete-room">
              <ctrl-button @click="onClickDeleteRoom(r.roomNo)"
                >Delete</ctrl-button
              >
            </th>
          </template>
          <td class="get-token">
            <ctrl-button @click="onClickGetRoomToken(r.roomNo)"
              >Get</ctrl-button
            >
          </td>
          <td class="room-password" v-if="roomInfoListAuthType === 'standard'">
            <label>
              <input
                type="password"
                :value="roomAdditionalInfoMap[r.roomNo].password"
                @input="event => updateRoomPassword(r.roomNo, event)"
              />
            </label>
          </td>
          <td class="token">{{ roomAdditionalInfoMap[r.roomNo].token }}</td>
          <td class="token-expires">
            {{ roomAdditionalInfoMap[r.roomNo].expires | moment() }}
          </td>
        </tr>
      </tbody>
    </table>

    <table class="user-list">
      <caption>
        <div>
          <span>User list</span>
          <ctrl-button
            @click="onClickGetUsers()"
            :disabled="roomInfoList.length === 0"
            >Get user list</ctrl-button
          >
          <label>
            <span>standard</span>
            <input
              type="radio"
              name="userInfoListAuthType"
              v-model="userInfoListAuthType"
              value="standard"
            />
          </label>
          <label>
            <span>admin</span>
            <input
              type="radio"
              name="userInfoListAuthType"
              v-model="userInfoListAuthType"
              value="admin"
            />
          </label>
          <span>{{ userInfoListGetTime | moment() }}</span>
        </div>
      </caption>
      <thead>
        <tr>
          <th class="radio"></th>
          <th class="room-no">room-no</th>
          <th class="user-key">user-key</th>
          <th class="name">name</th>
          <th class="type">type</th>
          <template v-if="userInfoListAuthType === 'admin'">
            <th class="login-num">login-num</th>
            <th class="create-time">create-time</th>
            <th class="update-time">update-time</th>
          </template>
          <th class="get-token">Get token</th>
          <th class="room-password" v-if="userInfoListAuthType === 'standard'">
            user-password
          </th>
          <th class="token">token</th>
          <th class="token-expires">token-expires</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in userInfoList"
          :key="u.userKey"
          @click="onClickUserRow(u.userKey)"
          :class="{ selected: selectedUserKey === u.userKey }"
        >
          <td class="radio">
            <label>
              <input
                type="radio"
                name="user"
                :value="u.userKey"
                v-model="selectedUserKey"
              />
            </label>
          </td>
          <td class="room-no">{{ u.roomNo }}</td>
          <td class="user-key">{{ u.userKey }}</td>
          <td class="name">{{ u.name }}</td>
          <td class="type">{{ u.type }}</td>
          <template v-if="userInfoListAuthType === 'admin'">
            <td class="login-num">{{ u.login }}</td>
            <td class="create-time">{{ u.createTime | moment() }}</td>
            <td class="update-time">{{ u.updateTime | moment() }}</td>
          </template>
          <td class="get-token">
            <ctrl-button @click="onClickGetUserToken(u.userKey)"
              >Get</ctrl-button
            >
          </td>
          <td class="user-password" v-if="userInfoListAuthType === 'standard'">
            <label>
              <input
                type="password"
                :value="userAdditionalInfoMap[u.userKey].password"
                @input="event => updateUserPassword(u.userKey, event)"
              />
            </label>
          </td>
          <td class="token">{{ userAdditionalInfoMap[u.userKey].token }}</td>
          <td class="token-expires">
            {{ userAdditionalInfoMap[u.userKey].expires | moment() }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import moment from "moment/moment";
import VueEvent from "@/app/core/decorator/VueEvent";

const locale =
  (window.navigator as any)["userLanguage"] ||
  (window.navigator as any)["language"];
moment.locale(locale);

class HttpError implements Error {
  public name = "HttpError";

  constructor(public status: number, public message: string) {}

  public toString() {
    return `【${this.name}】 ${this.status}: ${this.message}`;
  }
}

type RoomInfo = {
  roomNo: number;
  name: string;
  memberNum: number;
  bcdiceServer: string;
  system: string;
  roomCollectionPrefix: string;
  storageId: string;
  createTime: Date;
  updateTime: Date;
};

type UserInfo = {
  roomNo: number;
  userKey: string;
  name: string;
  login: number;
  type: string;
  createTime: Date;
  updateTime: Date;
};

@Component({
  components: { CtrlButton },
  filters: {
    /**
     * @param {Date} value    - Date オブジェクト
     * @param {string} format - 変換したいフォーマット
     */
    moment(value: Date | null, format: string) {
      if (!value) return "";
      const m = moment(value);
      return `${m.format("ll")} ${m.format("LTS")}`;
    }
  }
})
export default class AdminTool extends Vue {
  private apiUrlBase = "";
  private urlTestResult: string = "";

  private serverPassword: string = "";
  private serverToken: string = "";
  private serverTokenExpires: Date | null = null;

  private roomInfoListAuthType: "standard" | "admin" = "standard";
  private roomInfoList: RoomInfo[] = [];
  private roomInfoListGetTime: Date | null = null;
  private selectedRoomNo: number = -1;

  private userInfoListAuthType: "standard" | "admin" = "standard";
  private userInfoList: UserInfo[] = [];
  private userInfoListGetTime: Date | null = null;
  private selectedUserKey: string = "";

  private roomAdditionalInfoMap: {
    [roomNo: number]: {
      token: string;
      password: string;
      expires: Date | null;
    };
  } = {};

  private userAdditionalInfoMap: {
    [userKey: string]: {
      token: string;
      password: string;
      expires: Date | null;
    };
  } = {};

  @VueEvent
  private updateRoomPassword(roomNo: number, passwordInputEvent: InputEvent) {
    if (!(passwordInputEvent.target instanceof HTMLInputElement)) return;
    const roomAdditionalInfo = this.roomAdditionalInfoMap[roomNo];
    roomAdditionalInfo.password = passwordInputEvent.target.value;
    this.$set(this.roomAdditionalInfoMap, roomNo, roomAdditionalInfo);
  }

  @VueEvent
  private updateUserPassword(userKey: string, passwordInputEvent: InputEvent) {
    if (!(passwordInputEvent.target instanceof HTMLInputElement)) return;
    const userAdditionalInfo = this.userAdditionalInfoMap[userKey];
    userAdditionalInfo.password = passwordInputEvent.target.value;
    this.$set(this.userAdditionalInfoMap, userKey, userAdditionalInfo);
  }

  @VueEvent
  private async onClickDeleteRoom(roomNo: number): Promise<void> {
    const isConfirm = await swal({
      title: "Are you sure?",
      text: "This operation is irreversible.",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true
    });
    if (isConfirm) {
      this.deleteRoomApi(roomNo)
        .then(async () => {
          await this.onClickGetRooms();
        })
        .catch();
    }
  }

  @VueEvent
  private async onClickGetRoomToken(
    roomNo: number
  ): Promise<
    | {
        token: string;
        password: string;
        expires: Date | null;
      }
    | undefined
  > {
    const roomTokenInfo = await this.getRoomTokenApi(roomNo).catch(
      async err => {
        if (
          (err.status === 401 && err.message === "Expired token.") ||
          (err.status === 401 && err.message.startsWith("Invalid token."))
        ) {
          await this.onClickGetToken();
          return await this.getRoomTokenApi(roomNo);
        }
        return null;
      }
    );

    if (roomTokenInfo) {
      const roomPassword = this.roomAdditionalInfoMap[roomNo].password;
      this.$set(this.roomAdditionalInfoMap, roomNo, {
        password: roomPassword,
        token: roomTokenInfo.token,
        expires: roomTokenInfo.expires
      });
      return this.roomAdditionalInfoMap[roomNo];
    } else {
      this.$set(this.roomAdditionalInfoMap, roomNo, {
        password: "",
        token: "",
        expires: null
      });
      return;
    }
  }

  @VueEvent
  private async onClickGetUserToken(
    userKey: string
  ): Promise<
    | {
        token: string;
        password: string;
        expires: Date | null;
      }
    | undefined
  > {
    const userPassword = this.userAdditionalInfoMap[this.selectedUserKey]
      .password;
    const userTokenInfo = await this.getUserTokenApi().catch(async err => {
      console.log(err);
      if (
        (err.status === 401 && err.message === "Expired token.") ||
        (err.status === 401 && err.message.startsWith("Invalid token."))
      ) {
        await this.onClickGetRoomToken(this.selectedRoomNo);
        return await this.getUserTokenApi();
      }
      return null;
    });

    console.log(userTokenInfo);
    if (userTokenInfo) {
      this.$set(this.userAdditionalInfoMap, userKey, {
        password: userPassword,
        token: userTokenInfo.token,
        expires: userTokenInfo.expires
      });
      return this.userAdditionalInfoMap[userKey];
    } else {
      this.$set(this.userAdditionalInfoMap, userKey, {
        password: "",
        token: "",
        expires: null
      });
      return;
    }
  }

  private async deleteRoomApi(roomNo: number): Promise<void> {
    return await this.deleteJson(
      `${this.apiUrlBase}v1/rooms/${roomNo}`,
      `Bearer ${this.serverToken}`
    );
  }

  private async getRoomTokenApi(
    roomNo: number
  ): Promise<{ result: boolean; token: string; expires: Date }> {
    let authorization = this.roomAdditionalInfoMap[roomNo].password;
    if (this.roomInfoListAuthType === "admin") {
      authorization = `Bearer ${this.serverToken}`;
    }
    return await this.getJson(
      `${this.apiUrlBase}v1/rooms/${roomNo}/token`,
      authorization
    );
  }

  private async getUserTokenApi(): Promise<{
    result: boolean;
    token: string;
    expires: Date;
  }> {
    const userKey = this.selectedUserKey;
    const roomNo = this.userInfoList.find(u => u.userKey === userKey)!.roomNo;
    const roomToken = this.roomAdditionalInfoMap[roomNo].token;
    const userPassword = this.userAdditionalInfoMap[userKey].password;
    const url = `${this.apiUrlBase}v1/rooms/${roomNo}/users/${userKey}/token`;

    const header =
      this.userInfoListAuthType === "standard"
        ? `Bearer ${roomToken}/${userPassword}`
        : `Bearer ${this.serverToken}`;
    return await this.getJson(url, header);
  }

  @VueEvent
  private async onClickTest(): Promise<void> {
    const result = await this.getInfoApi().catch(() => null);
    this.urlTestResult = result && result.result ? "OK" : "NG";
  }

  @VueEvent
  private async onClickGetToken(): Promise<boolean> {
    const tokenInfo = await this.getTokenApi(this.serverPassword).catch(
      () => null
    );
    if (!tokenInfo) {
      this.serverToken = "";
      this.serverTokenExpires = null;
      return false;
    }
    this.serverToken = tokenInfo.token;
    this.serverTokenExpires = tokenInfo.expires;
    return true;
  }

  @VueEvent
  private async onClickGetRooms() {
    const result = await this.getRoomListApi().catch(() => {
      return null;
    });
    if (!result) {
      this.roomInfoList = [];
      this.selectedRoomNo = -1;
      return;
    }
    const roomInfoList = result.rooms;
    roomInfoList.forEach(r => {
      if (this.roomAdditionalInfoMap[r.roomNo] === undefined) {
        this.$set(this.roomAdditionalInfoMap, r.roomNo, {
          password: "",
          token: "",
          expires: null
        });
      }
    });
    if (roomInfoList.length) {
      this.selectedRoomNo = roomInfoList[0].roomNo;
    }
    this.roomInfoList = roomInfoList;
  }

  @VueEvent
  private async onClickGetUsers() {
    const result = await this.getUserListApi(this.selectedRoomNo).catch(() => {
      return null;
    });
    if (!result) {
      this.userInfoList = [];
      this.selectedUserKey = "";
      return;
    }
    const userInfoList = result.users;
    userInfoList.forEach(u => {
      if (this.userAdditionalInfoMap[u.userKey] === undefined) {
        this.$set(this.userAdditionalInfoMap, u.userKey, {
          password: "",
          token: "",
          expires: null
        });
      }
    });
    if (userInfoList.length) {
      this.selectedUserKey = userInfoList[0].userKey;
    }
    this.userInfoList = userInfoList;
  }

  @VueEvent
  private onClickRoomRow(roomNo: number) {
    this.selectedRoomNo = roomNo;
  }

  @VueEvent
  private onClickUserRow(userKey: string) {
    this.selectedUserKey = userKey;
  }

  private async getInfoApi() {
    const url = `${this.apiUrlBase}v1/`;
    return await this.getJson(url);
  }

  private async getTokenApi(
    serverPassword: string
  ): Promise<{ result: boolean; token: string; expires: Date }> {
    const url = `${this.apiUrlBase}v1/token`;
    return await this.getJson(url, serverPassword);
  }

  private async getRoomListApi(): Promise<{
    result: boolean;
    rooms: RoomInfo[];
  } | null> {
    let authorization: string | undefined = undefined;
    if (this.roomInfoListAuthType === "admin") {
      authorization = `Bearer ${this.serverToken}`;
    }
    const url = `${this.apiUrlBase}v1/rooms`;
    const json = await this.getJson(url, authorization).catch(async err => {
      console.log(err);
      if (
        (err.status === 401 && err.message === "Expired token.") ||
        (err.status === 401 && err.message.startsWith("Invalid token.")) ||
        (err.status === 401 && err.message.startsWith("Need token."))
      ) {
        return (await this.onClickGetToken())
          ? await this.getRoomListApi()
          : null;
      }
      throw err;
    });
    this.roomInfoListGetTime = new Date();
    return json;
  }

  private async getUserListApi(
    roomNo: number
  ): Promise<{ result: boolean; users: UserInfo[] } | undefined> {
    let authorization: string | undefined = undefined;
    if (this.userInfoListAuthType === "admin") {
      authorization = `Bearer ${this.serverToken}`;
    } else {
      let roomTokenObj:
        | {
            token: string;
            password: string;
            expires: Date | null;
          }
        | undefined = this.roomAdditionalInfoMap[roomNo];
      if (!roomTokenObj || !roomTokenObj.token) {
        roomTokenObj = await this.onClickGetRoomToken(roomNo);
        if (!roomTokenObj) return;
      }
      const roomToken = roomTokenObj.token;
      authorization = `Bearer ${roomToken}`;
    }
    const url = `${this.apiUrlBase}v1/rooms/${roomNo}/users`;
    const json = await this.getJson(url, authorization).catch(async err => {
      if (
        (err.status === 401 && err.message === "Expired token.") ||
        (err.status === 401 && err.message.startsWith("Invalid token.")) ||
        (err.status === 401 && err.message.startsWith("Need token."))
      ) {
        if (this.userInfoListAuthType === "admin") {
          if (!(await this.onClickGetToken())) return;
        } else {
          this.$set(this.roomAdditionalInfoMap, roomNo, {
            password: this.roomAdditionalInfoMap[roomNo]!.password,
            token: "",
            expires: null
          });
        }
        return await this.getUserListApi(roomNo);
      }
      throw err;
    });
    this.userInfoListGetTime = new Date();
    return json;
  }

  private async deleteJson(url: string, authorization: string): Promise<void> {
    const result = await window.fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: authorization
      }
    });
    const status = result.status;
    if (status !== 200) {
      const errMsg = await result.text();
      console.log(
        `${status}: ${errMsg} [DELETE] ${url.replace(this.apiUrlBase, "")}`
      );
      await swal({
        title: status.toString(),
        text: errMsg,
        icon: "error"
      });
      throw new HttpError(status, errMsg);
    }
  }

  private async getJson(url: string, authorization?: string): Promise<any> {
    if (!this.apiUrlBase) {
      await swal({
        title: "Please specify a valid server URL.",
        text: `URL: ${url}`,
        icon: "error"
      });
      return;
    }
    const headers: any = {};
    if (authorization !== undefined) {
      headers.Authorization = authorization;
    }

    const result = await window
      .fetch(url, {
        method: "GET",
        headers
      })
      .catch(() => null);

    if (!result) {
      await swal({
        title: "Please specify a valid server URL.",
        text: `URL: ${url}`,
        icon: "error"
      });
      return;
    }

    const status = result.status;

    if (status !== 200) {
      const errMsg = await result.text();
      console.log(
        `${status}: ${errMsg} [GET] ${url.replace(this.apiUrlBase, "")}`
      );
      if (
        status !== 401 ||
        (errMsg !== "Expired token." &&
          !errMsg.startsWith("Invalid token.") &&
          !errMsg.startsWith("Need token."))
      ) {
        await swal({
          title: status.toString(),
          text: errMsg,
          icon: "error"
        });
      }
      throw new HttpError(status, errMsg);
    }

    try {
      return await result.json();
    } catch (err) {
      await swal({
        title: "Please specify a valid server URL.",
        text: `URL: ${url}`,
        icon: "error"
      });
    }
  }
}
</script>

<style scoped lang="scss">
@import "../assets/common";

html,
body {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-size: 14px;
  background-color: #f0f0f0;
}

#web-api-tool {
  @include flex-box(column, flex-start, flex-start);

  .server-url {
    width: 20em;
  }

  .server-password {
    width: 10em;
  }

  table {
    table-layout: fixed;
    border-bottom: 1px solid black;
    border-right: 1px solid black;
    background-color: white;
    margin-top: 0.5em;

    caption {
      > div {
        @include flex-box(row, flex-start, center);
        padding-right: 2em;
        white-space: nowrap;

        > span:first-child {
          font-size: 1.3em;
          font-weight: bold;
          margin-right: 1em;
        }

        label {
          @include flex-box(column, center, flex-start);
          margin: 0 0.5em;
        }
      }
    }

    tr {
      &:hover {
        background-color: lightcyan;
      }

      &.selected {
        background-color: lightyellow;
      }
    }

    th {
      background-color: #9dd9fe;
    }

    td {
      cursor: pointer;
    }

    th,
    td {
      word-wrap: break-word;
      border-top: 1px solid black;
      border-left: 1px solid black;
      box-sizing: content-box;
      padding: 0.5em;
    }

    &.room-list {
      .room-no {
        max-width: 3em;
      }
      .member-num {
        max-width: 5em;
      }
      .bcdice-server {
        max-width: 8em;
      }
      .room-collection-prefix {
        max-width: 10em;
      }
      .storage-id {
        max-width: 10em;
      }
      .get-token {
        max-width: 3em;
        border-left: double 3px black;
      }
      .room-password {
        max-width: 6em;

        label {
          @include flex-box(column, stretch, center);
          width: 100%;
        }
      }
      .token {
        max-width: 10em;
      }
    }

    &.user-list {
      .room-no {
        max-width: 3em;
      }
      .user-key {
        max-width: 10em;
      }
      .login-num {
        max-width: 3em;
      }
      .get-token {
        max-width: 3em;
        border-left: double 3px black;
      }
      .user-password {
        max-width: 6em;

        label {
          @include flex-box(column, stretch, center);
          width: 100%;
        }
      }
      .token {
        max-width: 10em;
      }
    }
  }
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.block {
  @include flex-box(column, flex-start, flex-start);
}
</style>
