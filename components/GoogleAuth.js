// components/GoogleAuth.js
import React, { useState, useEffect, useRef } from 'react';
import { FaGoogle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const GoogleAuth = ({ onAuth, onError, buttonText = "Zaloguj się przez Google" }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [googleSDKReady, setGoogleSDKReady] = useState(false);
    const googleButtonRef = useRef(null);
    
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '109241638469-crsdg95vv895ajdq5b8sci7loe21goa7.apps.googleusercontent.com';

    // Załaduj Google SDK bezpośrednio
    useEffect(() => {
        const loadGoogleScript = () => {
            // Sprawdź czy script już istnieje
            if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
                if (window.google && window.google.accounts) {
                    initializeGoogleAuth();
                } else {
                    setTimeout(loadGoogleScript, 500);
                }
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('Google SDK script loaded');
                initializeGoogleAuth();
            };
            
            script.onerror = () => {
                console.error('Failed to load Google SDK script');
                onError('Nie udało się załadować Google SDK');
            };
            
            document.head.appendChild(script);
        };

        const initializeGoogleAuth = () => {
            if (!window.google || !window.google.accounts) {
                console.error('Google SDK not available');
                return;
            }

            try {
                console.log('Initializing Google with Client ID:', CLIENT_ID);
                
                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: handleGoogleCallback,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    use_fedcm_for_prompt: false,
                    itp_support: true,
                    state_cookie_domain: 'localhost'
                });

                console.log('Google initialized successfully');
                setGoogleSDKReady(true);
            } catch (error) {
                console.error('Google initialization error:', error);
                onError('Błąd inicjalizacji Google: ' + error.message);
            }
        };

        loadGoogleScript();
    }, []);

    // Renderuj przycisk Google gdy SDK jest gotowy
    useEffect(() => {
        if (googleSDKReady && googleButtonRef.current && !isLoading) {
            try {
                // Wyczyść poprzedni przycisk
                googleButtonRef.current.innerHTML = '';
                
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: 'outline',
                    size: 'large',
                    type: 'standard',
                    text: 'signin_with',
                    logo_alignment: 'left',
                    width: '100%'
                });
                console.log('Google button rendered successfully');
            } catch (error) {
                console.error('Failed to render Google button:', error);
                // Fallback - pokaż własny przycisk z bezpośrednim wywołaniem
                const fallbackButton = document.createElement('button');
                fallbackButton.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 12px; border: 1px solid #dadce0; border-radius: 8px; background: white; cursor: pointer;">
                        <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        ${buttonText}
                    </div>
                `;
                fallbackButton.onclick = () => {
                    try {
                        window.google.accounts.id.prompt((notification) => {
                            console.log('Google prompt notification:', notification);
                            if (notification.isNotDisplayed()) {
                                onError('Okno logowania Google nie może być wyświetlone. Sprawdź blokadę popup.');
                            }
                        });
                    } catch (error) {
                        console.error('Google prompt error:', error);
                        onError('Błąd Google: ' + error.message);
                    }
                };
                googleButtonRef.current.appendChild(fallbackButton);
            }
        }
    }, [googleSDKReady, isLoading]);

    const handleGoogleCallback = async (response) => {
        setIsLoading(true);
        console.log('Google callback received:', response);
        
        try {
            // Prosty decoder JWT
            const decodeJWT = (token) => {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
                return JSON.parse(jsonPayload);
            };

            const payload = decodeJWT(response.credential);
            console.log('Decoded Google payload:', payload);

            // Stwórz dane użytkownika
            const userData = {
                id: Date.now(),
                googleId: payload.sub,
                email: payload.email,
                firstName: payload.given_name || '',
                lastName: payload.family_name || '',
                fullName: payload.name || '',
                picture: payload.picture || '',
                verified: payload.email_verified || false,
                provider: 'google',
                isNewUser: true,
                loginTime: new Date().toISOString()
            };

            console.log('Calling onAuth with user data:', userData);
            onAuth(userData);

        } catch (error) {
            console.error('Google auth error:', error);
            onError('Błąd podczas logowania przez Google: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="w-full">
            {isLoading ? (
                <div className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    Łączenie z Google...
                </div>
            ) : !googleSDKReady ? (
                <div className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    Ładowanie Google...
                </div>
            ) : (
                <div 
                    ref={googleButtonRef}
                    className="w-full min-h-[48px] flex items-center justify-center"
                    style={{ minHeight: '48px' }}
                />
            )}
        </div>
    );
};

export default GoogleAuth;
