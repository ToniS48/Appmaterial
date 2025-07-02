const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Agregar alias específicos para resolución de módulos
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'process/browser': require.resolve('process/browser'),
      };

      // Agregar fallbacks para módulos de Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "process": require.resolve("process/browser"),
        "net": false,
        "tls": false,
        "fs": false,
        "child_process": false,
        "util": require.resolve("util")
      };

      // Agregar plugins para polyfills
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process',
        })
      );

      return webpackConfig;
    },
  },
};
