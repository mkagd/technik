// components/PartCard.js
// Karta części do widoku grid - ładne wyświetlanie z dużym zdjęciem

import { useState } from 'react';
import PhotoGallery from './PhotoGallery';

export default function PartCard({ part, onEdit, onDelete }) {
  const [showGallery, setShowGallery] = useState(false);
  const getStockBadge = (quantity) => {
    if (quantity === 0) return 'bg-red-500 text-white';
    if (quantity < 5) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStockLabel = (quantity) => {
    if (quantity === 0) return 'BRAK';
    if (quantity < 5) return 'NISKI';
    return 'OK';
  };

  const mainImage = part.images && part.images.length > 0 
    ? part.images[0].url 
    : part.imageUrl || null;

  const imageCount = part.images ? part.images.length : (part.imageUrl ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group border border-gray-200 dark:border-gray-700">
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer" onClick={() => setShowGallery(true)}>
        {mainImage ? (
          <>
            <img
              src={mainImage}
              alt={part.partName || part.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Image Count Badge */}
            {imageCount > 1 && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {imageCount}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Stock Badge Overlay */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs font-bold rounded ${getStockBadge(part.stockQuantity || part.availability?.inStock || 0)}`}>
            {getStockLabel(part.stockQuantity || part.availability?.inStock || 0)}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4">
        {/* Part Name */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {part.partName || part.name}
        </h3>

        {/* Part Number & ID */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono">{part.partNumber}</span>
          </div>
          <div>ID: {part.partId || part.id}</div>
        </div>

        {/* Category & Subcategory */}
        {(part.category || part.subcategory) && (
          <div className="mb-3 flex flex-wrap gap-1">
            {part.category && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                {part.category}
              </span>
            )}
            {part.subcategory && (
              <span className="inline-block px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                {part.subcategory}
              </span>
            )}
          </div>
        )}

        {/* Compatible Brands (first 3) */}
        {part.compatibleBrands && part.compatibleBrands.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kompatybilne:</div>
            <div className="flex flex-wrap gap-1">
              {part.compatibleBrands.slice(0, 3).map((brand, idx) => (
                <span key={idx} className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {brand}
                </span>
              ))}
              {part.compatibleBrands.length > 3 && (
                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  +{part.compatibleBrands.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price & Stock */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {part.unitPrice?.toFixed(2) || part.pricing?.retailPrice?.toFixed(2) || '0.00'} zł
            </div>
            {part.pricing?.wholesalePrice && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Hurt: {part.pricing.wholesalePrice.toFixed(2)} zł
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {part.stockQuantity || part.availability?.inStock || 0} szt
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              na stanie
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(part)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edytuj
          </button>
          <button
            onClick={() => onDelete(part.partId || part.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Photo Gallery Lightbox */}
      {part.images && part.images.length > 0 && (
        <PhotoGallery
          images={part.images}
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          initialIndex={0}
        />
      )}
    </div>
  );
}
