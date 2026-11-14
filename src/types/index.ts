export interface Company {
  id: string;
  code: 'HB' | 'PCAM' | string;
  name: string;
  logo_url?: string;
  description?: string;
}

export interface Product {
  id: string;
  company_id: string;
  name_en: string;
  name_kh: string;
  packaging_spec: string;
  unit: string; // 'កេស' | 'ប៉ាឡែត'
  unit_weight_kg: number;
  image_url?: string;
  display_order: number;
}

export interface LineItemState {
  id: string; // client temporary ID
  productId: string;
  productNameKh: string;
  productNameEn: string;
  packagingSpec: string;
  unit: string;
  unitWeightKg: number;
  imageUrl?: string;
  quantity: number;
  totalWeightKg: number;
  totalWeightTon: number;
}

export interface TruckRecord {
  id?: string;
  plate_number: string;
  company_id: string;
  company_code?: string;
  company_name?: string;
  company_logo?: string;
  record_date: string;
  scale_in_kg: number;
  scale_out_kg: number;
  scale_net_kg: number;
  warehouse_total_kg: number;
  diff_kg: number;
  diff_percent: number;
  status: 'អនុញ្ញាត' | 'ត្រួតពិនិត្យ';
  status_message: string;
  operator_name?: string;
  notes?: string;
  created_at?: string;
  items?: TruckRecordItem[];
}

export interface TruckRecordItem {
  id?: string;
  record_id?: string;
  product_id: string;
  quantity: number;
  unit_weight_kg: number;
  total_weight_kg: number;
  total_weight_ton: number;
  product?: Product;
}
