<template>
  <div id="menu" @contextmenu.prevent>
    <!-- 操作ボタングループ -->
    <div class="span-group">
      <menu-down-item
        type="管理"
        textTarget="menu.management"
        :isHover="isShow('管理')"
        @mousedown="menuClick"
        @mouseenter="menuHover"
      />
      <menu-down-item
        type="画面"
        textTarget="menu.window"
        :isHover="isShow('画面')"
        @mousedown="menuClick"
        @mouseenter="menuHover"
      />
      <menu-down-item
        type="マップ"
        textTarget="label.map"
        :isHover="isShow('マップ')"
        @mousedown="menuClick"
        @mouseenter="menuHover"
      />
      <menu-down-item
        type="演出"
        textTarget="menu.directing"
        :isHover="isShow('演出')"
        @mousedown="menuClick"
        @mouseenter="menuHover"
      />
      <menu-down-item
        type="作成"
        textTarget="menu.create"
        :isHover="isShow('作成')"
        @mousedown="menuClick"
        @mouseenter="menuHover"
      />
      <menu-down-item
        type="ヘルプ"
        textTarget="menu.help"
        :isHover="isShow('ヘルプ')"
        @mousedown="menuClick"
        @mouseenter="menuHover"
      />
    </div>
    <!-- 部屋情報 -->
    <div class="menu-button" @click="clickRoomInfo">
      <span>{{ roomData.name }}</span>
      ：
      <span>{{ userList | loginNum }}</span>
      名
    </div>
    <!-- 共有メモ -->
    <div class="menu-button" @click="onClickCreatePublicMemo">
      <span class="icon-file-text"></span>
      <span v-t="'type.public-memo-list'"></span>
    </div>
    <!-- ログアウト -->
    <div class="menu-button" @click="clickLogOut">
      <span class="icon-switch"></span>
      <span v-t="'button.logout'"></span>
    </div>
    <!--------------------------------------------------
     ! 管理
     !-------------------------------------------------->
    <div class="hover-menu" v-show="isShow('管理')" :style="hoverMenuStyle">
      <menu-window-item type="player-box-window" @click="menuClick" />
      <menu-window-item type="media-list-window" @click="menuClick" />
      <menu-window-item type="media-url-add-window" @click="menuClick" />
      <menu-window-item type="authority-group-list-window" @click="menuClick" />
      <hr />
      <div
        class="item disabled"
        @click="onClickExport"
        v-t="'menu.export-room-data'"
      ></div>
      <div
        class="item disabled"
        @click="onClickImport"
        v-t="'menu.import-room-data'"
      ></div>
      <hr class="disabled" />
      <div
        class="item"
        @click="onClickExportChatLog"
        v-t="'menu.export-chat-log'"
      ></div>
    </div>
    <!--------------------------------------------------
     ! 画面
     !-------------------------------------------------->
    <div class="hover-menu" v-show="isShow('画面')" :style="hoverMenuStyle">
      <menu-window-item type="chat-window" @click="menuClick" />
      <menu-window-item type="chat-palette-window" @click="menuClick" />
      <menu-window-item type="counter-remocon-window" @click="menuClick" />
      <hr />
      <menu-window-item type="initiative-window" @click="menuClick" />
      <hr />
      <div
        class="item"
        @click="clickResetWindowLocate"
        v-t="'menu.window-position-reset'"
      ></div>
    </div>
    <!--------------------------------------------------
     ! マップ
     !-------------------------------------------------->
    <div class="hover-menu" v-show="isShow('マップ')" :style="hoverMenuStyle">
      <menu-window-item type="scene-list-window" @click="menuClick" />
      <menu-screen-mode-item label-mode="draw-map" v-model="screenMode" />
      <hr />
      <menu-window-item type="map-mask-add-window" @click="menuClick" />
      <menu-window-item type="map-marker-add-window" @click="menuClick" />
      <menu-window-item type="chit-add-window" @click="menuClick" />
      <menu-window-item type="character-add-window" @click="menuClick" />
      <menu-window-item type="dice-symbol-add-window" @click="menuClick" />
      <hr />
      <menu-window-item type="card-deck-list-window" @click="menuClick" />
    </div>
    <!--------------------------------------------------
     ! 作成
     !-------------------------------------------------->
    <div class="hover-menu" v-show="isShow('作成')" :style="hoverMenuStyle">
      <menu-window-item type="public-memo-add-window" @click="menuClick" />
      <hr />
      <div
        class="item"
        @click="onClickCreateActor"
        v-t="'actor-add-window.window-title'"
      ></div>
      <div
        class="item"
        @click="onClickCreateAuthorityGroup"
        v-t="'authority-group-add-window.window-title'"
      ></div>
      <hr />
      <div
        class="item"
        @click="onClickCreateChatTab"
        v-t="'chat-tab-add-window.window-title'"
      ></div>
      <div
        class="item"
        @click="onClickCreateLike"
        v-t="'like-add-window.window-title'"
      ></div>
      <div
        class="item"
        @click="onClickCreateResourceMaster"
        v-t="'resource-master-add-window.window-title'"
      ></div>
      <div
        class="item"
        @click="onClickCreateCounterRemocon"
        v-t="'counter-remocon-add-window.window-title'"
      ></div>
      <hr />
      <menu-window-item type="map-mask-add-window" @click="menuClick" />
      <menu-window-item type="map-marker-add-window" @click="menuClick" />
      <menu-window-item type="chit-add-window" @click="menuClick" />
      <menu-window-item type="character-add-window" @click="menuClick" />
      <menu-window-item type="dice-symbol-add-window" @click="menuClick" />
      <hr />
      <div
        class="item"
        @click="onClickCreateBgm"
        v-t="'cut-in-add-window.window-title'"
      ></div>
    </div>
    <!--------------------------------------------------
     ! 演出
     !-------------------------------------------------->
    <div class="hover-menu" v-show="isShow('演出')" :style="hoverMenuStyle">
      <menu-window-item type="cut-in-list-window" @click="menuClick" />
    </div>
    <!--------------------------------------------------
     ! 立ち絵表示
     !-------------------------------------------------->
    <!--------------------------------------------------
     ! カットイン表示
     !-------------------------------------------------->
    <!--------------------------------------------------
     ! 座標表示
     !-------------------------------------------------->
    <!--------------------------------------------------
     ! マス目表示
     !-------------------------------------------------->
    <!--------------------------------------------------
     ! マス目にコマを合わせる
     !-------------------------------------------------->
    <!--------------------------------------------------
     ! ヘルプ
     !-------------------------------------------------->
    <div class="hover-menu" v-show="isShow('ヘルプ')" :style="hoverMenuStyle">
      <div class="item" @click="clickVersion" v-t="'label.version'"></div>
      <hr />
      <div
        class="item"
        @click="clickOfficialSite"
        v-t="'menu.goto-official-site'"
      ></div>
      <hr />
      <div class="item" @click="clickBufForm" v-t="'menu.bug-reports'"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { AuthorityGroupStore, UserStore } from "@/@types/store-data";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import MenuWindowItem from "@/app/basic/menu/MenuWindowItem.vue";
