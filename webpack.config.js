const path = require('path');
const { argv } = require('yargs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isDev = argv.mode === 'development';
const srcDir = path.resolve(__dirname, 'src');
const distDir = path.resolve(__dirname, 'dist');

const config = {
    mode: argv.mode,
    output: {
        filename: 'tabsync.js', // TODO: create declaration file for .js output
        path: distDir,
    },
    resolve: {
        extensions: [ '.ts', '.js' ],
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                use: 'ts-loader',
                include: srcDir,
                exclude: [
                    /node_modules/,
                    /\.test\.(ts|js)$/
                ]
            },
        ],
    },
    optimization: {
        minimize: !isDev
    },
    plugins: [
        new CleanWebpackPlugin()
    ]
};

if (isDev) {
    config.entry = './src/dev.ts';
    config.devtool = 'inline-source-map';
    config.devServer = {
        host: '127.0.0.1',
        port: 9197,
        contentBase: distDir,
    };

    config.plugins.push(
        new HtmlWebpackPlugin({
            template: './src/dev.html',
            hash: true
        })
    );
} else {
    config.entry = './src/tabsync.ts';
}

module.exports = config;
