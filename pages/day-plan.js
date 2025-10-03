import React from 'react';
import Layout from '../components/Layout';
import ServicemanDayPlanner from '../components/ServicemanDayPlanner';

export default function DayPlanPage() {
  return (
    <Layout title="Plan dnia serwisanta">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              📅 Plan dnia serwisanta
            </h1>
            <p className="text-lg text-gray-600">
              Szczegółowy harmonogram wizyt z lokalizacjami, czasami i statusami wykonania
            </p>
          </div>
          
          <ServicemanDayPlanner />
        </div>
      </div>
    </Layout>
  );
}