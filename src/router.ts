import Vue from "vue";
import Router from "vue-router";
import App from "./views/App.vue";
import WebApiTool from "@/views/WebApiTool.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  routes: [
    {
      path: `/${process.env.VUE_APP_BASE_URL}/`,
      name: "app",
      component: App
    },
    {
      path: `/${process.env.VUE_APP_BASE_URL}/web-api-tool.html`,
      name: "web-api-tool",
      component: WebApiTool
    }
    // ,{
    //   path: "/about",
    //   name: "about",
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () =>
    //     import(/* webpackChunkName: "about" */ "./views/About.vue")
    // }
  ]
});
