import {intakeDocument} from '@/lib/clinic/server';
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){const {token}=await params;return intakeDocument(req,token);}
