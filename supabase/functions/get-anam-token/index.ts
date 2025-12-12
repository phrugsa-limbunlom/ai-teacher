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
      name: personaConfig?.name || "Avatar 574354",
      avatarId: personaConfig?.avatarId || "3f6fa4a8-1ed5-4dd0-8821-ffc15b4b74d4",
      voiceId: personaConfig?.voiceId || "fa57c9c2-4d1e-4eea-8623-a7ee19040cc9",
      llmId: personaConfig?.llmId || "89649f1a-feb2-4fea-be43-56baec997a93",
      systemPrompt: personaConfig?.systemPrompt,
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