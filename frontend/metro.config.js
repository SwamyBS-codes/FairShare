const { getDefaultConfig } = require('@expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Provide an alias so imports of 'react-native-svg/css' resolve to our shim
config.resolver = config.resolver || {}
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules, {
  'react-native-svg/css': path.resolve(__dirname, 'shims', 'react-native-svg-css.js'),
})

module.exports = config
