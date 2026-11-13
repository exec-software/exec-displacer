import { readFile, writeFile, access, unlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const found = new Map()
async function packageRoot(name, from) {
  for (let directory = from; ; directory = dirname(directory)) {
    const candidate = join(directory, 'node_modules', name)
    try { await access(join(candidate, 'package.json')); return candidate } catch {}
    if (dirname(directory) === directory) throw new Error(`Missing installed runtime dependency: ${name}`)
  }
}
async function visit(name, from) {
  const directory = await packageRoot(name, from)
  const info = await readJson(join(directory, 'package.json'))
  const key = `${info.name}@${info.version}`
  if (found.has(key)) return
  let license
  for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
    try { license = await readFile(join(directory, filename), 'utf8'); break } catch {}
  }
  if (!license) throw new Error(`Missing license text: ${key}`)
  found.set(key, { info, license })
}
const manifest = join(root, 'dist', 'displacer-editors.packages.json')
for (const name of await readJson(manifest)) await visit(name, root)
let notice = 'Displacer optional browser editors — redistribution notices\n\n'
notice += 'Original Displacer code and the Matrix/Ny language adapters adapted from\nhttps://github.com/exec-software/exec-antimatter use the following MIT license.\n\n'
notice += await readFile(join(root, 'LICENSE'), 'utf8')
notice += '\nRuntime dependencies follow. Build-only tools are not bundled.\n'
for (const [key, { info, license }] of [...found.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  notice += `\n${'='.repeat(72)}\n${key} (${info.license ?? 'see license'})\n${'='.repeat(72)}\n\n${license.trim()}\n`
}
await writeFile(join(root, 'EDITORS_NOTICES.txt'), notice)
await writeFile(join(root, 'dist', 'displacer-editors.LICENSE.txt'), notice)
const asset = join(root, 'dist', 'displacer-editors.js')
// Full notices travel inside the standalone asset as well as alongside it.
await writeFile(asset, `${await readFile(asset, 'utf8')}\n/*!\n${notice.replaceAll('*/', '* /')}\n*/\n`)
console.log(`Editor redistribution notices: ${found.size} runtime packages`)
await unlink(manifest)
