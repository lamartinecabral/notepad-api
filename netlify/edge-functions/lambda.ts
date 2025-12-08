import type { Config } from "https://edge.netlify.com";

const defaultHeaders = {
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
    headers: defaultHeaders,
    status: err?.code || 500,
  });
}

function authHeader(req: Request) {
  const headers: { Authorization?: string } = {};
  if (req.headers.has("Authorization"))
    headers["Authorization"] = req.headers.get("Authorization") as string;
  return headers;
}

const _eval = (code: string) => eval(code);

export default async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: defaultHeaders });
  }

  if (req.method === "GET" || req.method === "POST") {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");
    if (!id) return errorResponse({ message: "Bad Request", code: 400 });

    try {
      const code = await fetch(firestoreApiUrl(id), {
        method: "GET",
        headers: authHeader(req),
      })
        .then((a) => a.json())
        .then((a) => {
          if (a.error) throw a.error;
          return String(a.fields.text.stringValue);
        });

      const lambda = _eval(code);
      let result;
      if (typeof lambda === "function") {
        result = await lambda(req);
      } else {
        result = lambda;
      }

      if (result instanceof Response) {
        for (const [header, value] of Object.entries(defaultHeaders))
          result.headers.append(header, value);
        return result;
      } else {
        return new Response(String(result), { headers: defaultHeaders });
      }
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  return errorResponse({ message: "invalid method", code: 403 });
};

export const config: Config = { path: "/lambda" };
