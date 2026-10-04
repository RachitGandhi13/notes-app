"use client";

// fetch() can't report upload progress, and a lecture video or a big slide deck
// can take minutes on a normal connection — so uploads use XMLHttpRequest, which
// can, and the forms show a progress bar instead of a silent "Uploading…".
export function postFormWithProgress<T = any>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as (T & { error?: string }) | null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
      } else if (xhr.status === 413) {
        reject(new Error("The file is too large for the server to accept."));
      } else {
        reject(new Error(body?.error ?? `Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — the upload did not finish."));
    xhr.send(formData);
  });
}

export function UploadBar({ percent }: { percent: number }) {
  return (
    <div
      className="space-y-1"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {percent < 100 ? `Uploading… ${percent}%` : "Upload finished — saving…"}
      </p>
    </div>
  );
}
