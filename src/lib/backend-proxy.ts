import { NextRequest, NextResponse } from "next/server";

/**
 * Teruskan request API frontend ke backend Express.
 * BACKEND_URL = mis. https://jagofarm-backend.vercel.app (tanpa trailing slash).
 * Cookie + Authorization diteruskan supaya sesi Supabase tetap jalan.
 */
export async function proxyToBackend(request: NextRequest) {
  const backend = (process.env.BACKEND_URL ?? "").replace(/\/+$/, "");
  if (!backend) {
    return NextResponse.json({ error: "BACKEND_URL belum dikonfigurasi" }, { status: 503 });
  }

  const url = new URL(request.url);
  // Ambil path /api/... dari URL aktual (mendukung segmen dinamis).
  const apiIndex = url.pathname.indexOf("/api/");
  const apiPath = apiIndex >= 0 ? url.pathname.slice(apiIndex + "/api/".length) : "";
  const target = `${backend}/api/${apiPath}${url.search}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  // Teruskan token tamu konsultasi + secret cron
  for (const h of ["x-consultation-token", "x-cron-secret"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) body = buf as unknown as BodyInit;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[proxy] unreachable:`, error);
    return NextResponse.json({ error: "Backend tidak terjangkau" }, { status: 502 });
  }

  const resBody = await upstream.arrayBuffer();
  const res = new NextResponse(resBody, { status: upstream.status });
  const resCt = upstream.headers.get("content-type");
  if (resCt) res.headers.set("content-type", resCt);
  const disp = upstream.headers.get("content-disposition");
  if (disp) res.headers.set("content-disposition", disp);
  // Teruskan set-cookie dari backend (sesi Supabase)
  const setCookie = upstream.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) res.headers.append("set-cookie", c);
  return res;
}
