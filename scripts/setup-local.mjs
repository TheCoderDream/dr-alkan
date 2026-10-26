/** Prepare a standalone local development copy. Never contacts a hosted database. */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<13))throw new Error('Node.js 22.13 or newer is required.');
if(!existsSync(path.join(root,'node_modules/vinext/dist/cli.js')))throw new Error('Install dependencies first: pnpm install --frozen-lockfile');
const runtime=path.join(root,'.sites-runtime');
mkdirSync(runtime,{recursive:true});
writeFileSync(path.join(runtime,'execution-profile.json'),JSON.stringify({executionProfile:'portable'},null,2)+'\n');

function run(args,{nonInteractive=false}={}){
  const result=spawnSync(process.execPath,args,{
    cwd:root,stdio:'inherit',
    env:nonInteractive?{...process.env,CI:'1'}:process.env,
  });
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}

console.log('Building the local Worker and browser application…');
run(['scripts/run-framework.mjs','build']);
const built=JSON.parse(readFileSync(path.join(root,'dist/server/wrangler.json'),'utf8'));
const binding=built.d1_databases?.find(db=>db.binding==='DB');
if(!binding?.database_id)throw new Error('The build did not generate the expected local DB binding.');

// A migration-only config keeps all paths portable and uses Wrangler's migration ledger.
// The database ID is the same local-emulator ID used by the built Worker/dev server.
const config=path.join(runtime,'local-migrations.json');
writeFileSync(config,JSON.stringify({
  name:'aurea-local-migrations',
  compatibility_date:built.compatibility_date||'2026-05-15',
  d1_databases:[{
    binding:'DB',database_name:binding.database_name,database_id:binding.database_id,
    migrations_dir:path.join(root,'drizzle'),
  }],
},null,2)+'\n');
console.log('Applying pending migrations to the local database only…');
run([
  '--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js',
  'd1','migrations','apply','DB','--local',
  '--config',config,'--persist-to',path.join(root,'.wrangler/state'),
],{nonInteractive:true});
console.log('\nLocal setup complete. Run: pnpm dev\nOpen: http://localhost:5173\n');
