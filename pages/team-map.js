import React from 'react';
import Layout from '../components/Layout';
import TeamLocationTracker from '../components/TeamLocationTracker';

export default function TeamMapTest() {
  return (
    <Layout title="Mapa zespołu - Test">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🗺️ Mapa zespołu serwisowego
            </h1>
            <p className="text-lg text-gray-600">
              Interaktywna mapa z lokalizacjami serwisantów i aktualnymi zleceniami w czasie rzeczywistym
            </p>
          </div>
          
          <TeamLocationTracker />
        </div>
      </div>
    </Layout>
  );
}