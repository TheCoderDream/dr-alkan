// Single-workspace password protection for an HTTPS-only initial deployment.
export async function passwordIdentity(request:Request,username:string|undefined,password:string|undefined,email:string|undefined){
  if(!username||!password||password.length<24||!email)throw new Error('Staff password configuration missing');
  const header=request.headers.get('authorization')||'';
  if(header.length>512||!header.startsWith('Basic '))throw new Error('Staff sign-in required');
  let supplied='';try{supplied=atob(header.slice(6));}catch{throw new Error('Invalid credentials');}
  const encode=new TextEncoder();
  const actual=new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(supplied)));
  const expected=new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(username+':'+password)));
  let difference=0;for(let i=0;i<expected.length;i++)difference|=actual[i]^expected[i];
  if(difference)throw new Error('Invalid credentials');
  return{id:'clinic:dr-alkan',email,name:'Dr. Alkan'};
}
