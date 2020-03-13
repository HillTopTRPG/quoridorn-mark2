<template>
  <div class="input-texture-component">
    <background-type-radio v-model="type" />
    <image-picker-component
      v-if="type === 'image'"
      v-model="imageId"
      :windowKey="windowKey"
      :imageTag.sync="imageTag"
      :direction.sync="direction"
    />
    <div v-else>
      <table>
        <tr>
          <tr-string-input-component
            labelName="text"
            width="100%"
            v-model="text"
          />
        </tr>
        <tr v-if="isMounted">
          <tr-color-picker-component
            class="value-color"
            labelName="background-color"
            v-model="color"
          />
        </tr>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import ColorPickerComponent from "@/app/core/component/ColorPickerComponent.vue";
import BaseInput from "@/app/core/component/BaseInput.vue";
import LifeCycle from "@/app/core/decorator/LifeCycle";
import CtrlButton from "@/app/core/component/CtrlButton.vue";
import SeekBarComponent from "@/app/basic/cut-in/bgm/SeekBarComponent.vue";
import SimpleTabComponent from "@/app/core/component/SimpleTabComponent.vue";
import SceneLayerSelect from "@/app/basic/common/components/select/SceneLayerSelect.vue";
import BackgroundTypeRadio from "@/app/basic/common/components/radio/BackgroundTypeRadio.vue";
import ImagePickerComponent from "@/app/core/component/ImagePickerComponent.vue";
import { BackgroundSize, Direction, Texture } from "@/@types/room";
import { parseColor } from "@/app/core/Utility";
import TrStringInputComponent from "@/app/basic/common/components/TrStringInputComponent.vue";
import TrColorPickerComponent from "@/app/basic/common/components/TrColorPickerComponent.vue";

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
export default class InputTextureComponent extends Vue {
  @Prop({ type: String, required: true })
  private windowKey!: string;

  @Prop({ type: String, required: true })
  private defaultTag!: string;

  @Prop({ type: Object, required: true })
  private value!: Texture;

  private isMounted: boolean = false;

  private type: "image" | "color" | null = null;
  private imageId: string = "";
  private imageTag: string = "";
  private direction: Direction = "none";
  private backgroundSize: BackgroundSize = "contain";

  private color: string = "#ffffff";
  private text: string = "";

  @LifeCycle
  private async mounted() {
    this.type = this.localValue.type;
    if (this.localValue.type === "image") {
      this.imageTag = this.localValue.imageTag;
      this.imageId = this.localValue.imageId;
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
      if (!this.imageTag) this.imageTag = this.defaultTag;
      this.localValue = {
        type: "image",
        imageTag: this.imageTag,
        imageId: this.imageId,
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

  @Watch("imageId")
  private onChangeImageId() {
    if (this.localValue.type === "image") {
      this.localValue.imageId = this.imageId;
    }
  }

  @Watch("imageTag")
  private onChangeImageTag() {
    if (this.localValue.type === "image") {
      this.localValue.imageTag = this.imageTag;
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

.image-picker-container {
  flex: 1;
}
</style>
