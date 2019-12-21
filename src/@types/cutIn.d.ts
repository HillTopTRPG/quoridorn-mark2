type CutInDeclareInfo = {
  title: string;
  url: string;
  tag: string;
  chatLinkage: 0 | 1 | 2;
  chatLinkageSearch: string;
  forceReset: boolean;
  start: number;
  end: number;
  volume: number;
  isLoop: boolean;
  fadeIn: number;
  fadeOut: number;
};

type CutInPlayingInfo = {
  duration: number;
};

type YoutubeVolumeChangeInfo = {
  tag: string;
  windowStatus: string;
  volume: number;
};

type YoutubeMuteChangeInfo = {
  tag: string;
  windowStatus: string;
  isMute: boolean;
};
