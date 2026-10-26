import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
const out=resolve('outputs/access-tests');await mkdir(out,{recursive:true});
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
await writeFile(out+'/access.mjs',compile(await readFile('lib/clinic/access.ts','utf8')));
let worker=await readFile('worker/index.ts','utf8');
worker=worker.replace("'../lib/clinic/access'","'./access.mjs'").replace('"vinext/server/fetch-handler"','"./handler.mjs"').replace('"../lib/connector-context"','"./context.mjs"').replaceAll('import.meta.env.DEV','false');
await writeFile(out+'/worker.mjs',compile(worker));
await writeFile(out+'/handler.mjs',`export default {fetch:r=>Response.json({id:r.headers.get('oai-authenticated-user-id'),email:r.headers.get('oai-authenticated-user-email')})};`);
await writeFile(out+'/context.mjs',`export const runWithConnectorBinding=(_,fn)=>fn();`);
const {default:app}=await import(pathToFileURL(out+'/worker.mjs'));
const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk={...await exportJWK(publicKey),kid:'test',alg:'RS256',use:'sig'};
const issuer='https://clinic-test.cloudflareaccess.com';const audience='clinic-test-audience';
const fetchBefore=globalThis.fetch;
globalThis.fetch=async url=>{assert.equal(String(url),issuer+'/cdn-cgi/access/certs');return Response.json({keys:[jwk]});};
const env={CLINIC_AUTH_MODE:'cloudflare-access',ACCESS_TEAM_DOMAIN:issuer,ACCESS_AUD:audience};
async function token(overrides={}){return new SignJWT({email:'doctor@example.com',...overrides}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('doctor-1').setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(privateKey);}
async function call(path,jwt,settings=env){const headers={'oai-authenticated-user-id':'spoofed','oai-authenticated-user-email':'spoofed@example.com'};if(jwt)headers['cf-access-jwt-assertion']=jwt;return app.fetch(new Request('https://clinic.test'+path,{headers}),settings,{});}
try{
  assert.equal((await call('/api/clinic')).status,401);
  assert.equal((await call('/', 'invalid')).status,401);
  assert.equal((await call('/api/clinic',await token(),{...env,ACCESS_AUD:undefined})).status,401);
  const valid=await token();const good=await call('/api/clinic',valid);assert.equal(good.status,200);assert.deepEqual(await good.json(),{id:'access:doctor-1',email:'doctor@example.com'});
  const wrongAudience=await new SignJWT({email:'doctor@example.com'}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('doctor-1').setIssuer(issuer).setAudience('wrong').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  assert.equal((await call('/api/clinic',wrongAudience)).status,401);
  const expired=await new SignJWT({email:'doctor@example.com'}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('doctor-1').setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(1).sign(privateKey);
  assert.equal((await call('/api/clinic',expired)).status,401);
  const other=await generateKeyPair('RS256');const forged=await new SignJWT({email:'attacker@example.com'}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('attacker').setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(other.privateKey);
  assert.equal((await call('/api/clinic',forged)).status,401);
  assert.equal((await call('/api/clinic',await token({email:undefined}))).status,401);
  const intake=await call('/api/intake/token');assert.equal(intake.status,200);assert.deepEqual(await intake.json(),{id:null,email:null});
  const site=await call('/api/clinic',undefined,{});assert.equal((await site.json()).id,'spoofed');
  assert.equal((await call('/signout-with-chatgpt')).headers.get('location'),'https://clinic.test/cdn-cgi/access/logout');
  console.log('PASS Access JWT signatures, expiry, audience, required identity, missing config, header spoofing, scoped intake bypass, existing Site behavior and logout');
}finally{globalThis.fetch=fetchBefore;}
