// interface YoutubeWindow extends Window {
//   onYouTubeIframeAPIReady: Function;
// }
// declare var window: YoutubeWindow;
// export default window;

// declare var YT: YT;
//
// export namespace YT {
//   enum PlayerState {
//     ENDED,
//     PLAYING,
//     PAUSED,
//     BUFFERING,
//     CUED
//   }
//
//   class Player {
//     constructor(
//       id: any,
//       arg: {
//         height: string;
//         width: string;
//         events: {
//           onReady: (event: any) => void;
//           onStateChange: (event: any) => void;
//           // onEnded: () => void;
//           // onPlaying: () => void;
//           // onPaused: () => void;
//           // onBuffering: (isBuffering: boolean) => void;
//           // onCued: () => void;
//           onPlaybackQualityChange: (suggestedQuality: string) => void;
//           onPlaybackRateChange: (event: any) => void;
//           onError: (event: any) => void; // https://so-zou.jp/web-app/tech/web-api/google/youtube/player-api/#on-error
//           onApiChange: (event: any) => void;
//         };
//         playerVars: {
//           origin: string;
//           autoplay: number;
//           controls: number;
//           disablekb: number;
//           enablejsapi: number;
//           list: string;
//           listType: string;
//           loop: number;
//           rel: number;
//           showinfo: number;
//         };
//       }
//     )
//   }
// }
