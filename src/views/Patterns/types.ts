export interface PatternCreator {
  id: string;
  name: string;
}

export interface PatternItem {
  id: string;
  name: string;
  description: string;
  skuCount: number;
  createdBy?: PatternCreator;
}

export interface PatternFormModel {
  name: string;
  description: string;
}
