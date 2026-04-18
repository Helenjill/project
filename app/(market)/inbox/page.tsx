'use client';

import { FormEvent, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { createClient } from '@/lib/supabase-browser';

interface MessageThread {
  id: string;
  listing_id: string;
  body: string;
  created_at: string;
  listings?: { title: string };
}

export default function InboxPage() {
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [body, setBody] = useState('');
  const [listingId, setListingId] = useState('');

  const load = async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data } = await supabase
      .from('messages')
      .select('id,listing_id,body,created_at,listings(title)')
      .or(`sender_id.eq.${auth.user.id},receiver_id.eq.${auth.user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setMessages((data as MessageThread[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data: listing } = await supabase.from('listings').select('seller_id').eq('id', listingId).single();
    if (!listing?.seller_id) return;

    await supabase.from('messages').insert({
      listing_id: listingId,
      sender_id: auth.user.id,
      receiver_id: listing.seller_id,
      body
    });

    setBody('');
    await load();
  };

  return (
    <RequireAuth>
      <section className="space-y-3 p-3">
        <h2 className="text-base font-semibold">Inbox</h2>
        <form className="space-y-2 border border-gray-300 p-3" onSubmit={send}>
          <input value={listingId} onChange={(e) => setListingId(e.target.value)} placeholder="Listing ID" required />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" required rows={2} />
          <button className="bg-tulane-green px-3 py-2 text-white" type="submit">
            Send
          </button>
        </form>

        <div className="space-y-2">
          {messages.map((msg) => (
            <article key={msg.id} className="card p-3 text-sm">
              <p className="text-xs text-gray-600">Listing: {msg.listings?.title ?? msg.listing_id}</p>
              <p>{msg.body}</p>
              <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </RequireAuth>
  );
}
