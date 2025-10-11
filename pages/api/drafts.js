import fs from 'fs';
import path from 'path';

const draftsFilePath = path.join(process.cwd(), 'data', 'drafts.json');

// Odczyt draftów
function readDrafts() {
    try {
        if (!fs.existsSync(draftsFilePath)) {
            fs.writeFileSync(draftsFilePath, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs.readFileSync(draftsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading drafts:', error);
        return [];
    }
}

// Zapis draftów
function saveDrafts(drafts) {
    try {
        fs.writeFileSync(draftsFilePath, JSON.stringify(drafts, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving drafts:', error);
        return false;
    }
}

// Czyszczenie starych draftów (starszych niż 7 dni)
function cleanOldDrafts() {
    const drafts = readDrafts();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const activeDrafts = drafts.filter(draft => {
        const draftTime = new Date(draft.updatedAt).getTime();
        return draftTime > sevenDaysAgo;
    });
    
    if (activeDrafts.length < drafts.length) {
        console.log(`🧹 Cleaned ${drafts.length - activeDrafts.length} old drafts`);
        saveDrafts(activeDrafts);
    }
    
    return activeDrafts;
}

export default async function handler(req, res) {
    const { method } = req;

    // Wyczyść stare drafty przy każdym requestcie
    cleanOldDrafts();

    if (method === 'GET') {
        // Pobierz drafty użytkownika/admina
        const { userId, adminId } = req.query;
        
        const drafts = readDrafts();
        const userDrafts = drafts.filter(draft => 
            (userId && draft.userId === userId) || 
            (adminId && draft.adminId === adminId) ||
            (!userId && !adminId) // Pobierz wszystkie jeśli brak filtra
        );

        console.log(`📥 GET /api/drafts - found ${userDrafts.length} drafts`);
        return res.status(200).json({ 
            success: true, 
            drafts: userDrafts 
        });
    }

    if (method === 'POST') {
        // Zapisz/zaktualizuj draft
        const { draftId, userId, adminId, formData, currentStep } = req.body;

        if (!formData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Brak danych formularza' 
            });
        }

        const drafts = readDrafts();
        const now = new Date().toISOString();

        // Sprawdź czy draft już istnieje
        const existingIndex = draftId 
            ? drafts.findIndex(d => d.id === draftId)
            : -1;

        if (existingIndex !== -1) {
            // Aktualizuj istniejący draft
            drafts[existingIndex] = {
                ...drafts[existingIndex],
                formData,
                currentStep,
                updatedAt: now
            };
            console.log(`♻️ Updated draft: ${draftId}`);
        } else {
            // Utwórz nowy draft
            const newDraft = {
                id: `DRAFT-${Date.now()}`,
                userId: userId || null,
                adminId: adminId || null,
                formData,
                currentStep: currentStep || 1,
                createdAt: now,
                updatedAt: now,
                status: 'active'
            };
            drafts.push(newDraft);
            console.log(`✅ Created new draft: ${newDraft.id}`);
        }

        const saved = saveDrafts(drafts);

        if (saved) {
            const draft = existingIndex !== -1 
                ? drafts[existingIndex] 
                : drafts[drafts.length - 1];

            return res.status(200).json({ 
                success: true, 
                message: 'Draft zapisany',
                draft 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'Błąd zapisu draftu' 
            });
        }
    }

    if (method === 'DELETE') {
        // Usuń draft
        const { draftId } = req.query;

        if (!draftId) {
            console.log('⚠️ DELETE request without draftId');
            return res.status(400).json({ 
                success: false, 
                message: 'Brak ID draftu' 
            });
        }

        const drafts = readDrafts();
        const filteredDrafts = drafts.filter(d => d.id !== draftId);

        if (filteredDrafts.length < drafts.length) {
            saveDrafts(filteredDrafts);
            console.log(`🗑️ Deleted draft: ${draftId}`);
            return res.status(200).json({ 
                success: true, 
                message: 'Draft usunięty' 
            });
        } else {
            // Draft nie znaleziony - może był już usunięty, zwróć sukces
            console.log(`ℹ️ Draft not found (already deleted?): ${draftId}`);
            return res.status(200).json({ 
                success: true, 
                message: 'Draft już nie istnieje (prawdopodobnie był usunięty wcześniej)' 
            });
        }
    }

    return res.status(405).json({ 
        success: false, 
        message: 'Metoda niedozwolona' 
    });
}
