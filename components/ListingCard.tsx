import Link from 'next/link';
import { Listing } from '@/lib/types';

export default function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.listing_images?.[0]?.image_url;

  return (
    <article className="card">
      <Link href={`/listing/${listing.id}`} className="block">
        {image ? (
          <img src={image} alt={listing.title} className="h-52 w-full object-cover" />
        ) : (
          <div className="flex h-52 items-center justify-center bg-gray-100 text-sm text-gray-500">No Image</div>
        )}
      </Link>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold">{listing.title}</h3>
          <span className="text-sm font-semibold text-tulane-green">${listing.price.toFixed(2)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-gray-700">{listing.description}</p>
        <div className="flex flex-wrap gap-1">
          {listing.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="border border-tulane-blue px-2 py-0.5 text-xs text-gray-700">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
