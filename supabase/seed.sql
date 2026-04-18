insert into public.listings (id, seller_id, title, description, price, category, condition, tags, meetup_location, payment_method, status)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Mini Fridge', 'Dorm mini fridge, works perfectly.', 85.00, 'Dorm', 'Good', '{dorm,fridge,appliance}', 'LBC', 'Cash', 'available'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Organic Chemistry Textbook', 'Great condition with light notes.', 45.00, 'Books', 'Good', '{book,chemistry,course}', 'Howard-Tilton Library', 'Venmo', 'available')
on conflict do nothing;

insert into public.listing_images (listing_id, image_url, position)
values
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5', 0),
  ('00000000-0000-0000-0000-000000000102', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', 0)
on conflict do nothing;
