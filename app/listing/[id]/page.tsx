'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Listing } from '@/lib/types';

interface OfferRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingImages, setListingImages] = useState<Array<{ image_url: string; position: number }>>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) {
      setError('Missing listing id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const [listingResult, imageResult, offersResult] = await Promise.all([
      supabase
        .from('listings')
        .select('id,title,description,price,category,condition,tags,meetup_location,meetup_note,payment_method,status,created_at,seller_id')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('listing_images').select('image_url,position').eq('listing_id', id).order('position', { ascending: true }),
      supabase.from('offers').select('id,amount,status,created_at').eq('listing_id', id).order('created_at', { ascending: false })
    ]);

    if (listingResult.error) {
      setError(`Could not load listing: ${listingResult.error.message}`);
      setLoading(false);
      return;
    }

    if (!listingResult.data) {
      setError('Listing not found.');
      setLoading(false);
      return;
    }

    if (imageResult.error) {
      setError(`Could not load images: ${imageResult.error.message}`);
      setLoading(false);
      return;
    }

    if (offersResult.error) {
      setError(`Could not load offers: ${offersResult.error.message}`);
      setLoading(false);
      return;
    }

    setListing(listingResult.data as Listing);
    setListingImages((imageResult.data as Array<{ image_url: string; position: number }>) ?? []);
    setOffers((offersResult.data as OfferRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const like = async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from('likes').upsert({ listing_id: id, user_id: auth.user.id });
  };

  const makeOffer = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !listing) return;

    await supabase.from('offers').insert({
      listing_id: id,
      buyer_id: auth.user.id,
      seller_id: listing.seller_id,
      amount: Number(offerAmount),
      status: 'pending'
    });
    setOfferAmount('');
    await load();
  };

  const updateOffer = async (offerId: string, status: 'accepted' | 'rejected' | 'countered') => {
    const supabase = createClient();
    await supabase.from('offers').update({ status }).eq('id', offerId);
    await load();
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !listing) return;

    const receiver = auth.user.id === listing.seller_id ? listing.seller_id : listing.seller_id;
    await supabase.from('messages').insert({
      listing_id: id,
      sender_id: auth.user.id,
      receiver_id: receiver,
      body: message
    });
    setMessage('');
  };

  const report = async (type: 'listing' | 'user') => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !listing) return;

    await supabase.from('reports').insert({
      reporter_id: auth.user.id,
      listing_id: listing.id,
      reported_user_id: type === 'user' ? listing.seller_id : null,
      reason: `Report ${type} from listing page`,
      moderation_flag: 'pending_review'
    });
  };

  if (loading) return <main className="p-4">Loading listing...</main>;

  if (error) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-3 pb-20">
        <Link href="/home" className="text-sm text-tulane-blue underline">
          Back to home
        </Link>
        <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>
      </main>
    );
  }

  if (!listing) return <main className="p-4">Listing not found.</main>;

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-3 pb-20">
      <Link href="/home" className="text-sm text-tulane-blue underline">
        Back to home
      </Link>
      {listingImages[0]?.image_url ? (
        <img src={listingImages[0].image_url} alt={listing.title} className="h-72 w-full border border-gray-300 object-cover" />
      ) : (
        <div className="flex h-72 w-full items-center justify-center border border-gray-300 bg-gray-100 text-sm text-gray-500">
          No images uploaded for this listing
        </div>
      )}
      <article className="card p-3">
        <h1 className="text-xl font-semibold">{listing.title}</h1>
        <p className="mt-1 text-sm">{listing.description}</p>
        <p className="mt-1 text-sm font-semibold text-tulane-green">${listing.price.toFixed(2)}</p>
        <p className="text-sm">Seller ID: {listing.seller_id}</p>
        <p className="text-sm">Meetup: {listing.meetup_location}</p>
        <p className="text-sm">Payment: {listing.payment_method}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={like} className="border border-tulane-blue px-3 py-1 text-sm">
            Like
          </button>
          <button onClick={() => report('listing')} className="border border-red-300 px-3 py-1 text-sm">
            Report Listing
          </button>
          <button onClick={() => report('user')} className="border border-red-300 px-3 py-1 text-sm">
            Report User
          </button>
        </div>
      </article>

      <section className="card p-3">
        <h2 className="mb-2 font-semibold">Offers</h2>
        <form onSubmit={makeOffer} className="mb-3 flex gap-2">
          <input
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            type="number"
            step="0.01"
            placeholder="Offer amount"
            required
          />
          <button className="bg-tulane-green px-3 py-2 text-white" type="submit">
            Make Offer
          </button>
        </form>
        <div className="space-y-2">
          {offers.map((offer) => (
            <div key={offer.id} className="border border-gray-300 p-2 text-sm">
              <p>${offer.amount.toFixed(2)} — {offer.status}</p>
              <p className="text-xs text-gray-500">{new Date(offer.created_at).toLocaleString()}</p>
              <div className="mt-1 flex gap-2">
                <button onClick={() => updateOffer(offer.id, 'accepted')} className="border px-2 py-1 text-xs">Accept</button>
                <button onClick={() => updateOffer(offer.id, 'rejected')} className="border px-2 py-1 text-xs">Reject</button>
                <button onClick={() => updateOffer(offer.id, 'countered')} className="border px-2 py-1 text-xs">Counter</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-3">
        <h2 className="mb-2 font-semibold">Message seller</h2>
        <p className="mb-2 text-xs text-gray-600">Listing preview: {listing.title}</p>
        <form onSubmit={sendMessage} className="space-y-2">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} required />
          <button className="bg-tulane-green px-3 py-2 text-white">Send Message</button>
        </form>
      </section>
    </main>
  );
}
