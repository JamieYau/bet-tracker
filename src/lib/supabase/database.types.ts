export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_accounts: {
        Row: {
          owner_id: string;
          singleton: boolean;
        };
        ComputedFields: never;
        Insert: {
          owner_id: string;
          singleton?: boolean;
        };
        Update: {
          owner_id?: string;
          singleton?: boolean;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          bet_id: string;
          created_at: string;
          id: string;
          image_hash: string | null;
          mime_type: string;
          original_name: string;
          owner_id: string;
          size_bytes: number;
          storage_path: string;
        };
        ComputedFields: never;
        Insert: {
          bet_id: string;
          created_at?: string;
          id?: string;
          image_hash?: string | null;
          mime_type: string;
          original_name: string;
          owner_id: string;
          size_bytes: number;
          storage_path: string;
        };
        Update: {
          bet_id?: string;
          created_at?: string;
          id?: string;
          image_hash?: string | null;
          mime_type?: string;
          original_name?: string;
          owner_id?: string;
          size_bytes?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_owner_id_bet_id_fkey";
            columns: ["owner_id", "bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      bets: {
        Row: {
          accepted_odds: number | null;
          bet_type: string;
          bookmaker_id: string;
          cash_stake_pence: number;
          confirmed_from_version: number | null;
          created_at: string;
          free_stake_pence: number;
          free_stake_returned: boolean;
          id: string;
          market: string;
          notes: string;
          owner_id: string;
          placed_at: string;
          reference: string;
          selection: string;
          source_id: string;
          sport: string;
          status: string;
          tags: string[];
          version: number;
        };
        ComputedFields: never;
        Insert: {
          accepted_odds?: number | null;
          bet_type: string;
          bookmaker_id: string;
          cash_stake_pence: number;
          confirmed_from_version?: number | null;
          created_at?: string;
          free_stake_pence: number;
          free_stake_returned?: boolean;
          id: string;
          market?: string;
          notes?: string;
          owner_id: string;
          placed_at: string;
          reference?: string;
          selection?: string;
          source_id: string;
          sport?: string;
          status: string;
          tags?: string[];
          version?: number;
        };
        Update: {
          accepted_odds?: number | null;
          bet_type?: string;
          bookmaker_id?: string;
          cash_stake_pence?: number;
          confirmed_from_version?: number | null;
          created_at?: string;
          free_stake_pence?: number;
          free_stake_returned?: boolean;
          id?: string;
          market?: string;
          notes?: string;
          owner_id?: string;
          placed_at?: string;
          reference?: string;
          selection?: string;
          source_id?: string;
          sport?: string;
          status?: string;
          tags?: string[];
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bets_owner_id_bookmaker_id_fkey";
            columns: ["owner_id", "bookmaker_id"];
            isOneToOne: false;
            referencedRelation: "bookmakers";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "bets_owner_id_source_id_fkey";
            columns: ["owner_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      bookmakers: {
        Row: {
          active: boolean;
          id: string;
          name: string;
          owner_id: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          active?: boolean;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      legs: {
        Row: {
          bet_id: string;
          id: string;
          market: string;
          odds: number | null;
          owner_id: string;
          position: number;
          selection: string;
          sport: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          bet_id: string;
          id: string;
          market?: string;
          odds?: number | null;
          owner_id: string;
          position: number;
          selection: string;
          sport: string;
          status: string;
        };
        Update: {
          bet_id?: string;
          id?: string;
          market?: string;
          odds?: number | null;
          owner_id?: string;
          position?: number;
          selection?: string;
          sport?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legs_owner_id_bet_id_fkey";
            columns: ["owner_id", "bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      settlements: {
        Row: {
          bet_id: string;
          created_at: string;
          early_payout: boolean;
          id: string;
          outcome: string;
          owner_id: string;
          reason: string;
          request_key: string;
          return_pence: number;
          revision: number;
          settled_at: string;
        };
        ComputedFields: never;
        Insert: {
          bet_id: string;
          created_at?: string;
          early_payout?: boolean;
          id?: string;
          outcome: string;
          owner_id: string;
          reason?: string;
          request_key: string;
          return_pence: number;
          revision: number;
          settled_at: string;
        };
        Update: {
          bet_id?: string;
          created_at?: string;
          early_payout?: boolean;
          id?: string;
          outcome?: string;
          owner_id?: string;
          reason?: string;
          request_key?: string;
          return_pence?: number;
          revision?: number;
          settled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_owner_id_bet_id_fkey";
            columns: ["owner_id", "bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      sources: {
        Row: {
          active: boolean;
          id: string;
          name: string;
          owner_id: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          active?: boolean;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_app_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      save_bet: {
        Args: {
          p_allow_duplicate?: boolean;
          p_confirm: boolean;
          p_expected_version: number;
          p_id: string;
          p_legs: Json;
          p_payload: Json;
        };
        Returns: string;
      };
      save_option: {
        Args: {
          p_active: boolean;
          p_id: string;
          p_kind: string;
          p_name: string;
        };
        Returns: string;
      };
      settle_bet: {
        Args: {
          p_bet_id: string;
          p_early_payout: boolean;
          p_expected_version: number;
          p_outcome: string;
          p_reason: string;
          p_request_key: string;
          p_return_pence: number;
          p_settled_at: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
