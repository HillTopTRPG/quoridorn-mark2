<template>
  <div id="menu" @contextmenu.prevent>
    <!-- 操作ボタングループ -->
    <div class="span-group">
      <span
        @click="menuClick()"
        @mouseenter="menuHover('ファイル')"
        :class="{ isHover: isShow('ファイル') }"
      >
        ファイル
      </span>
      <span
        @click="menuClick()"
        @mouseenter="menuHover('表示')"
        :class="{ isHover: isShow('表示', 'ウィンドウ') }"
      >
        表示
      </span>
      <span
        @click="menuClick()"
        @mouseenter="menuHover('コマ')"
        :class="{ isHover: isShow('コマ') }"
      >
        コマ
      </span>
      <span
        @click="menuClick()"
        @mouseenter="menuHover('マップ')"
        :class="{ isHover: isShow('マップ') }"
      >
        マップ
      </span>
      <span
        @click="menuClick()"
        @mouseenter="menuHover('画像')"
        :class="{ isHover: isShow('画像') }"
      >
        画像
      </span>
      <span
        @click="menuClick()"
        @mouseenter="menuHover('ヘルプ')"
        :class="{ isHover: isShow('ヘルプ') }"
      >
        ヘルプ
      </span>
      <span
        @click="menuClick()"
        @mouseenter="menuHover('デモ')"
        :class="{ isHover: isShow('デモ') }"
      >
        デモ
      </span>
    </div>
    <!-- 部屋情報 -->
    <div class="menu-button" @click="clickRoomInfo">
      <span>{{ roomData.name }}</span>
      ：
      <span>{{ userList | loginNum }}</span>
      名
    </div>
    <!-- 共有メモ -->
    <div class="menu-button" @click="clickPublicMemo">
      <span class="icon-file-text"></span>
      <span>共有メモ</span>
    </div>
    <!-- ログアウト -->
    <div class="menu-button" @click="clickLogOut">
      <span class="icon-switch"></span>
      <span>ログアウト</span>
    </div>

    <!--------------------------------------------------
     ! ファイル
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu2" v-show="isShow('ファイル')">
      <div class="item" @click="clickExport">セーブ</div>
      <div class="item" @click="clickImport">ロード</div>
      <hr @mouseenter="menuHover('ファイル')" />
      <div class="item" @click="clickChatLog">チャットログ取得</div>
    </div>
    <!--------------------------------------------------
     ! 表示
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu3" v-show="isShow('表示', 'ウィンドウ')">
      <div class="item" @mouseenter="menuHover('ウィンドウ')">
        ウィンドウ
        <span class="triangle"></span>
      </div>
      <hr @mouseenter="menuHover('表示')" />
      <menu-boolean-item
        property="private.setting.standImage"
        @mouseenter="menuHover('表示')"
      >
        立ち絵表示
      </menu-boolean-item>
      <menu-boolean-item
        property="private.setting.cutIn"
        @mouseenter="menuHover('表示')"
      >
        カットイン表示
      </menu-boolean-item>
      <hr @mouseenter="menuHover('表示')" />
      <menu-boolean-item
        property="public.setting.gridId"
        @mouseenter="menuHover('表示')"
      >
        座標表示
      </menu-boolean-item>
      <menu-boolean-item
        property="public.setting.gridLine"
        @mouseenter="menuHover('表示')"
      >
        マス目表示
      </menu-boolean-item>
      <hr @mouseenter="menuHover('表示')" />
      <menu-boolean-item
        property="public.setting.isFitGrid"
        @mouseenter="menuHover('表示')"
      >
        マス目にキャラクターを合わせる
      </menu-boolean-item>
      <hr @mouseenter="menuHover('表示')" />
      <div
        class="item"
        @click="clickSettingFontSize"
        @mouseenter="menuHover('表示')"
      >
        フォントサイズ調整
      </div>
      <hr @mouseenter="menuHover('表示')" />
      <div
        class="item"
        @click="clickResetWindowLocate"
        @mouseenter="menuHover('表示')"
      >
        ウィンドウ配置初期化
      </div>
    </div>
    <!--------------------------------------------------
     ! コマ
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu4" v-show="isShow('コマ')">
      <div class="item" @click="clickAddCharacter">キャラクター追加</div>
      <div class="item" @click="clickAddRange">範囲追加</div>
      <hr />
      <div class="item" @click="clickAddChit">チット作成</div>
      <hr />
      <div class="item" @click="clickGraveyard">墓場</div>
      <div class="item" @click="clickWaitingRoom">キャラクター待合室</div>
      <hr />
      <menu-boolean-item property="public.setting.pieceRotateMarker">
        回転マーカーを表示する
      </menu-boolean-item>
    </div>
    <!--------------------------------------------------
     ! マップ
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu5" v-show="isShow('マップ')">
      <div class="item" @click="clickChangeMap">マップ変更</div>
      <div class="item" @click="clickAddFloorTile">フロアタイル追加</div>
      <div class="item" @click="clickAddMapMask">マップマスク追加</div>
      <div class="item" @click="clickCreateEasyMap">簡易マップ作成</div>
      <hr />
      <div class="item" @click="clickSaveMap">マップ状態保存</div>
      <div class="item" @click="clickSwitchMap">マップ切り替え</div>
    </div>
    <!--------------------------------------------------
     ! 画像
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu6" v-show="isShow('画像')">
      <div class="item" @click="clickFileUploader">ファイルアップローダー</div>
      <hr />
      <div class="item" @click="clickTagEdit">タグ編集</div>
      <div class="item" @click="clickDeleteImage">画像削除</div>
    </div>
    <!--------------------------------------------------
     ! ヘルプ
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu7" v-show="isShow('ヘルプ')">
      <div class="item" @click="clickVersion">バージョン</div>
      <div class="item" @click="clickManual">マニュアル</div>
      <hr />
      <div class="item" @click="clickOfficialSite">オフィシャルサイトへ</div>
    </div>
    <!--------------------------------------------------
     ! ウィンドウ
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu8" v-show="isShow('ウィンドウ')">
      <menu-boolean-item
        @click="openChatWindow"
        property="private.display.chatWindow"
      >
        チャット表示
      </menu-boolean-item>
      <menu-boolean-item @click="menuClick" property="private.setting.dice">
        ダイス表示
      </menu-boolean-item>
      <menu-boolean-item
        @click="openPlayerBoxWindow"
        property="private.display.playerBoxWindow"
      >
        プレイヤーボックス表示
      </menu-boolean-item>
      <menu-boolean-item
        @click="openInitiativeWindow"
        property="private.display.initiativeWindow"
      >
        イニシアティブ表示
      </menu-boolean-item>
      <menu-boolean-item
        @click="menuClick"
        property="private.display.resourceWindow"
      >
        リソース表示
      </menu-boolean-item>
      <hr />
      <menu-boolean-item
        @click="openChatPaletteWindow"
        property="private.display.chatPaletteSettingWindow"
      >
        チャットパレット表示
      </menu-boolean-item>
      <menu-boolean-item
        @click="menuClick"
        property="private.display.counterRemoconWindow"
      >
        カウンターリモコン表示
      </menu-boolean-item>
    </div>
    <!--------------------------------------------------
     ! デモ
     !-------------------------------------------------->
    <div class="hoverMenu hoverMenu9" v-show="isShow('デモ')">
      <div class="item" @click="clickDevHistory">開発履歴</div>
      <hr />
      <div class="item" @click="clickBufForm">不具合の報告</div>
    </div>
  </div>
