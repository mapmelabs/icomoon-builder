# icomoon-builder

[![Build Status](https://api.travis-ci.org/nass600/icomoon-builder.svg?branch=master)](https://travis-ci.org/nass600/icomoon-builder)
[![npm](https://img.shields.io/npm/v/icomoon-builder.svg)](https://www.npmjs.com/package/icomoon-builder)
[![npm](https://img.shields.io/npm/dt/icomoon-builder.svg)](https://www.npmjs.com/package/icomoon-builder)


Update your icons library project from the zip generated by [icomoon](https://icomoon.io/).

> Currently working only for SASS.

If you are developing your own icons library using the Icomoon tool and you find yourself doing the below process all the time this project might be useful for you.

#### Normal process

1. Download the zip file from icomoon.
2. Uncompressing it.
3. Copy pasting parts of code into your own.
4. Moving files to the location you want.
5. Minify the css file.

#### Process with icomoon-builder

1. Download the font from icomoon.
2. Run `icomoon-builder`.

## Features

+ Uncompress the icomoon generated zip file for you.
+ Pick the location where the fonts styles will be moved.
+ Choose where to move the pre-processed and css styles separately.
+ All references between all these files will be updated accordingly.
+ Minify the distribution css with `cssnano`.
+ Update the font family name with the one you chose.
+ Will keep your `selection.json` generated by icomoon so you can resume your work.
+ And many more (below examples).

## Installation

```bash
npm install --save-dev icomoon-builder
```

## Usage

You can run it directly in your terminal with Node:

```bash
node node_modules/.bin/icomoon-builder export <fontName> <icomoonZipFile> <preProcessorPath> <cssPath> <fontsPath> <docsPath>
```

Or add it as a script in your `package.json`:

```json
"scripts": {
    "import": "icomoon-builder export"
}
```

And then run it:

```bash
npm run import <fontName> <icomoonZipFile> <preProcessorPath> <cssPath> <fontsPath> <docsPath>
```

## Examples

### Export

Considering the following files are the ones icomoon generates and compresses:

```
.tmp/
├── demo-files
|   ├── demo.css
|   └── demo.js
├── demo.html
├── fonts
|   ├── icomoon.svg
|   ├── icomoon.ttf
|   └── icomoon.woff
├── Read Me.txt
├── selection.json
├── style.css
├── style.scss
└── variables.scss
```

When running:

```bash
cd your/path/to/fancy-icons-project/
node node_modules/.bin/icomoon-builder export fancy-icons ~/Downloads/icomoon.zip scss css fonts docs
```

We will obtain:

```
target/
├── css
|   ├── fancy-icons.css
|   └── fancy-icons.min.css
├── docs
|   ├── demo
|   |   ├── index.html
|   |   ├── scripts.js
|   |   └── styles.css
|   └── icomoon.json
├── fonts
|   ├── fancy-icons.svg
|   ├── fancy-icons.ttf
|   └── fancy-icons.woff
└── scss
    ├── fancy-icons.scss
    ├── icons.scss
    └── _variables.scss
```

The `export` command does not destroy directories so if you have more files in the destination folders they will remain the same.

The following is the list of files copied:

| From                       | To                                          | Operations performed                                               |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| .tmp/demo.html             | fancy-icons-project/docs/demo/index.html    | Updated references to assets                                       |
| .tmp/demo-files/demo.css   | fancy-icons-project/docs/demo/styles.css    |                                                                    |
| .tmp/demo-files/demo.js    | fancy-icons-project/docs/demo/scripts.js    |                                                                    |
| .tmp/selection.json        | fancy-icons-project/docs/icomoon.json       | Renamed to icomoon.json                                            |
| .tmp/style.css             | fancy-icons-project/css/fancy-icons.css     | Renamed to `<fontName>`, updated references                        |
|                            | fancy-icons-project/css/fancy-icons.min.css | Minify the previous css                                            |
| .tmp/fonts/line-icons.woff | fancy-icons-project/fonts/fancy-icons.woff  | Renamed to `<fontName>`                                            |
| .tmp/fonts/line-icons.svg  | fancy-icons-project/fonts/fancy-icons.svg   | Renamed to `<fontName>`                                            |
| .tmp/fonts/line-icons.ttf  | fancy-icons-project/fonts/fancy-icons.ttf   | Renamed to `<fontName>`                                            |
| .tmp/style.scss            | fancy-icons-project/scss/icons.scss         | Updated references and renamed `$icomoon-font-path`                |
| .tmp/variables.scss        | fancy-icons-project/scss/_variables.scss    |                                                                    |
|                            | fancy-icons-project/scss/fancy-icons.scss   | Imports the other two scss files. Created if does not exist before |

### Clean

> Careful, this command is destructive and cannot be undone.

Running:

```bash
cd your/path/to/fancy-icons-project/
node node_modules/.bin/icomoon-builder clean scss css fonts docs
```

Will **remove entirely** the following folders:

+ your/path/to/fancy-icons-project/scss
+ your/path/to/fancy-icons-project/css
+ your/path/to/fancy-icons-project/fonts
+ your/path/to/fancy-icons-project/docs

## Todo

- [x] SASS
- [ ] LESS
- [ ] Stylus

## License

[MIT](LICENSE)

## Authors

+ [Ignacio Velazquez](http://ignaciovelazquez.es)
