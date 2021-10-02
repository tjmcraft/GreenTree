const path = require('path');

module.exports = {
    target: 'web',
    entry: {
        index: ['@babel/polyfill', path.resolve(__dirname, 'src', 'index.js')],
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: 'GreenTree.js',
        library: 'GreenTree',
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true,
        clean: true,
    },
    mode: "development",
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties'
                        ]
                    }
                }]
            }
        ]
    }
};