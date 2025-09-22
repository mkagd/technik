// utils/googleConfig.js
export const googleConfig = {
    // Google OAuth 2.0 Configuration
    CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',

    // Google API Scopes
    SCOPES: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/contacts.readonly', // Kontakty Google (opcjonalnie)
    ],

    // Funkcja do sprawdzania czy Google SDK jest załadowane
    isGoogleSDKReady: () => {
        return typeof window !== 'undefined' && !!window.google;
    },

    // Funkcja do ładowania Google SDK
    loadGoogleSDK: () => {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                reject(new Error('Window object is not available'));
                return;
            }

            if (window.google) {
                resolve(window.google);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                if (window.google) {
                    resolve(window.google);
                } else {
                    reject(new Error('Google SDK failed to load'));
                }
            };

            script.onerror = () => {
                reject(new Error('Failed to load Google SDK script'));
            };

            document.head.appendChild(script);
        });
    },

    // Funkcja do formatowania danych użytkownika z Google
    formatGoogleUser: (googlePayload) => {
        return {
            id: googlePayload.sub,
            email: googlePayload.email,
            firstName: googlePayload.given_name || '',
            lastName: googlePayload.family_name || '',
            fullName: googlePayload.name || '',
            picture: googlePayload.picture || '',
            verified: googlePayload.email_verified || false,
            provider: 'google',
            googleId: googlePayload.sub,
            locale: googlePayload.locale || 'pl'
        };
    },

    // Funkcja do synchronizacji danych użytkownika
    syncUserData: async (googleUser) => {
        try {
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            let user = existingUsers.find(u =>
                u.email === googleUser.email || u.googleId === googleUser.googleId
            );

            const timestamp = new Date().toISOString();

            if (user) {
                // Aktualizuj istniejącego użytkownika
                user = {
                    ...user,
                    googleId: googleUser.googleId,
                    firstName: googleUser.firstName || user.firstName,
                    lastName: googleUser.lastName || user.lastName,
                    picture: googleUser.picture,
                    lastGoogleSync: timestamp,
                    verified: googleUser.verified,
                    provider: 'google'
                };

                const updatedUsers = existingUsers.map(u => u.id === user.id ? user : u);
                localStorage.setItem('users', JSON.stringify(updatedUsers));
            } else {
                // Stwórz nowego użytkownika
                user = {
                    id: Date.now(),
                    ...googleUser,
                    phone: '',
                    city: '',
                    address: '',
                    createdAt: timestamp,
                    isActive: true,
                    registrationMethod: 'google',
                    lastGoogleSync: timestamp
                };

                existingUsers.push(user);
                localStorage.setItem('users', JSON.stringify(existingUsers));
            }

            return user;
        } catch (error) {
            console.error('Error syncing user data:', error);
            throw error;
        }
    },

    // Funkcja do synchronizacji danych pracownika z Google
    syncEmployeeData: async (user) => {
        try {
            const employees = JSON.parse(localStorage.getItem('employees') || '[]');
            const employeeIndex = employees.findIndex(emp =>
                emp.email === user.email ||
                emp.personalEmail === user.email ||
                emp.googleId === user.googleId
            );

            if (employeeIndex !== -1) {
                employees[employeeIndex] = {
                    ...employees[employeeIndex],
                    googleId: user.googleId,
                    personalEmail: user.email,
                    firstName: user.firstName || employees[employeeIndex].firstName,
                    lastName: user.lastName || employees[employeeIndex].lastName,
                    picture: user.picture,
                    lastGoogleSync: new Date().toISOString(),
                    googleContactsEnabled: true
                };

                localStorage.setItem('employees', JSON.stringify(employees));

                // Zaktualizuj sesję pracownika jeśli jest zalogowany
                const employeeSession = localStorage.getItem('employeeSession');
                if (employeeSession) {
                    const session = JSON.parse(employeeSession);
                    if (session.email === user.email || session.id === employees[employeeIndex].id) {
                        const updatedSession = {
                            ...session,
                            googleId: user.googleId,
                            picture: user.picture,
                            googleContactsEnabled: true
                        };
                        localStorage.setItem('employeeSession', JSON.stringify(updatedSession));
                    }
                }

                return employees[employeeIndex];
            }

            return null;
        } catch (error) {
            console.error('Error syncing employee data:', error);
            throw error;
        }
    },

    // Funkcja do tworzenia sesji użytkownika
    createUserSession: (user) => {
        const sessionData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || '',
            city: user.city || '',
            address: user.address || '',
            picture: user.picture,
            googleId: user.googleId,
            loginTime: new Date().toISOString(),
            provider: user.provider || 'google',
            verified: user.verified || false
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionData));
        return sessionData;
    },

    // Funkcja do dekodowania JWT tokenu Google
    decodeGoogleJWT: (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding Google JWT:', error);
            throw new Error('Invalid Google token');
        }
    }
};

export default googleConfig;
