import type { Config } from "https://edge.netlify.com";
import { get, put } from "./modules/firebase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

const firestoreStatus = {
  "not-found": 404,
  "permission-denied": 403,
};

// deno-lint-ignore no-explicit-any
function errorResponse(err: any) {
  return new Response(err?.code || err?.message || "" + err, {
    headers: corsHeaders,
    status: firestoreStatus[err?.code as keyof typeof firestoreStatus] || 500,
  });
}

export default async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") || "";
    try {
      const text = await get(id);
      return new Response(text, { headers: corsHeaders });
    } catch (err) {
      return errorResponse(err);
    }
  }

  if (req.method === "POST") {
    const id = new URL(req.url).searchParams.get("id") || "";
    const text = await req.text();
    try {
      await put(id, text);
      return new Response("ok", { headers: corsHeaders });
    } catch (err) {
      return errorResponse(err);
    }
  }

  return errorResponse("invalid method");
};

export const config: Config = { path: "/" };
