const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function callAI(endpoint: string, formData: FormData) {
  const response = await fetch(`${AI_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Service error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function checkAIHealth() {
  try {
    const response = await fetch(`${AI_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
