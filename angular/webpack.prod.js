const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const history = require('connect-history-api-fallback');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    main: './src/app/main.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, "dist")
  },
  mode: 'production',
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, "src"),
    inline: true,
    port: 3000,
    open: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ng-annotate-loader!awesome-typescript-loader!angular2-template-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'ng-annotate-loader' },
          { loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: "defaults" }]
              ]
            }
          },
        ],
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|ttf|eot|gif|png|jpg|svg)$/,
        loader: 'url-loader?limit=10000&publicPath=webpackAssets/&outputPath=webpackAssets/'
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              // Prefer `dart-sass`
              implementation: require("sass"),
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }
    ]
  },
  // Extract third party libraries into a separate vendor bundle.
  // Also extract webpack manifest into its own bundle (to prevent vendor hash changing when app source changes)
  optimization: {
    splitChunks: {
      name: false,
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    // Generate index.html file.
    // Include script bundles in the right order based on chunk name prefixes.
    new HtmlWebpackPlugin({
      title: 'CEP',
      template: 'src/index.ejs',
      chunksSortMode: function (a, b) {
        const chunkOrder = ['manifest', 'vendor', 'main'];
        const aChunk = chunkOrder.findIndex(chunk => a.names[0].startsWith(chunk));
        const bChunk = chunkOrder.findIndex(chunk => b.names[0].startsWith(chunk));
        const aValue = (aChunk > -1) ? aChunk : chunkOrder.length;
        const bValue = (bChunk > -1) ? bChunk : chunkOrder.length;
        return aValue - bValue;
      }
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "style.css",
      chunkFilename: "style.css",
    }),

    //https://github.com/angular/angular/issues/11580
    //Fixes "WARNING in ./~/@angular/core/@angular/core.es5.js 3705:332-415 Critical dependency: the request of a dependency is an expression"
    new webpack.ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/,
      path.resolve(__dirname, './src')
    )

  ]
};
