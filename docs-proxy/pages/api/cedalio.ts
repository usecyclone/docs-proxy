import { NextApiRequest, NextApiResponse } from "next";
import { JSDOM } from "jsdom";

function addCycloneScripts(respText: string): string {
  const doc = new JSDOM(respText);

  const head = doc.window.document.head;

  // scrollScript
  const scrollScript = doc.window.document.createElement("script");
  scrollScript.type = "text/javascript";
  scrollScript.src = "https://convex.usecyclone.dev/cyclone.js";
  head.appendChild(scrollScript);

  // call cyclone_load_ide
  const ideScript = doc.window.document.createElement("script");
  const ideScriptText = doc.window.document.createTextNode(
    "window.onload=function(){window.cyclone_load_ide()};"
  );
  ideScript.appendChild(ideScriptText);
  head.appendChild(ideScript);

  // add posthog snippet
  const posthogScript = doc.window.document.createElement("script");
  const posthogScriptText = doc.window.document
    .createTextNode(`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init("phc_fV15A0YJ30ayiUaZZolVIt203gPpsdl2AzU7npwCHTt",{session_recording:{recordCrossOriginIframes:true},api_host:"https://d1qzqtzwsjrts5.cloudfront.net"});`);
  posthogScript.appendChild(posthogScriptText);
  head.appendChild(posthogScript);

  return doc.window.document.documentElement.outerHTML;
}

async function handler(request: NextApiRequest, response: NextApiResponse) {
  const headers: any = {};

  let key = undefined;

  for (const val of request.rawHeaders) {
    if (key === undefined) {
      key = val;
    } else {
      headers[key] = val;
      key = undefined;
    }
  }
  delete headers["content-length"];

  headers.host = "docs.cedalio.com";

  console.log(`${request.method} request`);

  const resp = await fetch("https://docs.cedalio.com" + request.url, {
    method: request.method,
    headers: headers,
  });

  if (resp.status === 200) {
    response.status(resp.status).send(addCycloneScripts(await resp.text()));
  } else {
    response.status(resp.status).send(await resp.text());
  }

  return;
}

export default handler;
