export default {
  /** 設定(public) */
  state: {
    /** マス目を表示するか */
    gridLine: true,
    /** 座標を表示するか */
    gridId: true,
    /** 回転マーカーを表示するかどうか */
    pieceRotateMarker: true,
    /** マス目に合わせて動かすかどうか */
    isFitGrid: true
  },
  actions: {},
  mutations: {},
  getters: {
    /**
     * グリッドに合わせるかどうか
     * @param state
     * @returns { boolean }
     */
    isFitGrid: (state: any) => state.isFitGrid,
    isDrawGridLine: (state: any): boolean => state.gridLine,
    isDrawGridId: (state: any): boolean => state.gridId,
    isViewPieceRotateMarker: (state: any): boolean => state.pieceRotateMarker
  }
};
