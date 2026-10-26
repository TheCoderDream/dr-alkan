import {createRemoteJWKSet,jwtVerify} from 'jose';

const keySets=new Map<string,ReturnType<typeof createRemoteJWKSet>>();
export async function accessIdentity(request:Request,issuer:string|undefined,audience:string|undefined){
  if(!issuer||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!audience)throw new Error('Access configuration missing');
  const token=request.headers.get('cf-access-jwt-assertion');
  if(!token)throw new Error('Access sign-in required');
  let keys=keySets.get(issuer);
  if(!keys){keys=createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs'));keySets.set(issuer,keys);}
  const {payload}=await jwtVerify(token,keys,{issuer,audience,algorithms:['RS256'],requiredClaims:['sub','email','exp','iat']});
  if(typeof payload.sub!=='string'||!payload.sub||typeof payload.email!=='string'||!payload.email)throw new Error('Staff identity missing');
  return{id:'access:'+payload.sub,email:payload.email,name:typeof payload.name==='string'?payload.name:payload.email.split('@')[0]};
}
