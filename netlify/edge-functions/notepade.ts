import type { Config } from "https://edge.netlify.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

function errorResponse(err: any) {
  return new Response(err?.message || String(err), {
    headers: corsHeaders,
    status: err.code || 500,
  });
}

function authHeader(req: Request) {
  const headers: any = {};
  if (req.headers.has("Authorization"))
    headers["Authorization"] = req.headers.get("Authorization");
  return headers;
}

export default async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    console.log(req);
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");
    const subtype = searchParams.get("subtype") || "plain";
    if (!id) return errorResponse({ message: "Bad Request", code: 400 });

    try {
      const baseUrl = `https://firestore.googleapis.com/v1/projects/lamart-notepad/databases/(default)/documents/docs/`;

      const text = await fetch(baseUrl + id, {
        method: "GET",
        headers: authHeader(req),
      })
        .then((a) => a.json())
        .then((a) => {
          if (a.error) throw a.error;
          return a.fields.text.stringValue;
        });

      return new Response(text, {
        headers: {
          ...corsHeaders,
          "Content-Type": `text/${subtype}; charset=utf-8`,
        },
      });
    } catch (err) {
      return errorResponse(err);
    }
  }

  if (req.method === "POST") {
    const id = new URL(req.url).searchParams.get("id") || "";
    const field = new URL(req.url).searchParams.get("field") || "text";
    const text = await req.text();
    try {
      const fetchUrl = new URL(
        `https://firestore.googleapis.com/v1/projects/lamart-notepad/databases/(default)/documents/docs/${id}`
      );
      const fetchBody = {
        fields: {} as any,
      };

      fetchUrl.searchParams.set("updateMask.fieldPaths", field);
      if (field === "text") fetchBody.fields.text = { stringValue: text };
      if (field === "protected")
        if (text) fetchBody.fields.protected = { stringValue: text };
      if (field === "public")
        if (text) fetchBody.fields.public = { booleanValue: !!text };

      await fetch(fetchUrl, {
        method: "PATCH",
        headers: authHeader(req),
        body: JSON.stringify(fetchBody),
      })
        .then((a) => a.json())
        .then((a) => {
          if (a.error) throw a.error;
        });

      return new Response("ok", { headers: corsHeaders });
    } catch (err) {
      return errorResponse(err);
    }
  }

  return errorResponse("invalid method");
};

export const config: Config = { path: "/" };
