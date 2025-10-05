// components/admin/CompensationTab.js
// Zakładka wynagrodzeń - model prowizyjny od wizyt

import { FiTrendingUp, FiDollarSign, FiAward, FiMapPin, FiCalendar } from 'react-icons/fi';

export default function CompensationTab({ employeeData, setEmployeeData, setHasChanges, isNewEmployee }) {
  
  const updateCommissionField = (section, field, value) => {
    setEmployeeData({
      ...employeeData,
      compensation: {
        ...employeeData.compensation,
        commissionModel: {
          ...employeeData.compensation?.commissionModel,
          [section]: {
            ...employeeData.compensation?.commissionModel?.[section],
            [field]: value
          }
        }
      }
    });
    setHasChanges(true);
  };

  const updateBonusField = (section, field, value) => {
    setEmployeeData({
      ...employeeData,
      compensation: {
        ...employeeData.compensation,
        bonuses: {
          ...employeeData.compensation?.bonuses,
          [section]: {
            ...employeeData.compensation?.bonuses?.[section],
            [field]: value
          }
        }
      }
    });
    setHasChanges(true);
  };

  const updatePaymentMethod = (method, value) => {
    setEmployeeData({
      ...employeeData,
      compensation: {
        ...employeeData.compensation,
        paymentMethods: {
          ...employeeData.compensation?.paymentMethods,
          [method]: value
        }
      }
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiTrendingUp className="mr-2 h-5 w-5 text-green-600" />
          System wynagrodzeń prowizyjnych
        </h3>

        {/* Info o modelu */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Model prowizyjny:</strong> Pracownik zarabia za każdą wykonaną wizytę + premie dodatkowe. 
            Kwoty są automatycznie przypisywane po zakończeniu wizyty.
          </p>
        </div>

        {/* Prowizja za wizyty */}
        <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <FiDollarSign className="mr-2 h-5 w-5" />
            💰 Prowizja za typ wizyty
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Diagnoza (PLN)
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.visitRates?.diagnosis || 50}
                onChange={(e) => updateCommissionField('visitRates', 'diagnosis', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="50"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">Kwota za wizytę diagnostyczną</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔧 Naprawa (PLN)
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.visitRates?.repair || 100}
                onChange={(e) => updateCommissionField('visitRates', 'repair', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="100"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">Kwota za naprawę</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Instalacja (PLN)
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.visitRates?.installation || 80}
                onChange={(e) => updateCommissionField('visitRates', 'installation', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="80"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">Kwota za instalację sprzętu</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✅ Kontrola (PLN)
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.visitRates?.control || 40}
                onChange={(e) => updateCommissionField('visitRates', 'control', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="40"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">Kwota za wizytę kontrolną</p>
            </div>
          </div>
        </div>

        {/* Premia za trudność */}
        <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <FiAward className="mr-2 h-5 w-5" />
            🎯 Premia za trudność naprawy
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⚡ Standardowa
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.difficultyBonus?.standard || 0}
                onChange={(e) => updateCommissionField('difficultyBonus', 'standard', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⚠️ Skomplikowana
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.difficultyBonus?.complex || 50}
                onChange={(e) => updateCommissionField('difficultyBonus', 'complex', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="50"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔥 Bardzo skomplikowana
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.difficultyBonus?.veryComplex || 100}
                onChange={(e) => updateCommissionField('difficultyBonus', 'veryComplex', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="100"
                step="1"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            💡 Dodatkowa premia za trudne naprawy - admin lub technik może oznaczyć poziom trudności po zakończeniu wizyty
          </p>
        </div>

        {/* Premia za odległość */}
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <FiMapPin className="mr-2 h-5 w-5" />
            🚗 Premia za dojazd
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próg odległości (km)
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.distanceBonus?.threshold || 20}
                onChange={(e) => updateCommissionField('distanceBonus', 'threshold', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="20"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500">Powyżej ilu km dodawać bonus</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bonus za km (PLN)
              </label>
              <input
                type="number"
                value={employeeData.compensation?.commissionModel?.distanceBonus?.perExtraKm || 2}
                onChange={(e) => updateCommissionField('distanceBonus', 'perExtraKm', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="2"
                step="0.1"
              />
              <p className="mt-1 text-xs text-gray-500">Za każdy km powyżej progu</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
            <p className="text-xs text-yellow-800">
              <strong>Przykład:</strong> Wizyta na odległość 35 km = (35 - 20) × 2 PLN = <strong>30 PLN</strong> dodatkowego bonusu
            </p>
          </div>
        </div>

        {/* Premie miesięczne */}
        <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <FiCalendar className="mr-2 h-5 w-5" />
            📅 Premie miesięczne
          </h4>
          
          <div className="space-y-4">
            {/* Premia jakościowa */}
            <div className="p-4 bg-white rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">⭐ Premia jakościowa</h5>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={employeeData.compensation?.bonuses?.qualityScore?.enabled !== false}
                    onChange={(e) => updateBonusField('qualityScore', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktywna</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min. rating</label>
                  <input
                    type="number"
                    value={employeeData.compensation?.bonuses?.qualityScore?.minRating || 4.5}
                    onChange={(e) => updateBonusField('qualityScore', 'minRating', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="0.1"
                    min="0"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Kwota (PLN)</label>
                  <input
                    type="number"
                    value={employeeData.compensation?.bonuses?.qualityScore?.amount || 500}
                    onChange={(e) => updateBonusField('qualityScore', 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="10"
                  />
                </div>
              </div>
            </div>

            {/* Premia za punktualność */}
            <div className="p-4 bg-white rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">⏰ Premia za punktualność</h5>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={employeeData.compensation?.bonuses?.punctuality?.enabled !== false}
                    onChange={(e) => updateBonusField('punctuality', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktywna</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Próg (%)</label>
                  <input
                    type="number"
                    value={employeeData.compensation?.bonuses?.punctuality?.threshold || 90}
                    onChange={(e) => updateBonusField('punctuality', 'threshold', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="1"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Kwota (PLN)</label>
                  <input
                    type="number"
                    value={employeeData.compensation?.bonuses?.punctuality?.amount || 300}
                    onChange={(e) => updateBonusField('punctuality', 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="10"
                  />
                </div>
              </div>
            </div>

            {/* Premia za cel miesięczny */}
            <div className="p-4 bg-white rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">🎯 Premia za cel miesięczny</h5>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={employeeData.compensation?.bonuses?.monthlyTarget?.enabled !== false}
                    onChange={(e) => updateBonusField('monthlyTarget', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aktywna</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Liczba wizyt</label>
                  <input
                    type="number"
                    value={employeeData.compensation?.bonuses?.monthlyTarget?.visitsRequired || 60}
                    onChange={(e) => updateBonusField('monthlyTarget', 'visitsRequired', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Kwota (PLN)</label>
                  <input
                    type="number"
                    value={employeeData.compensation?.bonuses?.monthlyTarget?.amount || 1000}
                    onChange={(e) => updateBonusField('monthlyTarget', 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metody płatności */}
        <div className="mb-8 p-6 bg-teal-50 rounded-lg border border-teal-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">💳 Metody płatności od klientów</h4>
          <p className="text-sm text-gray-600 mb-4">
            Wybierz które metody płatności technik może przyjmować podczas wizyt:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center p-3 bg-white rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50">
              <input
                type="checkbox"
                checked={employeeData.compensation?.paymentMethods?.cash !== false}
                onChange={(e) => updatePaymentMethod('cash', e.target.checked)}
                className="h-4 w-4 text-teal-600 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium">💵 Gotówka</span>
            </label>

            <label className="flex items-center p-3 bg-white rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50">
              <input
                type="checkbox"
                checked={employeeData.compensation?.paymentMethods?.card !== false}
                onChange={(e) => updatePaymentMethod('card', e.target.checked)}
                className="h-4 w-4 text-teal-600 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium">💳 Karta</span>
            </label>

            <label className="flex items-center p-3 bg-white rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50">
              <input
                type="checkbox"
                checked={employeeData.compensation?.paymentMethods?.transfer !== false}
                onChange={(e) => updatePaymentMethod('transfer', e.target.checked)}
                className="h-4 w-4 text-teal-600 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium">🏦 Przelew</span>
            </label>

            <label className="flex items-center p-3 bg-white rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-50">
              <input
                type="checkbox"
                checked={employeeData.compensation?.paymentMethods?.blik !== false}
                onChange={(e) => updatePaymentMethod('blik', e.target.checked)}
                className="h-4 w-4 text-teal-600 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium">📱 BLIK</span>
            </label>
          </div>
        </div>

        {/* Statystyki zarobków */}
        {!isNewEmployee && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4">📊 Statystyki zarobków</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Łączne zarobki</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(employeeData.compensation?.earnings?.total || 0).toFixed(2)} <span className="text-sm">PLN</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Ten miesiąc</div>
                <div className="text-2xl font-bold text-green-600">
                  {(employeeData.compensation?.earnings?.thisMonth || 0).toFixed(2)} <span className="text-sm">PLN</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {employeeData.compensation?.earnings?.thisMonthVisits || 0} wizyt
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Poprzedni miesiąc</div>
                <div className="text-2xl font-bold text-gray-600">
                  {(employeeData.compensation?.earnings?.lastMonth || 0).toFixed(2)} <span className="text-sm">PLN</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-300 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Nieopłacone</div>
                <div className="text-2xl font-bold text-orange-600">
                  {(employeeData.compensation?.earnings?.unpaid || 0).toFixed(2)} <span className="text-sm">PLN</span>
                </div>
              </div>
            </div>
            
            {/* Średnia za wizytę */}
            {employeeData.compensation?.earnings?.thisMonthVisits > 0 && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <div className="text-sm text-gray-600">
                  📈 Średnia zarobków za wizytę: 
                  <strong className="ml-2 text-green-600">
                    {(employeeData.compensation.earnings.thisMonth / employeeData.compensation.earnings.thisMonthVisits).toFixed(2)} PLN
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info dla nowych pracowników */}
        {isNewEmployee && (
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Zapisz pracownika</strong>, aby móc śledzić zarobki z wykonanych wizyt
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
