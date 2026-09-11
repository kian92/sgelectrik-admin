export interface Dealer {
  id: number;
  name: string;
  slug: string;
}

export interface Promotion {
  id: number;
  /** Null for house promotions run by SGElectrik rather than a dealer. */
  dealer_id: number | null;
  title: string;
  slug: string;
  venue: string | null;
  area: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  time_range: string | null;
  perks: string[];
  image: string | null;
  description: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  dealers?: Dealer | null;
}

export interface PromotionFormState {
  title: string;
  slug: string;
  venue: string;
  area: string;
  startDate: string;
  endDate: string;
  timeRange: string;
  perksText: string;
  image: string;
  description: string;
  status: string;
  dealerId: string;
}