</template>

<script lang="ts">
import MenuBooleanItem from "./MenuBooleanItem.vue";

import { Component } from "vue-property-decorator";
import { StoreUseData } from "@/@types/store";
import { UserData } from "@/@types/room";
import GameObjectManager from "../GameObjectManager";
import VueEvent from "../../core/decorator/VueEvent";
import App from "../../../views/App.vue";
import { someByStr } from "../../core/utility/Utility";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";

@Component({
  components: {
    MenuBooleanItem
  },
  filters: {
    loginNum: (userList: StoreUseData<UserData>[]) =>
      userList.filter(user => user!.data!.login > 0).length
  }
})
export default class Menu extends Mixins<ComponentVue>(ComponentVue) {
  private roomData = GameObjectManager.instance.roomData;

  private isConnectHover: boolean = false;
  private isSelecting: boolean = false;
  private currentMenu: string = "";
  private userList: StoreUseData<UserData>[] =
    GameObjectManager.instance.userList;

  public key: string = "menu";

  // @LifeCycle
  // public async mounted() {}

  menuClick(): void {
    this.isSelecting = !this.isSelecting;
  }

  @VueEvent
  private async openChatWindow() {
    this.menuClick();
    await App.openSimpleWindow("chat-window");
  }

  @VueEvent
  private async openPlayerBoxWindow() {
    this.menuClick();
    await App.openSimpleWindow("player-box-window");
  }

  @VueEvent
  private async openInitiativeWindow() {
    this.menuClick();
    await App.openSimpleWindow("initiative-window");
  }

  @VueEvent
  private async openChatPaletteWindow() {
    this.menuClick();
    await App.openSimpleWindow("chat-palette-window");
  }

  isShow(...props: any[]): any {
    return this.isSelecting && someByStr(props, this.currentMenu);
  }

  menuHover(prop: string): void {
    this.currentMenu = prop;
  }

  hoverConnect(flg: boolean): void {
    this.isConnectHover = flg;
  }

  /** 部屋情報ボタン押下 */
  @VueEvent
  private async clickRoomInfo(): Promise<void> {
    await App.openSimpleWindow("room-info-window");
  }

