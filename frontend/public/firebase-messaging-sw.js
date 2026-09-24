importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDz0wFzEvRPGbYUEYgYqDPh_F5uuGgV4Rg",
    authDomain: "junker-74fb0.firebaseapp.com",
    projectId: "junker-74fb0",
    storageBucket: "junker-74fb0.firebasestorage.app",
    messagingSenderId: "578064058636",
    appId: "1:578064058636:web:5d6184847ab9cc8187a129",
    measurementId: "G-ZN7PKL5TMB"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler (when browser tab is NOT focused)
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
