// @ts-nocheck: Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Delete orders older than 3 days
        // Logic: resi auto remove setelah 3 hari di apps
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

        const { data, error } = await supabaseClient
            .from('orders')
            .delete()
            .lt('created_at', threeDaysAgo)

        if (error) throw error

        return new Response(JSON.stringify({ message: 'Cleanup successful', data }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
