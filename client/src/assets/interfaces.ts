export interface Property {
  name: string;
  price: number;
  rent: number[];
  color: string;
  position: number;
  owner: number | null;
  houses: number;
  type: "property" | "railroad" | "utility" | "special";
  housePrice?: number;
}

export interface Player {
  id: number;
  name: string;
  position: number;
  money: number;
  properties: number[];
  color: string;
  piece: string;
  isComputer: boolean;
}
