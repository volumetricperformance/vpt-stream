const path = require('path');

module.exports = env => {
  return {
    entry: './src/vptstream.js',
    mode: 'production',
    devtool: 'source-map',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'vptstream.js',
      library: {
        name: 'VPTStream',  
        type: 'umd',  
      },
    },
    module: {
      rules: [
        {
            test: /\.(glsl|frag|vert)(\?.*$|$)/,
            loader: 'webpack-glsl-loader'
        }
      ]
    }
  }  
};