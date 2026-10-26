import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export function GET(request: NextRequest) {
  return proxyToBackend(request);
}

export function POST(request: NextRequest) {
  return proxyToBackend(request);
}

export function PUT(request: NextRequest) {
  return proxyToBackend(request);
}

export function PATCH(request: NextRequest) {
  return proxyToBackend(request);
}

export function DELETE(request: NextRequest) {
  return proxyToBackend(request);
}
