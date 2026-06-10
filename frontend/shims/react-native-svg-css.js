// Shim module for 'react-native-svg/css' used by react-native-qrcode-svg
// Exports LocalSvg from 'react-native-svg' for native environments.
const rnSvg = require('react-native-svg')

exports.LocalSvg = rnSvg.LocalSvg || rnSvg.Svg || null
