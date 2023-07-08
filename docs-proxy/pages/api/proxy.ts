import { NextApiRequest, NextApiResponse } from "next";

import StreamPromises from "stream/promises";
import axios from "axios";

import proxyHosts from "../../lib/proxyConfig";
import { addCycloneScripts } from "../../lib/addScript";

import { get } from "@vercel/edge-config";

const defaultProxyHost = "https://docs.convex.dev";

async function streamToString(stream: any) {
  // lets have a ReadableStream as a stream variable
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}

async function handler(request: NextApiRequest, response: NextApiResponse) {
  let edgeProxySettings = proxyHosts;

  try {
    edgeProxySettings = (await get("production")) || proxyHosts;
  } catch (err) {
    console.log(err);
  }

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

  let proxyDestUrl: string = defaultProxyHost;
  const originalHost = headers.host as string | undefined;
  if (originalHost && edgeProxySettings[originalHost]) {
    proxyDestUrl = edgeProxySettings[originalHost];
  }

  headers.host = new URL(proxyDestUrl).host;

  const resp = await axios
    .request({
      url: proxyDestUrl + request.url,
      method: request.method,
      responseType: "stream",
      headers: headers,
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

  if (
    resp.status === 200 &&
    (resp.headers["content-type"] as string | null)?.includes("text/html")
  ) {
    // response.send will set the content-length header
    // that conflicts with the transfer-encoding one
    response.removeHeader("transfer-encoding");
    response.send(addCycloneScripts(await streamToString(resp.data)));
  } else {
    await StreamPromises.pipeline(resp.data, response).catch((err) => {
      console.log(err);
      throw err;
    });
  }

  return;
}

export default handler;
