'use client';

import { useEffect, useState } from 'react';
import ListingCard from '@/components/ListingCard';
import { createClient } from '@/lib/supabase-browser';
import { Listing } from '@/lib/types';

const listingListSelect = `
  id,
  title,
  description,
  price,
  category,
  condition,
  tags,
  meetup_location,
  meetup_note,
  payment_method,
  status,
  seller_id,
  created_at
`;

function mapListingRows(
  rows:
    | {
        price: number | string;
        tags: string[] | null;
      }[]
    | null
): Listing[] {
  if (!rows) return [];
  return rows.map((row) => ({
    ...row,
    price:
      typeof row.price === 'number'
        ? row.price
        : parseFloat(String(row.price)) || 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    listing_images: [] // 👈 temporary fix
  })) as Listing[];
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('listings')
        .select(listingListSelect)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Home listings load error:', error);
        return;
      }

      console.log('Listings loaded:', data); // 👈 debug log

      setListings(mapListingRows(data));
    };

    void load();
  }, []);

  return (
    <section className="space-y-3 p-3">
      <h2 className="text-base font-semibold">Newest Listings</h2>

      {listings.length === 0 ? (
        <p className="text-sm text-gray-500">No listings yet.</p>
      ) : (
        <div className="grid gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}