import { createPoint } from "@/app/core/utility/CoordinateUtility";
import WindowManager from "@/app/core/window/WindowManager";
import MenuDownItem from "@/app/basic/menu/MenuDownItem.vue";
import EventProcessor from "@/app/core/event/EventProcessor";
import moment from "moment/moment";
import * as Mustache from "mustache";
import { saveHTML } from "@/app/core/utility/FileUtility";
import urljoin from "url-join";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import { Point } from "@/@types/store-data-optional";
import { ModeInfo, ScreenModeType } from "mode";
import App from "@/views/App.vue";
import {
  findByKey,
  findRequireByKey,
  someByStr
} from "@/app/core/utility/Utility";
import GameObjectManager from "@/app/basic/GameObjectManager";
import VueEvent from "@/app/core/decorator/VueEvent";
import MenuScreenModeItem from "@/app/basic/menu/MenuScreenModeItem.vue";
import TaskProcessor from "@/app/core/task/TaskProcessor";
import { TaskResult, Task } from "task";

@Component({
  components: {
    MenuScreenModeItem,
    MenuDownItem,
    MenuWindowItem
  },
  filters: {
    loginNum: (userList: StoreData<UserStore>[]) =>
      userList.filter(user => user!.data!.login > 0).length
  }
})
export default class Menu extends Mixins<ComponentVue>(ComponentVue) {
  private roomData = GameObjectManager.instance.roomData;

  private isSelecting: boolean = false;
  private currentMenu: string = "";
  private currentMenuPoint: Point = createPoint(0, 0);
  private userList: StoreData<UserStore>[] =
    GameObjectManager.instance.userList;
  private screenMode: ScreenModeType = "normal";

  public key: string = "menu";

  // @LifeCycle
  // public async mounted() {}

