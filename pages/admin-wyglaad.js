import { useState, useEffect } from 'react';
import { FaPalette, FaEye, FaSave, FaUndo, FaImage, FaFont, FaAdjust, FaArrowLeft } from 'react-icons/fa';
import { themes, saveTheme, loadSavedTheme, applyTheme } from '../utils/themeManager';
import Link from 'next/link';

export default function AdminWyglaad() {
    const [currentTheme, setCurrentTheme] = useState('default');
    const [previewMode, setPreviewMode] = useState(false);

    const handleSaveTheme = () => {
        const success = saveTheme(currentTheme);
        if (success) {
            alert('Motyw został zapisany! Odśwież stronę główną aby zobaczyć zmiany.');
        } else {
            alert('Błąd podczas zapisywania motywu');
        }
    };

    const handleApplyTheme = (themeName) => {
        setCurrentTheme(themeName);
        applyTheme(themeName);
    };

    const handleResetToDefault = () => {
        setCurrentTheme('default');
        applyTheme('default');
        localStorage.removeItem('appTheme');
        alert('Przywrócono domyślny motyw!');
    };

    useEffect(() => {
        const savedTheme = loadSavedTheme();
        setCurrentTheme(savedTheme);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <Link
                                href="/admin-new"
                                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 mr-4 transition-colors"
                            >
                                <FaArrowLeft className="mr-2 h-4 w-4" />
                                Powrót do panelu
                            </Link>
                            <FaPalette className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Wygląd strony</h1>
                                <p className="text-sm text-gray-500">Zarządzaj motywami i wyglądem aplikacji</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${previewMode
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <FaEye className="inline mr-2" />
                                {previewMode ? 'Wyłącz podgląd' : 'Podgląd'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Wybór motywów */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Wybierz motyw</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(themes).map(([key, theme]) => (
                                    <div
                                        key={key}
                                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${currentTheme === key
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleApplyTheme(key)}
                                    >
                                        <div className="aspect-video bg-gray-100 rounded mb-3 relative overflow-hidden">
                                            {key === 'naprawa' && (
                                                <div className="absolute inset-0 p-2 text-xs">
                                                    <div className="bg-blue-600 text-white p-1 rounded mb-1">Technik</div>
                                                    <div className="bg-orange-500 text-white p-1 rounded text-xs">Zamów fachowca</div>
                                                    <div className="mt-1 text-gray-600 text-xs">4 kroki procesu</div>
                                                </div>
                                            )}
                                            {key === 'default' && (
                                                <div className="absolute inset-0 p-2 text-xs">
                                                    <div className="bg-blue-500 text-white p-1 rounded mb-1">Oryginalny</div>
                                                    <div className="bg-green-500 text-white p-1 rounded text-xs">Standardowy</div>
                                                </div>
                                            )}
                                            {key === 'minimal' && (
                                                <div className="absolute inset-0 p-2 text-xs">
                                                    <div className="bg-gray-500 text-white p-1 rounded mb-1">Minimal</div>
                                                    <div className="bg-red-500 text-white p-1 rounded text-xs">Prosty</div>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                                        <div className="flex items-center mt-2 space-x-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: theme.colors.primary }}
                                            ></div>
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: theme.colors.accent }}
                                            ></div>
                                            <span className="text-xs text-gray-500">Kolory motywu</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Informacje o wybranym motywie */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Szczegóły motywu</h2>

                            {themes[currentTheme] && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-2">{themes[currentTheme].name}</h3>
                                        <p className="text-gray-600 text-sm">{themes[currentTheme].description}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Paleta kolorów</h4>
                                        <div className="flex space-x-2">
                                            <div className="text-center">
                                                <div
                                                    className="w-12 h-12 rounded-lg border border-gray-200 mb-1"
                                                    style={{ backgroundColor: themes[currentTheme].colors.primary }}
                                                ></div>
                                                <span className="text-xs text-gray-500">Główny</span>
                                            </div>
                                            <div className="text-center">
                                                <div
                                                    className="w-12 h-12 rounded-lg border border-gray-200 mb-1"
                                                    style={{ backgroundColor: themes[currentTheme].colors.accent }}
                                                ></div>
                                                <span className="text-xs text-gray-500">Akcent</span>
                                            </div>
                                        </div>
                                    </div>

                                    {currentTheme === 'naprawa' && (
                                        <div className="bg-orange-50 rounded-lg p-4">
                                            <h4 className="font-medium text-orange-900 mb-2">Funkcje motywu naprawa.pl:</h4>
                                            <ul className="text-sm text-orange-800 space-y-1">
                                                <li>• Dwukolumnowy układ główny</li>
                                                <li>• Pomarańczowe przyciski akcji</li>
                                                <li>• 4-stopniowy proces rezerwacji</li>
                                                <li>• Profesjonalne zdjęcie fachowca</li>
                                                <li>• Zakładki "Zamów" / "Wyślij sprzęt"</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel kontrolny */}
                    <div>
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktualny motyw</h3>
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: themes[currentTheme]?.colors?.primary || '#3B82F6' }}>
                                    <FaPalette className="text-white text-xl" />
                                </div>
                                <h4 className="font-medium text-gray-900">
                                    {themes[currentTheme]?.name || 'Niestandardowy'}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {themes[currentTheme]?.description || 'Dostosowany motyw'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Akcje</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleSaveTheme}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <FaSave className="mr-2" />
                                    Zapisz motyw
                                </button>

                                <button
                                    onClick={handleResetToDefault}
                                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                                >
                                    <FaUndo className="mr-2" />
                                    Przywróć domyślny
                                </button>

                                <button
                                    onClick={() => window.open('/', '_blank')}
                                    className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center"
                                >
                                    <FaEye className="mr-2" />
                                    Zobacz na stronie
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
