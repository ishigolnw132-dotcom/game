import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve,join} from 'node:path';
import {mkdir,copyFile} from 'node:fs/promises';
const base=process.env.VITE_BASE_PATH||'/';
export default defineConfig({
 root:'firebase-web',
 base,
 publicDir:resolve('public'),
 plugins:[react(),{name:'github-pages-routes',async writeBundle(options){const out=String(options.dir||resolve('firebase-dist'));await mkdir(join(out,'school'),{recursive:true});await copyFile(join(out,'index.html'),join(out,'school','index.html'));await copyFile(join(out,'index.html'),join(out,'404.html'));}}],
 resolve:{alias:{'@':resolve('.')}},
 build:{outDir:resolve('firebase-dist'),emptyOutDir:true,chunkSizeWarningLimit:1500,rollupOptions:{output:{manualChunks(id){if(id.includes('@babylonjs'))return 'babylon';if(id.includes('/blockly'))return 'blockly';}}}}
});
