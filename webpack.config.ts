// eslint-disable-next-line node/no-unpublished-import
import nodeExternals from 'webpack-node-externals';
// eslint-disable-next-line node/no-unpublished-import
import TerserPlugin from 'terser-webpack-plugin';
// eslint-disable-next-line node/no-unpublished-import
import Dotenv from 'dotenv-webpack';

import { resolve } from 'path';

module.exports = {
  entry: './src/index.ts',

  mode: process.env.NODE_ENV || 'development',
  externalsPresets: { node: true },
  externals: [nodeExternals()],

  output: {
    filename: 'index.js',
    path: resolve(__dirname, 'build'),
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [new Dotenv()],

  optimization: {
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
};
