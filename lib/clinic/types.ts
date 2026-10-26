export const locales = ['en','tr','ar','ru','de','fr','es','it','pt-BR','zh-Hans'] as const;
export type Locale = typeof locales[number];
export type Treatment = 'lips'|'botox'|'jawline'|'chin'|'lift';
export type Answer = 'yes'|'no'|'unsure';
export type View = 'overview'|'patients'|'appointments'|'consents'|'photos'|'settings';
export type Patient = {id:string;name:string;email:string;phone:string;dob:string;language:Locale;notes:string;sample:boolean;createdAt:string};
export type Procedure = {treatment:Treatment;area:string;product:string;quantity:string;unit:string;batch:string;expiry:string;notes:string;clinician:string;recordedAt:string};
export type Visit = {id:string;patientId:string;date:string;time:string;duration:number;treatments:Treatment[];clinician:string;status:'planned'|'completed'|'cancelled';consentStatus:'needed'|'sent'|'signed'|'reviewed'|'discussion';followup:boolean;channel:string;reminder:boolean;notes:string;performed:Procedure[];sample:boolean;review?:{name:string;witness:string;at:string;userId:string;consentId?:string}};
export type ClinicSettings = {name:string;city:string;timezone:string;email:string;phone:string;clinician:string};
export type Permissions = {clinicalPhotos:Answer|null;educationPhotos:Answer|null;marketingPhotos:Answer|null;sharing:Answer|null;sharingNames?:string;channels:string[];privacy:boolean};
export type IntakeDraft = {step:number;name:string;email:string;phone:string;dob:string;locale:Locale;answers:Record<string,Answer>;details:Record<string,string>;permissions:Permissions;guardian:string;relationship:string;acknowledgment:boolean;signature:{mode:'draw'|'type';name:string;image:string};decision:'accept'|'discussion'};
export type ConsentSnapshot = {version:string;locale:Locale;clinic:string;patient:{name:string;dob:string;email:string;phone:string};treatments:{id:Treatment;name:string;information:string}[];questions:{id:string;label:string;answer:Answer;answerLabel:string;details:string}[];permissions:Permissions;permissionLabels:Record<string,string>;signature:IntakeDraft['signature'];guardian:string;relationship:string;acknowledgment:string;sample:boolean;draftOnly:boolean;date:string};
export type Consent = {id:string;patientId:string;visitId:string;createdAt:string;snapshot:ConsentSnapshot;digest:string};
export type Media = {id:string;patientId:string;visitId:string;stage:'before'|'after';angle:string;mime:string;size:number;createdAt:string;key:string};
export type Audit = {id:string;patientId?:string;visitId?:string;action:string;at:string};
export type Workspace = {authMode:'sites'|'cloudflare-access'|'password';capabilities:{photos:boolean};settings:ClinicSettings;patients:Patient[];visits:Visit[];consents:Consent[];media:Media[];audit:Audit[];initialized:boolean;user:{name:string;email:string}};
export const emptyPermissions:Permissions = {clinicalPhotos:null,educationPhotos:null,marketingPhotos:null,sharing:null,channels:[],privacy:false};
export const languageNames:Record<Locale,string> = {en:'English',tr:'Türkçe',ar:'العربية',ru:'Русский',de:'Deutsch',fr:'Français',es:'Español',it:'Italiano','pt-BR':'Português','zh-Hans':'简体中文'};
export const treatmentIds:Treatment[] = ['lips','botox','jawline','chin','lift'];
export const questions = [
  {id:'pregnancy',key:'qPregnancy',detail:false}, {id:'breastfeeding',key:'qBreastfeeding',detail:false},
  {id:'diabetes',key:'qDiabetes',detail:true}, {id:'bleeding',key:'qBleeding',detail:true},
  {id:'allergy',key:'qAllergy',detail:true}, {id:'medication',key:'qMedication',detail:true},
  {id:'antibiotics',key:'qAntibiotics',detail:true}, {id:'bloodThinners',key:'qBloodThinners',detail:true},
  {id:'siteInfection',key:'qSiteInfection',detail:true}, {id:'systemicInfection',key:'qSystemicInfection',detail:true},
  {id:'skin',key:'qSkin',detail:true}, {id:'bloodborne',key:'qBloodborne',detail:true},
  {id:'previousFiller',key:'qPreviousFiller',detail:true}, {id:'migraine',key:'qMigraine',detail:false},
  {id:'surgery',key:'qSurgery',detail:true}, {id:'cosmetics',key:'qCosmetics',detail:false},
];
export function clinicToday(timezone='Europe/Istanbul'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function addDays(date:string,n:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function initials(name:string){return name.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toLocaleUpperCase();}
export function isMinor(dob:string){if(!dob)return false;const now=new Date();const cutoff=new Date(now.getFullYear()-18,now.getMonth(),now.getDate());return new Date(dob+'T12:00:00')>cutoff;}
