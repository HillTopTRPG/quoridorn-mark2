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
      <span>{{ roomInfo.name }}</span>
      ：
      <span>{{ userList | loginNum }}</span>
      名
    </div>
    <!-- 共有メモ -->
    <div class="menu-button" @click="clickPublicMemo">
      共有メモ
    </div>
    <!-- ログアウト -->
    <div class="menu-button" @click="clickLogOut">
      ログアウト
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
      <div class="item" @click="clickWelcome">ようこそ画面</div>
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
        @click="menuClick"
        property="private.display.chatWindow"
      >
        チャット表示
      </menu-boolean-item>
      <menu-boolean-item @click="menuClick" property="private.setting.dice">
        ダイス表示
      </menu-boolean-item>
      <menu-boolean-item
        @click="menuClick"
        property="private.display.playerBoxWindow"
      >
        プレイヤーボックス表示
      </menu-boolean-item>
      <menu-boolean-item
        @click="menuClick"
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
        @click="menuClick"
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

import { Action, Getter } from "vuex-class";
import { Component, Prop, Vue } from "vue-property-decorator";
import { ClientRoomInfo } from "@/@types/socket";
import { StoreUseData } from "@/@types/store";
import { UserData } from "@/@types/room";
import VueEvent from "@/app/core/decorator/VueEvent";
import TaskManager from "@/app/core/task/TaskManager";
import { WindowOpenInfo } from "@/@types/window";
import GameObjectManager from "@/app/basic/GameObjectManager";

@Component({
  components: {
    MenuBooleanItem
  },
  filters: {
    loginNum: (userList: StoreUseData<UserData>[]) =>
      userList.filter(user => user!.data!.login > 0).length
  }
})
export default class Menu extends Vue {
  @Prop({ type: Object, required: true })
  private roomInfo!: ClientRoomInfo;

  @Action("windowOpenDeprecated") private windowOpenDeprecated: any;
  @Action("setPropertyDeprecated") private setPropertyDeprecated: any;
  @Action("doResetWindowLocateDeprecated")
  private doResetWindowLocateDeprecated: any;
  @Action("exportStartDeprecated") private exportStartDeprecated: any;
  @Action("addListObjDeprecated") private addListObjDeprecated: any;
  @Action("saveChatLogHtmlDeprecated") private saveChatLogHtmlDeprecated: any;

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

  isShow(this: any, ...props: any[]): any {
    return (
      this.isSelecting && props.filter(prop => prop === this.currentMenu)[0]
    );
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
    await TaskManager.instance.ignition<WindowOpenInfo<void>, void>({
      type: "window-open",
      owner: "Quoridorn",
      value: {
        type: "room-info-window"
      }
    });
  }

  /** 共有メモボタン押下 */
  @VueEvent
  private clickPublicMemo() {
    this.addListObjDeprecated({
      propName: "publicMemo",
      kind: "publicMemo",
      targetList: [],
      title: "共有メモ",
      tabList: []
    });
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
    this.exportStartDeprecated(true);
    this.menuClick();
  }

  /** ロード */
  clickImport(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "ロード",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** チャットログ保存 */
  clickChatLog(): void {
    this.saveChatLogHtmlDeprecated();
    this.menuClick();
  }

  /* --------------------
   * 表示
   * ----------------- */
  /** フォントサイズ調整 */
  clickSettingFontSize(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "フォントサイズ変更",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** ウィンドウ配置初期化 */
  clickResetWindowLocate(): void {
    this.doResetWindowLocateDeprecated();
    this.menuClick();
  }

  /* --------------------
   * コマ
   * ----------------- */
  /** キャラクター追加 */
  clickAddCharacter(): void {
    this.windowOpenDeprecated("private.display.addCharacterSettingWindow");
    this.menuClick();
  }

  /** 範囲追加 */
  clickAddRange(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "範囲追加",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** チット作成 */
  clickAddChit(): void {
    this.windowOpenDeprecated("private.display.addChitWindow");
    this.menuClick();
  }

  /** 墓場 */
  clickGraveyard(): void {
    alert("「墓場」はプレイヤーボックス画面に統合されました。");
    this.menuClick();
  }

  /** キャラクター待合室 */
  clickWaitingRoom(): void {
    alert("「キャラクター待合室」はプレイヤーボックス画面に統合されました。");
    this.menuClick();
  }

  /* --------------------
   * マップ
   * ----------------- */
  /** マップ変更 */
  clickChangeMap(): void {
    this.windowOpenDeprecated("private.display.editMapWindow");
    this.menuClick();
  }

  /** フロアタイル追加 */
  clickAddFloorTile(): void {
    this.windowOpenDeprecated("private.display.addFloorTileWindow");
    this.menuClick();
  }

  /** マップマスク追加 */
  clickAddMapMask(): void {
    this.windowOpenDeprecated("private.display.addMapMaskWindow");
    this.menuClick();
  }

  /** 簡易マップ作成 */
  clickCreateEasyMap(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "簡易マップ",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** マップ状態保存 */
  clickSaveMap(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "マップ保存",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** マップ切り替え */
  clickSwitchMap(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "マップ切り替え",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /* --------------------
   * 画像
   * ----------------- */
  /** ファイルアップローダー */
  clickFileUploader(): void {
    this.windowOpenDeprecated("private.display.fileUploaderWindow");
    this.menuClick();
  }

  /** タグ編集 */
  clickTagEdit(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "画像タグ編集",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** 画像削除 */
  clickDeleteImage(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "画像削除",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /* --------------------
   * ヘルプ
   * ----------------- */
  /** ようこそ */
  clickWelcome(): void {
    this.windowOpenDeprecated("private.display.welcomeWindow");
    this.menuClick();
  }

  /** バージョン */
  clickVersion(): void {
    this.windowOpenDeprecated("private.display.versionWindow");
    this.menuClick();
  }

  /** マニュアル */
  clickManual(): void {
    this.setPropertyDeprecated({
      property: "private.display.unSupportWindow.title",
      value: "マニュアル",
      logOff: true
    });
    this.windowOpenDeprecated("private.display.unSupportWindow");
    this.menuClick();
  }

  /** オフィシャルサイトへ */
  clickOfficialSite(): void {
    window.open("http://quoridorn.com/", "_blank");
    this.menuClick();
  }

  /* --------------------
   * デモ
   * ----------------- */
  /** 開発履歴 */
  clickDevHistory(): void {
    this.windowOpenDeprecated("private.display.devLogWindow");
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
  top: calc(2.5em - 1px);
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
  left: calc(25em - 1px);
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
