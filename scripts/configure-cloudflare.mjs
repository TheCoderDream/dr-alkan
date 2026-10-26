import {writeFileSync} from 'node:fs';
const photosDisabled=process.env.CLINIC_DISABLE_PHOTOS==='true';
const passwordAuth=process.env.CLINIC_AUTH_MODE==='password';
const required=['CLOUDFLARE_ACCOUNT_ID','CLINIC_D1_DATABASE_ID',...(passwordAuth?['STAFF_USERNAME','STAFF_EMAIL']:['ACCESS_TEAM_DOMAIN','ACCESS_AUD']),...(!photosDisabled?['CLINIC_R2_BUCKET']:[])];
for(const key of required)if(!process.env[key]?.trim())throw new Error('Set '+key+' before configuring Cloudflare. See DEPLOYMENT.md.');
const value=key=>process.env[key].trim();
if(!/^[a-f0-9]{32}$/.test(value('CLOUDFLARE_ACCOUNT_ID')))throw new Error('Invalid account ID');
if(!/^[a-f0-9-]{36}$/.test(value('CLINIC_D1_DATABASE_ID'))||value('CLINIC_D1_DATABASE_ID')==='00000000-0000-4000-8000-000000000000')throw new Error('Use a real D1 database ID');
if(!passwordAuth&&!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(value('ACCESS_TEAM_DOMAIN')))throw new Error('Use https://TEAM.cloudflareaccess.com without a trailing slash');
writeFileSync('wrangler.production.json',JSON.stringify({
  $schema:'node_modules/wrangler/config-schema.json',name:'dr-alkan',account_id:value('CLOUDFLARE_ACCOUNT_ID'),
  main:'worker/index.ts',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],
  workers_dev:true,preview_urls:false,
  vars:passwordAuth?{CLINIC_AUTH_MODE:'password',STAFF_USERNAME:value('STAFF_USERNAME'),STAFF_EMAIL:value('STAFF_EMAIL')}:{CLINIC_AUTH_MODE:'cloudflare-access',ACCESS_TEAM_DOMAIN:value('ACCESS_TEAM_DOMAIN'),ACCESS_AUD:value('ACCESS_AUD')},
  d1_databases:[{binding:'DB',database_name:'dr-alkan',database_id:value('CLINIC_D1_DATABASE_ID'),migrations_dir:'drizzle'}],
  r2_buckets:photosDisabled?[]:[{binding:'BUCKET',bucket_name:value('CLINIC_R2_BUCKET')}],
  observability:{enabled:false},
},null,2)+'\n');
console.log('Created ignored wrangler.production.json. No resources were created or deployed.');
