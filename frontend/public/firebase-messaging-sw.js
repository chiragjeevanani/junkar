importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Parse Firebase configuration passed from service worker registration URL query params
const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
    measurementId: params.get('measurementId')
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging ? firebase.messaging() : null;

// Background message handler (when browser tab is NOT focused)
if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Background message received', payload);

        const notificationTitle = payload.notification?.title || 'Junkar';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/favicon.png',
            badge: '/favicon.png',
            data: { ...payload.data, link: '/scrapper/request-list' },
            tag: 'new-order-' + (payload.data?.orderId || Date.now()),
            requireInteraction: true,   // Keep notification on screen until user clicks
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};

    // Scrapper new order notifications go to request-list (for new) or active-requests (for updates)
    let urlToOpen = '/scrapper/request-list';
    if (data.link) {
        urlToOpen = data.link;
    } else if (data.type === 'order_update' || data.type === 'order_cancelled') {
        urlToOpen = '/scrapper/active-requests';
    }

    const fullUrl = self.location.origin + urlToOpen;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it and navigate
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    client.navigate(fullUrl);
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(fullUrl);
            }
        })
    );
});
