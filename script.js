const STORAGE_KEY = "morfeu_sonhos";
const DREAMS_PER_PAGE = 7;

const homeScreen = document.getElementById("homeScreen");
const formScreen = document.getElementById("formScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const settingsScreen = document.getElementById("settingsScreen");
const dreamList = document.getElementById("dreamList");
const dreamCount = document.getElementById("dreamCount");
const dreamForm = document.getElementById("dreamForm");
const dreamDate = document.getElementById("dreamDate");
const dreamTitle = document.getElementById("dreamTitle");
const dreamDescription = document.getElementById("dreamDescription");
const deleteModal = document.getElementById("deleteModal");

let dreams = loadDreams();
let editingId = null;
let selectedMood = "neutral";
let deletingId = null;
let currentPage = 1;

const moods = {
    happy: { emoji: "☀️", label: "Feliz / Agradável", score: 5 },
    neutral: { emoji: "☁️", label: "Neutro", score: 3 },
    surreal: { emoji: "🪐", label: "Estranho / Surreal", score: 2 },
    sad: { emoji: "🌧️", label: "Triste", score: 2 },
    nightmare: { emoji: "🌑", label: "Pesadelo", score: 1 }
};

function loadDreams() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Erro ao carregar sonhos:", error);
        return [];
    }
}

function saveDreams() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
        return true;
    } catch (error) {
        console.error("Erro ao salvar sonhos:", error);
        alert("Não foi possível salvar. Verifique o armazenamento do navegador.");
        return false;
    }
}

function hideAllScreens() {
    homeScreen.classList.add("hidden");
    formScreen.classList.add("hidden");
    dashboardScreen.classList.add("hidden");
    settingsScreen.classList.add("hidden");
}

