// components/SimpleChart.js
// Prosty komponent wykresu słupkowego bez zewnętrznych zależności

export default function SimpleBarChart({ data, title, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Brak danych do wyświetlenia
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const scale = height / maxValue;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <div className="flex items-end justify-between space-x-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = item.value * scale;
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer relative group"
                style={{ height: `${barHeight}px`, minHeight: '4px' }}
              >
                {/* Wartość nad słupkiem */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.value}
                </div>
              </div>
              
              {/* Etykieta pod słupkiem */}
              <div className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SimpleLineChart({ data, title, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Brak danych do wyświetlenia
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const width = 100 / (data.length - 1 || 1);

  // Oblicz punkty dla ścieżki SVG
  const points = data.map((item, index) => {
    const x = index * width;
    const y = 100 - ((item.value - minValue) / range) * 80; // 80% wysokości, 10% margines góra/dół
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Linia trendu */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Wypełnienie pod linią */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#gradient)"
            opacity="0.3"
          />
          
          {/* Gradient */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Punkty */}
          {data.map((item, index) => {
            const x = index * width;
            const y = 100 - ((item.value - minValue) / range) * 80;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Etykiety pod wykresem */}
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-gray-600 text-center flex-1">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
