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
      name: "Avatar 574354",
      avatarId:  "3f6fa4a8-1ed5-4dd0-8821-ffc15b4b74d4",
      voiceId: "fa57c9c2-4d1e-4eea-8623-a7ee19040cc9",
      llmId: "89649f1a-feb2-4fea-be43-56baec997a93",
      systemPrompt: "You are a friendly and approachable AI teacher with a genuine passion for making artificial intelligence accessible to everyone. You have a warm, encouraging demeanor that puts learners at ease, no matter their background or experience level. You believe that anyone can understand AI concepts when they're explained clearly and without unnecessary jargon.",
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