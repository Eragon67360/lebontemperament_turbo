export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json | null;
          target_id: string | null;
          title: string;
          type: Database["public"]["Enums"]["activity_type"];
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          target_id?: string | null;
          title: string;
          type: Database["public"]["Enums"]["activity_type"];
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          target_id?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["activity_type"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      anniversary_archives: {
        Row: {
          created_at: string | null;
          description: string;
          file_size: string;
          file_url: string;
          id: string;
          is_visible: boolean | null;
          theme: string;
          title: string;
          type: string;
          updated_at: string | null;
          year: number;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          file_size: string;
          file_url: string;
          id?: string;
          is_visible?: boolean | null;
          theme: string;
          title: string;
          type: string;
          updated_at?: string | null;
          year: number;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          file_size?: string;
          file_url?: string;
          id?: string;
          is_visible?: boolean | null;
          theme?: string;
          title?: string;
          type?: string;
          updated_at?: string | null;
          year?: number;
        };
        Relationships: [];
      };
      anniversary_audio_memories: {
        Row: {
          audio_url: string;
          created_at: string | null;
          description: string;
          display_order: number;
          duration: string;
          id: string;
          is_visible: boolean | null;
          speaker_name: string | null;
          title: string;
          updated_at: string | null;
          year: number | null;
        };
        Insert: {
          audio_url: string;
          created_at?: string | null;
          description: string;
          display_order: number;
          duration: string;
          id?: string;
          is_visible?: boolean | null;
          speaker_name?: string | null;
          title: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Update: {
          audio_url?: string;
          created_at?: string | null;
          description?: string;
          display_order?: number;
          duration?: string;
          id?: string;
          is_visible?: boolean | null;
          speaker_name?: string | null;
          title?: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Relationships: [];
      };
      anniversary_form_config: {
        Row: {
          created_at: string | null;
          email_label: string | null;
          id: string;
          is_enabled: boolean | null;
          message_label: string | null;
          name_label: string | null;
          section_description: string;
          section_title: string;
          submit_button_text: string | null;
          success_message: string | null;
          updated_at: string | null;
          year_label: string | null;
        };
        Insert: {
          created_at?: string | null;
          email_label?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          message_label?: string | null;
          name_label?: string | null;
          section_description?: string;
          section_title?: string;
          submit_button_text?: string | null;
          success_message?: string | null;
          updated_at?: string | null;
          year_label?: string | null;
        };
        Update: {
          created_at?: string | null;
          email_label?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          message_label?: string | null;
          name_label?: string | null;
          section_description?: string;
          section_title?: string;
          submit_button_text?: string | null;
          success_message?: string | null;
          updated_at?: string | null;
          year_label?: string | null;
        };
        Relationships: [];
      };
      anniversary_hero: {
        Row: {
          created_at: string | null;
          cta_target_section: string | null;
          cta_text: string | null;
          description: string | null;
          enable_intro_animation: boolean | null;
          hero_number: string;
          hero_subtitle: string;
          id: string;
          skip_button_text: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          cta_target_section?: string | null;
          cta_text?: string | null;
          description?: string | null;
          enable_intro_animation?: boolean | null;
          hero_number?: string;
          hero_subtitle?: string;
          id?: string;
          skip_button_text?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          cta_target_section?: string | null;
          cta_text?: string | null;
          description?: string | null;
          enable_intro_animation?: boolean | null;
          hero_number?: string;
          hero_subtitle?: string;
          id?: string;
          skip_button_text?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      anniversary_hero_stats: {
        Row: {
          created_at: string;
          display_order: number;
          icon_name: string;
          id: string;
          is_visible: boolean;
          label: string;
          number: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          icon_name: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          number: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          icon_name?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          number?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      anniversary_memories: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          is_approved: boolean | null;
          is_featured: boolean | null;
          message: string;
          name: string;
          updated_at: string | null;
          year: number | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          message: string;
          name: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          is_approved?: boolean | null;
          is_featured?: boolean | null;
          message?: string;
          name?: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Relationships: [];
      };
      anniversary_navigation_cards: {
        Row: {
          created_at: string | null;
          description: string;
          display_order: number;
          icon_name: string;
          id: string;
          is_visible: boolean | null;
          target_section_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          display_order: number;
          icon_name: string;
          id?: string;
          is_visible?: boolean | null;
          target_section_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          display_order?: number;
          icon_name?: string;
          id?: string;
          is_visible?: boolean | null;
          target_section_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      anniversary_photos: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          display_order: number;
          id: string;
          image_url: string;
          is_visible: boolean | null;
          title: string;
          updated_at: string | null;
          year: number | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          display_order: number;
          id?: string;
          image_url: string;
          is_visible?: boolean | null;
          title: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string;
          is_visible?: boolean | null;
          title?: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Relationships: [];
      };
      anniversary_timeline_events: {
        Row: {
          created_at: string | null;
          description: string;
          display_order: number;
          icon_name: string;
          id: string;
          is_visible: boolean | null;
          title: string;
          updated_at: string | null;
          year: number;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          display_order: number;
          icon_name: string;
          id?: string;
          is_visible?: boolean | null;
          title: string;
          updated_at?: string | null;
          year: number;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          display_order?: number;
          icon_name?: string;
          id?: string;
          is_visible?: boolean | null;
          title?: string;
          updated_at?: string | null;
          year?: number;
        };
        Relationships: [];
      };
      anniversary_videos: {
        Row: {
          category: string;
          created_at: string | null;
          description: string;
          display_order: number;
          id: string;
          is_visible: boolean | null;
          thumbnail_url: string;
          title: string;
          updated_at: string | null;
          video_url: string | null;
          year: number | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description: string;
          display_order: number;
          id?: string;
          is_visible?: boolean | null;
          thumbnail_url: string;
          title: string;
          updated_at?: string | null;
          video_url?: string | null;
          year?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string;
          display_order?: number;
          id?: string;
          is_visible?: boolean | null;
          thumbnail_url?: string;
          title?: string;
          updated_at?: string | null;
          video_url?: string | null;
          year?: number | null;
        };
        Relationships: [];
      };
      bug_messages: {
        Row: {
          bug_report_id: string;
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          receiver_id: string | null;
          sender_id: string;
        };
        Insert: {
          bug_report_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          receiver_id?: string | null;
          sender_id: string;
        };
        Update: {
          bug_report_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          receiver_id?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bug_messages_bug_report_id_fkey";
            columns: ["bug_report_id"];
            isOneToOne: false;
            referencedRelation: "bug_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bug_messages_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bug_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bug_reports: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_read: boolean | null;
          reported_by: string;
          status: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_read?: boolean | null;
          reported_by: string;
          status?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_read?: boolean | null;
          reported_by?: string;
          status?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bug_reports_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cas: {
        Row: {
          created_at: string;
          created_by: string;
          date_from: string;
          file_url: string | null;
          id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          date_from: string;
          file_url?: string | null;
          id?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          date_from?: string;
          file_url?: string | null;
          id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      concerts: {
        Row: {
          additional_informations: string | null;
          affiche: string | null;
          context: string;
          created_at: string | null;
          created_by: string | null;
          date: string;
          id: string;
          name: string | null;
          place: string;
          related_link: string | null;
          time: string;
          tour_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          additional_informations?: string | null;
          affiche?: string | null;
          context: string;
          created_at?: string | null;
          created_by?: string | null;
          date: string;
          id?: string;
          name?: string | null;
          place: string;
          related_link?: string | null;
          time: string;
          tour_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          additional_informations?: string | null;
          affiche?: string | null;
          context?: string;
          created_at?: string | null;
          created_by?: string | null;
          date?: string;
          id?: string;
          name?: string | null;
          place?: string;
          related_link?: string | null;
          time?: string;
          tour_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "concerts_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      deliveries: {
        Row: {
          created_at: string | null;
          current_recipient_id: string | null;
          delay_minutes: number | null;
          driver_id: string;
          expires_at: string;
          id: string;
          is_delayed: boolean;
          is_tracking_active: boolean;
          latitude: number | null;
          longitude: number | null;
          problem_message: string | null;
          public_token: string;
          scheduled_at: string | null;
          scheduled_end_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_recipient_id?: string | null;
          delay_minutes?: number | null;
          driver_id: string;
          expires_at: string;
          id?: string;
          is_delayed?: boolean;
          is_tracking_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          problem_message?: string | null;
          public_token: string;
          scheduled_at?: string | null;
          scheduled_end_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_recipient_id?: string | null;
          delay_minutes?: number | null;
          driver_id?: string;
          expires_at?: string;
          id?: string;
          is_delayed?: boolean;
          is_tracking_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          problem_message?: string | null;
          public_token?: string;
          scheduled_at?: string | null;
          scheduled_end_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deliveries_current_recipient_id_fkey";
            columns: ["current_recipient_id"];
            isOneToOne: false;
            referencedRelation: "delivery_recipients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_recipients: {
        Row: {
          address: string | null;
          delivered_at: string | null;
          delivery_id: string;
          eta_arrival_sms_sent_at: string | null;
          id: string;
          label: string;
          latitude: number | null;
          longitude: number | null;
          phone_number: string | null;
          public_token: string;
          scheduled_at: string | null;
          sort_order: number;
        };
        Insert: {
          address?: string | null;
          delivered_at?: string | null;
          delivery_id: string;
          eta_arrival_sms_sent_at?: string | null;
          id?: string;
          label: string;
          latitude?: number | null;
          longitude?: number | null;
          phone_number?: string | null;
          public_token: string;
          scheduled_at?: string | null;
          sort_order?: number;
        };
        Update: {
          address?: string | null;
          delivered_at?: string | null;
          delivery_id?: string;
          eta_arrival_sms_sent_at?: string | null;
          id?: string;
          label?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone_number?: string | null;
          public_token?: string;
          scheduled_at?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_recipients_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          },
        ];
      };
      donation_receipt_seq: {
        Row: {
          next_val: number;
          year: number;
        };
        Insert: {
          next_val?: number;
          year: number;
        };
        Update: {
          next_val?: number;
          year?: number;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          amount_cents: number;
          created_at: string | null;
          currency: string;
          donor_id: string;
          email_sent_at: string | null;
          id: string;
          pdf_storage_path: string | null;
          receipt_number: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string | null;
          currency?: string;
          donor_id: string;
          email_sent_at?: string | null;
          id?: string;
          pdf_storage_path?: string | null;
          receipt_number: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string | null;
          currency?: string;
          donor_id?: string;
          email_sent_at?: string | null;
          id?: string;
          pdf_storage_path?: string | null;
          receipt_number?: string;
          stripe_checkout_session_id?: string;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey";
            columns: ["donor_id"];
            isOneToOne: false;
            referencedRelation: "donors";
            referencedColumns: ["id"];
          },
        ];
      };
      donors: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          city: string;
          country: string;
          created_at: string | null;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          postal_code: string;
          updated_at: string | null;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          city: string;
          country?: string;
          created_at?: string | null;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          postal_code: string;
          updated_at?: string | null;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          country?: string;
          created_at?: string | null;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          postal_code?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string | null;
          date_from: string;
          date_to: string | null;
          description: string | null;
          event_type: string;
          id: string;
          is_public: boolean;
          link: string | null;
          location: string;
          responsible_email: string | null;
          responsible_name: string;
          time: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date_from: string;
          date_to?: string | null;
          description?: string | null;
          event_type: string;
          id?: string;
          is_public?: boolean;
          link?: string | null;
          location: string;
          responsible_email?: string | null;
          responsible_name: string;
          time: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date_from?: string;
          date_to?: string | null;
          description?: string | null;
          event_type?: string;
          id?: string;
          is_public?: boolean;
          link?: string | null;
          location?: string;
          responsible_email?: string | null;
          responsible_name?: string;
          time?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          created_at: string | null;
          description: string | null;
          flag_key: string;
          flag_name: string;
          id: string;
          is_enabled: boolean;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          flag_key: string;
          flag_name: string;
          id?: string;
          is_enabled?: boolean;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          flag_key?: string;
          flag_name?: string;
          id?: string;
          is_enabled?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      files: {
        Row: {
          created_at: string | null;
          folder_id: string | null;
          group_id: string;
          id: string;
          mime_type: string;
          name: string;
          original_name: string;
          program_id: string;
          size: number;
          storage_path: string;
          updated_at: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          folder_id?: string | null;
          group_id: string;
          id?: string;
          mime_type: string;
          name: string;
          original_name: string;
          program_id: string;
          size: number;
          storage_path: string;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          folder_id?: string | null;
          group_id?: string;
          id?: string;
          mime_type?: string;
          name?: string;
          original_name?: string;
          program_id?: string;
          size?: number;
          storage_path?: string;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      folders: {
        Row: {
          created_at: string | null;
          group_id: string;
          id: string;
          name: string;
          parent_folder_id: string | null;
          path: string;
          program_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          group_id: string;
          id?: string;
          name: string;
          parent_folder_id?: string | null;
          path: string;
          program_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          group_id?: string;
          id?: string;
          name?: string;
          parent_folder_id?: string | null;
          path?: string;
          program_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "folders_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "folders_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string | null;
          description: string | null;
          icon: string;
          id: string;
          name: string;
          order_index: number;
          slug: string;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          icon: string;
          id?: string;
          name: string;
          order_index: number;
          slug: string;
          type: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          icon?: string;
          id?: string;
          name?: string;
          order_index?: number;
          slug?: string;
          type?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          bug_report_id: string | null;
          created_at: string;
          id: string;
          message: string;
          read: boolean | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          bug_report_id?: string | null;
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          bug_report_id?: string | null;
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_bug_report_id_fkey";
            columns: ["bug_report_id"];
            isOneToOne: false;
            referencedRelation: "bug_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          created_at: string | null;
          display_name: string | null;
          email: string | null;
          home_phone: string | null;
          id: string;
          mobile_phone: string | null;
          profile_picture_url: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          updated_at: string | null;
          voice: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          home_phone?: string | null;
          id: string;
          mobile_phone?: string | null;
          profile_picture_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string | null;
          voice?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string | null;
          home_phone?: string | null;
          id?: string;
          mobile_phone?: string | null;
          profile_picture_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string | null;
          voice?: string | null;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          created_at: string | null;
          end_date: string;
          id: string;
          is_active: boolean | null;
          name: string;
          start_date: string;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          start_date: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          start_date?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          author_name: string | null;
          banniere: string | null;
          banniere_photographer_name: string | null;
          banniere_photographer_url: string | null;
          created_at: string | null;
          date: string;
          display_order: number | null;
          explanation: string | null;
          id: string;
          image: string | null;
          image2: string | null;
          image2_photographer_name: string | null;
          image2_photographer_url: string | null;
          image3: string | null;
          image3_photographer_name: string | null;
          image3_photographer_url: string | null;
          name: string;
          press_articles: Json | null;
          slug: string;
          sub_name: string | null;
          text1: string | null;
          text2: string | null;
          updated_at: string | null;
        };
        Insert: {
          author_name?: string | null;
          banniere?: string | null;
          banniere_photographer_name?: string | null;
          banniere_photographer_url?: string | null;
          created_at?: string | null;
          date: string;
          display_order?: number | null;
          explanation?: string | null;
          id?: string;
          image?: string | null;
          image2?: string | null;
          image2_photographer_name?: string | null;
          image2_photographer_url?: string | null;
          image3?: string | null;
          image3_photographer_name?: string | null;
          image3_photographer_url?: string | null;
          name: string;
          press_articles?: Json | null;
          slug: string;
          sub_name?: string | null;
          text1?: string | null;
          text2?: string | null;
          updated_at?: string | null;
        };
        Update: {
          author_name?: string | null;
          banniere?: string | null;
          banniere_photographer_name?: string | null;
          banniere_photographer_url?: string | null;
          created_at?: string | null;
          date?: string;
          display_order?: number | null;
          explanation?: string | null;
          id?: string;
          image?: string | null;
          image2?: string | null;
          image2_photographer_name?: string | null;
          image2_photographer_url?: string | null;
          image3?: string | null;
          image3_photographer_name?: string | null;
          image3_photographer_url?: string | null;
          name?: string;
          press_articles?: Json | null;
          slug?: string;
          sub_name?: string | null;
          text1?: string | null;
          text2?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      rehearsal_sync_logs: {
        Row: {
          created: number | null;
          deleted: number | null;
          errors: Json | null;
          events_fetched: number | null;
          finished_at: string | null;
          id: string;
          mode: string;
          skipped: number | null;
          started_at: string;
          status: string;
          updated: number | null;
        };
        Insert: {
          created?: number | null;
          deleted?: number | null;
          errors?: Json | null;
          events_fetched?: number | null;
          finished_at?: string | null;
          id?: string;
          mode?: string;
          skipped?: number | null;
          started_at?: string;
          status: string;
          updated?: number | null;
        };
        Update: {
          created?: number | null;
          deleted?: number | null;
          errors?: Json | null;
          events_fetched?: number | null;
          finished_at?: string | null;
          id?: string;
          mode?: string;
          skipped?: number | null;
          started_at?: string;
          status?: string;
          updated?: number | null;
        };
        Relationships: [];
      };
      rehearsals: {
        Row: {
          created_at: string | null;
          date: string;
          end_time: string;
          event_id: string | null;
          google_updated_at: string | null;
          group_type: Database["public"]["Enums"]["group_type"];
          id: string;
          name: string;
          place: string;
          start_time: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          end_time: string;
          event_id?: string | null;
          google_updated_at?: string | null;
          group_type: Database["public"]["Enums"]["group_type"];
          id?: string;
          name: string;
          place: string;
          start_time: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          end_time?: string;
          event_id?: string | null;
          google_updated_at?: string | null;
          group_type?: Database["public"]["Enums"]["group_type"];
          id?: string;
          name?: string;
          place?: string;
          start_time?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          context: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean;
          name: string;
          start_date: string | null;
          tour_poster: string | null;
          updated_at: string | null;
        };
        Insert: {
          context: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          start_date?: string | null;
          tour_poster?: string | null;
          updated_at?: string | null;
        };
        Update: {
          context?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          start_date?: string | null;
          tour_poster?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      youtube_links: {
        Row: {
          composer: string;
          created_at: string | null;
          created_by: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          performance_date: string;
          soloists: string[] | null;
          title: string;
          updated_at: string | null;
          venue: string;
          youtube_url: string;
        };
        Insert: {
          composer: string;
          created_at?: string | null;
          created_by?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          performance_date: string;
          soloists?: string[] | null;
          title: string;
          updated_at?: string | null;
          venue: string;
          youtube_url: string;
        };
        Update: {
          composer?: string;
          created_at?: string | null;
          created_by?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          performance_date?: string;
          soloists?: string[] | null;
          title?: string;
          updated_at?: string | null;
          venue?: string;
          youtube_url?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_delivery_by_token: {
        Args: { token: string };
        Returns: {
          created_at: string;
          delay_minutes: number;
          driver_id: string;
          expires_at: string;
          id: string;
          is_delayed: boolean;
          is_tracking_active: boolean;
          latitude: number;
          longitude: number;
          problem_message: string;
          public_token: string;
          scheduled_at: string;
          scheduled_end_at: string;
          updated_at: string;
        }[];
      };
      get_next_receipt_number: { Args: { p_year: number }; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      is_admin_or_superadmin: { Args: never; Returns: boolean };
      rehearsals_sync_write: {
        Args: {
          p_delete_ids: string[];
          p_silence_push?: boolean;
          p_upserts: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      activity_type:
        | "user_created"
        | "user_role_changed"
        | "concert_created"
        | "concert_updated"
        | "concert_deleted"
        | "poster_updated"
        | "group_updated"
        | "ca_created";
      group_type:
        | "Orchestre"
        | "Choeur complet"
        | "Tous"
        | "Hommes"
        | "Femmes"
        | "Jeunes/Enfants";
      user_role: "superadmin" | "admin" | "user";
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "user_created",
        "user_role_changed",
        "concert_created",
        "concert_updated",
        "concert_deleted",
        "poster_updated",
        "group_updated",
        "ca_created",
      ],
      group_type: [
        "Orchestre",
        "Choeur complet",
        "Tous",
        "Hommes",
        "Femmes",
        "Jeunes/Enfants",
      ],
      user_role: ["superadmin", "admin", "user"],
    },
  },
} as const;
