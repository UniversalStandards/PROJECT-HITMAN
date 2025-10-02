const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isDevelopment = process.env.NODE_ENV !== 'production';
const isAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  
  entry: {
    main: './src/index.tsx',
    // Add more entry points as needed
    // vendor: ['react', 'react-dom']
  },
  
  output: {
    path: path.resolve(__dirname, '_site/assets'),
    filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDevelopment ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
    publicPath: '/assets/',
    clean: true,
    assetModuleFilename: 'images/[name].[contenthash][ext]'
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },
  
  module: {
    rules: [
      // TypeScript/React
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: isDevelopment,
              configFile: 'tsconfig.json'
            }
          }
        ]
      },
      
      // CSS/SCSS
      {
        test: /\.(css|scss|sass)$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: isDevelopment 
                  ? '[name]__[local]--[hash:base64:5]' 
                  : '[hash:base64:8]'
              },
              sourceMap: isDevelopment
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                  ['tailwindcss']
                ]
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: isDevelopment,
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'src/styles')]
              }
            }
          }
        ]
      },
      
      // Images
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        },
        generator: {
          filename: 'images/[name].[contenthash][ext]'
        }
      },
      
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      },
      
      // Other assets
      {
        test: /\.(pdf|txt|xml)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[contenthash][ext]'
        }
      }
    ]
  },
  
  plugins: [
    // Extract CSS
    !isDevelopment && new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].chunk.css'
    }),
    
    // HTML generation (optional, for SPA components)
    // new HtmlWebpackPlugin({
    //   template: 'src/template.html',
    //   filename: '../components.html',
    //   inject: 'body'
    // }),
    
    // Bundle analyzer
    isAnalyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: '../reports/bundle-analysis.html'
    })
  ].filter(Boolean),
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: {