
export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export type OrnamentType = 'GIFT' | 'BALL' | 'STAR' | 'BAUBLE' | 'HEART' | 'RED_CUBE' | 'SILVER_BAUBLE' | 'SILVER_STAR';

export interface OrnamentData {
  id: number;
  type: OrnamentType;
  scatterPos: [number, number, number];
  treePos: [number, number, number];
  rotation: [number, number, number];
  weight: number;
}