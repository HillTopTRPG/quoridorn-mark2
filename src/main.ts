import Vue from "vue";
import router from "./router";
import MainVue from "./MainVue.vue";
import store from "@/app/store/store";
import ImageDirective from "@/app/basic/common/directive/Image";
const windowInfo: any = require("./app/core/window/window.yaml");

Vue.config.productionTip = false;
Vue.use(ImageDirective);

type Modules = {
  [name: string]: Promise<any>;
};

const modules: Modules = {
  "test-window": import("./app/basic/common/window/TestWindow.vue")
};

Object.keys(windowInfo)
  .filter((w: string) => !modules[w])
  .forEach((w: string) => {
    window.console.warn(`Un supported window='${w}'`);
  });

(async () => {
  const moduleList: any[] = await Promise.all(
    Object.keys(windowInfo)
      .map((w: any) => modules[w])
      .filter((p: Promise<any>) => p)
  );
  moduleList.forEach((module: any) => {
    Vue.use({
      install(Vue: any) {
        Vue.component(module.default.name, module.default);
      }
    });
  });

  const app = new Vue({
    router,
    store,
    render: h => h(MainVue)
  });
  app.$mount("#app");
})();
