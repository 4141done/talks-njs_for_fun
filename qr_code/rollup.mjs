import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import * as fs from 'fs/promises';
import * as path from 'path';

const inputOptions = {
  external: [
    'querystring'
  ], // Place things provided by njs here
  input: {
    'qr-code': 'qr-code.mjs',
    'helper': 'helper.mjs'
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
  dir: '_build'
};

build();

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
    // do some error reporting
    console.error(error);
  }


  if (bundle) {
    // closes the bundle
    await bundle.close();
    await write_outputs(finalOutput);
  }
  process.exit(buildFailed ? 1 : 0);
}

async function write_outputs(output, folder) {
  folder = folder || outputOptions.dir;
  for (const bundle of output) {
    const destFile = path.join(folder, bundle.fileName);
    await fs.writeFile(destFile, bundle.code);
  }
}