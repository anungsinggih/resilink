/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Handle Share Target for PDF files
self.addEventListener('fetch', (event: FetchEvent) => {
    const url = new URL(event.request.url);

    // Check if the request is a POST to /upload (ignoring trailing slashes)
    if (event.request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/upload') {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    // Try getting 'file', or fallback to the first file found
                    let file = formData.get('file');

                    if (!file) {
                        for (const [key, value] of formData.entries()) {
                            if (value instanceof File) {
                                file = value;
                                break;
                            }
                        }
                    }

                    if (file instanceof File) {
                        // Store file temporarily in Cache API
                        const cache = await caches.open('shared-files');
                        await cache.put('/shared-file', new Response(file));

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

// Skip waiting and claim clients immediately to ensure updates take effect
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
