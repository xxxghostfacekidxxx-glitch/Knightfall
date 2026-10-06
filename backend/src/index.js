const json = (data, status = 200, origin = "*") =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
    },
  });

function corsOrigin(request) {
  const origin = request.headers.get("Origin");
  return origin === "https://ash-fall.com" || origin === "https://www.ash-fall.com"
    ? origin
    : "https://ash-fall.com";
}

export default {
  async fetch(request) {
    const origin = corsOrigin(request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type, authorization",
          "access-control-max-age": "86400",
        },
      });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, service: "knightfall-api", timestamp: new Date().toISOString() }, 200, origin);
    }

    if (url.pathname === "/api/threads" && request.method === "GET") {
      return json({ threads: [] }, 200, origin);
    }

    return json({ error: "Not found" }, 404, origin);
  },
};
