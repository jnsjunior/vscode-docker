/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// See https://github.com/Microsoft/vscode-azuretools/wiki/webpack for guidance

// 'use strict';

/* eslint-disable @typescript-eslint/no-var-requires */
// const process = require('process');
// const webpack = require('webpack');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const dev = require('vscode-azureextensiondev');
/* eslint-enable @typescript-eslint/no-var-requires */
/*
let DEBUG_WEBPACK = !!process.env.DEBUG_WEBPACK;

let config = dev.getDefaultWebpackConfig({
    projectRoot: __dirname,
    verbosity: DEBUG_WEBPACK ? 'debug' : 'normal',

    externalNodeModules: [
        // Modules that we can't easily webpack for some reason.
        // These and their dependencies will be copied into node_modules rather than placed in the bundle
        // Keep this list small, because all the subdependencies will also be excluded
    ],
    entries: {
        // Note: Each entry is a completely separate Node.js application that cannot interact with any
        // of the others, and that individually includes all dependencies necessary (i.e. common
        // dependencies will have a copy in each entry file, no sharing).

        // Separate module for the language server (doesn't share any code with extension.js)
        './dockerfile-language-server-nodejs/lib/server': './node_modules/dockerfile-language-server-nodejs/lib/server.js'
    },

    loaderRules: [

        {
            // Unpack UMD module headers used in some modules since webpack doesn't
            // handle them.
            test: /dockerfile-language-service|vscode-languageserver-types/,
            use: { loader: 'umd-compat-loader' }
        }

    ], // end of loaderRules

    plugins: [
        // Replace vscode-languageserver/lib/files.js with a modified version that doesn't have webpack issues
        new webpack.NormalModuleReplacementPlugin(
            /[/\\]vscode-languageserver[/\\]lib[/\\]files\.js/,
            require.resolve('./resources/vscode-languageserver-files-stub.js')
        ),

        // Copy files to dist folder where the runtime can find them
        new CopyWebpackPlugin({
            patterns: [
                // node_modules/vscode-codicons/dist/codicon.css, .ttf -> dist/node_modules/vscode-codicons/dist/codicon.css, .ttf
                { from: './node_modules/vscode-codicons/dist/codicon.css', to: 'node_modules/vscode-codicons/dist' },
                { from: './node_modules/vscode-codicons/dist/codicon.ttf', to: 'node_modules/vscode-codicons/dist' },
            ]
        }),
    ]
});

if (DEBUG_WEBPACK) {
    console.log('Config:', config);
}

module.exports = config;
*/

// @ts-check
/* eslint-disable no-undef */

'use strict';


/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

/** @type {import('webpack').Configuration}*/
const config = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    cache: true, // Makes 'watch' builds way faster after the first full build

    entry: {
        './extension.bundle': './src/extension.ts',
        './dockerfile-language-server-nodejs/lib/server': './node_modules/dockerfile-language-server-nodejs/lib/server.js',
    }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },
    devtool: 'nosources-source-map',
    externals: {
        vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                // Default TypeScript loader for .ts files
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                // Unpack UMD module headers used in some modules since webpack doesn't handle them.
                test: /dockerfile-language-service|vscode-languageserver-types/,
                use: { loader: 'umd-compat-loader' }
            }
        ]
    },
    plugins: [
        // Copy some needed resource files from external sources
        // @ts-expect-error: Class incompatibility with CopyPlugin
        new CopyPlugin({
            patterns: [
                './node_modules/vscode-azureextensionui/resources/**/*.svg',
                './node_modules/vscode-azureappservice/resources/**/*.svg',
                './node_modules/vscode-codicons/dist/codicon.{css,ttf}',
            ],
        }),
    ],
    optimization: {
        minimizer: [
            // @ts-expect-error: Class incompatibility with TerserPlugin
            new TerserPlugin({
                terserOptions: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    // Keep class and function names so that stacks aren't useless and things like UserCancelledError work
                    keep_classnames: true,
                    keep_fnames: true,
                    /* eslint-enable @typescript-eslint/naming-convention */
                }
            }),
        ]
    },
    ignoreWarnings: [
        // Suppress some webpack warnings caused by dependencies
        {
            // Ignore some warnings from handlebars in code that doesn't get used anyway
            module: /node_modules\/handlebars\/lib\/index\.js/,
            message: /require\.extensions/,
        },
        {
            // Ignore a warning from applicationinsights
            module: /node_modules\/applicationinsights/,
            message: /Can't resolve 'applicationinsights-native-metrics'/
        },
        {
            // Ignore a warning from diagnostic-channel-publishers
            module: /node_modules\/diagnostic-channel-publishers/,
            message: /Can't resolve '@opentelemetry\/tracing'/
        },
        (warning) => false, // No other warnings should be ignored
    ]
};
module.exports = config;

/* eslint-enable no-undef */
