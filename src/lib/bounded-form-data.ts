export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the permitted size");
    this.name = "RequestBodyTooLargeError";
  }
}

function assertPositiveByteLimit(maxBytes: number): void {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("Request body size limit must be a positive integer");
  }
}

/**
 * Parses multipart form data while enforcing a byte limit even when a client
 * omits Content-Length (for example, a chunked request).
 */
export async function parseBoundedFormData(request: Request, maxBytes: number): Promise<FormData> {
  assertPositiveByteLimit(maxBytes);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) return request.formData();

  let receivedBytes = 0;
  const boundedBody = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      receivedBytes += chunk.byteLength;
      if (receivedBytes > maxBytes) {
        controller.error(new RequestBodyTooLargeError());
        return;
      }
      controller.enqueue(chunk);
    },
  }));

  return new Response(boundedBody, {
    headers: { "content-type": request.headers.get("content-type") ?? "" },
  }).formData();
}
