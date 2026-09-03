/**
 * Cheap synchronous capability check — client-only, safe to call in an effect
 * or a lazy useState initializer.
 *
 * Explicitly releases the throwaway context via WEBGL_lose_context. Chrome
 * caps the number of live WebGL contexts (commonly 16); leaving detection
 * contexts around — easy to do across repeated dev-mode Fast Refresh
 * remounts — can exhaust that budget and make the REAL renderer's context
 * creation fail later, for reasons that have nothing to do with the actual
 * capability being tested here.
 */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
