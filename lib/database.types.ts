export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type AmenityCategory = { label: string; items: string[] }

export type Database = {
  public: {
    Tables: {
      apartments: {
        Row: {
          id: number
          slug: string
          title: string
          subtitle: string
          rating: number
          review_count: number
          badge: string | null
          persons: number
          bedrooms: number
          bed: string
          bathrooms: number
          bed_extras: string | null
          description: string
          license: string
          photo_count: number
          price_min: number
          price_max: number
          top_amenities: string[]
          amenity_categories: AmenityCategory[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['apartments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['apartments']['Insert']>
      }
      resenas: {
        Row: {
          id: number
          apartment_slug: string
          author: string
          location: string
          date: string
          rating: number
          text: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['resenas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['resenas']['Insert']>
      }
      reservas: {
        Row: {
          id: number
          apartment_slug: string
          guest_name: string
          guest_email: string
          guest_phone: string | null
          check_in: string
          check_out: string
          guests: number
          status: 'pending' | 'quote_sent' | 'quote_accepted' | 'confirmed' | 'cancelled'
          notes: string | null
          total_price: number | null
          cleaning_fee: number
          extras: Array<{ name: string; amount: number; quantity?: number; unit?: string }>
          deposit_paid: number
          quote_message: string | null
          quote_token: string | null
          quote_sent_at: string | null
          quote_accepted_at: string | null
          conversation_token: string | null
          stripe_session_id: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reservas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reservas']['Insert']>
      }
      mensajes: {
        Row: {
          id: number
          name: string
          email: string
          phone: string | null
          apartment_slug: string | null
          subject: string | null
          message: string
          status: 'new' | 'read' | 'replied'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mensajes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['mensajes']['Insert']>
      }
      mensajes_chat: {
        Row: {
          id: number
          reserva_id: number
          sender: 'guest' | 'admin'
          texto: string
          tipo: 'text' | 'payment_request'
          payment_amount: number | null
          leido: boolean
          created_at: string
        }
     