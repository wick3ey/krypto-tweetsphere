export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          tweet_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          tweet_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          tweet_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_tweet_id_fkey"
            columns: ["tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nfts: {
        Row: {
          collection_name: string | null
          contract_address: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          listed: boolean | null
          name: string
          owner_id: string
          price: number | null
          token_id: string | null
        }
        Insert: {
          collection_name?: string | null
          contract_address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          listed?: boolean | null
          name: string
          owner_id: string
          price?: number | null
          token_id?: string | null
        }
        Update: {
          collection_name?: string | null
          contract_address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          listed?: boolean | null
          name?: string
          owner_id?: string
          price?: number | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nonce_challenges: {
        Row: {
          created_at: string | null
          id: string
          message: string
          nonce: string
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          nonce: string
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          nonce?: string
          wallet_address?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          header_url: string | null
          id: string
          updated_at: string
          username: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          header_url?: string | null
          id: string
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          header_url?: string | null
          id?: string
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          id: string
          status: string | null
          to_user_id: string
          tweet_id: string | null
          tx_hash: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id: string
          id?: string
          status?: string | null
          to_user_id: string
          tweet_id?: string | null
          tx_hash?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          id?: string
          status?: string | null
          to_user_id?: string
          tweet_id?: string | null
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_tweet_id_fkey"
            columns: ["tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
        ]
      }
      token_balances: {
        Row: {
          amount: number
          change_24h: number | null
          id: string
          logo: string | null
          symbol: string
          token: string
          updated_at: string
          user_id: string
          value_usd: number
        }
        Insert: {
          amount?: number
          change_24h?: number | null
          id?: string
          logo?: string | null
          symbol: string
          token: string
          updated_at?: string
          user_id: string
          value_usd?: number
        }
        Update: {
          amount?: number
          change_24h?: number | null
          id?: string
          logo?: string | null
          symbol?: string
          token?: string
          updated_at?: string
          user_id?: string
          value_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "token_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          fee: number | null
          from_address: string | null
          hash: string | null
          id: string
          status: string
          timestamp: string
          to_address: string | null
          token: string
          token_logo: string | null
          token_symbol: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee?: number | null
          from_address?: string | null
          hash?: string | null
          id?: string
          status: string
          timestamp?: string
          to_address?: string | null
          token: string
          token_logo?: string | null
          token_symbol: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number | null
          from_address?: string | null
          hash?: string | null
          id?: string
          status?: string
          timestamp?: string
          to_address?: string | null
          token?: string
          token_logo?: string | null
          token_symbol?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tweets: {
        Row: {
          attachments: string[] | null
          comment_count: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          likes: string[] | null
          mentions: string[] | null
          reply_to: string | null
          retweet_of: string | null
          retweets: string[] | null
          user_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          comment_count?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: string[] | null
          mentions?: string[] | null
          reply_to?: string | null
          retweet_of?: string | null
          retweets?: string[] | null
          user_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          comment_count?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: string[] | null
          mentions?: string[] | null
          reply_to?: string | null
          retweet_of?: string | null
          retweets?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tweets_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tweets_retweet_of_fkey"
            columns: ["retweet_of"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tweets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string
          followers: string[] | null
          following: string[] | null
          header_url: string | null
          id: string
          joined_date: string | null
          last_seen: string | null
          username: string
          verified: boolean | null
          wallet_address: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name: string
          followers?: string[] | null
          following?: string[] | null
          header_url?: string | null
          id?: string
          joined_date?: string | null
          last_seen?: string | null
          username: string
          verified?: boolean | null
          wallet_address: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string
          followers?: string[] | null
          following?: string[] | null
          header_url?: string | null
          id?: string
          joined_date?: string | null
          last_seen?: string | null
          username?: string
          verified?: boolean | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_nonce: {
        Args: {
          wallet_addr: string
          nonce_value: string
          message_text: string
        }
        Returns: undefined
      }
      follow_user: {
        Args: {
          follower_id: string
          followed_id: string
        }
        Returns: undefined
      }
      get_nonce: {
        Args: {
          wallet_addr: string
        }
        Returns: {
          nonce: string
          message: string
        }[]
      }
      get_unread_messages_count: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      get_unread_notifications_count: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      unfollow_user: {
        Args: {
          follower_id: string
          followed_id: string
        }
        Returns: undefined
      }
      verify_signature: {
        Args: {
          wallet_addr: string
          signature: string
          message: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
