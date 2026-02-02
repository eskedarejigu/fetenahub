// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Backend URL (replace with your Railway URL)
const BACKEND_URL = 'https://your-railway-app-url.up.railway.app';

document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const university = document.getElementById('university').value;
    const year = document.getElementById('year').value;
    const subject = document.getElementById('subject').value;
    
    const params = new URLSearchParams({ university, year, subject });
    const response = await fetch(`${BACKEND_URL}/exams?${params}`);
    const exams = await response.json();
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    exams.forEach(exam => {
        const div = document.createElement('div');
        div.className = 'exam-item';
        div.innerHTML = `
            <p>${exam.university} - ${exam.year} - ${exam.subject}</p>
            <a href="${exam.file_url}" target="_blank">Download</a>
        `;
        resultsDiv.appendChild(div);
    });
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', document.getElementById('file').files[0]);
    formData.append('university', document.getElementById('uploadUniversity').value);
    formData.append('year', document.getElementById('uploadYear').value);
    formData.append('subject', document.getElementById('uploadSubject').value);
    formData.append('initData', tg.initData);
    formData.append('user', JSON.stringify(tg.initDataUnsafe.user));
    
    const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    alert(result.message || result.error);
});