import type {
  StaffRole,
  Category,
  Occasion,
  Color,
  Fabric,
  Availability,
  PaymentMode,
  ShoppingFor,
  TryonStatus,
  SessionStatus,
} from '@/lib/constants';

export interface StoreSettings {
  id: string;
  store_code: string;
  store_name: string;
  currency: string;
  tax_percent: number;
  updated_at: string;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  password_hash: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  dress_id: string;
  name: string;
  images: string[];
  quantity: number;
  category: Category;
  gender: 'men' | 'women';
  occasions: Occasion[];
  colors: Color[];
  tags: string[];
  fabric: Fabric | null;
  sizes: string[];
  price: number;
  availability: Availability;
  active: boolean;
  created_at: string;
}

export interface StylingSession {
  id: string;
  staff_id: string;
  customer_name: string;
  customer_age: number | null;
  shopping_for: ShoppingFor;
  occasions: Occasion[];
  category: Category | null;
  wants_couple_combo: boolean;
  price_range_min: number | null;
  price_range_max: number | null;
  customer_photo_url: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface Recommendation {
  id: string;
  session_id: string;
  item_id: string;
  match_score: number;
  match_reasons: string[];
  rank: number;
  created_at: string;
}

export interface Tryon {
  id: string;
  session_id: string;
  item_id: string;
  person_image_url: string;
  result_image_url: string | null;
  status: TryonStatus;
  created_at: string;
}

export interface Bill {
  id: string;
  staff_id: string;
  session_id: string | null;
  customer_name: string | null;
  payment_mode: PaymentMode;
  payment_ref: string | null;
  bill_number: number;
  total_amount: number;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
}

export interface Return {
  id: string;
  item_id: string;
  staff_id: string;
  notes: string | null;
  created_at: string;
}
