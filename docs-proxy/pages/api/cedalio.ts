import { NextApiRequest, NextApiResponse } from "next";

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
  response.status(resp.status).send(await resp.text());
  return;
}

export default handler;
