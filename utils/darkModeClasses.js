// Global Dark Mode Styles - Dodaj dark: klasy do wszystkich elementów

export const darkModeClasses = {
  // Backgrounds
  bgPrimary: 'bg-white dark:bg-gray-800',
  bgSecondary: 'bg-gray-50 dark:bg-gray-900',
  bgTertiary: 'bg-gray-100 dark:bg-gray-700',
  
  // Text
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-300',
  textTertiary: 'text-gray-500 dark:text-gray-400',
  
  // Borders
  border: 'border-gray-200 dark:border-gray-700',
  borderLight: 'border-gray-300 dark:border-gray-600',
  
  // Hover states
  hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-700',
  hoverText: 'hover:text-gray-900 dark:hover:text-white',
  
  // Cards
  card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  cardHover: 'hover:shadow-md dark:hover:shadow-gray-900/50',
  
  // Inputs
  input: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
  
  // Buttons
  btnPrimary: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white',
  btnSecondary: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
  
  // Badges
  badgeYellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  badgeGreen: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  badgeRed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  badgeBlue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  badgePurple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  badgeOrange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  
  // Alerts
  alertRed: 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-800 text-red-700 dark:text-red-300',
  alertGreen: 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-800 text-green-700 dark:text-green-300',
  alertBlue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  alertYellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
};

// Quick apply function
export function dm(key) {
  return darkModeClasses[key] || '';
}
