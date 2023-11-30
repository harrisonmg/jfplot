const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    watchFiles: ["src/**/*"]
  },
  entry: './src/main.ts',
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
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/index.html' },
        { from: 'src/main.css' },
        { from: 'src/series_colors.css' },
        { from: 'src/loading.css' },
        { from: 'src/modal.css' }
      ]
    })
  ]
};
