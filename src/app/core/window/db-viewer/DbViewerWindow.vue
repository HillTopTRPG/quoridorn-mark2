<template>
  <div class="container selectable" ref="window-container">
    <div class="options">
      <meta-property-check
        @click="onClickMeta"
        property="id"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="collection"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="key"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="ownerType"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="owner"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="order"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="exclusionOwner"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="lastExclusionOwner"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="permission"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="status"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="createTime"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="updateTime"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="refList"
        :default-value="false"
      />
      <meta-property-check
        @click="onClickMeta"
        property="data"
        :default-value="true"
      />
    </div>
    <div class="cc-container">
      <template v-for="(type, ind) in typeList">
        <db-collection-component
          :key="type"
          v-if="type !== 'room-data'"
          :cc-name="type"
          :data-list="listList[ind]"
          :meta-prop-list="targetPropertyList"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import WindowVue from "@/app/core/window/WindowVue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import ButtonArea from "@/app/basic/common/components/ButtonArea.vue";
import SocketFacade from "@/app/core/api/app-server/SocketFacade";
import GameObjectManager from "@/app/basic/GameObjectManager";
import MetaPropertyCheck from "@/app/core/window/db-viewer/MetaPropertyCheck.vue";
import DbCollectionComponent from "@/app/core/window/db-viewer/DbCollectionComponent.vue";

@Component({
  components: {
    DbCollectionComponent,
    MetaPropertyCheck,
    ButtonArea,
    BaseInput
  }
})
export default class DbViewerWindow extends Mixins<WindowVue<void, void>>(
  WindowVue
) {
  private typeList: string[] = SocketFacade.instance.getAllSuffix().sort();
  private listList: StoreData<any>[][] = [];

  private targetPropertyList: (keyof StoreUseData<any>)[] = ["data"];

  @LifeCycle
  public created() {
    this.listList = this.typeList.map(
      type => GameObjectManager.instance.getList(type)!
    );
  }

  private onClickMeta(flg: boolean, propName: keyof StoreUseData<any>) {
    if (flg) this.targetPropertyList.push(propName);
    else {
      const ind = this.targetPropertyList.findIndex(p => p === propName);
      this.targetPropertyList.splice(ind, 1);
    }
  }

  @LifeCycle
  public async mounted() {
    await this.init();
  }
}
</script>

<style scoped lang="scss">
@import "../../../../assets/common";

.container {
  @include flex-box(column, stretch, flex-start);
  width: 100%;
  height: 100%;

  .options {
    @include flex-box(row, flex-start, flex-start, wrap);
  }

  .cc-container {
    @include flex-box(column, stretch, flex-start);
    overflow-y: scroll;
    flex: 1;
  }
}
</style>
