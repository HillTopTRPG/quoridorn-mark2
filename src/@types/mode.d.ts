type ModeInfo = WheelModeInfo | ModalModeInfo;

type WheelModeInfo = {
  type: "wheel";
  value: "on" | "off";
};

type ModalModeInfo = {
  type: "modal";
  value: "on" | "off";
};
