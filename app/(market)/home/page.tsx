'use client';

import { useEffect, useState } from 'react';
import ListingCard from '@/components/ListingCard';
import { createClient } from '@/lib/supabase-browser';
import { Listing } from '@/lib/types';

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('listings')
        .select('*, profiles(username,avatar_url,graduation_year,verification_status), listing_images(image_url,position)')
        .order('created_at', { ascending: false })
        .limit(30);
      setListings((data as Listing[]) ?? []);
    };
    void load();
  }, []);

  return (
    <section className="space-y-3 p-3">
      <h2 className="text-base font-semibold">Newest Listings</h2>
      <div className="grid gap-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
