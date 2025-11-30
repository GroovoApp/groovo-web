import * as tus from "tus-js-client";

export interface TusUploadResult {
  url: string;
  id: string | null;
}

function extractIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return url;
    return parts[parts.length - 1];
  } catch (err) {
    // fallback: try simple split
    try {
      const parts = (url || "").split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : url;
    } catch {
      return url;
    }
  }
}

export function startTusUpload(file: File, opts?: {
  endpoint?: string;
  metadata?: Record<string, string>;
  retryDelays?: number[];
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
}) {
  const endpoint = "http://localhost:8080/files";

  // Get auth token from localStorage
  let authHeaders: Record<string, string> = {};
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        authHeaders = { Authorization: `Bearer ${token}` };
      }
    }
  } catch (err) {
    console.warn('Could not read accessToken from localStorage', err);
  }

  let resolveFn: (value: TusUploadResult) => void;
  let rejectFn: (err: any) => void;

  const promise = new Promise<TusUploadResult>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  const upload = new (tus as any).Upload(file, {
    endpoint,
    retryDelays: opts?.retryDelays || [0, 1000, 3000, 5000],
    metadata: opts?.metadata || { filename: file.name },
    headers: authHeaders,
    onError(err: any) {
      rejectFn(err);
    },
    onProgress(bytesUploaded: number, bytesTotal: number) {
      if (typeof opts?.onProgress === "function") {
        opts!.onProgress(bytesUploaded, bytesTotal);
      }
    },
    onSuccess() {
      const url = (upload as any).url || null;
      const id = extractIdFromUrl(url);
      resolveFn({ url, id });
    },
  });

  // start immediately
  upload.start();

  return { upload, promise } as { upload: any; promise: Promise<TusUploadResult> };
}
