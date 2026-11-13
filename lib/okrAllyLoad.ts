/**
 * OKR Ally / Goal Ally — the two reads the app makes right after sign-in is confirmed: the saved draft and the saved profile.
 * Both requests start together and the caller waits for both (they used to go one after the other). Behaviour is the same as before:
 *  - the draft failing (network error or a reply that is not JSON) rejects, and the caller falls back to the intro screen;
 *  - the profile reply not being JSON gives null (the form is simply not prefilled);
 *  - the profile request itself failing (network error) rejects, as it did.
 * The API routes are unchanged.
 */
export async function loadDraftAndProfile<D = unknown, P = unknown>(
  fetchFn: typeof fetch = fetch
): Promise<{ draft: D; profile: P | null }> {
  const draftP: Promise<D> = fetchFn('/api/okr-ally/draft').then((r) => r.json())
  const profileP: Promise<P | null> = fetchFn('/api/okr-ally/profile').then((r) => r.json().catch(() => null))
  // If the draft fails first, the profile request is still running; its own later failure must not go unhandled.
  profileP.catch(() => {})
  const [draft, profile] = await Promise.all([draftP, profileP])
  return { draft, profile }
}
