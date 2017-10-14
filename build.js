// require modules
let fs = require('fs');
let path = require('path');
let archiver = require('archiver');
let pack = require('./package.json');
let manifest = require('./src/manifest.json');

Object.keys(manifest).forEach((key) => {
    if (manifest[key] === '') {
        manifest[key] = pack[key];
    }
});

if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
}

let output = fs.createWriteStream(path.resolve(__dirname, 'build/' + pack.name + '-v' + pack.version + '.zip'));
let archive = archiver('zip', {store: true});

archive.pipe(output);

archive.append(JSON.stringify(manifest), {name: 'manifest.json'});

archive.glob('**/!(manifest.json)', {
    cwd: 'src'
});

archive.finalize();

// create a file to stream archive data to.
//


