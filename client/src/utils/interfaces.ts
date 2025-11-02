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
  mortgaged?: boolean;
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
  isActive: boolean;
  bankrupt: boolean;
  inJail: boolean;
  getOutOfJailFree: number;
  socketId?: string;
}

export interface TradeOffer {
  id: string;
  from: number;
  to: number;
  offerProperties: number[];
  requestProperties: number[];
  offerMoney: number;
  requestMoney: number;
  status: "pending" | "accepted" | "rejected";
}

export interface ChanceCard {
  type: "money" | "move" | "jail" | "jail_free";
  title: string;
  description: string;
  amount?: number;
  position?: number;
}

export interface CommunityChestCard {
  type: "money" | "jail_free";
  title: string;
  description: string;
  amount?: number;
}
