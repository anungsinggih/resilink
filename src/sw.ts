/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Handle Share Target for PDF files
self.addEventListener('fetch', (event: FetchEvent) => {
    const url = new URL(event.request.url);

    if (event.request.method === 'POST' && url.pathname === '/upload') {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    const file = formData.get('file');

                    if (file instanceof File) {
                        // Store PDF temporarily in Cache API
                        const cache = await caches.open('shared-files');
                        await cache.put('/shared-pdf', new Response(file));

                        // Redirect to dropshipper page with shared flag
                        return Response.redirect('/dropshipper?shared=true', 303);
                    }
                } catch (err) {
                    console.error('Share target error:', err);
                }
                return Response.redirect('/dropshipper', 303);
            })()
        );
    }
});
