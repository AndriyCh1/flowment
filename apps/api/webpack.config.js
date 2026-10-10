const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { dirname, join } = require('path');
const { IgnorePlugin } = require('webpack');

// SwaggerModule serves the UI's static files from swagger-ui-dist's __dirname.
// Bundled, that __dirname is dist/, so the files are copied there.
const swaggerUiDist = dirname(require.resolve('swagger-ui-dist/package.json'));

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  // Some deps (e.g. @nestjs/throttler) ship .js.map files referencing .ts sources they don't publish.
  ignoreWarnings: [/Failed to parse source map/],
  plugins: [
    // pg loads the optional pg-native only when `pg.native` is used; it isn't installed.
    new IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
    // Optional requires in @nestjs/swagger and @nestjs/mapped-types. Validation goes
    // through nestjs-zod and the app runs on Express, so none of these are installed.
    new IgnorePlugin({
      resourceRegExp: /^(class-validator|class-transformer(\/.*)?|@fastify\/static)$/,
    }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        {
          input: swaggerUiDist,
          glob: '{swagger-ui.css,swagger-ui-bundle.js,swagger-ui-standalone-preset.js,favicon-*.png}',
          output: '.',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
