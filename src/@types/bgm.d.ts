type BgmDeclareInfo = {
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

type BgmInfo = BgmDeclareInfo & {
  key: string;
  seek: number;
  duration: number;
  isPlay: boolean;
  isMute: boolean;
  volumeSetting: number;
  volume: number;
};
