export interface Database {
  public: {
    Tables: {
      tender_configs: {
        Row: {
          id: string;
          package_code: string;
          package_name: string;
          project_name: string;
          form_schema: FormSchemaJson;
          boq_template: BoqTemplateJson;
          closing_deadline: string;
          is_active: boolean;
          is_archived: boolean;
          commercial_terms: CommercialTermsJson;
          location: string | null;
          job_sequence: string | null;
          dependencies: string | null;
          mobilisation_requirement: string | null;
          scope_items: string[] | null;
          boq_qty_editable: boolean;
          notes_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          package_code: string;
          package_name: string;
          project_name: string;
          form_schema: FormSchemaJson;
          boq_template: BoqTemplateJson;
          closing_deadline: string;
          is_active?: boolean;
          is_archived?: boolean;
          commercial_terms?: CommercialTermsJson;
          location?: string | null;
          job_sequence?: string | null;
          dependencies?: string | null;
          mobilisation_requirement?: string | null;
          scope_items?: string[] | null;
          boq_qty_editable?: boolean;
          notes_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          package_code?: string;
          package_name?: string;
          project_name?: string;
          form_schema?: FormSchemaJson;
          boq_template?: BoqTemplateJson;
          closing_deadline?: string;
          is_active?: boolean;
          is_archived?: boolean;
          commercial_terms?: CommercialTermsJson;
          location?: string | null;
          job_sequence?: string | null;
          dependencies?: string | null;
          mobilisation_requirement?: string | null;
          scope_items?: string[] | null;
          boq_qty_editable?: boolean;
          notes_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tender_configs_pkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'tender_configs';
            referencedColumns: ['id'];
          },
        ];
      };
      vendors: {
        Row: {
          id: string;
          company_name: string;
          trade_licence_number: string;
          contact_name: string;
          email: string;
          whatsapp: string;
          tier: VendorTier;
          quality_score: number;
          is_dda_approved: boolean;
          metaforge_confirmed: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          trade_licence_number: string;
          contact_name: string;
          email: string;
          whatsapp: string;
          tier?: VendorTier;
          quality_score?: number;
          is_dda_approved?: boolean;
          metaforge_confirmed?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          trade_licence_number?: string;
          contact_name?: string;
          email?: string;
          whatsapp?: string;
          tier?: VendorTier;
          quality_score?: number;
          is_dda_approved?: boolean;
          metaforge_confirmed?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      vendor_tenders: {
        Row: {
          id: string;
          vendor_id: string;
          tender_config_id: string;
          token: string;
          status: VendorTenderStatus;
          expires_at: string;
          invited_at: string;
          opened_at: string | null;
          submitted_at: string | null;
          reissue_count: number;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          tender_config_id: string;
          token: string;
          status?: VendorTenderStatus;
          expires_at: string;
          invited_at?: string;
          opened_at?: string | null;
          submitted_at?: string | null;
          reissue_count?: number;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          tender_config_id?: string;
          token?: string;
          status?: VendorTenderStatus;
          expires_at?: string;
          invited_at?: string;
          opened_at?: string | null;
          submitted_at?: string | null;
          reissue_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'vendor_tenders_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendor_tenders_tender_config_id_fkey';
            columns: ['tender_config_id'];
            isOneToOne: false;
            referencedRelation: 'tender_configs';
            referencedColumns: ['id'];
          },
        ];
      };
      submissions: {
        Row: {
          id: string;
          vendor_tender_id: string;
          vendor_id: string;
          tender_config_id: string;
          form_data: Record<string, unknown>;
          boq_data: BoqSubmissionItemJson[];
          total_quote_aed: number;
          material_option: MaterialOption;
          mobilisation_date: string;
          crew_size: number;
          metaforge_confirmed: boolean;
          insurance_confirmed: boolean;
          price_score: number | null;
          quality_score: number | null;
          tier_score: number | null;
          composite_score: number | null;
          submitted_at: string;
          form_schema_snapshot: FormSchemaJson;
          boq_template_snapshot: BoqTemplateJson;
        };
        Insert: {
          id?: string;
          vendor_tender_id: string;
          vendor_id: string;
          tender_config_id: string;
          form_data: Record<string, unknown>;
          boq_data: BoqSubmissionItemJson[];
          total_quote_aed: number;
          material_option: MaterialOption;
          mobilisation_date: string;
          crew_size: number;
          metaforge_confirmed: boolean;
          insurance_confirmed: boolean;
          price_score?: number | null;
          quality_score?: number | null;
          tier_score?: number | null;
          composite_score?: number | null;
          submitted_at?: string;
          form_schema_snapshot: FormSchemaJson;
          boq_template_snapshot: BoqTemplateJson;
        };
        Update: {
          id?: string;
          vendor_tender_id?: string;
          vendor_id?: string;
          tender_config_id?: string;
          form_data?: Record<string, unknown>;
          boq_data?: BoqSubmissionItemJson[];
          total_quote_aed?: number;
          material_option?: MaterialOption;
          mobilisation_date?: string;
          crew_size?: number;
          metaforge_confirmed?: boolean;
          insurance_confirmed?: boolean;
          price_score?: number | null;
          quality_score?: number | null;
          tier_score?: number | null;
          composite_score?: number | null;
          submitted_at?: string;
          form_schema_snapshot?: FormSchemaJson;
          boq_template_snapshot?: BoqTemplateJson;
        };
        Relationships: [
          {
            foreignKeyName: 'submissions_vendor_tender_id_fkey';
            columns: ['vendor_tender_id'];
            isOneToOne: false;
            referencedRelation: 'vendor_tenders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_tender_config_id_fkey';
            columns: ['tender_config_id'];
            isOneToOne: false;
            referencedRelation: 'tender_configs';
            referencedColumns: ['id'];
          },
        ];
      };
      boq_rates: {
        Row: {
          id: string;
          package_code: string;
          line_item_code: string;
          line_item_description: string;
          unit: string;
          rate_min: number;
          rate_median: number;
          rate_max: number;
          outlier_count: number;
          sample_size: number;
          tender_cycle_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          package_code: string;
          line_item_code: string;
          line_item_description: string;
          unit: string;
          rate_min: number;
          rate_median: number;
          rate_max: number;
          outlier_count?: number;
          sample_size: number;
          tender_cycle_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          package_code?: string;
          line_item_code?: string;
          line_item_description?: string;
          unit?: string;
          rate_min?: number;
          rate_median?: number;
          rate_max?: number;
          outlier_count?: number;
          sample_size?: number;
          tender_cycle_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          event_type: string;
          token: string | null;
          vendor_tender_id: string | null;
          tender_config_id: string | null;
          vendor_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          token?: string | null;
          vendor_tender_id?: string | null;
          tender_config_id?: string | null;
          vendor_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          token?: string | null;
          vendor_tender_id?: string | null;
          tender_config_id?: string | null;
          vendor_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_vendor_invites: {
        Args: {
          p_tender_config_id: string;
          p_vendor_ids: string[];
        };
        Returns: number;
      };
      reissue_vendor_invite: {
        Args: {
          p_vendor_id: string;
          p_tender_id: string;
          p_expiry_hours?: number;
        };
        Returns: string;
      };
      expire_stale_tokens: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Enum types
export type VendorTier = 'trial' | 'preferred' | 'strategic';
export type VendorTenderStatus = 'invited' | 'opened' | 'submitted' | 'expired';
export type MaterialOption = 'labour_only' | 'labour_material' | 'split_rate';

// JSONB column types
export type FormSchemaJson = {
  sections: {
    id: string;
    title: string;
    description?: string;
    fields: {
      id: string;
      type: string;
      label: string;
      required: boolean;
      placeholder?: string;
      prefill_from_vendor?: string;
      options?: { value: string; label: string }[];
      min?: number;
      max?: number;
      step?: number;
      rows?: number;
      hint?: string;
    }[];
  }[];
};

export type BoqTemplateJson = {
  code: string;
  description: string;
  unit: string;
  quantity: number;
}[];

export type BoqSubmissionItemJson = {
  code: string;
  rate: number;
  total: number;
  quantity?: number;
};

export type CommercialTermsJson = Record<string, unknown>;

// Helper types for table access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T];

export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
