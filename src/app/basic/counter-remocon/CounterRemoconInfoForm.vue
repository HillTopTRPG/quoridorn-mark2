<template>
  <div class="counter-remocon-info-form">
    <table>
      <tr>
        <tr-string-input-component
          labelName="label.name"
          width="100%"
          v-model="nameVolatile"
          :placeholder="$t('label.require-text')"
        />
      </tr>
      <tr>
        <tr-general-type-select-component
          type="counter-remocon-target-type"
          v-model="targetTypeVolatile"
          :value-list="['every-one', 'own']"
        />
      </tr>
      <tr>
        <tr-resource-master-select-component
          label-name="label.resource"
          type="counter-remocon-modify-type"
          :filter="['number']"
          v-model="resourceMasterKeyVolatile"
        />
      </tr>
      <tr>
        <tr-general-type-select-component
          type="counter-remocon-modify-type"
          v-model="modifyTypeVolatile"
          :value-list="['plus', 'minus', 'substitute', 'plus-minus']"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="counter-remocon-info-form.label.value"
          width="100%"
          v-model="valueVolatile"
        />
      </tr>
      <tr>
        <tr-string-input-component
          labelName="counter-remocon-info-form.label.message-format"
          width="100%"
          v-model="messageFormatVolatile"
        />
      </tr>
      <tr>
        <th></th>
        <td>{{ testMessage }}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import { Mixins } from "vue-mixin-decorator";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ComponentVue from "@/app/core/window/ComponentVue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import TrNumberInputComponent from "@/app/basic/common/components/table-item/TrNumberInputComponent.vue";
import {
  CounterRemoconModifyType,
  CounterRemoconTargetType
} from "@/@types/store-data";
import TrGeneralTypeSelectComponent from "@/app/basic/common/components/table-item/TrGeneralTypeSelectComponent.vue";
import TrResourceMasterSelectComponent from "@/app/basic/common/components/table-item/TrResourceMasterSelectComponent.vue";
import App from "@/views/App.vue";

@Component({
  components: {
    TrResourceMasterSelectComponent,
    TrGeneralTypeSelectComponent,
    TrNumberInputComponent,
    TrStringInputComponent
  }
})
export default class CounterRemoconInfoForm extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: Boolean, required: true })
  private isAdd!: boolean;

  private isMounted: boolean = false;

  @LifeCycle
  public async mounted() {
    this.isMounted = true;
  }

  private get testMessage() {
    return App.createCounterRemoconMessage(
      this.messageFormatVolatile,
      "[who]",
      "[resource]",
      this.modifyTypeVolatile,
      1,
      0
    );
  }

  // name
  @Prop({ type: String, required: true })
  private name!: string;
  private nameVolatile: string = "";
  @Watch("name", { immediate: true })
  private onChangeName(value: string) {
    this.nameVolatile = value;
  }
  @Watch("nameVolatile")
  private onChangeNameVolatile(value: string) {
    this.$emit("update:name", value);
  }

  // targetType
  @Prop({ type: String, required: true })
  private targetType!: CounterRemoconTargetType;
  private targetTypeVolatile: CounterRemoconTargetType = "every-one";
  @Watch("targetType", { immediate: true })
  private onChangeTargetType(value: CounterRemoconTargetType) {
    this.targetTypeVolatile = value;
  }
  @Watch("targetTypeVolatile")
  private onChangeTargetTypeVolatile(value: CounterRemoconTargetType) {
    this.$emit("update:targetType", value);
  }

  // resourceMasterKey
  @Prop({ type: String, default: null })
  private resourceMasterKey!: string | null;
  private resourceMasterKeyVolatile: string | null = null;
  @Watch("resourceMasterKey", { immediate: true })
  private onChangeResourceMasterKey(value: string | null) {
    this.resourceMasterKeyVolatile = value;
  }
  @Watch("resourceMasterKeyVolatile")
  private onChangeResourceMasterKeyVolatile(value: string | null) {
    this.$emit("update:resourceMasterKey", value);
  }

  // modifyType
  @Prop({ type: String, required: true })
  private modifyType!: CounterRemoconModifyType;
  private modifyTypeVolatile: CounterRemoconModifyType = "plus-minus";
  @Watch("modifyType", { immediate: true })
  private onChangeModifyType(value: CounterRemoconModifyType) {
    this.modifyTypeVolatile = value;
  }
  @Watch("modifyTypeVolatile")
  private onChangeModifyTypeVolatile(value: CounterRemoconModifyType) {
    this.$emit("update:modifyType", value);
  }

  // value
  @Prop({ type: String, required: true })
  private value!: string;
  private valueVolatile: string = "";
  @Watch("value", { immediate: true })
  private onChangeValue(value: string) {
    this.valueVolatile = value;
  }
  @Watch("valueVolatile")
  private onChangeValueVolatile(value: string) {
    this.$emit("update:value", value);
  }

  // messageFormat
  @Prop({ type: String, required: true })
  private messageFormat!: string;
  private messageFormatVolatile: string = "{0}の{1}を{2}した({3})";
  @Watch("messageFormat", { immediate: true })
  private onChangeMessageFormat(value: string) {
    this.messageFormatVolatile = value;
  }
  @Watch("messageFormatVolatile")
  private onChangeMessageFormatVolatile(value: string) {
    this.$emit("update:messageFormat", value);
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.counter-remocon-info-form {
  display: contents;
}

tr {
  height: 2em;
}

label {
  flex: 1;
}
</style>
