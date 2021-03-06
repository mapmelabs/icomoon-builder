const fs = require('fs-extra')
const path = require('path')
const decompress = require('decompress')
const replace = require('replace-in-file')
const cssnano = require('cssnano')
const os = require('os')

let TEMP_DIR

/**
 * Extracts the font name.
 *
 * @param {string} file
 */
const parseFontName = (file) => {
  var matches = /font-family:\s*'([^']*)'/g.exec(fs.readFileSync(file, 'utf-8'))

  if (matches.length < 1) {
    throw Error('Unable to find font name')
  }

  return matches[1]
}

/**
 * Uncompresses the zip file generated by the Icomoon app.
 *
 * @param {string} icomoonZipFile
 */
const unzipIcomoon = (icomoonZipFile) => {
  TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'icomoon-builder-'))
  return decompress(icomoonZipFile, TEMP_DIR).then(files => {
    console.log('Unzipped Icomoon files into temporary directory')
  })
}

/**
 * Returns the list of files that will be copied.
 *
 * @param {object} paths
 */
const getFiles = (paths, fontName, minify) => {
  const files = []

  // Doc files
  if (paths.docs) {
    files.push(
      {
        src: 'demo.html',
        dest: path.resolve(paths.docs, 'index.html')
      },
      {
        src: 'demo-files/demo.css',
        dest: path.resolve(paths.docs, 'styles.css')
      },
      {
        src: 'demo-files/demo.js',
        dest: path.resolve(paths.docs, 'scripts.js')
      },
      {
        src: 'style.css',
        dest: path.resolve(paths.docs, `${fontName}.css`)
      }
    )
  }

  // JSON file
  if (paths.json) {
    files.push({
      src: 'selection.json',
      dest: path.resolve(paths.json, 'icomoon.json')
    })
  }

  // CSS files
  if (paths.css) {
    files.push({
      src: 'style.css',
      dest: path.resolve(paths.css, paths.cssName || `${fontName}.css`)
    })
    if (minify) {
      files.push({
        src: path.resolve(paths.css, paths.cssName || `${fontName}.css`),
        dest: path.resolve(paths.css, paths.cssName || `${fontName}.min.css`),
        ignore: true
      })
    }
  }

  // Font files
  if (paths.fonts || paths.docs) {
    const fontsPath = path.resolve(TEMP_DIR, 'fonts')
    fs.readdirSync(fontsPath).map((file) => {
      if (paths.fonts) {
        files.push({
          src: path.join('fonts', file),
          dest: path.resolve(paths.fonts, `${fontName}${path.parse(file).ext}`)
        })
      }
      if (paths.docs) {
        files.push({
          src: path.join('fonts', file),
          dest: path.resolve(paths.docs, 'fonts', file)
        })
      }
    })
  }

  // Preprocessor files (only Sass supported at the moment)
  if (paths.preProcessor) {
    if (!fs.existsSync(path.resolve(TEMP_DIR, 'style.scss'))) {
      throw new Error('--preprocessor option specified but zip file doesn\'t have a preprocessor file')
    }
    files.push(
      ...[
        {
          src: 'style.scss',
          dest: path.resolve(paths.preProcessor, '_icons.scss')
        },
        {
          src: 'variables.scss',
          dest: path.resolve(paths.preProcessor, '_variables.scss')
        },
        {
          src: '',
          dest: path.resolve(paths.preProcessor, `${fontName}.scss`),
          ignore: true
        }
      ]
    )
  }

  return files
}

/**
 * Copies the files from source to destination.
 *
 * @param {object} paths
 */
const copyFiles = (paths, fontName) => {
  const files = getFiles(paths, fontName)

  return Promise
    .all(files.map(item => {
      if (item.ignore === true) {
        return Promise.resolve()
      }

      return fs.copy(path.resolve(TEMP_DIR, item.src), item.dest)
    }))
    .then(() => {
      console.log('Files copied to destination')
    })
}

/**
 * Updates file paths references in the docs files.
 *
 * @param {object} paths
 * @param {string} fontName
 */
const updateDocsFiles = (paths, fontName) => {
  if (!paths.docs) return
  return replace({
    files: path.resolve(paths.docs, 'index.html'),
    from: [
      'demo-files/demo.css',
      'demo-files/demo.js',
      'style.css'
    ],
    to: [
      'styles.css',
      'scripts.js',
      `${fontName}.css`
    ]
  })
    .then(() => {
      console.log('Modified doc files to use the new references')
    })
}

