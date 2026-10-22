// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // O protótipo web junta vários scripts que compartilham variáveis globais.
    ignores: ['dist/*', 'web/prototipo/*'],
  },
]);
