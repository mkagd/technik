// utils/themeManager.js

export const themes = {
    default: {
        name: 'Domyślny motyw',
        description: 'Oryginalny wygląd aplikacji',
        colors: {
            primary: '#3B82F6',
            primaryHover: '#2563EB',
            accent: '#10B981',
            accentHover: '#059669',
            background: '#F9FAFB',
            surface: '#FFFFFF',
            text: '#111827',
            textSecondary: '#6B7280'
        },
        layout: 'default',
        buttonStyle: 'rounded',
        fontFamily: 'Inter, sans-serif'
    },
    naprawa: {
        name: 'Styl naprawa.pl',
        description: 'Profesjonalny wygląd inspirowany naprawa.pl',
        colors: {
            primary: '#1E40AF',
            primaryHover: '#1E3A8A',
            accent: '#F97316',
            accentHover: '#EA580C',
            background: '#F8FAFC',
            surface: '#FFFFFF',
            text: '#0F172A',
            textSecondary: '#475569'
        },
        layout: 'naprawa-style',
        buttonStyle: 'rounded-lg',
        fontFamily: 'Inter, sans-serif'
    },
    usterka: {
        name: 'Styl usterka.pl',
        description: 'Charakterystyczny wygląd usterka.pl',
        colors: {
            primary: '#DC2626',
            primaryHover: '#B91C1C',
            accent: '#F59E0B',
            accentHover: '#D97706',
            background: '#FEFEFE',
            surface: '#FFFFFF',
            text: '#1F2937',
            textSecondary: '#6B7280'
        },
        layout: 'usterka-style',
        buttonStyle: 'rounded-md',
        fontFamily: 'Inter, sans-serif'
    },
    minimal: {
        name: 'Minimalistyczny',
        description: 'Czysty i prosty design',
        colors: {
            primary: '#6B7280',
            primaryHover: '#4B5563',
            accent: '#EF4444',
            accentHover: '#DC2626',
            background: '#FFFFFF',
            surface: '#F9FAFB',
            text: '#111827',
            textSecondary: '#9CA3AF'
        },
        layout: 'minimal',
        buttonStyle: 'square',
        fontFamily: 'system-ui, sans-serif'
    }
};

export const applyTheme = (themeName) => {
    const theme = themes[themeName];
    if (!theme || typeof window === 'undefined') return;

    const root = document.documentElement;

    // Aplikuj kolory CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
    });

    // Aplikuj inne style
    root.style.setProperty('--font-family', theme.fontFamily);

    // Dodaj klasę dla layoutu
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeName}`);
};

export const loadSavedTheme = () => {
    if (typeof window === 'undefined') return 'default';

    try {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme && themes[savedTheme]) {
            applyTheme(savedTheme);
            return savedTheme;
        }
    } catch (error) {
        console.error('Błąd ładowania motywu:', error);
    }

    return 'default';
};

export const saveTheme = (themeName) => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem('appTheme', themeName);
        applyTheme(themeName);
        return true;
    } catch (error) {
        console.error('Błąd zapisywania motywu:', error);
        return false;
    }
};
