<template>
  <div class="chat-log-line-component" @click="onClick">
    <div
      class="chat-line"
      :class="{ system: chat.data.chatType === 'system-message' }"
    >
      <span class="sender">{{ getSender(chat.data) }}：</span>
      <span class="text" v-html="transText(chat.data.text)"></span>
      <div class="icon-container" v-if="!isExported">
        <span class="edited-message" v-if="isEdited">{{ editedMessage }}</span>
        <template v-if="isEditable(chat) && chat.data.chatType === 'chat'">
          <span
            class="icon icon-pencil"
            @click="$emit('edit', chat.key)"
          ></span>
          <span class="icon icon-bin" @click="$emit('delete', chat.key)"></span>
        </template>
        <span class="update-time">{{ getDateStr(chat.updateTime) }}</span>
      </div>
    </div>
    <div
      class="extend-bord"
      v-if="
        chat.data.chatType !== 'system-message' &&
          (isLast || isSelected || likeInfoList.length)
      "
    >
      <div class="add-like" v-if="likeList && likeList.length">
        <chat-log-like-add-component
          v-for="like in likeList"
          :key="like.key"
          :like="like"
          @add="onAddLike"
        />
      </div>
      <chat-log-like-view-component
        v-for="likeInfo in likeInfoList"
        :key="likeInfo.like.data.char"
        :isOpen="selectedChar === likeInfo.like.data.char"
        :like="likeInfo.like"
        :actorCountList="likeInfo.list"
        :actorList="actorList"
        @select="onSelectChar"
        @minus="onMinusLike"
      />
    </div>
    <div
      class="chat-line dice-roll-result"
      v-if="!chat.data.isSecretDice && chat.data.diceRollResult"
    >
      <span class="sender">{{ chat.data.system }}</span>
      <span>：</span>
      <span>{{
        chat.data.originalTableResult || chat.data.diceRollResult
      }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Watch } from "vue-property-decorator";
import { Component, Mixins } from "vue-mixin-decorator";
import moment from "moment/moment";
import { permissionCheck } from "@/app/core/api/app-server/SocketFacade";
import { transText } from "@/app/core/utility/ChatUtility";
import {
  ActorStore,
  LikeStore,
  ChatStore,
  GroupChatTabStore,
  UserStore
} from "@/@types/store-data";
import VueEvent from "@/app/core/decorator/VueEvent";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import {
  createEmptyStoreUseData,
  findByKey,
  findRequireByKey
} from "@/app/core/utility/Utility";
import ComponentVue from "@/app/core/window/ComponentVue";
import { listToEmpty } from "@/app/core/utility/PrimaryDataUtility";
import ChatLogLikeAddComponent from "@/app/basic/chat/log/ChatLogLikeAddComponent.vue";
import ChatLogLikeViewComponent from "@/app/basic/chat/log/ChatLogLikeViewComponent.vue";
import GameObjectManager from "@/app/basic/GameObjectManager";
import { UserType } from "@/@types/store-data-optional";

@Component({
  components: { ChatLogLikeViewComponent, ChatLogLikeAddComponent }
})
export default class ChatLogLineComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: Object, required: true })
  private chat!: StoreData<ChatStore>;

  @Prop({ type: Boolean, required: true })
  private isExported!: boolean;

  @Prop({ type: Boolean, required: true })
  private isSelected!: boolean;

  @Prop({ type: Boolean, required: true })
  private isLast!: boolean;

  @Prop({ type: String, required: true })
  private editedMessage!: string;

  @Prop({ type: Array, required: true })
  private likeList!: StoreData<LikeStore>[];

  @Prop({ type: Array, required: true })
  private actorList!: StoreData<ActorStore>[];

  @Prop({ type: Array, required: true })
  private userList!: StoreData<UserStore>[];

  @Prop({ type: Array, required: true })
  private groupChatTabList!: StoreData<GroupChatTabStore>[];

  @Prop({ type: Object, required: true })
  private userTypeLanguageMap!: { [type in UserType]: string };

  private likeInfoList: {
    like: StoreData<LikeStore>;
    list: { actorKey: string; count: number }[];
  }[] = [];
  private selectedChar: string | null = null;

  @LifeCycle
  private mounted() {
    this.setFontColor();
  }

  @VueEvent
  private onClick() {
    if (this.isExported) return;
    this.$emit("select", this.chat.key, !this.isSelected);
  }

  @VueEvent
  private onAddLike(like: StoreData<LikeStore>) {
    const actorKey = GameObjectManager.instance.chatPublicInfo.actorKey;
    this.$emit("like", actorKey, this.chat.key, like, 1);
  }

  @VueEvent
  private onMinusLike(actorKey: string, like: StoreData<LikeStore>) {
    this.$emit("like", actorKey, this.chat.key, like, -1);
  }

  @VueEvent
  private onSelectChar(like: StoreData<LikeStore>) {
    this.selectedChar = like ? like.data!.char : null;
  }

  @Watch("chat", { deep: true, immediate: true })
  private onChangeChatDeepImmediate() {
    listToEmpty(this.likeInfoList);
    if (!this.chat.data!.like) return;
    this.chat.data!.like.forEach(l => {
      // userName
      const actorKey = l.actorKey;

      const char = l.char;
      const likeChar = this.likeInfoList.find(
        li => li.like.data!.char === char
      );
      if (likeChar) {
        const likeUser = likeChar.list.find(c => c.actorKey === l.actorKey);
        if (likeUser) likeUser.count += l.count;
        else likeChar.list.push({ actorKey, count: l.count });
      } else {
        let like = this.likeList.find(like => like.data!.char === char);
        if (!like) {
          like = createEmptyStoreUseData("", {
            char,
            isThrowLinkage: false,
            linkageResourceKey: null
          });
        }
        this.likeInfoList.push({
          like,
          list: [{ actorKey, count: l.count }]
        });
      }
    });
  }

  @Watch("chat", { deep: true })
  private onChangeChatDeep() {
    this.setFontColor();
  }

  private setFontColor() {
    const textElm: HTMLElement = this.elm
      .getElementsByClassName("text")
      .item(0) as HTMLElement;
    textElm.style.setProperty(
      "color",
      `var(--font-color-${this.chat.data!.actorKey})`
    );
  }

  @VueEvent
  private isEditable(chat: StoreData<ChatStore>): boolean {
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
  private getSender(chat: ChatStore): string {
    const actorName = this.getName(chat.actorKey, "actor");
    const delimiter = " ＞＞ ";
    const targetName = this.getName(chat.targetKey, chat.targetType);

    return actorName + (targetName ? delimiter + targetName : "");
  }

  private getName(key: string | null, type: "group" | "actor" | null) {
    if (type === "group") {
      const gct = findRequireByKey(this.groupChatTabList, key);
      if (gct.data!.isSystem) return "";
      return gct.data!.name;
    } else {
      const actor = findByKey(this.actorList, key);
      if (!actor) return "Quoridorn";
      const user = findRequireByKey(this.userList, actor.owner);
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
  flex-shrink: 0;

  &.system {
    background-color: var(--uni-color-light-green);
  }

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

.extend-bord {
  @include flex-box(row, flex-start, center);
  min-height: 2em;

  .add-like {
    @include flex-box(row, flex-start, center);
  }

  .user {
    @include flex-box(row, flex-start, center);
    margin-left: 0.5em;

    .name {
    }

    .like {
    }
  }
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
