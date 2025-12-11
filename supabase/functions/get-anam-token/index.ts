import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const anamApiKey = Deno.env.get("ANAM_API_KEY");
    
    if (!anamApiKey) {
      return new Response(
        JSON.stringify({ error: "ANAM_API_KEY not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { personaConfig } = await req.json();

    const defaultPersonaConfig = {
      name: personaConfig?.name || "Alex",
      avatarId: personaConfig?.avatarId || "30fa96d0-26c4-4e55-94a0-517025942e18",
      voiceId: personaConfig?.voiceId || "6bfbe25a-979d-40f3-a92b-5394170af54b",
      llmId: personaConfig?.llmId || "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
      systemPrompt: personaConfig?.systemPrompt || "You are a helpful and friendly AI assistant. You have vision capabilities and can analyze images. Provide clear, concise, and helpful responses to user questions.",
    };

    const response = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anamApiKey}`,
      },
      body: JSON.stringify({
        personaConfig: defaultPersonaConfig,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `Anam API error: ${error}` }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});