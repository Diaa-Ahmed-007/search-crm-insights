import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function has been disabled after initial admin setup
// The first admin account has already been created
// All subsequent user management should go through the admin panel
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Setup first admin endpoint called but is now disabled');
  
  return new Response(
    JSON.stringify({ 
      error: 'This endpoint has been disabled. Admin account setup is complete. Use the admin panel to manage users.' 
    }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
