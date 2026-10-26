import {intakeHandler} from '@/lib/clinic/server';
async function handle(req:Request,{params}:{params:Promise<{token:string}>}){const {token}=await params;return intakeHandler(req,token);}
export const GET=handle;export const PATCH=handle;export const POST=handle;
