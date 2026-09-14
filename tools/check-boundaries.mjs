import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '..');
const projects = ['apps', 'packages']
  .flatMap((parent) => readdirSync(join(root, parent)).map((name) => join(root, parent, name)))
  .filter((dir) => existsSync(join(dir, 'package.json')))
  .map((dir) => ({ dir, ...JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) }));
const byName = new Map(projects.map((p) => [p.name, p]));
const failures = [];
const browserSafe = new Set([
  '@dealith/ui',
  '@dealith/contracts',
  '@dealith/types',
  '@dealith/events',
  '@dealith/validation',
]);
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', '.next', 'generated'].includes(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : /\.(ts|tsx|mjs)$/.test(entry.name) ? [path] : [];
  });
}
for (const project of projects) {
  for (const file of files(project.dir)) {
    if (file.endsWith('.d.ts')) continue;
    const content = readFileSync(file, 'utf8');
    const imports = ts.preProcessFile(content, true, true).importedFiles.map((i) => i.fileName);
    const frontend = project.name === '@dealith/web' || project.name === '@dealith/admin';
    const publicEntry = /\/(config|security|observability)\/src\/public\.ts$/.test(file);
    for (const specifier of imports) {
      const dependency = specifier.startsWith('@dealith/')
        ? specifier.split('/').slice(0, 2).join('/')
        : undefined;
      const label = relative(root, file) + ': ' + specifier;
      if (
        dependency &&
        dependency !== project.name &&
        !project.dependencies?.[dependency] &&
        !project.devDependencies?.[dependency]
      )
        failures.push('Undeclared workspace dependency ' + label);
      if (dependency === '@dealith/test-kit' && project.name !== '@dealith/test-kit')
        failures.push('Production import of test fixtures ' + label);
      if (
        (frontend || browserSafe.has(project.name) || publicEntry) &&
        (specifier.startsWith('@dealith/backend') ||
          /^(?:@prisma\/|pg$|ioredis$|bullmq$|@nestjs\/)/.test(specifier) ||
          /^@dealith\/(config|security|observability)\/server/.test(specifier))
      )
        failures.push('Server authority reachable from presentation/shared contract ' + label);
      if ((browserSafe.has(project.name) || publicEntry) && specifier.startsWith('node:'))
        failures.push('Node runtime in browser-safe entry ' + label);
      if (
        specifier.startsWith('.') &&
        !resolve(file, '..', specifier).startsWith(project.dir + '/')
      )
        failures.push('Cross-package relative import ' + label);
      if (specifier.startsWith('@dealith/') && specifier.includes('/src/'))
        failures.push('Private package source import ' + label);
    }
    if (publicEntry && /\bprocess\.env\b/.test(content))
      failures.push('Environment access in public entry ' + relative(root, file));
  }
}
const visited = new Set();
function visit(name, active = []) {
  if (active.includes(name)) {
    failures.push('Dependency cycle: ' + [...active, name].join(' -> '));
    return;
  }
  if (visited.has(name)) return;
  for (const dependency of Object.keys(byName.get(name)?.dependencies ?? {}).filter((n) =>
    byName.has(n),
  ))
    visit(dependency, [...active, name]);
  visited.add(name);
}
for (const name of byName.keys()) visit(name);
if (failures.length) {
  failures.forEach((f) => console.error(f));
  process.exit(1);
}
console.log(`Package boundaries: PASS (${projects.length} projects)`);
