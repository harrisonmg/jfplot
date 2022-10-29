module.exports = {
  entry: './src/main.js',
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'ify-loader'
  }]}
};
