import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const publicDir = resolve(root, 'public');
const paths = ['assets', 'campoamor', 'data', 'docs', 'torrevieja', 'villaggio-aurora'];

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });
for (const path of paths) await cp(resolve(root, path), resolve(publicDir, path), { recursive: true });
