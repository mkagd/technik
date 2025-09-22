// pages/index.js

import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Witamy w systemie rezerwacji serwisu</h1>
      <ul className="space-y-3">
        <li><Link href="/rezerwacja" className="text-blue-600 underline">🛠 Umów wizytę</Link></li>
        <li><Link href="/admin" className="text-blue-600 underline">🔐 Panel administratora</Link></li>
        <li><Link href="/kalendarz" className="text-blue-600 underline">📅 Kalendarz zleceń</Link></li>
        <li><Link href="/mapa" className="text-blue-600 underline">🗺 Mapa zgłoszeń</Link></li>
      </ul>
    </main>
  );
}
