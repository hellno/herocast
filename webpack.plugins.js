const webpack = require('webpack');
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

function inDev() {
  return process.env.NODE_ENV == 'development';
}

module.exports = [
  // new ForkTsCheckerWebpackPlugin(),
  inDev() && new webpack.HotModuleReplacementPlugin(),
  inDev() && new ReactRefreshWebpackPlugin(),
].filter(Boolean);
