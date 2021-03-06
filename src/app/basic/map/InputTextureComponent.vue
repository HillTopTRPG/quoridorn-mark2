<template>
  <div class="input-texture-component">
    <background-type-radio v-model="type" />
    <image-picker-component
      v-if="type === 'image'"
      v-model="imageKey"
      :windowKey="windowKey"
      :mediaTag.sync="mediaTag"
      :direction.sync="direction"
      :is-simple.sync="isSimple"
    />
    <div v-else>
      <table>
        <tr>
          <tr-string-input-component
            labelName="label.text"
            width="100%"
            v-model="text"
          />
        </tr>
        <tr v-if="isMounted">
          <tr-color-picker-component
            class="value-color"
            labelName="label.background-color"
            v-model="color"
          />
        </tr>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import ComponentVue from "@/app/core/window/ComponentVue";
import { Mixins } from "vue-mixin-decorator";
import {
  BackgroundSize,
  Direction,
  Texture
} from "@/@types/store-data-optional";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import TrStringInputComponent from "@/app/basic/common/components/table-item/TrStringInputComponent.vue";
import BackgroundTypeRadio from "@/app/basic/common/components/radio/BackgroundTypeRadio.vue";
import SeekBarComponent from "@/app/basic/cut-in/bgm/SeekBarComponent.vue";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import TrColorPickerComponent from "@/app/basic/common/components/table-item/TrColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import { parseColor } from "@/app/core/utility/ColorUtility";

@Component({
  components: {
    TrColorPickerComponent,
    TrStringInputComponent,
    ImagePickerComponent,
    BackgroundTypeRadio,
    SceneLayerSelect,
    SimpleTabComponent,
    ColorPickerComponent,
    BaseInput,
    SeekBarComponent,
    CtrlButton
  }
})
export default class InputTextureComponent extends Mixins<ComponentVue>(
  ComponentVue
) {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, required: true })
  private defaultTag!: string;

  @Prop({ type: Object, required: true })
  private value!: Texture;

  private isMounted: boolean = false;
  private isSimple: boolean = true;

  private type: "image" | "color" | null = null;
  private imageKey: string = "";
  private mediaTag: string = "";
  private direction: Direction = "none";
  private backgroundSize: BackgroundSize = "contain";

  private color: string = "#ffffff";
  private text: string = "";

  @LifeCycle
  private async mounted() {
    this.type = this.localValue.type;
    if (this.localValue.type === "image") {
      this.mediaTag = this.localValue.mediaTag;
      this.imageKey = this.localValue.mediaKey;
      this.direction = this.localValue.direction;
      this.backgroundSize = this.localValue.backgroundSize;
    } else {
      this.color = this.localValue.backgroundColor;
      this.text = this.localValue.text;
    }
    this.isMounted = true;
  }

  public input(value: Texture) {
    this.$emit("input", value);
  }

  private get localValue(): Texture {
    return this.value;
  }

  private set localValue(value: Texture) {
    this.input(value);
  }

  @Watch("type")
  private onChangeType(newValue: string | null, oldValue: string | null) {
    if (!newValue || !oldValue) return;
    if (newValue === "image") {
      if (!this.mediaTag) this.mediaTag = this.defaultTag;
      this.localValue = {
        type: "image",
        mediaTag: this.mediaTag,
        mediaKey: this.imageKey,
        direction: this.direction,
        backgroundSize: this.backgroundSize
      };
    } else {
      const colorObj = parseColor(this.color);
      const backgroundColor: string = colorObj.getRGBA();
      const fontColor: string = colorObj.getRGBReverse();
      this.localValue = {
        type: "color",
        backgroundColor,
        fontColor,
        text: this.text
      };
    }
  }

  @Watch("imageKey")
  private onChangeImageKey() {
    if (this.localValue.type === "image") {
      this.localValue.mediaKey = this.imageKey;
    }
  }

  @Watch("mediaTag")
  private onChangeImageTag() {
    if (this.localValue.type === "image") {
      this.localValue.mediaTag = this.mediaTag;
    }
  }

  @Watch("direction")
  private onChangeDirection() {
    if (this.localValue.type === "image") {
      this.localValue.direction = this.direction;
    }
  }

  @Watch("backgroundSize")
  private onChangeBackgroundSize() {
    if (this.localValue.type === "image") {
      this.localValue.backgroundSize = this.backgroundSize;
    }
  }

  @Watch("color")
  private onChangeColor() {
    if (this.localValue.type === "color") {
      const colorObj = parseColor(this.color);
      const backgroundColor: string = colorObj.getRGBA();
      const fontColor: string = colorObj.getRGBReverse();
      this.localValue.backgroundColor = backgroundColor;
      this.localValue.fontColor = fontColor;
    }
  }
}
</script>

<style scoped lang="scss">
@import "../../../assets/common";

.input-texture-component {
  @include flex-box(column, stretch, flex-start);
}

.value-alpha {
  transform: rotate(180deg);
  transform-origin: center;
}

th {
  text-align: right;
}

td {
  text-align: left;
}

.image-picker-component {
  flex: 1;
}
</style>