/**
 * Creates main pre-processor file to link the rest.
 *
 * @param {object} paths
 * @param {string} fontName
 */
const createMainPreProcessorFile = (paths, fontName) => {
  const mainFile = path.resolve(paths.preProcessor, `${fontName}.scss`)

  if (fs.existsSync(mainFile)) {
    return Promise.resolve()
  }

  return fs.appendFile(mainFile, '@import "variables";\n@import "icons";\n')
}

/**
 * Updates file paths references in preProcessor files (sass, less, stylus).
 *
 * @param {object} paths
 * @param {string} fontName
 */
const updatePreProcessorFiles = (paths, fontName) => {
  if (!paths.preProcessor) return
  const preProcessorFile = path.resolve(paths.preProcessor, '_icons.scss')
  const formerFontName = parseFontName(path.resolve(TEMP_DIR, 'style.css'))

  return replace({
    files: path.resolve(paths.preProcessor, `_variables.scss`),
    from: ['$icomoon-font-path: "fonts" !default;'],
    to: [`$${fontName}-font-path: "${paths.fontsPublic || path.relative(paths.preProcessor, paths.fonts)}" !default;`]
  })
    .then(() => replace({
      files: preProcessorFile,
      from: [
        /\$icomoon-font-path/g,
        new RegExp(`font-family: '${formerFontName}'`, 'g'), // font-family
        new RegExp(`/${formerFontName}.`, 'g'), // font-face url
        new RegExp(`#${formerFontName}'`, 'g'), // font-face hashbang svg
        '@import "variables";\n\n'
      ],
      to: [
        `$${fontName}-font-path`,
        `font-family: '${fontName}'`,
        `/${fontName}.`,
        `#${fontName}'`,
        ''
      ]
    }))
    .then(() => createMainPreProcessorFile(paths, fontName))
    .then(() => {
      console.log('Modified pre-processor files to use the new references')
    })
}

/**
 * Updates file paths references in css files.
 *
 * @param {object} paths
 * @param {string} fontName
 */
const updateCssFiles = (paths, fontName) => {
  if (!paths.css) return
  const cssFile = path.resolve(paths.css, paths.cssName || `${fontName}.css`)
  const formerFontName = parseFontName(path.resolve(TEMP_DIR, 'style.css'))
  const finalPath = paths.fontsPublic ? paths.fontsPublic : path.relative(paths.css, paths.fonts)

  return replace({
    files: cssFile,
    from: [/url\('fonts\//g],
    to: [`url('${finalPath}/`.replace(/\/\/+/g, '/')] // this replace takes care of extra slashes
  })
    .then(() => replace({
      files: cssFile,
      from: [new RegExp(formerFontName, 'g')],
      to: [fontName]
    }))
    .then(() => {
      console.log('Modified css files to use the new references')
    })
}

/**
 * Minifies the generated css.
 *
 * @param {object} paths
 * @param {string} fontName
 */
const minifyCss = (paths, fontName) => {
  if (!paths.css) return
  const cssFile = path.resolve(paths.css, paths.cssName || `${fontName}.css`)

  return cssnano.process(fs.readFileSync(cssFile)).then(result => {
    fs.writeFileSync(path.resolve(paths.css, paths.cssName || `${fontName}.min.css`), result)

    console.log('Minified css')
  })
}

/**
 * Removes temporary folder.
 */
const removeTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    return Promise.resolve()
  }

  return fs.remove(TEMP_DIR).then(() => {
    console.log('Removed temporary directory')
  })
}

/**
 * Uncompresses the zip file generated by icomoon and moves the files to the new destination
 *
 * @param {string} icomoonZipFile
 */
const cmd = (fontName, icomoonZipFile, paths, minify) => {
  return unzipIcomoon(icomoonZipFile)
    .then(() => copyFiles(paths, fontName))
    .then(() => updatePreProcessorFiles(paths, fontName))
    .then(() => updateCssFiles(paths, fontName))
    .then(() => updateDocsFiles(paths, fontName))
    .then(() => minify && minifyCss(paths, fontName))
    .then(removeTempDir)
}

module.exports = {
  cmd: cmd,
  getFiles: getFiles,
  unzipIcomoon: unzipIcomoon,
  removeTempDir: removeTempDir
}
