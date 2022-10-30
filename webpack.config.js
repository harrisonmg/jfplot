module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
   static: './dist'
  },
  entry: './src/main.js',
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'ify-loader'
  }]},
};
