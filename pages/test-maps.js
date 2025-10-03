import React, { useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { Wrapper } from '@googlemaps/react-wrapper';

const SimpleMap = ({ center = { lat: 50.8661, lng: 20.6286 }, zoom = 12 }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) {
      console.log('Map ref or Google not available');
      return;
    }

    console.log('Creating Google Map instance');
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
    });

    // Dodaj prosty marker
    const marker = new window.google.maps.Marker({
      position: center,
      map: map,
      title: 'Test marker - Kielce',
    });

    console.log('Map created successfully');
  }, [center, zoom]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

export default function GoogleMapsTest() {
  return (
    <Layout title="Test Google Maps">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🗺️ Test Google Maps API
          </h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Prosta mapa Google</h2>
            <div className="mb-4">
              <p className="text-gray-600">
                Klucz API: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Obecny' : '❌ Brak'}
              </p>
            </div>
            
            <Wrapper 
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              render={(status) => {
                console.log('Google Maps Wrapper status:', status);
                switch (status) {
                  case 'LOADING':
                    return <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p>Ładowanie Google Maps...</p>
                      </div>
                    </div>;
                  case 'FAILURE':
                    return <div className="h-[400px] bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
                      <div className="text-center text-red-600">
                        <div className="text-2xl mb-2">❌</div>
                        <p className="font-semibold">Błąd ładowania Google Maps</p>
                        <p className="text-sm mt-2">Sprawdź klucz API lub połączenie</p>
                      </div>
                    </div>;
                  case 'SUCCESS':
                    return <div className="border rounded-lg overflow-hidden">
                      <SimpleMap />
                    </div>;
                  default:
                    return <div className="h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
                      Status: {status}
                    </div>;
                }
              }}
            />
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Debug info:</h3>
              <p>Sprawdź konsolę przeglądarki (F12) po więcej szczegółów</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}