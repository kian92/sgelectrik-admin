export interface Dealer {
  id: number;
  name: string;
  slug: string;
}

export interface Workshop {
  id: number;
  dealer_id: number;
  name: string;
  slug: string;
  type: "Authorised" | "Independent" | "Specialist";
  area: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  services: string[];
  brands: string[];
  certifications: string[];
  rating: string | number;
  review_count: number;
  description: string | null;
  since: number | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  dealers?: Dealer | null;
}

export interface WorkshopFormState {
  name: string;
  slug: string;
  type: string;
  area: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  since: string;
  servicesText: string;
  brandsText: string;
  certificationsText: string;
  rating: string;
  reviewCount: string;
  status: string;
  dealerId: string;
}
