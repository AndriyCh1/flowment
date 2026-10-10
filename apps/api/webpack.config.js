const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const { IgnorePlugin } = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
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
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
