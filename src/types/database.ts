// Generated from Supabase project zgxhgjtzzqzpycrrdptm on 2026-09-16.
// Keep this file in sync with the production schema when migrations change.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      fleets: {
        Row: {
          created_at: string | null;
          current_lat: number | null;
          current_lng: number | null;
          driver_id: string | null;
          id: string;
          is_demo: boolean;
          jenis_armada: string;
          kapasitas: number | null;
          location_updated_at: string | null;
          no_polisi: string;
          satuan_kapasitas: string;
          status_ketersediaan: string;
          tarif_dasar: number;
          tarif_per_km: number;
          vendor_id: string;
        };
        Insert: {
          created_at?: string | null;
          current_lat?: number | null;
          current_lng?: number | null;
          driver_id?: string | null;
          id?: string;
          is_demo?: boolean;
          jenis_armada?: string;
          kapasitas?: number | null;
          location_updated_at?: string | null;
          no_polisi: string;
          satuan_kapasitas?: string;
          status_ketersediaan?: string;
          tarif_dasar?: number;
          tarif_per_km?: number;
          vendor_id: string;
        };
        Update: {
          created_at?: string | null;
          current_lat?: number | null;
          current_lng?: number | null;
          driver_id?: string | null;
          id?: string;
          is_demo?: boolean;
          jenis_armada?: string;
          kapasitas?: number | null;
          location_updated_at?: string | null;
          no_polisi?: string;
          satuan_kapasitas?: string;
          status_ketersediaan?: string;
          tarif_dasar?: number;
          tarif_per_km?: number;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fleets_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fleets_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
        ];
      };
      items: {
        Row: {
          created_at: string | null;
          harga: number;
          id: string;
          kategori: string;
          lokasi_lat: number | null;
          lokasi_lng: number | null;
          nama_item: string;
          satuan: string;
          stok: number;
          vendor_id: string;
        };
        Insert: {
          created_at?: string | null;
          harga: number;
          id?: string;
          kategori: string;
          lokasi_lat?: number | null;
          lokasi_lng?: number | null;
          nama_item: string;
          satuan: string;
          stok?: number;
          vendor_id: string;
        };
        Update: {
          created_at?: string | null;
          harga?: number;
          id?: string;
          kategori?: string;
          lokasi_lat?: number | null;
          lokasi_lng?: number | null;
          nama_item?: string;
          satuan?: string;
          stok?: number;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'items_vendor_id_fkey';
            columns: ['vendor_id'];
            isOneToOne: false;
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          assigned_at: string | null;
          created_at: string | null;
          customer_id: string;
          delivery_address: string | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          distance_km: number | null;
          driver_id: string | null;
          fleet_id: string | null;
          id: string;
          item_id: string;
          kontrak_id: string | null;
          notes: string | null;
          project_name: string | null;
          receiver_name: string | null;
          receiver_phone: string | null;
          route_distance_m: number | null;
          route_duration_s: number | null;
          route_polyline: string | null;
          route_source: string | null;
          route_updated_at: string | null;
          service_fee: number;
          shipping_cost: number;
          status: string;
          total_harga: number;
          vehicle_capacity: string | null;
          vehicle_type: string | null;
          volume: number;
        };
        Insert: {
          assigned_at?: string | null;
          created_at?: string | null;
          customer_id: string;
          delivery_address?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          distance_km?: number | null;
          driver_id?: string | null;
          fleet_id?: string | null;
          id?: string;
          item_id: string;
          kontrak_id?: string | null;
          notes?: string | null;
          project_name?: string | null;
          receiver_name?: string | null;
          receiver_phone?: string | null;
          route_distance_m?: number | null;
          route_duration_s?: number | null;
          route_polyline?: string | null;
          route_source?: string | null;
          route_updated_at?: string | null;
          service_fee?: number;
          shipping_cost?: number;
          status?: string;
          total_harga: number;
          vehicle_capacity?: string | null;
          vehicle_type?: string | null;
          volume: number;
        };
        Update: {
          assigned_at?: string | null;
          created_at?: string | null;
          customer_id?: string;
          delivery_address?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          distance_km?: number | null;
          driver_id?: string | null;
          fleet_id?: string | null;
          id?: string;
          item_id?: string;
          kontrak_id?: string | null;
          notes?: string | null;
          project_name?: string | null;
          receiver_name?: string | null;
          receiver_phone?: string | null;
          route_distance_m?: number | null;
          route_duration_s?: number | null;
          route_polyline?: string | null;
          route_source?: string | null;
          route_updated_at?: string | null;
          service_fee?: number;
          shipping_cost?: number;
          status?: string;
          total_harga?: number;
          vehicle_capacity?: string | null;
          vehicle_type?: string | null;
          volume?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fleet_id_fkey';
            columns: ['fleet_id'];
            isOneToOne: false;
            referencedRelation: 'fleets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          id: string;
          nama: string | null;
          no_hp: string | null;
          role: string;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          nama?: string | null;
          no_hp?: string | null;
          role: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          nama?: string | null;
          no_hp?: string | null;
          role?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          alamat: string | null;
          created_at: string | null;
          dokumen_izin_url: string | null;
          id: string;
          is_demo: boolean;
          logo_url: string | null;
          lokasi_lat: number | null;
          lokasi_lng: number | null;
          nama_perusahaan: string;
          status_verifikasi: string;
          user_id: string | null;
        };
        Insert: {
          alamat?: string | null;
          created_at?: string | null;
          dokumen_izin_url?: string | null;
          id?: string;
          is_demo?: boolean;
          logo_url?: string | null;
          lokasi_lat?: number | null;
          lokasi_lng?: number | null;
          nama_perusahaan: string;
          status_verifikasi?: string;
          user_id?: string | null;
        };
        Update: {
          alamat?: string | null;
          created_at?: string | null;
          dokumen_izin_url?: string | null;
          id?: string;
          is_demo?: boolean;
          logo_url?: string | null;
          lokasi_lat?: number | null;
          lokasi_lng?: number | null;
          nama_perusahaan?: string;
          status_verifikasi?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vendors_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      assign_driver_to_fleet: {
        Args: { p_driver_id?: string; p_fleet_id: string };
        Returns: boolean;
      };
      list_available_drivers: {
        Args: never;
        Returns: {
          assigned_fleet_count: number;
          id: string;
          nama: string;
          no_hp: string;
        }[];
      };
      update_driver_location: {
        Args: { p_lat: number; p_lng: number };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
