const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const meta = require('./package.json')

const config = {
    entry: { main: './src/index.js' },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    'style-loader',
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.css'
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src', 'index.html'),
            filename: 'index.html',
            title: meta.name,
            hash: true,
            alwaysWriteToDisk: true
        }),
        new CopyWebpackPlugin([
            { from: './src/assets/map.json', to: './assets' },
            { from: './src/assets/battles.csv', to: './assets' },
            { from: './src/assets/wars.csv', to: './assets' },
            { from: './src/assets/allies.csv', to: './assets' },
            { from: './src/assets/commanders.csv', to: './assets' },
            { from: './src/assets/images.csv', to: './assets' },
            { from: './src/assets/dark-eye-off.png', to: './assets' },
            { from: './src/assets/light-eye-off.png', to: './assets' },
            { from: './src/assets/dark-eye-on.png', to: './assets' },
            { from: './src/assets/light-eye-on.png', to: './assets' },
            { from: './src/assets/dark-theme.png', to: './assets' },
            { from: './src/assets/light-theme.png', to: './assets' },
            { from: './src/assets/placeholder.png', to: './assets' }
        ])
    ]
}

module.exports = (_, argv) => {
    if (argv.mode === 'development') {
        config.devtool = 'inline-source-map'
        config.watch = true
        config.devServer = {
            contentBase: path.resolve(__dirname, 'dist'),
            historyApiFallback: true,
            watchContentBase: true
        }
        config.plugins.push(new HtmlWebpackHarddiskPlugin({
            outputPath: path.resolve(__dirname, 'dist')
        }))
    } else if (argv.mode === 'production') {
        config.stats = {
            colors: false,
            hash: true,
            timings: true,
            assets: true,
            chunks: true,
            chunkModules: true,
            modules: true,
            children: true
        }
    }
    return config
}
