import IntakeApp from '@/app/components/intake-app';
export default async function IntakePage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <IntakeApp token={token}/>;}
