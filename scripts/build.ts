import { execSync as Child } from 'child_process';
import FS from 'fs';

const Pkg = JSON.parse(FS.readFileSync('package.json').toString());

function fileReplace(fileName: string, placeholder: string, value: string) {
    const originalFile = FS.readFileSync(fileName).toString();
    FS.writeFileSync(fileName, originalFile.replace(placeholder, value));
}

// Copy local package files
Child('npm run clean');
Child('npm run compile');
Child('npm run compile:module');

// Embed package version into CJS and ES modules
fileReplace('dist/cjs/Constants.js', '__STANZAJS_VERSION__', Pkg.version);
fileReplace('dist/es/Constants.js', '__STANZAJS_VERSION__', Pkg.version);

Child('mkdir "dist/npm"');
Child('cp -r dist/cjs/* dist/npm/');
Child('cp dist/es/index.js dist/npm/index.module.js');
Child(`cp ${__dirname}/../*.md dist/npm`);

// Create package.json file
FS.writeFileSync(
    'dist/npm/package.json',
    JSON.stringify(
        {
            ...Pkg,
            browser: {
                './platform': './platform/browser/index.js'
            },
            devDependencies: undefined,
            main: './index.js',
            private: false,
            'react-native': {
                './platform': './platform/react-native/index.js'
            },
            scripts: undefined,
            sideEffects: false,
            typings: './index'
        },
        null,
        2
    )
);

Child('npm run compile:webpack');

// Create package bundle
Child('cd dist/npm && npm pack');
Child(`mv dist/npm/*.tgz ${__dirname}/../dist/${Pkg.name}.tgz`);
