'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import ListingCard from '@/components/ListingCard';
import { createClient } from '@/lib/supabase-browser';
import { Listing } from '@/lib/types';

export default function LikesPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const { data } = await supabase
        .from('likes')
        .select('listings(*, listing_images(image_url,position))')
        .eq('user_id', user.id);

      const mapped = (data ?? []).map((row: any) => row.listings).filter(Boolean);
      setListings(mapped);
    };
    void load();
  }, []);

  return (
    <RequireAuth>
      <section className="space-y-3 p-3">
        <h2 className="text-base font-semibold">Liked Items</h2>
        <div className="grid gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </RequireAuth>
  );
}
