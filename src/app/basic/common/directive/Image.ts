export default {
  install(Vue: any, options: any) {
    Vue.directive("img", (el: any, binding: any) => {
      const imgData = binding.value;
      if (!imgData) {
        el.src = "";
        return;
      }
      const img = new Image();
      img.src = imgData;

      img.onload = () => {
        el.src = imgData;
        el.style.opacity = "1";
        el.classList.add("loaded");
        if (el.className.indexOf("animation") >= 0) {
          el.style.transition = "all 0.5s ease";
        }
      };
    });

    Vue.directive("bg-img", (el: any, binding: any) => {
      const imgData = binding.value;

      if (!imgData) return;

      const img = new Image();

      img.onerror = () => {
        setTimeout(() => {
          delete el.style.backgroundImage;
          el.style.opacity = "0";
          el.classList.remove("loaded");
          delete el.style.transition;
        });
      };

      img.onload = () => {
        setTimeout(() => {
          el.style.backgroundImage = `url(${imgData})`;
          el.style.opacity = "1";
          el.classList.add("loaded");
          if (el.className.indexOf("animation") >= 0) {
            el.style.transition = "all 0.5s ease";
          }
        }, 100);
      };
      setTimeout(() => (img.src = imgData));
    });
  }
};
