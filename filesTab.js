export function initFilesTab() {
  const filesKey = 'uploadedFiles';
  const container = document.getElementById('filesTabContent');
  const form = document.getElementById('fileUploadForm');
  const input = document.getElementById('fileInput');

  function loadFiles() {
    const files = JSON.parse(localStorage.getItem(filesKey) || '[]');
    container.innerHTML = `
      <div class="file-list">
        ${files.map(file => `
          <div class="file-item">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-type">${file.type}</span>
            <span class="file-modified">${file.date}</span>
            <a href="${file.data}" download="${file.name}">Download</a>
            <button type="button" class="delete-file-btn" data-name="${file.name}">Delete</button>
          </div>
        `).join('')}
      </div>
    `;
    container.querySelectorAll('.delete-file-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteFile(this.dataset.name);
      });
    });
  }

  function deleteFile(filename) {
    let stored = JSON.parse(localStorage.getItem(filesKey) || '[]');
    stored = stored.filter(f => f.name !== filename);
    localStorage.setItem(filesKey, JSON.stringify(stored));
    loadFiles();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const files = Array.from(input.files);
    let stored = JSON.parse(localStorage.getItem(filesKey) || '[]');
    let filesProcessed = 0;
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = function(ev) {
        stored.push({
          name: file.name,
          type: file.type,
          date: new Date().toISOString().slice(0,10),
          data: ev.target.result
        });
        filesProcessed++;
        if (filesProcessed === files.length) {
          localStorage.setItem(filesKey, JSON.stringify(stored));
          loadFiles();
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = "";
  });

  loadFiles();
}
