const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    watchFiles: ["src/**/*"]
  },
  entry: './src/main.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'ify-loader'
      },
      {
        test: /\.html$/,
        type: 'asset/resource'
      },
      {
        test: /\.css/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/index.html' },
        { from: 'src/main.css' },
      ]
    })
  ]
};
