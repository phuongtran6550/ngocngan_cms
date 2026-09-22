export type AppliesToType = "all" | "weighted" | "piece";
export type StatusType = "active" | "inactive";

export interface PriceRounding {
  id: string;
  price: number;
  appliesTo: AppliesToType;
  status: StatusType;
  description?: string;
  createdBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceRoundingFormModel {
  price: number | null;
  appliesTo: AppliesToType;
  status: StatusType;
  description: string;
}
