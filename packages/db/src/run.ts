import { codegen } from './codegen.js'
import { schemaFromFile } from './schema.js'

if (process.argv.length > 3) {
  const srcFile = process.argv[2]
  const targetDir = process.argv[3]
  const schema = schemaFromFile(srcFile)
  await codegen(schema, targetDir)
} else {
  console.error('Not enough argument')
  process.exit(1)
}
