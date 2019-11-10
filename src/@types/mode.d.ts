type ModeInfo = WheelModeInfo | ModalModeInfo | CreateRoomModeInfo;

type WheelModeInfo = {
  type: "wheel";
  value: "on" | "off";
};

type ModalModeInfo = {
  type: "modal";
  value: "on" | "off";
};

type CreateRoomModeInfo = {
  type: "create-room";
  value: "on" | "off";
};
