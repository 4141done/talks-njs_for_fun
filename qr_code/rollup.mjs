/**
 * Transpilation and bundling script using rollup.js
 * This is a very basic application of bundling and transpilation
 * using rollup.js.  It's main features are:
 * Bundling together javascript across dependencies by
 * following `require` or `import` statements from one or
 * more input files.
 * 
 * Inserting polyfills as necessary using corejs
 * 
 * Transpiling files to be compatible with Ecmascript 5.1
 * 
 * Excludes user-created files (any files in the this directory
 * with a `.mjs` extension) and corejs files since corejs polyfills
 * are by definition highly compatible.
 * 
 * This file is set up to be run using `npm run transpile`
 * (see `./package.js`) but can also be run simply with 
 * `node rollup.mjs`
 * 
 * @module rollup
 */

// The main import for rollup.js usage in javascript
import { rollup } from 'rollup';

// This plugin for rollup.js helps it understand where to
// find dependencies that live in node-modules
// https://github.com/rollup/plugins/tree/master/packages/node-resolve
import { nodeResolve } from '@rollup/plugin-node-resolve';

// This rollup plugin Ttakes any commonjs dependencies and converts
// them to es modules.  This makes the bundled code a lot cleaner
// https://github.com/rollup/plugins/tree/master/packages/commonjs
import commonjs from '@rollup/plugin-commonjs';

// This rollup plugin invokes babel following the configuration in the
// .babel.config.json to transpile javascript
// https://github.com/rollup/plugins/tree/master/packages/babel
import { babel } from '@rollup/plugin-babel';

// This allows us to access the filesystem and is a standard node library
import * as fs from 'fs/promises';

// Standard node tools for working with paths
import * as path from 'path';

const inputOptions = {
  // Place things provided by njs here.  This tells rollup that it should not bother
  // looking for any library in `external` because we will provide it.
  // You'll want to put any things that njs has implemented itself here.
  external: [
    'querystring'
  ],
  // A list of files to act as the starting point for a bundle.
  input: {
    'qr-code': 'qr-code.mjs'
  },
  plugins: [
    // MUST be before babel.  Makes sure all external code is brought in using ES Modules rather than commonjs
    commonjs(),
    // Clue rollup on where to find dependencies
    nodeResolve(),
    // Transpile ONLY library code. We ignore corejs since these are es5 compatible polyfills
    babel({ babelHelpers: 'bundled', exclude: ['./*.mjs', /\/core-js\//] })
  ]
};

const outputOptions = {
  // Tell rollup the folder to put bundled files in
  dir: '_build'
};

// This is where the build process is actually kicked off
build();

/**
 * The entire build process is outlined in this function.
 * It is taken very closely from the rollup.js documentation
 * but contains a small piece of logic to rewrite rollup's
 * generated default export syntax to one that can be understood
 * by njs.
 */
async function build() {
  let bundle;
  let finalOutput;
  let buildFailed = false;
  try {
    // create a bundle
    bundle = await rollup(inputOptions);

    // an array of file names this bundle depends on
    console.log(bundle.watchFiles);
    

    const { output } = await bundle.generate(outputOptions);
    finalOutput = output.map((chunk) => {

      // The following is a small hack because njs expects the file to have one default
      // export expressed as `export default XX`.  Rollup produces `export XX as default`
      // so this piece of logic rewrites that part to njs can load the script.
      if (chunk.exports.includes('default')) {
        return Object.assign(
          chunk,
          {
            code: chunk.code.replace(/export \{ (.+) as default \};/, 'export default $1;')
          }
        );
      } else {
        return chunk;
      }
    });
  } catch (error) {
    buildFailed = true;
    console.error(error);
  }


  if (bundle) {
    // closes the bundle.  This is important the operation of some plugins
    await bundle.close();
    await write_outputs(finalOutput);
  }

  process.exit(buildFailed ? 1 : 0);
}


// Small helper function to actually write the transpiled files out to the file system
async function write_outputs(output, folder) {
  folder = folder || outputOptions.dir;
  for (const bundle of output) {
    const destFile = path.join(folder, bundle.fileName);
    await fs.writeFile(destFile, bundle.code);
  }
}