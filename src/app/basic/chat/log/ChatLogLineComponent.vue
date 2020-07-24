<template>
  <div class="chat-log-line-component">
    <div class="chat-line">
      <span class="sender">{{ getSender(chat.data) }}：</span>
      <span class="text" v-html="transText(chat.data.text)"></span>
      <div class="icon-container">
        <template v-if="isEditable(chat)">
          <span class="icon icon-pencil" @click="$emit('edit', chat.id)"></span>
          <span class="icon icon-bin" @click="$emit('delete', chat.id)"></span>
        </template>
        <span class="update-time">{{ getDateStr(chat.updateTime) }}</span>
        <span class="edited-message" v-if="isEdited">{{ editedMessage }}</span>
      </div>
    </div>
    <div class="chat-line dice-roll-result" v-if="chat.data.diceRollResult">
      <span class="sender">{{ chat.data.system }}</span>
      <span>：</span>
      <span>{{ chat.data.diceRollResult }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Watch } from "vue-property-decorator";
import { Component } from "vue-mixin-decorator";
import moment from "moment/moment";
import { StoreUseData } from "../../../../@types/store";
import { permissionCheck } from "../../../core/api/app-server/SocketFacade";
import { ChatInfo, GroupChatTabInfo, UserData } from "../../../../@types/room";
import { transText } from "../../../core/utility/ChatUtility";
import { ActorStore } from "../../../../@types/gameObject";
import TabsComponent from "../../common/components/tab-component/TabsComponent.vue";
import { UserType } from "../../../../@types/socket";
import VueEvent from "../../../core/decorator/VueEvent";
import LifeCycle from "../../../core/decorator/LifeCycle";
import { findRequireById } from "../../../core/utility/Utility";

@Component({
  components: { TabsComponent }
})
export default class ChatLogLineComponent extends Vue {
  @Prop({ type: Object, required: true })
  private chat!: StoreUseData<ChatInfo>;

  @Prop({ type: String, required: true })
  private editedMessage!: string;

  @Prop({ type: Array, required: true })
  private userList!: StoreUseData<UserData>[];

  @Prop({ type: Array, required: true })
  private actorList!: StoreUseData<ActorStore>[];

  @Prop({ type: Array, required: true })
  private groupChatTabList!: StoreUseData<GroupChatTabInfo>[];

  @Prop({ type: Object, required: true })
  private userTypeLanguageMap!: { [type in UserType]: string };

  @LifeCycle
  private mounted() {
    this.setFontColor();
  }

  @Watch("chat", { deep: true })
  private onChangeChat() {
    this.setFontColor();
  }

  private setFontColor() {
    const textElm: HTMLElement = this.elm
      .getElementsByClassName("text")
      .item(0) as HTMLElement;
    textElm.style.setProperty(
      "color",
      `var(--font-color-${this.chat.data!.actorId})`
    );
  }

  @VueEvent
  private isEditable(chat: StoreUseData<ChatInfo>): boolean {
    return permissionCheck(chat, "edit");
  }

  @VueEvent
  private get isEdited(): boolean {
    return this.chat.updateTime !== this.chat.createTime;
  }

  private get elm(): HTMLElement {
    return this.$el as HTMLElement;
  }

  @VueEvent
  private getDateStr(d: Date) {
    return moment(d).format("YYYY/MM/DD HH:mm:ss");
  }

  @VueEvent
  private getSender(chat: ChatInfo): string {
    const actorName = this.getName(chat.actorId, "actor");
    const delimiter = " ＞＞ ";
    const targetName = this.getName(chat.targetId, chat.targetType);

    return actorName + (targetName ? delimiter + targetName : "");
  }

  private getName(id: string, type: "group" | "actor") {
    if (type === "group") {
      const gct = findRequireById(this.groupChatTabList, id);
      if (gct.data!.isSystem) return "";
      return gct.data!.name;
    } else {
      const actor = findRequireById(this.actorList, id);
      const user = findRequireById(this.userList, actor.owner);
      const userType = this.userTypeLanguageMap[user.data!.type];
      const userTypeStr = actor.data!.type !== "user" ? "" : `(${userType})`;
      return `${actor.data!.name}${userTypeStr}`;
    }
  }

  @VueEvent
  private transText(raw: string): string {
    return transText(raw);
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.chat-log-line-component {
  display: contents;
}

.chat-line {
  position: relative;
  min-height: 2em;
  line-height: 1.7em;
  white-space: pre-wrap;

  &:hover {
    background-color: var(--uni-color-light-skyblue);

    .icon-container {
      visibility: visible;
    }
  }
}

.sender {
  font-weight: bold;
  margin-top: 0.5em;
}

.edited-message {
  margin-left: 0.2rem;
  color: black;
  font-size: 80%;
  white-space: nowrap;
}
.update-time {
  color: black;
  font-size: 80%;
}

.dice-roll-result {
  background-color: var(--uni-color-cream);
}

.icon-container {
  position: absolute;
  height: 2em;
  top: 0;
  right: 0;
  visibility: hidden;
  padding-left: 0.3rem;
  background-color: var(--uni-color-light-green);
}
.icon {
  @include inline-flex-box(row, center, center);
  background-color: white;
  border: 1px solid gray;
  border-radius: 50%;
  width: 2em;
  height: 2em;
  margin-right: 0.3rem;
  box-sizing: border-box;
  cursor: pointer;

  &:hover {
    background-color: var(--uni-color-light-pink);
  }

  &:active {
    background-color: var(--uni-color-pink);
  }
}
</style>
