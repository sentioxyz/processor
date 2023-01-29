import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'

export async function buildProcessor(onlyGen: boolean) {
  if (!onlyGen) {
    await installDeps()
  }

  // targets.forEach(async (target) => await buildProcessorForTarget(onlyGen, target))
  // for (const target) {
  await buildProcessorForTarget(onlyGen)
  // }

  if (!onlyGen) {
    let WEBPACK_CONFIG: string
    try {
      WEBPACK_CONFIG = require.resolve('@sentio/sdk/lib/webpack.config.js')
    } catch (e) {
      // In the future this should not need unless using very old sdk
      WEBPACK_CONFIG = path.join(__dirname, 'webpack.config.js')
    }
    await execStep('yarn tsc -p .', 'Compile')
    await execStep('yarn webpack --config=' + WEBPACK_CONFIG, 'Packaging')
  }
}

async function buildProcessorForTarget(onlyGen: boolean) {
  await codeGenEthersProcessor(path.join('abis', 'evm'))

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const solanaModule = require('@sentio/sdk-solana/lib/codegen/codegen')
    solanaModule.codeGenSolanaProcessor(path.join('abis', 'solana'))
  } catch (e) {}

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const aptosModuole = require('@sentio/sdk-aptos/lib/codegen/codegen')
    aptosModuole.codeGenAptosProcessor(path.join('abis', 'aptos'))
  } catch (e) {}

  if (onlyGen) {
    return
  }
}

async function installDeps() {
  await execStep('yarn install --ignore-scripts', 'Yarn Install')
}

export async function codeGenEthersProcessor(
  abisDir: string,
  ETHERS_TARGET = path.dirname(require.resolve('@sentio/sdk/lib/target-ethers-sentio')),
  outDir = 'src/types/internal'
) {
  if (!fs.existsSync(abisDir)) {
    return
  }

  let haveJson = false
  const files = fs.readdirSync(abisDir)
  for (const file of files) {
    if (file.toLowerCase().endsWith('.json')) {
      haveJson = true
      break
    }
  }
  if (!haveJson) {
    return
  }

  console.log(chalk.green('Generated Types for EVM'))

  // TODO this will fail during postinstall, need to locate real typechain path
  await execStep(
    'yarn typechain --target ' + ETHERS_TARGET + ` --out-dir ${outDir} ${path.join(abisDir, '*.json')}`,
    'Type definitions gen'
  )
}

async function execStep(cmd: string, stepName: string) {
  const child = exec(cmd)
  console.log(chalk.blue(stepName + ' begin'))

  if (!child.stdout || !child.stderr) {
    console.error(chalk.red(stepName + ' failed'))
    process.exit(1)
  }

  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  await new Promise((resolve) => {
    child.on('close', resolve)
  })

  if (child.exitCode) {
    console.error(chalk.red(stepName + ' failed'))
    process.exit(child.exitCode)
  }
  console.log(chalk.blue(stepName + ' success'))
  console.log()
}
