#!/usr/bin/env node

const program = require('commander')
const inquirer = require('inquirer')
const path = require('path')
const chalk = require('chalk')
const Table = require('cli-table')
const build = require('../src/commands/build')
const clean = require('../src/commands/clean')
const version = require('../package.json').version
const defaultConfig = require('../src/config')

const renderFilesTable = (paths) => {
  let table = new Table({
    head: [chalk.yellow('from'), chalk.green('to')],
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
  })

  build.getFiles(paths).map((item) => {
    table.push([item.src, item.dest])
  })

  return table
}

program
  .version(version)
  .usage('[options] <file ...>')
  .description('Update your icon library from icomoon zip file')

program
  .command('build <icomoonZipFile> <stylesPath> <fontsPath> <docsPath>')
  .alias('b')
  .description('Uncompresses the zip file generated by icomoon and moves the files to the new destination.')
  .option('--force', 'Executes the command straight away without user confirmation.')
  .action((icomoonZipFile, stylesPath, fontsPath, docsPath, options) => {
    const paths = {
      temp: defaultConfig.temp,
      fonts: path.resolve(fontsPath),
      styles: path.resolve(stylesPath),
      docs: path.resolve(docsPath)
    }

    if (options.force === true) {
      return build.cmd(icomoonZipFile, paths)
    }

    inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `This is the list of files that will be copied once unzipped: \n${renderFilesTable(paths)}\n Do you want to proceed?`
      }
    ]).then(answers => {
      if (answers.proceed === false) {
        return console.log(chalk.white.bgRed('\n Cancelled by the user \n'))
      }
      build.cmd(icomoonZipFile, paths)
    })
  })

program
  .command('clean <stylesPath> <fontsPath> <docsPath>')
  .alias('c')
  .description('Cleans previously generated files.')
  .option('--force', 'Executes the command straight away without user confirmation.')
  .action((stylesPath, fontsPath, docsPath, options) => {
    const paths = [
      defaultConfig.temp,
      path.resolve(fontsPath),
      path.resolve(stylesPath),
      path.resolve(docsPath)
    ]

    if (options.force === true) {
      return clean(paths)
    }

    inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `This is the list of files that will be removed: \n\n${chalk.yellow(paths.map((item) => item).join('\n'))}\n\n Do you want to proceed?`
      }
    ]).then(answers => {
      if (answers.proceed === false) {
        return console.log(chalk.white.bgRed('\n Cancelled by the user \n'))
      }

      clean(paths)
    })
  })

program.parse(process.argv)

if (program.args.length === 0) program.help()
