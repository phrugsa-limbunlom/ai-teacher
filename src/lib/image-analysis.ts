const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function analyzeImage(imageBase64: string): Promise<string> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/analyze-image`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  const data = await response.json();
  return data.description;
}