function showHome() {
    hideAllScreens();
    homeScreen.classList.remove("hidden");
    renderDreams();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDashboard() {
    hideAllScreens();
    dashboardScreen.classList.remove("hidden");
    renderDashboard();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSettings() {
    hideAllScreens();
    settingsScreen.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showForm() {
    hideAllScreens();
    formScreen.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openForm(id = null) {
    editingId = id;
    const dream = dreams.find(item => item.id === id);

    if (dream) {
        document.getElementById("formTitle").textContent = "Editar sonho";
        dreamDate.value = dream.date;
        dreamTitle.value = dream.title;
        dreamDescription.value = dream.description;
        selectedMood = dream.mood || "neutral";
    } else {
        document.getElementById("formTitle").textContent = "Registrar sonho";
        dreamForm.reset();
        dreamDate.value = getLocalDateString();
        selectedMood = "neutral";
    }

    updateMoodButtons();
    showForm();
}

function getLocalDateString() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function updateMoodButtons() {
    document.querySelectorAll(".mood-option").forEach(button => {
        const isSelected = button.dataset.mood === selectedMood;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
}

document.querySelectorAll(".mood-option").forEach(button => {
    button.addEventListener("click", () => {
        selectedMood = button.dataset.mood;
        updateMoodButtons();
    });
});

dreamForm.addEventListener("submit", event => {
    event.preventDefault();

    const date = dreamDate.value;
    const title = dreamTitle.value.trim();
    const description = dreamDescription.value.trim();

    if (!date || !title || !description) {
        alert("Preencha a data, o título e a descrição.");
        return;
    }

    const now = Date.now();

    if (editingId) {
        const index = dreams.findIndex(dream => dream.id === editingId);
        if (index !== -1) {
            dreams[index] = {
                ...dreams[index], date, title, description,
                mood: selectedMood, updatedAt: now
            };
        }
    } else {
        dreams.push({
            id: (crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random()}`),
            date, title, description, mood: selectedMood,
            createdAt: now, updatedAt: now
        });
    }

    if (saveDreams()) {
        editingId = null;
        currentPage = 1;
        showHome();
    }
});

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

function formatDate(date) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric"
    });
}

function renderDreams() {
    const sortedDreams = [...dreams].sort((a, b) =>
        b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0)
    );

    const totalPages = Math.max(1, Math.ceil(sortedDreams.length / DREAMS_PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);

    dreamCount.textContent = `${dreams.length} ${dreams.length === 1 ? "sonho registrado" : "sonhos registrados"}`;
    dreamList.innerHTML = "";

    if (sortedDreams.length === 0) {
        dreamList.innerHTML = `
            <div class="empty-state">
                <span>☾</span>
                <h3>Seu diário começa aqui</h3>
                <p>Todo sonho guarda uma história. Registre seu primeiro sonho!</p>
            </div>`;
        document.getElementById("pagination").classList.add("hidden");
        return;
    }

    const start = (currentPage - 1) * DREAMS_PER_PAGE;
    const pageDreams = sortedDreams.slice(start, start + DREAMS_PER_PAGE);

    pageDreams.forEach(dream => {
        const mood = moods[dream.mood] || moods.neutral;
        const card = document.createElement("article");
        card.className = "dream-card";
        card.innerHTML = `
            <span class="card-date">${escapeHTML(formatDate(dream.date))}</span>
            <button class="delete-icon" type="button" aria-label="Excluir sonho" title="Excluir">🗑</button>
            <h3>${escapeHTML(dream.title)}</h3>
            <p>${escapeHTML(dream.description)}</p>
            <span class="card-mood">${mood.emoji} ${escapeHTML(mood.label)}</span>`;

        card.addEventListener("click", () => openForm(dream.id));
        card.querySelector(".delete-icon").addEventListener("click", event => {
            event.stopPropagation();
            openDeleteModal(dream.id);
        });
        dreamList.appendChild(card);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.classList.toggle("hidden", totalPages <= 1);

    document.getElementById("pageInfo").textContent =
        `Página ${currentPage} de ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
}

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderDreams();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(dreams.length / DREAMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        renderDreams();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

function openDeleteModal(id) {
    deletingId = id;
    deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
    deletingId = null;
    deleteModal.classList.add("hidden");
}

document.getElementById("cancelDelete").addEventListener("click", closeDeleteModal);

document.getElementById("confirmDelete").addEventListener("click", () => {
    if (!deletingId) return;

    const previousDreams = dreams;
    dreams = dreams.filter(dream => dream.id !== deletingId);

    if (saveDreams()) {
        const maxPage = Math.max(1, Math.ceil(dreams.length / DREAMS_PER_PAGE));
        currentPage = Math.min(currentPage, maxPage);
        closeDeleteModal();
        renderDreams();
    } else {
        dreams = previousDreams;
    }
});

deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) closeDeleteModal();
});

document.getElementById("addDreamBtn").addEventListener("click", () => openForm());
document.getElementById("backBtn").addEventListener("click", showHome);
document.getElementById("cancelBtn").addEventListener("click", showHome);
document.getElementById("dashboardBtn").addEventListener("click", showDashboard);
document.getElementById("dashboardBackBtn").addEventListener("click", showHome);

// Configurações e backup
const settingsBtn = document.getElementById("settingsBtn");
const settingsBackBtn = document.getElementById("settingsBackBtn");
const exportDreamsBtn = document.getElementById("exportDreamsBtn");
const importDreamsBtn = document.getElementById("importDreamsBtn");
const importFile = document.getElementById("importFile");
const importMode = document.getElementById("importMode");
const backupStatus = document.getElementById("backupStatus");
const selectedFileName = document.getElementById("selectedFileName");

settingsBtn.addEventListener("click", showSettings);
settingsBackBtn.addEventListener("click", showHome);

function setBackupStatus(message, type = "") {
    backupStatus.textContent = message;
    backupStatus.className = `backup-status${type ? ` ${type}` : ""}`;
}

// Exporta todos os sonhos em um arquivo JSON compatível com o importador.
exportDreamsBtn.addEventListener("click", () => {
    const backup = {
        app: "Morfeu",
        version: 1,
        exportedAt: new Date().toISOString(),
        dreams: dreams
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `morfeu-backup-${getLocalDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setBackupStatus("Backup exportado com sucesso! Guarde o arquivo em um local seguro.", "success");
});

importFile.addEventListener("change", () => {
    selectedFileName.textContent = importFile.files.length
        ? importFile.files[0].name
        : "Nenhum arquivo selecionado.";
    setBackupStatus("");
});

function validateBackup(data) {
    const validMoods = ["happy", "neutral", "surreal", "sad", "nightmare"];

    if (!data || typeof data !== "object" || Array.isArray(data) ||
        data.app !== "Morfeu" || data.version !== 1 || !Array.isArray(data.dreams)) {
        throw new Error("O arquivo não é um backup válido do Morfeu.");
    }

    const idsInBackup = new Set();

    for (const dream of data.dreams) {
        if (!dream || typeof dream !== "object" || Array.isArray(dream)) {
            throw new Error("O backup contém um registro inválido.");
        }
        if (typeof dream.id !== "string" || !dream.id.trim()) {
            throw new Error("Um sonho possui um identificador inválido.");
        }
        if (idsInBackup.has(dream.id)) {
            throw new Error("O backup contém sonhos com identificadores repetidos.");
        }
        idsInBackup.add(dream.id);

        if (typeof dream.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dream.date)) {
            throw new Error("Um sonho possui uma data inválida.");
        }
        const [year, month, day] = dream.date.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
            throw new Error("Um sonho possui uma data inexistente.");
        }
        if (typeof dream.title !== "string" || !dream.title.trim() ||
            typeof dream.description !== "string" || !dream.description.trim()) {
            throw new Error("Um sonho possui título ou descrição inválidos.");
        }
        if (!validMoods.includes(dream.mood)) {
            throw new Error("Um sonho possui uma categoria de humor inválida.");
        }
        if ((dream.createdAt !== undefined && !Number.isFinite(dream.createdAt)) ||
            (dream.updatedAt !== undefined && !Number.isFinite(dream.updatedAt))) {
            throw new Error("Um sonho possui informações de data inválidas.");
        }
    }

    return true;
}

function generateDreamId() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

importDreamsBtn.addEventListener("click", async () => {
    const file = importFile.files[0];
    setBackupStatus("");

    if (!file) {
        setBackupStatus("Selecione um arquivo JSON primeiro.", "error");
        return;
    }
    if (!file.name.toLowerCase().endsWith(".json")) {
        setBackupStatus("O arquivo selecionado precisa ter a extensão .json.", "error");
        return;
    }

    try {
        const backup = JSON.parse(await file.text());
        validateBackup(backup);

        let newDreams;
        if (importMode.value === "replace") {
            const confirmed = confirm(
                `Você está prestes a substituir ${dreams.length} sonho(s) atual(is) por ${backup.dreams.length} sonho(s) do backup.\n\nEssa ação não poderá ser desfeita. Deseja continuar?`
            );
            if (!confirmed) return;
            newDreams = backup.dreams.map(dream => ({ ...dream }));
        } else {
            const existingIds = new Set(dreams.map(dream => dream.id));
            newDreams = [...dreams];

            backup.dreams.forEach(dream => {
                const importedDream = { ...dream };
                if (existingIds.has(importedDream.id)) {
                    importedDream.id = generateDreamId();
                }
                existingIds.add(importedDream.id);
                newDreams.push(importedDream);
            });
        }

        const previousDreams = dreams;
        dreams = newDreams;
        if (!saveDreams()) {
            dreams = previousDreams;
            return;
        }

        currentPage = 1;
        editingId = null;
        selectedFileName.textContent = "Nenhum arquivo selecionado.";
        importFile.value = "";
        renderDashboard();
        renderDreams();
        setBackupStatus(`${backup.dreams.length} sonho(s) importado(s) com sucesso!`, "success");
        alert("Importação concluída com sucesso!");
        showHome();
    } catch (error) {
        console.error("Erro ao importar backup:", error);
        const message = error instanceof SyntaxError
            ? "O arquivo JSON está inválido ou corrompido."
            : error.message || "Não foi possível importar o backup.";
        setBackupStatus(message, "error");
    } finally {
        // Permite selecionar novamente o mesmo arquivo em uma nova tentativa.
        importFile.value = "";
        selectedFileName.textContent = "Nenhum arquivo selecionado.";
    }
});

// Dashboard: a escala é descritiva, não uma avaliação psicológica.
// O "humor médio" é calculado pela média das notas atribuídas às categorias.
function renderDashboard() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthDreams = dreams.filter(dream => {
        const [year, month] = dream.date.split("-").map(Number);
        return year === currentYear && month === currentMonth + 1;
    });

    document.getElementById("dashboardMonth").textContent =
        now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    document.getElementById("monthlyDreams").textContent = thisMonthDreams.length;

    const monthsWithDreams = new Set(dreams.map(dream => dream.date.slice(0, 7))).size;
    const average = monthsWithDreams ? dreams.length / monthsWithDreams : 0;
    document.getElementById("monthlyAverage").textContent =
        average.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    document.getElementById("averageCaption").textContent =
        monthsWithDreams
            ? `Média nos ${monthsWithDreams} ${monthsWithDreams === 1 ? "mês com registro" : "meses com registros"}`
            : "Ainda não há sonhos registrados";

    const moodCounts = Object.keys(moods).reduce((acc, key) => {
        acc[key] = dreams.filter(dream => (dream.mood || "neutral") === key).length;
        return acc;
    }, {});

    const totalMoodEntries = dreams.length;
    const moodScore = dreams.length
        ? dreams.reduce((sum, dream) => sum + (moods[dream.mood] || moods.neutral).score, 0) / dreams.length
        : null;

    let averageLabel = "—";
    if (moodScore !== null) {
        if (moodScore >= 4.2) averageLabel = "Positivo";
        else if (moodScore >= 3.2) averageLabel = "Neutro";
        else if (moodScore >= 2.2) averageLabel = "Misto";
        else averageLabel = "Difícil";
    }
    document.getElementById("averageMood").textContent = averageLabel;
    document.getElementById("moodCaption").textContent = dreams.length
        ? `Índice médio ${moodScore.toFixed(1)} de 5 · baseado nos registros`
        : "Registre sonhos para visualizar seu humor";

    const moodBreakdown = document.getElementById("moodBreakdown");
    if (!totalMoodEntries) {
        moodBreakdown.innerHTML = '<p class="dashboard-empty">Ainda não há dados de humor. Registre alguns sonhos para visualizar esta seção.</p>';
    } else {
        moodBreakdown.innerHTML = Object.entries(moods).map(([key, mood]) => {
            const count = moodCounts[key];
            const percent = Math.round((count / totalMoodEntries) * 100);
            return `
                <div class="mood-row">
                    <span class="mood-name">${mood.emoji} ${mood.label}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
                    <span class="mood-percent">${percent}%</span>
                </div>`;
        }).join("");
    }

    const monthCounts = {};
    dreams.forEach(dream => {
        const key = dream.date.slice(0, 7);
        monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    const monthKeys = Object.keys(monthCounts).sort().slice(-6).reverse();
    const monthlyBreakdown = document.getElementById("monthlyBreakdown");

    if (!monthKeys.length) {
        monthlyBreakdown.innerHTML = '<p class="dashboard-empty">Nenhum sonho registrado ainda.</p>';
    } else {
        const maxCount = Math.max(...monthKeys.map(key => monthCounts[key]));
        monthlyBreakdown.innerHTML = monthKeys.map(key => {
            const [year, month] = key.split("-").map(Number);
            const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
                month: "short", year: "numeric"
            });
            const count = monthCounts[key];
            const width = Math.max(5, (count / maxCount) * 100);
            return `
                <div class="month-row">
                    <span>${label}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
                    <span class="month-count">${count}</span>
                </div>`;
        }).join("");
    }
}

renderDreams();
updateMoodButtons();
