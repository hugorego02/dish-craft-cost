export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      components: {
        Row: {
          food_group: string
          id: string
          ingredient_id: string
          name: string
          notes: string | null
          yield_factor_id: string | null
        }
        Insert: {
          food_group?: string
          id?: string
          ingredient_id: string
          name: string
          notes?: string | null
          yield_factor_id?: string | null
        }
        Update: {
          food_group?: string
          id?: string
          ingredient_id?: string
          name?: string
          notes?: string | null
          yield_factor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "components_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_yield_factor_id_fkey"
            columns: ["yield_factor_id"]
            isOneToOne: false
            referencedRelation: "yield_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          dietary_restrictions: string[] | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferences: string[] | null
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          dietary_restrictions?: string[] | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferences?: string[] | null
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          dietary_restrictions?: string[] | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferences?: string[] | null
          status?: string
        }
        Relationships: []
      }
      extra_costs: {
        Row: {
          apply_per: string
          category: string
          id: string
          name: string
          notes: string | null
          value: number
        }
        Insert: {
          apply_per?: string
          category?: string
          id?: string
          name: string
          notes?: string | null
          value?: number
        }
        Update: {
          apply_per?: string
          category?: string
          id?: string
          name?: string
          notes?: string | null
          value?: number
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          notes: string | null
          price: number
          quantity: number
          supplier: string | null
          unit: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          price?: number
          quantity?: number
          supplier?: string | null
          unit?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          price?: number
          quantity?: number
          supplier?: string | null
          unit?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          notes: string | null
          order_id: string
          plate_id: string | null
          plate_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          notes?: string | null
          order_id: string
          plate_id?: string | null
          plate_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          notes?: string | null
          order_id?: string
          plate_id?: string | null
          plate_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          delivery_date: string | null
          discount: number
          id: string
          notes: string | null
          order_date: string
          payment_method: string | null
          status: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_date?: string
          payment_method?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_date?: string
          payment_method?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      plate_sizes: {
        Row: {
          active: boolean
          description: string | null
          groups: Json
          id: string
          name: string
          notes: string | null
          total_weight: number
        }
        Insert: {
          active?: boolean
          description?: string | null
          groups?: Json
          id?: string
          name: string
          notes?: string | null
          total_weight?: number
        }
        Update: {
          active?: boolean
          description?: string | null
          groups?: Json
          id?: string
          name?: string
          notes?: string | null
          total_weight?: number
        }
        Relationships: []
      }
      plates: {
        Row: {
          active: boolean
          components: Json
          extra_cost_ids: Json
          id: string
          manual_price: number | null
          markup_or_margin: number | null
          name: string
          notes: string | null
          plate_size_id: string
          pricing_method: string
          type: string
        }
        Insert: {
          active?: boolean
          components?: Json
          extra_cost_ids?: Json
          id?: string
          manual_price?: number | null
          markup_or_margin?: number | null
          name: string
          notes?: string | null
          plate_size_id: string
          pricing_method?: string
          type?: string
        }
        Update: {
          active?: boolean
          components?: Json
          extra_cost_ids?: Json
          id?: string
          manual_price?: number | null
          markup_or_margin?: number | null
          name?: string
          notes?: string | null
          plate_size_id?: string
          pricing_method?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "plates_plate_size_id_fkey"
            columns: ["plate_size_id"]
            isOneToOne: false
            referencedRelation: "plate_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      yield_factors: {
        Row: {
          cooked_weight: number
          factor: number
          id: string
          ingredient_id: string
          method: string | null
          notes: string | null
          raw_weight: number
        }
        Insert: {
          cooked_weight?: number
          factor?: number
          id?: string
          ingredient_id: string
          method?: string | null
          notes?: string | null
          raw_weight?: number
        }
        Update: {
          cooked_weight?: number
          factor?: number
          id?: string
          ingredient_id?: string
          method?: string | null
          notes?: string | null
          raw_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "yield_factors_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
