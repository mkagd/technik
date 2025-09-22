// components/GoogleAuth.js
import React, { useState, useEffect } from 'react';
import { FaGoogle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import googleConfig from '../utils/googleConfig';

const GoogleAuth = ({ onAuth, onError, buttonText = "Zaloguj się przez Google" }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [googleSDKReady, setGoogleSDKReady] = useState(false);

    useEffect(() => {
        const initializeGoogle = async () => {
            try {
                await googleConfig.loadGoogleSDK();

                window.google.accounts.id.initialize({
                    client_id: googleConfig.CLIENT_ID,
                    callback: handleGoogleCallback,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                setGoogleSDKReady(true);
            } catch (error) {
                console.error('Failed to initialize Google SDK:', error);
                onError('Nie udało się załadować Google SDK');
            }
        };

        initializeGoogle();
    }, []);

    const handleGoogleCallback = async (response) => {
        setIsLoading(true);
        try {
            // Dekodowanie JWT tokenu Google
            const payload = googleConfig.decodeGoogleJWT(response.credential);
            const googleUser = googleConfig.formatGoogleUser(payload);

            // Synchronizacja danych użytkownika
            const user = await googleConfig.syncUserData(googleUser);

            // Sprawdzenie czy użytkownik to pracownik
            await googleConfig.syncEmployeeData(user);

            // Utworzenie sesji
            const sessionData = googleConfig.createUserSession(user);

            onAuth(sessionData);

        } catch (error) {
            console.error('Google auth error:', error);
            onError(error.message || 'Błąd podczas logowania przez Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (!googleSDKReady) {
            onError('Google SDK nie jest gotowe. Spróbuj ponownie za chwilę.');
            return;
        }

        setIsLoading(true);
        try {
            window.google.accounts.id.prompt();
        } catch (error) {
            console.error('Google login error:', error);
            onError('Błąd podczas inicjalizacji logowania Google');
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleGoogleLogin}
            disabled={isLoading || !googleSDKReady}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    Łączenie z Google...
                </>
            ) : !googleSDKReady ? (
                <>
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    Ładowanie Google...
                </>
            ) : (
                <>
                    <FaGoogle className="h-5 w-5 text-red-500 mr-3" />
                    {buttonText}
                </>
            )}
        </button>
    );
};

export default GoogleAuth;
