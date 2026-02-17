import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all active lotteries
    const { data: lotteries, error: fetchError } = await supabase
      .from("lotteries")
      .select("id, draw_time")
      .eq("is_active", true);

    if (fetchError) throw fetchError;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Update each lottery's draw_time to today, keeping the same time-of-day
    for (const lottery of lotteries ?? []) {
      const timeOfDay = lottery.draw_time.split("T")[1]; // HH:MM:SS+TZ
      const newDrawTime = `${today}T${timeOfDay}`;

      const { error } = await supabase
        .from("lotteries")
        .update({ draw_time: newDrawTime })
        .eq("id", lottery.id);

      if (error) console.error(`Failed to update ${lottery.id}:`, error);
    }

    return new Response(
      JSON.stringify({ success: true, updated: lotteries?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error resetting draws:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
