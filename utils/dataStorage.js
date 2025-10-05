// utils/dataStorage.js
// Tymczasowe rozwiązanie dla trwałego przechowywania danych w pliku JSON

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'rezerwacje.json');

// Upewnij się, że folder data istnieje
const ensureDataDir = () => {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

// Odczytaj dane z pliku
export const readReservations = () => {
    try {
        ensureDataDir();
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Błąd odczytu danych:', error);
        return [];
    }
};

// Zapisz dane do pliku
export const writeReservations = (reservations) => {
    try {
        ensureDataDir();
        fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2));
        return true;
    } catch (error) {
        console.error('Błąd zapisu danych:', error);
        return false;
    }
};

// Dodaj nową rezerwację
export const addReservation = (reservation) => {
    try {
        const reservations = readReservations();
        const newReservation = {
            ...reservation,
            id: reservation.id || Date.now(),
            created_at: reservation.created_at || new Date().toISOString()
        };
        reservations.push(newReservation);
        writeReservations(reservations);
        return newReservation;
    } catch (error) {
        console.error('Błąd dodawania rezerwacji:', error);
        return null;
    }
};

// Usuń rezerwację
export const deleteReservation = (id) => {
    try {
        const reservations = readReservations();
        const filteredReservations = reservations.filter(r => r.id !== id);
        writeReservations(filteredReservations);
        return true;
    } catch (error) {
        console.error('Błąd usuwania rezerwacji:', error);
        return false;
    }
};

// Aktualizuj rezerwację
export const updateReservation = (id, updates) => {
    try {
        const reservations = readReservations();
        const index = reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            reservations[index] = { ...reservations[index], ...updates };
            writeReservations(reservations);
            return reservations[index];
        }
        return null;
    } catch (error) {
        console.error('Błąd aktualizacji rezerwacji:', error);
        return null;
    }
};
