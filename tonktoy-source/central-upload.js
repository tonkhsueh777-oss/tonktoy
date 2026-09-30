// Make the center editor empty-state the primary upload target.
(() => {
  const stage = E.stage;
  const empty = E.empty;
  const fileInput = E.file;
  if (!stage || !empty || !fileInput) return;

  const style = document.createElement('style');
  style.textContent = `
    #editorStage:not(.has-image) .empty-state{cursor:pointer}
    #editorStage:not(.has-image) .empty-state:hover .empty-icon{transform:translateY(-2px);border-color:#3a95ff}
    #editorStage.upload-dragging{border-color:#3a95ff!important;box-shadow:inset 0 0 0 2px rgba(58,149,255,.35),inset 0 0 70px rgba(22,119,255,.12)}
    #editorStage.upload-dragging .empty-state{background:rgba(8,27,49,.55)}
    #editorStage.upload-dragging .empty-icon{transform:scale(1.06);background:rgba(22,119,255,.25)}
    .empty-icon{transition:transform .16s ease,border-color .16s ease,background .16s ease;border:1px solid transparent}
  `;
  document.head.appendChild(style);

  const openPicker = () => fileInput.click();

  empty.addEventListener('click', (event) => {
    event.preventDefault();
    openPicker();
  });

  empty.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openPicker();
  });
  empty.tabIndex = 0;
  empty.setAttribute('role', 'button');
  empty.setAttribute('aria-label', '拖移图片到这里开始处理，或点击选择图片');

  ['dragenter', 'dragover'].forEach((type) => {
    stage.addEventListener(type, (event) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      stage.classList.add('upload-dragging');
    });
  });

  stage.addEventListener('dragleave', (event) => {
    if (event.relatedTarget && stage.contains(event.relatedTarget)) return;
    stage.classList.remove('upload-dragging');
  });

  stage.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    stage.classList.remove('upload-dragging');
    const file = event.dataTransfer?.files?.[0];
    if (file) load(file).catch((error) => setStatus(error.message, 'error'));
  });

  // Keep a simple state class so the empty uploader never interferes with editing.
  const observer = new MutationObserver(() => {
    const hidden = getComputedStyle(empty).display === 'none';
    stage.classList.toggle('has-image', hidden);
  });
  observer.observe(empty, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  stage.classList.toggle('has-image', getComputedStyle(empty).display === 'none');
})();
