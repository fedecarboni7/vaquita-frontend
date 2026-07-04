export interface UniquePair {
  category_name: string;
  subcategory_name: string | null;
}

export interface ImportPreviewResponse {
  staging_token: string;
  transaction_count: number;
  unique_pairs: UniquePair[];
}

export interface MappingItem {
  category_name: string;
  subcategory_name: string | null;
  existing_category_id: string | null;
  existing_subcategory_id: string | null;
}

export interface ImportConfirmRequest {
  staging_token: string;
  mapping: MappingItem[];
}

export interface ImportConfirmResponse {
  created_transactions: number;
  created_accounts: string[];
  created_categories: string[];
  created_subcategories: string[];
}