  @TaskProcessor("mode-change-finished")
  private async modeChangeFinished(
    task: Task<ModeInfo, never>
  ): Promise<TaskResult<never> | void> {
    const taskValue = task.value!;
    if (taskValue.type === "screen-mode") {
      this.screenMode = taskValue.value;
      task.resolve();
    }
  }

  isShow(...props: any[]): any {
    return this.isSelecting && someByStr(props, this.currentMenu);
  }

  @EventProcessor("click")
  private mouseDown(event: MouseEvent | TouchEvent): void {
    this.isSelecting = false;
  }

  menuClick(event: MouseEvent): void {
    this.isSelecting = this.menuHover(event) || !this.isSelecting;
  }

  @VueEvent
  private menuHover(event: MouseEvent): boolean {
    const elm = event.target as HTMLElement;
    const result = this.currentMenu !== elm.dataset.type!;
    this.currentMenu = elm.dataset.type!;
    const r = elm.getBoundingClientRect();
    this.currentMenuPoint = createPoint(r.x, r.y + r.height);
    return result;
  }

  @VueEvent
  private get hoverMenuStyle() {
    return {
      left: `${this.currentMenuPoint.x}px`
    };
  }

  /** 部屋情報ボタン押下 */
  @VueEvent
  private async clickRoomInfo(): Promise<void> {
    await App.openSimpleWindow("room-info-window");
  }

  /** 共有メモボタン押下 */
  @VueEvent
  private async onClickCreatePublicMemo() {
    await App.openSimpleWindow("public-memo-add-window");
  }

  /** ログアウトボタン押下 */
  @VueEvent
  private clickLogOut(): void {
    location.href = location.href.replace(/\?.+$/, "");
  }

  /* --------------------
   * ファイル
   * ----------------- */
  /** セーブ */
  @VueEvent
  private onClickExport(event: MouseEvent): void {
    this.menuClick(event);
  }

  /** ロード */
  @VueEvent
  private onClickImport(event: MouseEvent): void {
    this.menuClick(event);
  }

  /** チャットログ保存 */
  @VueEvent
  private async onClickExportChatLog(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    const dateStr = moment().format("YYYYMMDD_HHmmss");
    const title = `Quoridorn_chatLog_${dateStr}`;

    const chatTabList = GameObjectManager.instance.chatTabList;
    let chatList = GameObjectManager.instance.chatList;
    const userList = GameObjectManager.instance.userList;
    const actorList = GameObjectManager.instance.actorList;
    const authorityGroupList = GameObjectManager.instance.authorityGroupList;
    const groupChatTabList = GameObjectManager.instance.groupChatTabList;
    const userTypeLanguageMap = {
      PL: this.$t("selection.user-type.pl")!.toString(),
      GM: this.$t("selection.user-type.gm")!.toString(),
      VISITOR: this.$t("selection.user-type.visitor")!.toString()
    };

    if (!GameObjectManager.instance.isGm) {
      const someActor = (key: string | null): boolean => {
        const actor = findByKey(actorList, key);
        if (!actor) return true;
        return actor.owner === SocketFacade.instance.userKey;
      };
      chatList = chatList.filter(c => {
        if (!c.data!.isSecret) return true;
        if (someActor(c.data!.actorKey)) return true;
        const targetKey = c.data!.targetKey;
        switch (c.data!.targetType) {
          case "group":
            const groupChatTab = findRequireByKey(groupChatTabList, targetKey);
            const authorityGroupKey = groupChatTab.data!.authorityGroupKey;
            const authorityGroup: StoreData<AuthorityGroupStore> = findRequireByKey(
              authorityGroupList,
              authorityGroupKey
            );
            return authorityGroup.data!.list.some(
              a => a.userKey === SocketFacade.instance.userKey
            );
          case "actor":
            return someActor(targetKey);
          default:
            return true;
        }
      });
    }

    const convert = (data: any) => {
      return JSON.stringify(data).replaceAll(/\\n/g, "\\\\n");
    };

    const data = {
      owner: SocketFacade.instance.userKey,
      chatTabList: convert(chatTabList),
      chatList: convert(chatList),
      userList: convert(userList),
      actorList: convert(actorList),
      authorityGroupList: convert(authorityGroupList),
      groupChatTabList: convert(groupChatTabList),
      userTypeLanguageMap: convert(userTypeLanguageMap),
      editedMessage: this.$t("label.edited")!.toString(),
      title,
      mode: "dev"
    };

    const protocol = window.location.protocol;
    const host = window.location.host;
    const baseUrl = process.env.BASE_URL;
    const path = "static/chatLogTemplate.html";
    const templateFilePath = urljoin(protocol, host, baseUrl, path);
    return Promise.resolve()
      .then(() => fetch(templateFilePath).then(res => res.text()))
      .then((templateStr: string) => Mustache.render(templateStr, data))
      .then((contents: string) => saveHTML(`${title}`, contents))
      .catch((err: any) => console.error(err));
  }

