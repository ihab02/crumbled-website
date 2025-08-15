export interface Order {
  id: number;
  order_number?: string;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_zone?: string;
  delivery_additional_info?: string;
  subtotal?: number;
  delivery_fee?: number;
  original_delivery_fee?: number;
  discount_amount?: number;
  total_amount?: number;
  total_after_discount?: number;
  status: string;
  order_status?: string;
  payment_method?: string;
  payment_status?: string;
  payment_token?: string;
  promo_code?: string;
  promo_code_id?: number;
  promo_code_details?: any;
  expected_delivery_date?: string;
  delivery_time_slot_name?: string;
  from_hour?: string;
  to_hour?: string;
  delivery_man_id?: number;
  delivery_man_name?: string;
  delivery_man_phone?: string;
  kitchen_id?: number;
  priority?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  zone?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_type: string;
  quantity: number;
  unit_price: number;
  price?: number;
  total_price?: number;
  flavor_details?: string;
  flavors?: FlavorDetail[];
  image?: string;
  notes?: string;
}

export interface FlavorDetail {
  flavor_id: number;
  flavor_name: string;
  size_id: number;
  size_name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
}

export interface OrderFilter {
  status?: string[];
  priority?: string[];
  assigned_to?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

