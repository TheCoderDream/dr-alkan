import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {translate as t} from './messages';
import {locales,treatmentIds,questions,emptyPermissions,clinicToday,addDays,isMinor} from './types';
import type {Locale,Patient,Visit,ClinicSettings,IntakeDraft,ConsentSnapshot,Consent,Media} from './types';

const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
class ApiError extends Error{constructor(public status:number,public code:string){super(code);}}
const fail=(code:string,status=400):never=>{throw new ApiError(status,code);};
const now=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID();
const db=()=>{if(!env.DB)fail('storageUnavailable',503);return env.DB!;};
function user(req:Request){
  const id=req.headers.get('oai-authenticated-user-id');
  const email=req.headers.get('oai-authenticated-user-email')||'';
  let name=req.headers.get('oai-authenticated-user-full-name')||email.split('@')[0]||'Clinic team';
  try{if(req.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')name=decodeURIComponent(name);}catch{}
  if(id)return{id,name,email};
  if(import.meta.env.DEV)return{id:'local-preview',name:'Emre',email:''};
  return fail('signIn',401);
}
function originGuard(req:Request){const o=req.headers.get('origin');if(o&&o!==new URL(req.url).origin)fail('forbidden',403);}
async function body(req:Request){originGuard(req);const text=await req.text();if(text.length>600_000)fail('tooLarge',413);try{return JSON.parse(text);}catch{return fail('invalidRequest');}}
async function hash(s:string){const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,'0')).join('');}
type Row={id:string;owner_id:string;kind:string;patient_id:string|null;visit_id:string|null;data:string;created_at:string;updated_at:string};
const parse=<T,>(r:Row)=>JSON.parse(r.data) as T;
async function record<T>(owner:string,id:string,kind:string){const r=await db().prepare('SELECT * FROM clinic_records WHERE owner_id=? AND id=? AND kind=?').bind(owner,id,kind).first<Row>();if(!r)fail('notFound',404);return parse<T>(r!);}
function put(owner:string,kind:string,value:{id:string;patientId?:string;visitId?:string},insert=false){const at=now();return db().prepare(insert?'INSERT OR IGNORE INTO clinic_records(id,owner_id,kind,patient_id,visit_id,data,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)':'INSERT INTO clinic_records(id,owner_id,kind,patient_id,visit_id,data,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at WHERE clinic_records.owner_id=excluded.owner_id').bind(value.id,owner,kind,value.patientId??(kind==='patient'?value.id:null),value.visitId??(kind==='visit'?value.id:null),JSON.stringify(value),at,at);}
function audit(owner:string,action:string,patientId?:string,visitId?:string){return put(owner,'audit',{id:uid(),action,patientId,visitId,at:now()} as any,true);}
const defaults:ClinicSettings={name:'Dr. Alkan Aesthetic',city:'Istanbul',timezone:'Europe/Istanbul',email:'',phone:'',clinician:'Dr. Alkan Veysi Alkan'};
async function getSettings(owner:string){const r=await db().prepare('SELECT data FROM clinic_settings WHERE owner_id=?').bind(owner).first<{data:string}>();if(!r)return null;const settings=JSON.parse(r.data) as ClinicSettings;if(settings.name==='Auréa')settings.name=defaults.name;if(settings.clinician==='Dr. Deniz Aydın')settings.clinician=defaults.clinician;return settings;}
const str=z.string().trim().max(200);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s);
const contact=z.object({name:str.min(2),email:z.union([z.string().trim().email().max(200),z.literal('')]),phone:z.string().trim().max(40),dob:z.union([date,z.literal('')]),language:z.enum(locales),notes:z.string().max(4000).default('')});
const visitSchema=z.object({patientId:str.min(1),date,time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),duration:z.number().int().min(5).max(480),treatments:z.array(z.enum(treatmentIds as [typeof treatmentIds[number],...typeof treatmentIds[number][]])).min(1).max(5),clinician:str.min(1),followup:z.boolean().default(false),channel:z.enum(['email','sms','whatsapp','phone','']).default(''),reminder:z.boolean().default(false),notes:z.string().max(4000).default('')});
const answer=z.enum(['yes','no','unsure']);
const draftSchema=z.object({step:z.number().int().min(0).max(4),name:str,email:z.string().trim().max(200),phone:z.string().max(40),dob:z.union([date,z.literal('')]),locale:z.enum(locales),answers:z.record(answer),details:z.record(z.string().max(2000)),permissions:z.object({clinicalPhotos:answer.nullable(),educationPhotos:answer.nullable(),marketingPhotos:answer.nullable(),sharing:answer.nullable(),sharingNames:z.string().max(2000).optional(),channels:z.array(z.enum(['email','sms','whatsapp','phone'])).max(4),privacy:z.boolean()}),guardian:str,relationship:str,acknowledgment:z.boolean(),signature:z.object({mode:z.enum(['draw','type']),name:str,image:z.string().max(250000)}),decision:z.enum(['accept','discussion'])});
export function makeDraft(p:Patient):IntakeDraft{return{step:0,name:p.name,email:p.email,phone:p.phone,dob:p.dob,locale:p.language,answers:{},details:{},permissions:{...emptyPermissions,channels:[]},guardian:'',relationship:'',acknowledgment:false,signature:{mode:'draw',name:'',image:''},decision:'accept'};}
export function snapshot(p:Patient,v:Visit,d:IntakeDraft,clinic:ClinicSettings):ConsentSnapshot{
  return{version:'review-2026-10-v1',locale:d.locale,clinic:clinic.name,patient:{name:d.name,dob:d.dob,email:d.email,phone:d.phone},treatments:v.treatments.map(id=>({id,name:t(d.locale,id),information:t(d.locale,id==='botox'?'infoBotox':id==='lift'?'infoLift':'infoFiller')})),questions:questions.map(q=>({id:q.id,label:t(d.locale,q.key),answer:d.answers[q.id],answerLabel:t(d.locale,d.answers[q.id]),details:d.details[q.id]||''})),permissions:d.permissions,permissionLabels:Object.fromEntries(['clinicalPhotos','educationPhotos','marketingPhotos','sharing','privacyAck','contactChoices','yes','no','unsure'].map(k=>[k,t(d.locale,k)])),signature:d.signature,guardian:d.guardian,relationship:d.relationship,acknowledgment:t(d.locale,'acknowledgment'),sample:p.sample,draftOnly:true,date:now()};
}
function reminder(owner:string,v:Visit,zone:string){const start=wallTime(v.date,v.time,zone);const job={id:'reminder-'+v.id,patientId:v.patientId,visitId:v.id,dueAt:new Date(start.getTime()-86400000).toISOString(),channel:v.channel,status:v.status==='cancelled'||!v.reminder?'cancelled':'awaitingConnection'};return put(owner,'reminder',job);}
export function wallTime(date:string,time:string,zone:string){
  const base=new Date(date+'T'+time+':00Z');let result=base;
  for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(result);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));const wall=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);result=new Date(result.getTime()+base.getTime()-wall);}
  return result;
}
async function initialize(owner:string){
  if(await getSettings(owner))return;
  const suffix=(await hash(owner)).slice(0,10);const today=clinicToday();const statements:D1PreparedStatement[]=[];
  const examples=[['Elena Petrova','ru','1993-04-16'],['Sophia Williams','en','1991-08-22'],['Zeynep Kaya','tr','1995-02-11'],['Amira Hassan','ar','1988-11-03'],['Camille Martin','fr','1994-06-18'],['Isabella Rossi','it','1990-01-27']];
  statements.push(db().prepare('INSERT OR IGNORE INTO clinic_settings(owner_id,data,created_at) VALUES(?,?,?)').bind(owner,JSON.stringify(defaults),now()));
  for(let i=0;i<examples.length;i++){
    const [name,language,dob]=examples[i];const p:Patient={id:`sample-${suffix}-${i}`,name,language:language as Locale,dob,email:name.toLowerCase().replaceAll(' ','.')+'@example.com',phone:'',notes:'',sample:true,createdAt:now()};
    const v:Visit={id:`sample-visit-${suffix}-${i}`,patientId:p.id,date:today,time:['09:30','10:15','11:00','12:30','14:00','15:30'][i],duration:45,treatments:[(['lips','botox','jawline','lips','chin','botox'] as const)[i]],clinician:defaults.clinician,status:'planned',consentStatus:i===1||i===4?'signed':i===2?'reviewed':'needed',followup:i===4,channel:'email',reminder:i===4,notes:'',performed:[],sample:true};
    statements.push(put(owner,'patient',p,true),put(owner,'visit',v,true));
    if(['signed','reviewed'].includes(v.consentStatus)){
      const d=makeDraft(p);d.answers=Object.fromEntries(questions.map(q=>[q.id,'no']));d.permissions={clinicalPhotos:'no',educationPhotos:'no',marketingPhotos:'no',sharing:'no',channels:['email'],privacy:true};d.signature={mode:'type',name:'EXAMPLE — '+p.name,image:''};d.acknowledgment=true;
      const snap=snapshot(p,v,d,defaults);const c:Consent={id:`sample-consent-${suffix}-${i}`,patientId:p.id,visitId:v.id,createdAt:now(),snapshot:snap,digest:await hash(JSON.stringify(snap))};statements.push(put(owner,'consent',c,true));
      if(v.consentStatus==='reviewed'){v.review={name:defaults.clinician,witness:'',at:now(),userId:owner,consentId:c.id};statements.push(put(owner,'visit',v),put(owner,'review',{id:uid(),patientId:p.id,visitId:v.id,...v.review},true));}
    }
    statements.push(audit(owner,'visitAdded',p.id,v.id));
    if(v.reminder)statements.push(reminder(owner,v,defaults.timezone));
  }
  const next:Visit={id:`sample-visit-${suffix}-next`,patientId:`sample-${suffix}-0`,date:addDays(today,2),time:'11:30',duration:30,treatments:['lips'],clinician:defaults.clinician,status:'planned',consentStatus:'needed',followup:true,channel:'email',reminder:true,notes:'',performed:[],sample:true};
  statements.push(put(owner,'visit',next,true),reminder(owner,next,defaults.timezone));
  await db().batch(statements);
}
async function handleClinic(req:Request){
  const u=user(req);const path=new URL(req.url).pathname.replace(/^\/api\/clinic\/?/,'').split('/').filter(Boolean);
  const [section,id,action]=path;
  if(req.method==='GET'&&!section){
    const settings=await getSettings(u.id);const result=await db().prepare('SELECT * FROM clinic_records WHERE owner_id=? ORDER BY created_at DESC').bind(u.id).all<Row>();
    const by=(kind:string)=>result.results.filter(r=>r.kind===kind).map(r=>JSON.parse(r.data));
    return json({capabilities:{photos:!!env.BUCKET},authMode:env.CLINIC_AUTH_MODE||'sites',settings:settings||defaults,initialized:!!settings,patients:by('patient'),visits:by('visit'),consents:by('consent'),media:by('media').map(({key,...m}:Media)=>m),audit:by('audit').slice(0,60),user:{name:u.name,email:u.email}});
  }
  if(req.method==='POST'&&!section){const b=await body(req);if(b.action!=='initialize')fail('invalidRequest');await initialize(u.id);return json({ok:true});}
  if(section==='settings'&&req.method==='PATCH'){
    const s=z.object({name:str.min(1),city:str,timezone:str.refine(x=>{try{new Intl.DateTimeFormat('en',{timeZone:x});return true;}catch{return false;}}),email:z.union([z.string().email(),z.literal('')]),phone:str,clinician:str.min(1)}).parse(await body(req));
    await db().prepare('UPDATE clinic_settings SET data=? WHERE owner_id=?').bind(JSON.stringify(s),u.id).run();return json({ok:true});
  }
  if(section==='patients'){
    if(req.method==='POST'){const p:Patient={...contact.parse(await body(req)),id:uid(),sample:false,createdAt:now()};await db().batch([put(u.id,'patient',p,true),audit(u.id,'patientAdded',p.id)]);return json(p,201);}
    const p=await record<Patient>(u.id,id,'patient');
    if(action==='export'&&req.method==='GET'){const rows=await db().prepare('SELECT kind,data FROM clinic_records WHERE owner_id=? AND patient_id=?').bind(u.id,p.id).all<{kind:string;data:string}>();return new Response(JSON.stringify({patient:p,records:rows.results.map(r=>({kind:r.kind,...JSON.parse(r.data)}))},null,2),{headers:{...headers,'Content-Type':'application/json','Content-Disposition':`attachment; filename="patient-${p.id}.json"`}});}
    if(req.method==='PATCH'){const updated={...p,...contact.parse(await body(req))};await db().batch([put(u.id,'patient',updated),audit(u.id,'saved',p.id)]);return json(updated);}
  }
  if(section==='visits'){
    if(req.method==='POST'&&!id){const data=visitSchema.parse(await body(req));await record<Patient>(u.id,data.patientId,'patient');const v:Visit={...data,id:uid(),status:'planned',consentStatus:'needed',performed:[],sample:false};const s=await getSettings(u.id)||defaults;await db().batch([put(u.id,'visit',v,true),reminder(u.id,v,s.timezone),audit(u.id,'visitAdded',v.patientId,v.id)]);return json(v,201);}
    const v=await record<Visit>(u.id,id,'visit');
    if(action==='intake'&&req.method==='POST'){
      await body(req);if(v.status==='cancelled')fail('cancelled');
      const p=await record<Patient>(u.id,v.patientId,'patient');const token=uid().replaceAll('-','')+uid().replaceAll('-','');const tokenHash=await hash(token);const expires=new Date(Date.now()+7*86400000).toISOString();v.consentStatus='sent';delete v.review;
      await db().batch([db().prepare('UPDATE clinic_intakes SET revoked=1 WHERE owner_id=? AND visit_id=? AND submitted_at IS NULL').bind(u.id,v.id),db().prepare('INSERT INTO clinic_intakes(token_hash,owner_id,patient_id,visit_id,draft,expires_at,revoked) VALUES(?,?,?,?,?,?,0)').bind(tokenHash,u.id,p.id,v.id,JSON.stringify(makeDraft(p)),expires),put(u.id,'visit',v),audit(u.id,'intakeCreated',p.id,v.id)]);
      return json({token,expiresAt:expires});
    }
    if(action==='revoke'&&req.method==='POST'){await body(req);await db().prepare('UPDATE clinic_intakes SET revoked=1 WHERE owner_id=? AND visit_id=? AND submitted_at IS NULL').bind(u.id,v.id).run();v.consentStatus='needed';await db().batch([put(u.id,'visit',v),audit(u.id,'revoke',v.patientId,v.id)]);return json({ok:true});}
    if(action==='review'&&req.method==='POST'){
      const b=z.object({name:str.min(2),witness:str,confirmed:z.literal(true),consentId:str.min(1)}).parse(await body(req));if(!['signed','reviewed'].includes(v.consentStatus))fail('reviewRequired',409);const c=await db().prepare("SELECT id FROM clinic_records WHERE owner_id=? AND visit_id=? AND kind='consent' ORDER BY created_at DESC LIMIT 1").bind(u.id,v.id).first<{id:string}>();if(!c)fail('noSigned',409);if(c!.id!==b.consentId)fail('recordChanged',409);
      v.review={name:b.name,witness:b.witness,at:now(),userId:u.id,consentId:c!.id};v.consentStatus='reviewed';await db().batch([put(u.id,'visit',v),put(u.id,'review',{id:uid(),patientId:v.patientId,visitId:v.id,...v.review},true),audit(u.id,'consentReviewed',v.patientId,v.id)]);return json(v);
    }
    if(action==='treatment'&&req.method==='POST'){
      if(v.consentStatus!=='reviewed')fail('reviewRequired',409);
      const b=z.object({treatment:z.enum(treatmentIds as [typeof treatmentIds[number],...typeof treatmentIds[number][]]),area:str.min(1),product:str,quantity:str,unit:str,batch:str,expiry:z.union([date,z.literal('')]),notes:z.string().max(4000),clinician:str.min(1)}).parse(await body(req));
      if(!v.treatments.includes(b.treatment))fail('matchConsent',409);v.performed=[...v.performed,{...b,recordedAt:now()}];v.status='completed';await db().batch([put(u.id,'visit',v),audit(u.id,'treatmentAdded',v.patientId,v.id)]);return json(v);
    }
    if(req.method==='PATCH'){
      const b=z.object({date:date.optional(),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),status:z.enum(['planned','cancelled']).optional(),notes:z.string().max(4000).optional()}).parse(await body(req));Object.assign(v,b);
      const s=await getSettings(u.id)||defaults;const ops=[put(u.id,'visit',v),reminder(u.id,v,s.timezone),audit(u.id,'appointmentUpdated',v.patientId,v.id)];
      if(v.status==='cancelled')ops.push(db().prepare('UPDATE clinic_intakes SET revoked=1 WHERE owner_id=? AND visit_id=? AND submitted_at IS NULL').bind(u.id,v.id));
      await db().batch(ops);return json(v);
    }
    if(action==='calendar'&&req.method==='GET'){
      const s=await getSettings(u.id)||defaults;const start=wallTime(v.date,v.time,s.timezone);const format=(d:Date)=>d.toISOString().replaceAll('-','').replaceAll(':','').replace('.000','');const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,' ');
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Dr Alkan Aesthetic//Clinic//EN','BEGIN:VEVENT','UID:'+v.id+'@aurea','DTSTAMP:'+format(new Date()),'DTSTART:'+format(start),'DTEND:'+format(new Date(start.getTime()+v.duration*60000)),'SUMMARY:'+escape(s.name+' — '+(v.followup?'Follow-up':'Appointment')),'LOCATION:'+escape(s.city),'DESCRIPTION:Clinic local time '+v.time+' '+s.timezone,'STATUS:'+(v.status==='cancelled'?'CANCELLED':'CONFIRMED'),...(v.reminder&&v.status!=='cancelled'?['BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Clinic appointment tomorrow','END:VALARM']:[]),'END:VEVENT','END:VCALENDAR'];
      return new Response(lines.join('\r\n'),{headers:{...headers,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="appointment-${v.id}.ics"`}});
    }
  }
  if(section==='consents'&&action==='document'&&req.method==='GET'){
    const c=await record<Consent>(u.id,id,'consent');return consentDocument(u.id,c);
  }
  if(section==='media'&&req.method==='POST'){
    if(!env.BUCKET)fail('photosUnavailable',503);
    originGuard(req);const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||file.size>8*1024*1024||file.size<12)fail('invalidImage');if(form.get('permission')!=='true')fail('photoPermission');
    const upload=file as File;const v=await record<Visit>(u.id,String(form.get('visitId')),'visit');const stage=z.enum(['before','after']).parse(form.get('stage'));const angle=z.enum(['front','left','right']).parse(form.get('angle'));const buf=await upload.arrayBuffer();const a=new Uint8Array(buf);let mime='';if(a[0]===255&&a[1]===216)mime='image/jpeg';else if(a[0]===137&&a[1]===80&&a[2]===78&&a[3]===71)mime='image/png';else if(String.fromCharCode(...a.slice(0,4))==='RIFF'&&String.fromCharCode(...a.slice(8,12))==='WEBP')mime='image/webp';if(!mime)fail('invalidImage');
    if(!env.BUCKET)fail('storageUnavailable',503);const id=uid();const key=u.id+'/'+id;await env.BUCKET!.put(key,buf,{httpMetadata:{contentType:mime}});const m:Media={id,patientId:v.patientId,visitId:v.id,stage,angle,mime,size:upload.size,key,createdAt:now()};
    try{await db().batch([put(u.id,'media',m,true),audit(u.id,'photoAdded',v.patientId,v.id)]);}catch(e){await env.BUCKET!.delete(key);throw e;}const{key:_,...safe}=m;return json(safe,201);
  }
  if(section==='media'&&id&&req.method==='GET'){
    const m=await record<Media>(u.id,id,'media');if(!env.BUCKET)fail('storageUnavailable',503);const image=await env.BUCKET!.get(m.key);if(!image)fail('notFound',404);return new Response(image!.body,{headers:{...headers,'Content-Type':m.mime,'X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
  }
  return fail('notFound',404);
}
type IntakeRow={token_hash:string;owner_id:string;patient_id:string;visit_id:string;draft:string;expires_at:string;submitted_at:string|null;revoked:number};
async function handleIntake(req:Request,token:string){
  if(!/^[a-f0-9]{64}$/.test(token))fail('expired',410);const tokenHash=await hash(token);
  const row=await db().prepare('SELECT * FROM clinic_intakes WHERE token_hash=?').bind(tokenHash).first<IntakeRow>();
  if(!row||row.revoked||row.expires_at<now())fail('expired',410);
  const r=row!;const visit=await record<Visit>(r.owner_id,r.visit_id,'visit');if(visit.status==='cancelled')fail('expired',410);const clinic=await getSettings(r.owner_id)||defaults;
  if(req.method==='GET')return json({draft:JSON.parse(r.draft),visit:{date:visit.date,time:visit.time,treatments:visit.treatments},clinic:{name:clinic.name,city:clinic.city,timezone:clinic.timezone},submitted:!!r.submitted_at,decision:(JSON.parse(r.draft) as IntakeDraft).decision});
  if(r.submitted_at)return json({submitted:true,decision:(JSON.parse(r.draft) as IntakeDraft).decision});
  const draft=draftSchema.parse(await body(req));
  if(req.method==='PATCH'){await db().prepare('UPDATE clinic_intakes SET draft=? WHERE token_hash=? AND submitted_at IS NULL AND revoked=0').bind(JSON.stringify(draft),tokenHash).run();return json({ok:true});}
  if(req.method!=='POST')fail('invalidRequest');
  const pending=' EXISTS(SELECT 1 FROM clinic_intakes WHERE token_hash=? AND submitted_at IS NULL AND revoked=0)';const when=now();
  if(draft.decision==='discussion'){
    visit.consentStatus='discussion';const event={id:uid(),patientId:r.patient_id,visitId:r.visit_id,action:'discussionRequested',at:when};
    await db().batch([db().prepare('UPDATE clinic_records SET data=?,updated_at=? WHERE id=? AND owner_id=? AND'+pending).bind(JSON.stringify(visit),when,visit.id,r.owner_id,tokenHash),db().prepare('INSERT INTO clinic_records(id,owner_id,kind,patient_id,visit_id,data,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE'+pending).bind(event.id,r.owner_id,'audit',r.patient_id,r.visit_id,JSON.stringify(event),when,when,tokenHash),db().prepare('UPDATE clinic_intakes SET draft=?,submitted_at=? WHERE token_hash=? AND submitted_at IS NULL AND revoked=0').bind(JSON.stringify(draft),when,tokenHash)]);
    return json({submitted:true,decision:'discussion'});
  }
  if(!draft.name||!draft.dob||draft.dob>clinicToday()||!draft.phone||!draft.acknowledgment||!draft.permissions.privacy)fail('checkRequired');
  if(draft.email&&!z.string().email().safeParse(draft.email).success)fail('invalidEmail');
  if(draft.permissions.sharing==='yes'&&!draft.permissions.sharingNames?.trim())fail('checkRequired');
  for(const q of questions){if(!draft.answers[q.id])fail('checkRequired');if(q.detail&&draft.answers[q.id]==='yes'&&!draft.details[q.id]?.trim())fail('checkRequired');}
  if(['clinicalPhotos','educationPhotos','marketingPhotos','sharing'].some(k=>!draft.permissions[k as keyof typeof draft.permissions]))fail('checkRequired');
  if(!draft.signature.name||draft.signature.mode==='draw'&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(draft.signature.image))fail('signature');
  if(isMinor(draft.dob)&&(!draft.guardian||!draft.relationship))fail('guardian');
  const patient=await record<Patient>(r.owner_id,r.patient_id,'patient');const snap=snapshot(patient,visit,draft,clinic);const consent:Consent={id:'consent-'+tokenHash.slice(0,32),patientId:patient.id,visitId:visit.id,createdAt:when,snapshot:snap,digest:await hash(JSON.stringify(snap))};
  Object.assign(patient,{name:draft.name,email:draft.email,phone:draft.phone,dob:draft.dob,language:draft.locale});visit.consentStatus='signed';delete visit.review;const event={id:uid(),action:'consentSigned',patientId:patient.id,visitId:visit.id,at:when};
  await db().batch([
    db().prepare('INSERT OR IGNORE INTO clinic_records(id,owner_id,kind,patient_id,visit_id,data,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE'+pending).bind(consent.id,r.owner_id,'consent',patient.id,visit.id,JSON.stringify(consent),when,when,tokenHash),
    db().prepare('UPDATE clinic_records SET data=?,updated_at=? WHERE id=? AND owner_id=? AND'+pending).bind(JSON.stringify(patient),when,patient.id,r.owner_id,tokenHash),
    db().prepare('UPDATE clinic_records SET data=?,updated_at=? WHERE id=? AND owner_id=? AND'+pending).bind(JSON.stringify(visit),when,visit.id,r.owner_id,tokenHash),
    db().prepare('INSERT INTO clinic_records(id,owner_id,kind,patient_id,visit_id,data,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE'+pending).bind(event.id,r.owner_id,'audit',patient.id,visit.id,JSON.stringify(event),when,when,tokenHash),
    db().prepare('UPDATE clinic_intakes SET draft=?,submitted_at=? WHERE token_hash=? AND submitted_at IS NULL AND revoked=0').bind(JSON.stringify(draft),when,tokenHash)
  ]);
  return json({submitted:true,decision:'accept'});
}
function esc(x:unknown){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
async function consentDocument(owner:string,c:Consent){const v=await record<Visit>(owner,c.visitId,'visit');const r=await db().prepare("SELECT * FROM clinic_records WHERE owner_id=? AND kind='review' AND json_extract(data,'$.consentId')=? ORDER BY created_at DESC LIMIT 1").bind(owner,c.id).first<Row>();v.review=r?parse<NonNullable<Visit['review']>>(r):v.review?.consentId===c.id||c.snapshot.sample?v.review:undefined;return documentResponse(c,v);}
function documentResponse(c:Consent,v:Visit){const s=c.snapshot;const l=s.locale;const rows=s.questions.map(q=>`<tr><td>${esc(q.label)}</td><td>${esc(q.answerLabel)}</td><td>${esc(q.details)}</td></tr>`).join('');const permissions=['clinicalPhotos','educationPhotos','marketingPhotos','sharing'].map(k=>`<p><strong>${esc(s.permissionLabels[k])}:</strong> ${esc(s.permissionLabels[s.permissions[k as 'clinicalPhotos']||'no'])}</p>`).join('');
  const html=`<!doctype html><html lang="${l}" dir="${l==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(s.clinic)} — ${esc(t(l,'reviewSign'))}</title><style>body{font-family:Arial,sans-serif;color:#302b2d;max-width:850px;margin:36px auto;padding:0 24px;line-height:1.65}h1,h2{font-family:Georgia,serif}h1{font-size:34px}h2{font-size:22px;margin-top:30px}.notice{padding:16px;background:#f4e9df;border-radius:10px}table{border-collapse:collapse;width:100%;font-size:13px}td{padding:10px;border-bottom:1px solid #ddd;vertical-align:top}img{max-height:120px;max-width:300px}.typed{font-family:cursive;font-size:32px}.muted{color:#766b71;font-size:12px;overflow-wrap:anywhere}button{border:0;border-radius:8px;padding:12px 18px;background:#47313f;color:white;cursor:pointer}section{break-inside:avoid}@media print{button{display:none}body{margin:0;max-width:none}.notice{border:1px solid #bbb;background:none}tr{break-inside:avoid}h2{break-after:avoid}}</style></head><body><button onclick="window.print()">${esc(t(l,'print'))}</button><h1>${esc(s.clinic)}</h1><p class="notice">${esc(t(l,'draftNotice'))}${s.sample?' · '+esc(t(l,'sample')):''}</p><h2>${esc(t(l,'reviewSign'))}</h2><p>${esc(s.patient.name)} · ${esc(s.patient.dob)}<br>${esc(s.patient.email)} · ${esc(s.patient.phone)}<br>${esc(s.date)}</p>${s.treatments.map(x=>`<section><h2>${esc(x.name)}</h2><p>${esc(x.information)}</p></section>`).join('')}<h2>${esc(t(l,'health'))}</h2><table>${rows}</table><h2>${esc(t(l,'permissions'))}</h2>${permissions}${s.permissions.sharing==='yes'?'<p>'+esc(s.permissions.sharingNames)+'</p>':''}<p>${esc(s.permissionLabels.contactChoices)}: ${esc(s.permissions.channels.join(', '))}</p><p>${esc(s.permissionLabels.privacyAck)}</p><section><h2>${esc(t(l,'signature'))}</h2><p>${esc(s.acknowledgment)}</p>${s.signature.mode==='draw'?`<img src="${esc(s.signature.image)}" alt="${esc(t(l,'signature'))}">`:`<div class="typed">${esc(s.signature.name)}</div>`}<p>${esc(s.signature.name)} · ${esc(s.signature.mode)}</p>${s.guardian?`<p>${esc(t(l,'guardian'))}: ${esc(s.guardian)} (${esc(s.relationship)})</p>`:''}</section>${v.review?`<section><h2>${esc(t(l,'reviewed'))}</h2><p>${esc(v.review.name)} · ${esc(v.review.at)}</p>${v.review.witness?`<p>${esc(t(l,'witness'))}: ${esc(v.review.witness)}</p>`:''}</section>`:''}<p class="muted">${esc(s.version)} · ${esc(c.id)}<br>SHA-256: ${esc(c.digest)}</p></body></html>`;
  return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'unsafe-inline'; frame-ancestors 'self'"}});
}
async function safe(fn:()=>Promise<Response>){try{return await fn();}catch(e){if(e instanceof ApiError)return json({error:e.code},e.status);if(e instanceof z.ZodError)return json({error:'required'},400);console.error('Clinic request failed',e instanceof Error?e.name:'UnknownError');return json({error:'failed'},500);}}
export function clinicHandler(req:Request){return safe(()=>handleClinic(req));}
export function intakeHandler(req:Request,token:string){return safe(()=>handleIntake(req,token));}
export function intakeDocument(req:Request,token:string){return safe(async()=>{if(!/^[a-f0-9]{64}$/.test(token))fail('expired',410);const tokenHash=await hash(token);const row=await db().prepare('SELECT * FROM clinic_intakes WHERE token_hash=?').bind(tokenHash).first<IntakeRow>();if(!row||row.revoked||row.expires_at<now()||!row.submitted_at)fail('expired',410);const r=row!;const c=await record<Consent>(r.owner_id,'consent-'+tokenHash.slice(0,32),'consent');return consentDocument(r.owner_id,c);});}
