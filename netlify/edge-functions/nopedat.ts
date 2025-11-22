import type { Config } from "https://edge.netlify.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization",
};

function firestoreApiUrl(id: string) {
  return new URL(
    "https://firestore.googleapis.com/v1/" +
      "projects/lamart-notepad/databases/(default)/documents/docs/" +
      id
  );
}

function errorResponse(err: { code?: number; message?: string }) {
  return new Response(err?.message || "Internal Error", {
    headers: corsHeaders,
    status: err?.code || 500,
  });
}

function authHeader(req: Request) {
  const headers: { Authorization?: string } = {};
  if (req.headers.has("Authorization"))
    headers["Authorization"] = req.headers.get("Authorization") as string;
  return headers;
}

export default async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");
    const subtype = searchParams.get("subtype") || "plain";
    if (!id) return errorResponse({ message: "Bad Request", code: 400 });

    try {
      const text = await fetch(firestoreApiUrl(id), {
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
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  if (req.method === "POST") {
    const id = new URL(req.url).searchParams.get("id") || "";
    const field = new URL(req.url).searchParams.get("field") || "text";
    const text = await req.text();
    try {
      const fetchUrl = firestoreApiUrl(id);
      const fetchBody: {
        fields: {
          text?: { stringValue: string };
          protected?: { stringValue: string };
          public?: { booleanValue: boolean };
        };
      } = { fields: {} };

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
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  return errorResponse({ message: "invalid method", code: 403 });
};

export const config: Config = { path: "/api" };
