import {passwordIdentity} from '../lib/clinic/password';
import {accessIdentity} from '../lib/clinic/access';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    if(env.CLINIC_AUTH_MODE==='cloudflare-access'||env.CLINIC_AUTH_MODE==='password'){
      const url=new URL(request.url);
      if(url.protocol!=='https:'){url.protocol='https:';return Response.redirect(url.toString(),308);}
      const headers=new Headers(request.headers);
      // Standalone hosting must never trust identity headers supplied by callers.
      for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-'))headers.delete(key);
      if(url.pathname==='/'||url.pathname==='/api/clinic'||url.pathname.startsWith('/api/clinic/')){
        try{
          const identity=env.CLINIC_AUTH_MODE==='password'
            ?await passwordIdentity(request,env.STAFF_USERNAME,env.STAFF_PASSWORD,env.STAFF_EMAIL)
            :await accessIdentity(request,env.ACCESS_TEAM_DOMAIN,env.ACCESS_AUD);
          headers.set('oai-authenticated-user-id',identity.id);
          headers.set('oai-authenticated-user-email',identity.email);
          headers.set('oai-authenticated-user-full-name',encodeURIComponent(identity.name));
          headers.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');
        }catch{return Response.json({error:'signIn'},{status:401,headers:{'Cache-Control':'no-store',...(env.CLINIC_AUTH_MODE==='password'?{'WWW-Authenticate':'Basic realm="Dr. Alkan Clinic", charset="UTF-8"'}:{})}});}
      }
      if(url.pathname==='/signin-with-chatgpt')return Response.redirect(url.origin+'/',302);
      if(url.pathname==='/signout-with-chatgpt')return env.CLINIC_AUTH_MODE==='password'?new Response('Close the private browser window to end this password session.',{headers:{'Cache-Control':'no-store'}}):Response.redirect(url.origin+'/cdn-cgi/access/logout',302);
      request=new Request(request,{headers});
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
