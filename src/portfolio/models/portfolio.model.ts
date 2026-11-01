export interface PortfolioPosition {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  marketValue: number;
  totalReturnPercentage: number;
  dailyReturnPercentage: number;
}

export interface Portfolio {
  totalValue: number;
  availableCash: number;
  positions: PortfolioPosition[];
}
