import { JSDOM } from "jsdom";
import { get } from "@vercel/edge-config";

export async function addCycloneScripts(
  respText: string,
  originalHost: string | undefined
): Promise<string> {
  let edgeIframeStringMap: { [host: string]: string } = {};
  let edgeProjectMap: { [host: string]: string } = {};
  try {
    edgeIframeStringMap = (await get("iframeUrlFormatString")) || {};
    edgeProjectMap = (await get("project")) || {};
  } catch (err) {
    console.log(err);
  }

  const project: string =
    originalHost === undefined
      ? "cedalio"
      : edgeProjectMap[originalHost] || "cedalio";
  const iframeUrl: string | undefined =
    originalHost === undefined ? undefined : edgeIframeStringMap[originalHost];

  console.log(originalHost, project, iframeUrl);

  const doc = new JSDOM(respText);

  const head = doc.window.document.head;

  // scrollScript
  const scrollScript = doc.window.document.createElement("script");
  scrollScript.type = "text/javascript";
  scrollScript.src = "https://embed.static.usecyclone.dev/cyclone.js";
  head.appendChild(scrollScript);

  // call cyclone_load_ide
  const ideScript = doc.window.document.createElement("script");
  const ideScriptText =
    iframeUrl === undefined
      ? doc.window.document.createTextNode(
          `window.onload=function(){window.cyclone_load_ide("${project}")};`
        )
      : doc.window.document.createTextNode(
          `window.onload=function(){window.cyclone_load_ide("${project}", "${iframeUrl}")};`
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

  // allow CSS to be edited by cyclone scripts
  const cssLinks = doc.window.document.querySelectorAll("link[rel=stylesheet]");
  for (let i = 0; i < cssLinks.length; i++) {
    const cssLink = cssLinks[i] as HTMLLinkElement;

    if (cssLink.crossOrigin?.length == 0) {
      cssLink.crossOrigin = "anonymous";
    }
  }

  // attempt to put the top level children of body in a div
  const body = doc.window.document.body;
  const topLevelDomString = body.innerHTML;
  const topLevelDom = doc.window.document.createElement("div");
  topLevelDom.id = "cyclone-ide-wrapped";
  topLevelDom.innerHTML = topLevelDomString;
  body.innerHTML = topLevelDom.outerHTML;

  return doc.window.document.documentElement.outerHTML;
}

export default addCycloneScripts;
