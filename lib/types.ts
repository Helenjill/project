export type ListingStatus = 'available' | 'pending' | 'sold';
export type PaymentMethod = 'Cash' | 'Venmo';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  tags: string[];
  meetup_location: string;
  meetup_note: string | null;
  payment_method: PaymentMethod;
  status: ListingStatus;
  created_at: string;
  seller_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    graduation_year: number | null;
    verification_status: string;
  } | null;
  listing_images?: Array<{ image_url: string; position: number }>;
}
