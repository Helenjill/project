import BottomNav from '@/components/BottomNav';

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white pb-16">
      <header className="border-b border-gray-300 bg-tulane-green px-4 py-3 text-white">
        <h1 className="text-lg font-semibold">Tulane Marketplace</h1>
      </header>
      {children}
      <BottomNav />
    </main>
  );
}
