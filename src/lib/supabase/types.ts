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
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          note_type: string;
          is_pinned: boolean;
          is_archived: boolean;
          is_trashed: boolean;
          trashed_at: string | null;
          color: string;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          note_type?: string;
          is_pinned?: boolean;
          is_archived?: boolean;
          is_trashed?: boolean;
          trashed_at?: string | null;
          color?: string;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          note_type?: string;
          is_pinned?: boolean;
          is_archived?: boolean;
          is_trashed?: boolean;
          trashed_at?: string | null;
          color?: string;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      todo_items: {
        Row: {
          id: string;
          note_id: string;
          user_id: string;
          content: string;
          is_completed: boolean;
          completed_at: string | null;
          priority: number;
          sort_order: number | null;
          due_at: string | null;
          reminder_at: string | null;
          snooze_until: string | null;
          do_not_notify: string | null;
          notify_on_location: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          content: string;
          is_completed?: boolean;
          completed_at?: string | null;
          priority?: number;
          sort_order?: number | null;
          due_at?: string | null;
          reminder_at?: string | null;
          snooze_until?: string | null;
          do_not_notify?: string | null;
          notify_on_location?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          user_id?: string;
          content?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          priority?: number;
          sort_order?: number | null;
          due_at?: string | null;
          reminder_at?: string | null;
          snooze_until?: string | null;
          do_not_notify?: string | null;
          notify_on_location?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "todo_items_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "todo_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      note_tags: {
        Row: {
          note_id: string;
          tag_id: string;
        };
        Insert: {
          note_id: string;
          tag_id: string;
        };
        Update: {
          note_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type Note = Database['public']['Tables']['notes']['Row'];
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];
export type NoteUpdate = Database['public']['Tables']['notes']['Update'];
export type TodoItem = Database['public']['Tables']['todo_items']['Row'];
export type TodoItemInsert = Database['public']['Tables']['todo_items']['Insert'];
export type TodoItemUpdate = Database['public']['Tables']['todo_items']['Update'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type NoteTag = Database['public']['Tables']['note_tags']['Row'];
