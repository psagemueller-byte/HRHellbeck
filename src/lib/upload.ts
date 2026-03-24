/**
 * Upload a file (image) to Supabase Storage via the API route.
 * Returns the public URL on success, null on failure.
 */
export async function uploadFile(file: File, folder = "avatars"): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    console.error("Upload failed:", data.error);
    return null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}
