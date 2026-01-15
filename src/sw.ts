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
                    const cache = await caches.open('shared-files');
                    let hasFile = false;

                    for (const [, value] of formData.entries()) {
                        if (value instanceof File) {
                            if (value.type === 'application/pdf') {
                                await cache.put('/shared-pdf', new Response(value));
                                hasFile = true;
                            } else if (value.type.startsWith('image/')) {
                                await cache.put('/shared-image', new Response(value));
                                hasFile = true;
                            }
                        }
                    }

                    if (hasFile) {
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