  /** 共有メモボタン押下 */
  @VueEvent
  private async clickPublicMemo() {
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
  clickExport(): void {
    this.menuClick();
  }

  /** ロード */
  clickImport(): void {
    this.menuClick();
  }

  /** チャットログ保存 */
  clickChatLog(): void {
    this.menuClick();
  }

  /* --------------------
   * 表示
   * ----------------- */
  /** フォントサイズ調整 */
  private async clickSettingFontSize(): Promise<void> {
    this.menuClick();
    alert("プレイヤーボックス画面から行う仕様です。");
    await App.openSimpleWindow("player-box-window");
  }

  /** ウィンドウ配置初期化 */
  clickResetWindowLocate(): void {
    this.menuClick();
  }

  /* --------------------
   * コマ
   * ----------------- */
  /** キャラクター追加 */
  private async clickAddCharacter(): Promise<void> {
    this.menuClick();
    await App.openSimpleWindow("character-add-window");
  }

  /** 範囲追加 */
  clickAddRange(): void {
    this.menuClick();
    alert("未実装です！ごめんなさい！");
  }

  /** チット作成 */
  private async clickAddChit(): Promise<void> {
    this.menuClick();
    await App.openSimpleWindow("chit-add-window");
  }

  /** 墓場 */
  private async clickGraveyard(): Promise<void> {
    this.menuClick();
    alert(
      "「墓場」はプレイヤーボックス画面に統合されます！\n未実装だったらごめんなさい！"
    );
    await App.openSimpleWindow("player-box-window");
  }

  /** キャラクター待合室 */
  private async clickWaitingRoom(): Promise<void> {
    this.menuClick();
    alert(
      "「キャラクター待合室」はプレイヤーボックス画面に統合されます！\n未実装だったらごめんなさい！"
    );
    await App.openSimpleWindow("player-box-window");
  }

  /* --------------------
   * マップ
   * ----------------- */
  /** マップ変更 */
  private async clickChangeMap(): Promise<void> {
    this.menuClick();
    await App.openSimpleWindow("scene-list-window");
  }

  /** フロアタイル追加 */
  private async clickAddFloorTile(): Promise<void> {
    this.menuClick();
    alert(
      "フロアタイルは未実装です。\nマップマスクを工夫して代用してください。"
    );
    await App.openSimpleWindow("map-mask-add-window");
  }

  /** マップマスク追加 */
  private async clickAddMapMask(): Promise<void> {
    this.menuClick();
    await App.openSimpleWindow("map-mask-add-window");
  }

  /** 簡易マップ作成 */
  private async clickCreateEasyMap(): Promise<void> {
    this.menuClick();
  }

  /** マップ状態保存 */
  private async clickSaveMap(): Promise<void> {
    this.menuClick();
    alert("シーンリスト画面から行う仕様です。\n未実装だったらごめんなさい！");
    await App.openSimpleWindow("scene-list-window");
  }

  /** マップ切り替え */
  private async clickSwitchMap(): Promise<void> {
    this.menuClick();
    alert("シーンリスト画面から行う仕様です。\n未実装だったらごめんなさい！");
    await App.openSimpleWindow("scene-list-window");
  }

  /* --------------------
   * 画像
   * ----------------- */
  /** ファイルアップローダー */
  clickFileUploader(): void {
    this.menuClick();
  }

  /** タグ編集 */
  clickTagEdit(): void {
    this.menuClick();
  }

  /** 画像削除 */
  clickDeleteImage(): void {
    this.menuClick();
  }

  /* --------------------
   * ヘルプ
   * ----------------- */
  /** バージョン */
  private async clickVersion(): Promise<void> {
    this.menuClick();
    await App.openSimpleWindow("version-info-window");
  }

  /** マニュアル */
  clickManual(): void {
    this.menuClick();
  }

  /** オフィシャルサイトへ */
  clickOfficialSite(): void {
    window.open("https://quoridorn.com/", "_blank");
    this.menuClick();
  }

  /* --------------------
   * デモ
   * ----------------- */
  /** 開発履歴 */
  clickDevHistory(): void {
    this.menuClick();
  }

  /** 不具合の報告 */
  clickBufForm(): void {
    window.open("https://9224.teacup.com/quoridorn_bug/bbs", "_blank");
    this.menuClick();
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

  > *:not(:first-child) {
    margin-left: 1em;
  }
}

.span-group {
  display: flex;
  flex-direction: row;
  background-color: rgba(250, 250, 250, 0.2);
  border: solid gray 1px;
  padding: 0 1em;

  span {
    display: inline-flex;
    justify-content: center;
    align-items: center;
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
  display: inline-flex;
  justify-content: center;
  align-items: center;
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
.hoverMenu {
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

  > .item:hover {
    background: lightblue;
  }
}
.hoverMenu2 {
  left: 1em;
}
.hoverMenu3 {
  left: 7em;
}
.hoverMenu4 {
  left: 11em;
}
.hoverMenu5 {
  left: 15em;
}
.hoverMenu6 {
  left: 20em;
}
.hoverMenu7 {
  left: 24em;
}
.hoverMenu8 {
  left: calc(24em - 1px);
}
.hoverMenu9 {
  left: 29em;
}

.item {
  position: relative;
  white-space: nowrap;

  > * {
    display: inline;
    vertical-align: middle;
  }

  img.check {
    display: inline;
    width: 10px;
    height: 10px;
    min-width: 10px;
    min-height: 10px;
    margin-right: 5px;
    border: none;
  }
}
.triangle {
  position: absolute;
  right: 7px;
  top: 0;
  bottom: 0;
  margin: auto;
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  border-left: 5px solid black;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}
</style>
