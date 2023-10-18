import * as fs from 'fs'
import * as path from 'path'


const runnerScript = fs.readFileSync('runner.py')
fs.writeFileSync('runner.ts', 
`
export const RUNNER = \`
${runnerScript}
\`
`)
