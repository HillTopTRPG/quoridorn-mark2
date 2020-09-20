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
      <span v-t="'type.public-memo'"></span>
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
      <hr />
      <menu-window-item type="map-mask-add-window" @click="menuClick" />
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
      <hr />
      <div
        class="item"
        @click="onClickCreateChatTab"
        v-t="'chat-tab-add-window.window-title'"
      ></div>
      <div
        class="item"
        @click="onClickCreateResourceMaster"
        v-t="'resource-master-add-window.window-title'"
      ></div>
      <hr />
      <menu-window-item type="map-mask-add-window" @click="menuClick" />
      <menu-window-item type="chit-add-window" @click="menuClick" />
      <menu-window-item type="character-add-window" @click="menuClick" />
      <menu-window-item type="dice-symbol-add-window" @click="menuClick" />
      <hr />
      <div
        class="item"
        @click="onClickCreateBgm"
        v-t="'bgm-add-window.window-title'"
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
import MenuBooleanItem from "./MenuBooleanItem.vue";
import { Component } from "vue-property-decorator";
import { StoreUseData } from "@/@types/store";
import { ActorGroup, UserData } from "@/@types/room";
import GameObjectManager from "../GameObjectManager";
import VueEvent from "../../core/decorator/VueEvent";
import App from "../../../views/App.vue";
import {
  findById,
  findRequireById,
  someByStr
} from "../../core/utility/Utility";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import MenuWindowItem from "@/app/basic/menu/MenuWindowItem.vue";
import { createPoint } from "@/app/core/utility/CoordinateUtility";
import { Point } from "address";
import WindowManager from "@/app/core/window/WindowManager";
import MenuDownItem from "@/app/basic/menu/MenuDownItem.vue";
import EventProcessor from "@/app/core/event/EventProcessor";
import moment from "moment/moment";
import * as Mustache from "mustache";
import { saveHTML } from "@/app/core/utility/FileUtility";
import LanguageManager from "@/LanguageManager";

@Component({
  components: {
    MenuDownItem,
    MenuWindowItem,
    MenuBooleanItem
  },
  filters: {
    loginNum: (userList: StoreUseData<UserData>[]) =>
      userList.filter(user => user!.data!.login > 0).length
  }
})
export default class Menu extends Mixins<ComponentVue>(ComponentVue) {
  private roomData = GameObjectManager.instance.roomData;

  private isSelecting: boolean = false;
  private currentMenu: string = "";
  private currentMenuPoint: Point = createPoint(0, 0);
  private userList: StoreUseData<UserData>[] =
    GameObjectManager.instance.userList;

  public key: string = "menu";

  // @LifeCycle
  // public async mounted() {}

  isShow(...props: any[]): any {
    return this.isSelecting && someByStr(props, this.currentMenu);
  }

  @EventProcessor("click")
  private mouseDown(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
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
    const actorGroupList = GameObjectManager.instance.actorGroupList;
    const groupChatTabList = GameObjectManager.instance.groupChatTabList;
    const userTypeLanguageMap = {
      PL: this.$t("selection.user-type.PL")!.toString(),
      GM: this.$t("selection.user-type.GM")!.toString(),
      VISITOR: this.$t("selection.user-type.VISITOR")!.toString()
    };

    const convert = (data: any) => {
      return JSON.stringify(data);
    };

    if (!GameObjectManager.instance.isGm) {
      const someActor = (id: string | null): boolean => {
        const actor = findById(actorList, id);
        if (!actor) return true;
        return actor.owner === GameObjectManager.instance.mySelfUserId;
      };
      chatList = chatList.filter(c => {
        if (!c.data!.isSecret) return true;
        if (someActor(c.data!.actorId)) return true;
        const targetId = c.data!.targetId;
        switch (c.data!.targetType) {
          case "group":
            const groupChatTab = findRequireById(groupChatTabList, targetId);
            const actorGroupId = groupChatTab.data!.actorGroupId;
            const actorGroup: StoreUseData<ActorGroup> = findRequireById(
              actorGroupList,
              actorGroupId
            );
            return actorGroup.data!.list.some(
              a => a.userId === GameObjectManager.instance.mySelfUserId
            );
          case "actor":
            return someActor(targetId);
          default:
            return true;
        }
      });
    }

    const data = {
      owner: GameObjectManager.instance.mySelfUserId,
      chatTabList: convert(chatTabList),
      chatList: convert(chatList),
      userList: convert(userList),
      actorList: convert(actorList),
      actorGroupList: convert(actorGroupList),
      groupChatTabList: convert(groupChatTabList),
      userTypeLanguageMap: convert(userTypeLanguageMap),
      editedMessage: this.$t("label.edited")!.toString(),
      title,
      mode: "dev"
    };

    const basePath = process.env.BASE_URL ? `${process.env.BASE_URL}/` : "";
    const templateFilePath = `${basePath}static/chatLogTemplate.html`;
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
    if (!(await App.openSimpleWindow("bgm-add-window"))) return;
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
  private async onClickCreateActor(event: MouseEvent): Promise<void> {
    this.menuClick(event);
    if (!(await App.openSimpleWindow("actor-add-window"))) return;
    await WindowManager.instance.activeWindowForce("player-box-window");
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