  /* --------------------
   * 表示
   * ----------------- */

  /** ウィンドウ配置初期化 */
  @VueEvent
  private clickResetWindowLocate(event: MouseEvent): void {
    this.menuClick(event);
    WindowManager.instance.arrangePointAll();
  }

  @VueEvent
  private async onClickCreateBgm(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("cut-in-add-window"))) return;
    await WindowManager.instance.activeWindowForce("cut-in-list-window");
  }

  @VueEvent
  private async onClickCreateChatTab(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("chat-tab-add-window"))) return;
    await WindowManager.instance.activeWindowForce("chat-window");
    await WindowManager.instance.activeWindowForce("chat-setting-window");
  }

  @VueEvent
  private async onClickCreateLike(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("like-add-window"))) return;
    await WindowManager.instance.activeWindowForce("chat-window");
    await WindowManager.instance.activeWindowForce("chat-setting-window");
  }

  @VueEvent
  private async onClickCreateActor(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("actor-add-window"))) return;
    await WindowManager.instance.activeWindowForce("player-box-window");
  }

  @VueEvent
  private async onClickCreateAuthorityGroup(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("authority-group-add-window"))) return;
    await WindowManager.instance.activeWindowForce(
      "authority-group-list-window"
    );
  }

  @VueEvent
  private async onClickCreateResourceMaster(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("resource-master-add-window"))) return;
    await WindowManager.instance.activeWindowForce("initiative-window");
    await WindowManager.instance.activeWindowForce(
      "resource-master-list-window"
    );
  }

  @VueEvent
  private async onClickCreateCounterRemocon(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("counter-remocon-add-window"))) return;
    await WindowManager.instance.activeWindowForce("counter-remocon-window");
  }

  /* --------------------
   * ヘルプ
   * ----------------- */
  /** バージョン */
  @VueEvent
  private async clickVersion(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    await App.openSimpleWindow("version-info-window");
  }

  /** オフィシャルサイトへ */
  @VueEvent
  private clickOfficialSite(event: MouseEvent): void {
    window.open("https://quoridorn.com/", "_blank");
    this.menuClick(event);
  }

  /** 不具合の報告 */
  @VueEvent
  private clickBufForm(event: MouseEvent): void {
    window.open("https://9224.teacup.com/quoridorn_bug/bbs", "_blank");
    this.menuClick(event);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

#menu {
  @include flex-box(row, flex-start, center);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--menu-bar-height);
  background: linear-gradient(rgba(247, 248, 249, 1), rgba(0, 0, 0, 0));
  border-bottom: solid gray 1px;
  padding: 0 1rem;
  box-sizing: border-box;
  filter: var(--filter);
}

.span-group {
  @include flex-box(row, flex-start, center);
  background-color: rgba(250, 250, 250, 0.2);
  border: solid gray 1px;
  padding: 0 1em;

  span {
    @include inline-flex-box(row, center, center);
    padding: 0 1em;
    white-space: nowrap;
    height: 1.8rem;
    box-sizing: border-box;
    cursor: pointer;
  }
}
.span-group span:hover,
.span-group span.isHover {
  background: linear-gradient(rgba(186, 195, 199, 0.6), rgba(247, 248, 249, 1));
}

.menu-button {
  @include inline-flex-box(row, center, center);
  margin-left: 1em;
  position: relative;
  background: rgba(250, 250, 250, 0.4);
  border: solid gray 1px;
  padding: 0 1em;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  z-index: 100;
  height: 1.8rem;

  &:hover {
    border: solid #0092ed 1px;
    background: rgba(250, 250, 250, 0.5);
  }
}
.hover-menu {
  position: fixed;
  top: calc(var(--menu-bar-height) / 2 + 0.9rem - 1px);
  background: white;
  border: solid gray 1px;
  box-sizing: border-box;
  z-index: 200;

  > * {
    padding: 2px 10px;
  }

  > hr {
    padding: 0;
  }

  > .disabled {
    background: darkgray;
    cursor: no-drop;
  }

  > :not(.disabled) {
    cursor: pointer;

    &:hover {
      background: lightblue;
    }
  }
}

.item {
  position: relative;
  white-space: nowrap;

  > * {
    display: inline;
    vertical-align: middle;
  }
}
</style>
