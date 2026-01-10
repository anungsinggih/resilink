import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Delete orders older than 3 days
        const { data, error } = await supabaseClient
            .from('orders')
            .delete()
            .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())

        if (error) throw error

        return new Response(JSON.stringify({ message: 'Cleanup successful', data }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
