import { put, get, del } from '@vercel/blob'

/**
 * OKR Ally PDF storage on Vercel Blob (build sequence step 7).
 *
 * The store `okr-ally-pdfs` is PRIVATE — blobs are not publicly fetchable by
 * URL; reads go through the SDK with BLOB_READ_WRITE_TOKEN. Both the review
 * report and the GST invoice use this one helper (step 5's deferred invoice
 * storage is wired here too — storage is solved once).
 *
 * Everything degrades gracefully when BLOB_READ_WRITE_TOKEN is absent: uploads
 * return null (pdf_url stays NULL) and the download routes fall back to
 * regenerating the PDF from the stored row.
 */

export function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

/** Upload a PDF; returns its private blob URL, or null if Blob is not configured / the upload failed. */
export async function putPdf(pathname: string, bytes: Buffer): Promise<string | null> {
  if (!blobEnabled()) return null
  try {
    const res = await put(pathname, bytes, {
      access: 'private',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    })
    return res.url
  } catch (err) {
    console.error('OKR Ally blob: putPdf failed for', pathname, err)
    return null
  }
}

/** Fetch a stored PDF's bytes by its blob URL, or null if unavailable. */
export async function getPdfBytes(url: string): Promise<Buffer | null> {
  if (!blobEnabled()) return null
  try {
    const res = await get(url, { access: 'private' })
    if (!res || res.statusCode !== 200) return null
    const buf = await new Response(res.stream).arrayBuffer()
    return Buffer.from(buf)
  } catch (err) {
    console.error('OKR Ally blob: getPdfBytes failed for', url, err)
    return null
  }
}

/** Best-effort delete (used to roll back an orphaned upload). */
export async function deletePdf(url: string): Promise<void> {
  if (!blobEnabled()) return
  try {
    await del(url)
  } catch (err) {
    console.error('OKR Ally blob: deletePdf failed for', url, err)
  }
}
