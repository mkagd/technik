
// pages/kalendarz.js

import { useEffect, useState } from 'react';

export default function KalendarzWidok() {
  const [rezerwacje, setRezerwacje] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/rezerwacje');
      const data = await res.json();
      setRezerwacje(data.rezerwacje || []);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Kalendarz rezerwacji</h1>
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
        {['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'].map((d) => (
          <div key={d} className="p-2 bg-gray-200 rounded">{d}</div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const day = new Date();
          day.setDate(day.getDate() + i - (day.getDay()));
          const iso = day.toISOString().split('T')[0];
          const dzienne = rezerwacje.filter(r => r.date?.startsWith(iso));
          return (
            <div key={i} className="border p-2 rounded h-24 text-left text-xs overflow-auto">
              <div className="font-semibold">{day.getDate()}.{day.getMonth() + 1}</div>
              {dzienne.map((r, idx) => (
                <div key={idx} className="text-blue-700">
                  {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {r.device}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
