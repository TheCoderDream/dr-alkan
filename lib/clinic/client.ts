export async function api(path:string,data?:unknown,method?:string){
  const response=await fetch('/api/'+path,{method:method||(data?'POST':'GET'),headers:data instanceof FormData?undefined:data?{'Content-Type':'application/json'}:undefined,body:data instanceof FormData?data:data?JSON.stringify(data):undefined,cache:'no-store'});
  let result:any;try{result=await response.json();}catch{throw new Error('failed');}
  if(!response.ok)throw new Error(result.error||'failed');return result;
}
