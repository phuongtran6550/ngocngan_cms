export interface Material {
  id: string;
  name: string;
  description: string;
  productCount: number;
  createdBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialFormModel {
  name: string;
  description: string;
}
