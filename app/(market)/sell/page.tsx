'use client';

import { FormEvent, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { MEETUP_SPOTS } from '@/lib/meetup-spots';
import { createClient } from '@/lib/supabase-browser';

interface Draft {
  title: string;
  description: string;
  category: string;
  condition: string;
  tags: string;
}

const initialDraft: Draft = {
  title: '',
  description: '',
  category: 'Other',
  condition: 'Good',
  tags: ''
};

export default function SellPage() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Venmo'>('Cash');
  const [meetupLocation, setMeetupLocation] = useState(MEETUP_SPOTS[0]);
  const [meetupNote, setMeetupNote] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState('');

  const runAi = async () => {
    if (!files?.[0]) {
      setStatus('Please pick at least one photo first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', files[0]);

    const res = await fetch('/api/ai/suggest-listing', { method: 'POST', body: formData });
    if (!res.ok) {
      setStatus('AI suggestion failed.');
      return;
    }

    const data = await res.json();
    setDraft({
      title: data.title ?? '',
      description: data.description ?? '',
      category: data.category ?? 'Other',
      condition: data.condition ?? 'Good',
      tags: (data.tags ?? []).join(', ')
    });
    setStatus('AI draft generated. You can edit everything before posting.');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setStatus('Please sign in first.');
      return;
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title: draft.title,
        description: draft.description,
        price: Number(price || 0),
        category: draft.category,
        condition: draft.condition,
        tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
        meetup_location: meetupLocation,
        meetup_note: meetupNote || null,
        payment_method: paymentMethod,
        status: 'available'
      })
      .select('id')
      .single();

    if (error || !listing) {
      setStatus(error?.message ?? 'Could not create listing.');
      return;
    }

    if (files?.length) {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const filePath = `${user.id}/${listing.id}/${Date.now()}-${i}-${file.name}`;
        const upload = await supabase.storage.from('listing-images').upload(filePath, file);
        if (upload.error) continue;
        const { data } = supabase.storage.from('listing-images').getPublicUrl(filePath);
        await supabase.from('listing_images').insert({
          listing_id: listing.id,
          image_url: data.publicUrl,
          position: i
        });
      }
    }

    setStatus('Listing posted!');
    setDraft(initialDraft);
    setPrice('');
    setMeetupNote('');
  };

  return (
    <RequireAuth>
      <section className="space-y-3 p-3">
        <h2 className="text-base font-semibold">Create Listing</h2>
        <form onSubmit={submit} className="space-y-2">
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
          <button type="button" className="bg-tulane-blue px-3 py-2 text-sm" onClick={runAi}>
            Generate with AI
          </button>
          <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
          <textarea
            required
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description"
            rows={4}
          />
          <div className="grid grid-cols-2 gap-2">
            <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Category" />
            <input value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })} placeholder="Condition" />
          </div>
          <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="Tags (comma separated)" />
          <input type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
          <div className="grid grid-cols-2 gap-2">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Venmo')}>
              <option>Cash</option>
              <option>Venmo</option>
            </select>
            <select value={meetupLocation} onChange={(e) => setMeetupLocation(e.target.value)}>
              {MEETUP_SPOTS.map((spot) => (
                <option key={spot}>{spot}</option>
              ))}
            </select>
          </div>
          <input value={meetupNote} onChange={(e) => setMeetupNote(e.target.value)} placeholder="Custom meetup note (optional)" />
          <button type="submit" className="w-full bg-tulane-green px-3 py-2 text-white">
            Post Listing
          </button>
          {status && <p className="text-sm text-gray-700">{status}</p>}
        </form>
      </section>
    </RequireAuth>
  );
}
