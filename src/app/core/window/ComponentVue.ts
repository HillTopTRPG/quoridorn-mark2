import Vue from "vue";
import { Mixin } from "vue-mixin-decorator";
const uuid = require("uuid");

// @ts-ignore
@Mixin
export default class ComponentVue extends Vue {
  public key: string = uuid.v4();
}
