/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Dodaj obsługę plików z folderu shared
config.resolver.alias = {
  './shared': './shared',
};

// Rozszerz obsługiwane rozszerzenia
config.resolver.sourceExts.push('js', 'jsx', 'ts', 'tsx', 'json');

module.exports = config;