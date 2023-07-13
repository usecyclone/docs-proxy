import type { VercelRequest, VercelResponse } from "@vercel/node";

import StreamPromises from "stream/promises";
import axios from "axios";

import proxyHosts from "../lib/proxyConfig";
import { addCycloneScripts } from "../lib/addScript";

import { get } from "@vercel/edge-config";

const defaultProxyHost = "https://docs.convex.dev";

async function streamToString(stream: any) {
  // lets have a ReadableStream as a stream variable
  const chunks = [];

  for await (const chunk of stream) {
    // @ts-ignore
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}

async function handler(request: VercelRequest, response: VercelResponse) {
  let edgeProxySettings = proxyHosts;

  try {
    edgeProxySettings = (await get("production")) || proxyHosts;
  } catch (err) {
    console.log(err);
  }

  const headers: any = {};

  let key: string | undefined = undefined;

  console.log(request.url);

  for (const val of request.rawHeaders) {
    if (key === undefined) {
      key = val;
    } else {
      headers[key] = val;
      key = undefined;
    }
  }
  delete headers["content-length"];

  let proxyDestUrl: string = defaultProxyHost;
  let unknownHost = false; // host not found in vercel config
  const originalHost = headers.host as string | undefined;
  if (originalHost && edgeProxySettings[originalHost]) {
    proxyDestUrl = edgeProxySettings[originalHost];
  } else {
    unknownHost = true;
  }

  headers.host = new URL(proxyDestUrl).host;

  const reqUrl = new URL(proxyDestUrl + request.url);
  reqUrl.searchParams.delete("slug");

  const resp = await axios
    .request({
      url: reqUrl.toString(),
      method: request.method,
      responseType: "stream",
      headers: headers,
      maxRedirects: 0,
    })
    .catch((err) => {
      return err.response;
    });

  response.status(resp.status);
  for (const headerName in resp.headers) {
    if (
      resp.headers.hasOwnProperty(headerName) &&
      headerName.toLowerCase() !== "content-length" &&
      // remove the CSP policy headers. Example platforms: gitbook
      headerName.toLowerCase() !== "content-security-policy"
    ) {
      const headerValue = resp.headers[headerName];
      response.setHeader(headerName, headerValue);
    }
  }

  if (unknownHost) {
    response.setHeader("cyclone-unknown-host", "true");
  }

  console.log(resp.status, reqUrl.toString());

  if (
    resp.status === 200 &&
    (resp.headers["content-type"] as string | null)?.includes("text/html")
  ) {
    // response.send will set the content-length header
    // that conflicts with the transfer-encoding one
    response.removeHeader("transfer-encoding");
    response.send(
      await addCycloneScripts(await streamToString(resp.data), originalHost)
    );
  } else if (resp.status > 300 && resp.status < 400) {
    // consider rewrite redirect header
    const redirectLocation = resp.headers["location"];
    if (redirectLocation && originalHost) {
      try {
        // throw error if not a valid url, e.g. relative path
        const redirectUrl = new URL(redirectLocation);

        if (redirectUrl.host === new URL(proxyDestUrl).host) {
          // rewrite to the original host
          redirectUrl.host = originalHost;
          if (originalHost.includes("localhost")) {
            redirectUrl.protocol = "http";
          }
          response.setHeader("location", redirectUrl.toString());
        }
      } catch (err) {
        console.log("Not rewriting redirect location", err);
      }
      await StreamPromises.pipeline(resp.data, response).catch((err) => {
        console.log(err);
        throw err;
      });
    }
  } else {
    await StreamPromises.pipeline(resp.data, response).catch((err) => {
      console.log(err);
      throw err;
    });
  }

  return;
}

export default handler;
