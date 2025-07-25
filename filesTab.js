export function initFilesTab() {
  const filesKey = 'uploadedFiles';
  const container = document.getElementById('filesTabContent');
  const form = document.getElementById('fileUploadForm');
  const input = document.getElementById('fileInput');

  // Add a modal for previewing files
  if (!document.getElementById('filePreviewModal')) {
    const modal = document.createElement('div');
    modal.id = 'filePreviewModal';
    modal.innerHTML = `
      <div id="filePreviewContent">
        <button id="closePreviewBtn">Close</button>
        <div id="filePreviewBody"></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closePreviewBtn').onclick = () => {
      modal.style.display = 'none';
      document.getElementById('filePreviewBody').innerHTML = '';
    };
  }

  function showPreview(file) {
    const previewBody = document.getElementById('filePreviewBody');
    previewBody.innerHTML = '';
    // Images
    if (file.type.startsWith('image/')) {
      previewBody.innerHTML = `<img src="${file.data}" alt="${file.name}" />`;
    }
    // PDF
    else if (file.type === 'application/pdf') {
      previewBody.innerHTML = `<embed src="${file.data}" type="application/pdf" style="width:100%;height:60vh;" />`;
    }
    // Text
    else if (
      file.type.startsWith('text/') ||
      /\.(txt|md|csv|json)$/i.test(file.name)
    ) {
      fetch(file.data)
        .then(res => res.text())
        .then(text => {
          previewBody.innerHTML = `<pre>${text}</pre>`;
        })
        .catch(() => {
          previewBody.innerHTML = `<p>Unable to preview text.</p>`;
        });
    }
    // Audio
    else if (file.type.startsWith('audio/')) {
      previewBody.innerHTML = `<audio controls src="${file.data}" style="width:100%"></audio>`;
    }
    // Video
    else if (file.type.startsWith('video/')) {
      previewBody.innerHTML = `<video controls src="${file.data}" style="width:100%;max-height:60vh"></video>`;
    }
    // Fallback
    else {
      previewBody.innerHTML = `
        <p><b>${file.name}</b></p>
        <p>Preview not supported for this file type.</p>
        <a href="${file.data}" download="${file.name}">Download</a>
      `;
    }
    document.getElementById('filePreviewModal').style.display = 'block';
  }

  function loadFiles() {
    const files = JSON.parse(localStorage.getItem(filesKey) || '[]');
    container.innerHTML = `
      <div class="file-list">
        ${files.map((file, i) => `
          <div class="file-item">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            ${file.path ? `<span class="file-path">${file.path}</span>` : ''}
            <span class="file-type">${file.type}</span>
            <span class="file-modified">${file.date}</span>
            <a href="${file.data}" download="${file.name}">Download</a>
            <button type="button" class="preview-file-btn" data-idx="${i}">Preview</button>
            <button type="button" class="delete-file-btn" data-name="${file.name}" data-path="${file.path || ''}">Delete</button>
          </div>
        `).join('')}
      </div>
    `;
    container.querySelectorAll('.delete-file-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteFile(this.dataset.name, this.dataset.path);
      });
    });
    container.querySelectorAll('.preview-file-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        showPreview(files[idx]);
      });
    });
  }

  function deleteFile(filename, filepath) {
    let stored = JSON.parse(localStorage.getItem(filesKey) || '[]');
    stored = stored.filter(f => !(f.name === filename && (f.path || '') === (filepath || '')));
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
          path: file.webkitRelativePath || "",
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
