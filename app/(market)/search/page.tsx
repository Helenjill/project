'use client';

import { useEffect, useState } from 'react';
import ListingCard from '@/components/ListingCard';
import { createClient } from '@/lib/supabase-browser';
import { Listing } from '@/lib/types';

const categories = ['All', 'Clothing', 'Electronics', 'Books', 'Dorm', 'Sports', 'Other'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      let req = supabase.from('listings').select('*, listing_images(image_url,position)');
      if (query) req = req.ilike('title', `%${query}%`);
      if (category !== 'All') req = req.eq('category', category);
      if (sort === 'newest') req = req.order('created_at', { ascending: false });
      if (sort === 'low') req = req.order('price', { ascending: true });
      if (sort === 'high') req = req.order('price', { ascending: false });

      const { data } = await req.limit(40);
      setListings((data as Listing[]) ?? []);
    };
    void load();
  }, [query, category, sort]);

  return (
    <section className="space-y-3 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>
      <div className="grid gap-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
