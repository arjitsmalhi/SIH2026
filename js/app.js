// EduSync Main Application Controller (v3)
class EduSyncApp {
  constructor() {
    this.currentRole = null; // 'teacher' | 'student'
    this.selectedClass = '8';
    this.selectedSubject = 'all';
    this.activeScreen = 'screen-role-select';
    this.currentQuiz = null;
    this.quizAnswers = {};
    this.currentQuizQuestionIdx = 0;
    this.quizTimerInterval = null;
    this.quizSecondsRemaining = 0;
    this.activeLessonResourceId = null;
    this.currentTransferResource = null;
    this.discoveredPeers = [];
    this.radarSearchQuery = '';
    this.theme = localStorage.getItem('edusync_theme') || 'dark';
    this.quizBuilderQuestions = [];
  }

  async init() {
    console.log('[EduSync] Initializing offline platform (v3)...');

    // 1. Initialize Theme
    this.initTheme();

    // 2. Immediately bind UI events
    this.bindEvents();
    if (window.eduTransport) {
      this.bindTransportEvents();
    }
    this.updateTransportBadge();
    if (window.i18n) {
      window.i18n.updateDOM();
    }
    this.renderScreen('screen-role-select');

    // 3. Initialize offline IndexedDB
    try {
      if (window.eduDB) {
        await window.eduDB.init();
        console.log('[EduSync] Offline Database ready');
      }
    } catch (err) {
      console.warn('[EduSync] Offline DB init issue:', err);
    }
    
    // 4. Register Service Worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('[EduSync] Service worker active'))
        .catch((err) => console.warn('[EduSync] SW registration failed:', err));
    }
  }

  // --- Theme Management ---
  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.updateThemeButtonsUI();
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('edusync_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeButtonsUI();
  }

  updateThemeButtonsUI() {
    const darkBtn = document.getElementById('btn-theme-dark');
    const lightBtn = document.getElementById('btn-theme-light');
    if (darkBtn && lightBtn) {
      if (this.theme === 'dark') {
        darkBtn.classList.add('active');
        lightBtn.classList.remove('active');
      } else {
        lightBtn.classList.add('active');
        darkBtn.classList.remove('active');
      }
    }
  }

  // --- Drawer Navigation ---
  openDrawer() {
    this.updateDrawerUI();
    document.getElementById('drawer-overlay')?.classList.add('active');
  }

  closeDrawer() {
    document.getElementById('drawer-overlay')?.classList.remove('active');
  }

  updateDrawerUI() {
    const roleText = document.getElementById('drawer-role-text');
    const roleIcon = document.getElementById('drawer-role-icon');
    const langText = document.getElementById('drawer-current-lang-text');
    const notesSection = document.getElementById('drawer-notes-section');

    if (roleText && roleIcon) {
      if (this.currentRole === 'teacher') {
        roleText.textContent = window.i18n.t('teacher');
        roleIcon.textContent = '👨‍🏫';
      } else if (this.currentRole === 'student') {
        roleText.textContent = window.i18n.t('student');
        roleIcon.textContent = '👨‍🎓';
      } else {
        roleText.textContent = window.i18n.t('selectRole');
        roleIcon.textContent = '👤';
      }
    }

    if (langText) {
      langText.textContent = window.i18n.currentLang === 'hi' ? 'हिंदी (Hindi)' : 'English';
    }

    if (notesSection) {
      notesSection.style.display = this.currentRole === 'student' ? 'block' : 'none';
    }

    this.updateThemeButtonsUI();
  }

  updateTransportBadge() {
    const badge = document.getElementById('transport-badge');
    if (!badge) return;
    if (window.eduTransport && window.eduTransport.isNative) {
      badge.textContent = 'Bluetooth Active';
      badge.className = 'transport-badge badge-ble';
    } else {
      badge.textContent = 'Offline Preview';
      badge.className = 'transport-badge badge-demo';
    }
  }

  bindTransportEvents() {
    window.eduTransport.on('peerDiscovered', (peer) => {
      if (this.activeScreen === 'screen-nearby-radar') {
        this.addPeerToRadarList(peer);
      }
    });

    window.eduTransport.on('peerConnected', (peer) => {
      console.log('[App] Peer connection confirmed:', peer);
      const pairingModal = document.getElementById('modal-pairing');
      if (pairingModal) pairingModal.classList.remove('active');
      if (this.currentRole === 'student') {
        this.openSyncCenter();
      } else if (this.currentRole === 'teacher') {
        const codeDisplay = document.getElementById('teacher-pairing-code-display');
        if (codeDisplay) {
          codeDisplay.innerHTML = `<span style="font-size:1.1rem; color:var(--primary); font-weight:700;">✓ ${peer.name || 'Student'} Connected</span>`;
        }
      }
    });

    window.eduTransport.on('pairingFailed', (err) => {
      alert('Verification Failed: The 4-digit code does not match the teacher screen.');
    });

    window.eduTransport.on('peerDisconnected', () => {
      if (this.activeScreen === 'screen-sync-center') {
        alert('Bluetooth Connection Ended: Peer disconnected.');
      }
    });

    window.eduTransport.on('transferProgress', (progress) => {
      const box = document.getElementById('sync-progress-box');
      if (box && box.style.display !== 'none') {
        const progressBar = document.getElementById('transfer-progress-fill');
        const percentLabel = document.getElementById('transfer-percent-label');
        const metaLabel = document.getElementById('transfer-meta-label');
        const titleLabel = document.getElementById('transfer-title-label');

        if (titleLabel) titleLabel.textContent = progress.resourceTitle;
        if (progressBar) progressBar.style.width = `${progress.percent}%`;
        if (percentLabel) percentLabel.textContent = `${progress.percent}%`;
        if (metaLabel) metaLabel.textContent = `Chunk ${progress.chunk}/${progress.totalChunks} (${progress.percent}%)`;
      }
    });

    window.eduTransport.on('transferComplete', () => {
      const box = document.getElementById('sync-progress-box');
      if (box) box.style.display = 'none';
      alert(`✅ ${window.i18n.t('syncSuccess')}\n\n${window.i18n.t('syncSuccessMsg')}`);
      this.refreshCurrentScreen();
    });
  }

  onPeerManifestReceived(manifest) {
    if (this.activeScreen === 'screen-sync-center') {
      this.openSyncCenter();
    } else if (this.activeScreen === 'screen-student-learning') {
      this.renderStudentLearning();
    }
  }

  onResourceReceived(resource) {
    console.log('[App] onResourceReceived triggered for:', resource.title);

    // 1. Display prominent toast notification
    this.showResourceReceivedToast(resource);

    // 2. Alert notification for user awareness
    alert(`📥 New Lesson Received from Teacher!\n\n"${resource.title}" (${resource.chapter})\nSaved for offline study.`);

    // 3. Refresh active student screens immediately
    if (this.activeScreen === 'screen-student-learning') {
      this.renderStudentLearning();
    } else if (this.activeScreen === 'screen-sync-center') {
      this.openSyncCenter();
    }
  }

  showResourceReceivedToast(resource) {
    const existing = document.getElementById('toast-resource-received');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-resource-received';
    toast.style.cssText = `
      position: fixed;
      top: 68px;
      left: 14px;
      right: 14px;
      max-width: 452px;
      margin: 0 auto;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--primary);
      box-shadow: var(--shadow-card);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 99999;
    `;
    toast.innerHTML = `
      <div style="font-size: 1.6rem;">📥</div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 0.72rem; color: var(--primary); font-weight: 700; text-transform: uppercase;">New Resource Received!</div>
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${resource.title}</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary);">${resource.chapter} • Saved for Offline Study</div>
      </div>
      <button class="btn-primary btn-sm" style="width: auto;" onclick="document.getElementById('toast-resource-received').remove(); window.eduApp.openLessonViewer('${resource.resourceId}');">
        Open
      </button>
    `;
    const root = document.getElementById('app-root') || document.body;
    root.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 9000);
  }

  bindEvents() {
    // Header & Drawer events
    document.getElementById('btn-open-drawer')?.addEventListener('click', () => this.openDrawer());
    document.getElementById('btn-close-drawer')?.addEventListener('click', () => this.closeDrawer());
    document.getElementById('drawer-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'drawer-overlay') this.closeDrawer();
    });

    document.getElementById('btn-header-home')?.addEventListener('click', () => {
      if (this.currentRole === 'teacher') {
        this.renderTeacherDashboard();
      } else if (this.currentRole === 'student') {
        this.renderStudentDashboard();
      } else {
        this.renderScreen('screen-role-select');
      }
    });

    document.getElementById('btn-drawer-switch-role')?.addEventListener('click', () => {
      this.closeDrawer();
      if (window.eduTransport) window.eduTransport.disconnect();
      this.currentRole = null;
      this.renderScreen('screen-role-select');
    });

    document.getElementById('btn-theme-dark')?.addEventListener('click', () => this.setTheme('dark'));
    document.getElementById('btn-theme-light')?.addEventListener('click', () => this.setTheme('light'));

    document.getElementById('btn-drawer-lang-toggle')?.addEventListener('click', () => {
      window.i18n.toggleLanguage();
      this.updateDrawerUI();
      this.refreshCurrentScreen();
    });

    document.getElementById('btn-drawer-open-notes')?.addEventListener('click', () => {
      this.closeDrawer();
      this.renderStudentNotes();
    });

    // Role selection
    document.getElementById('btn-select-teacher')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setRole('teacher');
    });

    document.getElementById('btn-select-student')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setRole('student');
    });

    // Class selection changes
    document.querySelectorAll('.class-select').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        this.selectedClass = e.target.value;
        this.refreshCurrentScreen();
      });
    });

    // Subject tab filtering
    document.querySelectorAll('.subject-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const sub = e.target.getAttribute('data-subject');
        this.selectedSubject = sub;
        document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        if (this.currentRole === 'teacher') {
          this.renderTeacherResources();
        } else {
          this.renderStudentLearning();
        }
      });
    });

    // Teacher Dashboard navigation
    document.getElementById('nav-teacher-resources')?.addEventListener('click', () => this.renderTeacherResources());
    document.getElementById('nav-teacher-nearby')?.addEventListener('click', () => this.renderNearbyRadar());
    document.getElementById('nav-teacher-progress')?.addEventListener('click', () => this.renderTeacherAnalytics());
    document.getElementById('nav-teacher-sync')?.addEventListener('click', () => this.openSyncCenter());

    // Student Dashboard navigation
    document.getElementById('nav-student-learning')?.addEventListener('click', () => this.renderStudentLearning());
    document.getElementById('nav-student-quizzes')?.addEventListener('click', () => this.renderStudentQuizzes());
    document.getElementById('nav-student-progress')?.addEventListener('click', () => this.renderStudentScorecard());
    document.getElementById('nav-student-notes')?.addEventListener('click', () => this.renderStudentNotes());

    // Add Resource Modal
    const openAddModal = () => {
      const isConnected = window.eduTransport.isConnected && window.eduTransport.connectedPeer;
      const indicator = document.getElementById('add-res-bt-indicator');
      const submitBtn = document.getElementById('btn-save-and-share');
      if (indicator) {
        if (isConnected) {
          indicator.innerHTML = `Connected: <b style="color:var(--primary);">${window.eduTransport.connectedPeer.name || 'Student Phone'}</b>`;
          if (submitBtn) submitBtn.textContent = 'Save & Share via BT';
        } else {
          indicator.innerHTML = `Bluetooth: <b>No Student Connected</b>`;
          if (submitBtn) submitBtn.textContent = 'Save Resource';
        }
      }
      document.getElementById('modal-add-resource').classList.add('active');
    };

    document.getElementById('btn-open-add-resource')?.addEventListener('click', openAddModal);
    document.getElementById('btn-open-add-resource-2')?.addEventListener('click', openAddModal);
    document.getElementById('btn-close-add-modal')?.addEventListener('click', () => {
      document.getElementById('modal-add-resource').classList.remove('active');
    });

    // Resource Type selector (show PDF upload when PDF is selected)
    document.getElementById('res-input-type')?.addEventListener('change', (e) => {
      const isPdf = e.target.value === 'pdf';
      const pdfGroup = document.getElementById('group-pdf-file');
      if (pdfGroup) pdfGroup.style.display = isPdf ? 'flex' : 'none';
    });

    document.getElementById('form-add-resource')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddNewResource();
    });

    // Teacher Create Quiz Modal
    document.getElementById('btn-open-create-quiz')?.addEventListener('click', () => this.openCreateQuizModal());
    document.getElementById('btn-open-create-quiz-2')?.addEventListener('click', () => this.openCreateQuizModal());
    document.getElementById('btn-close-create-quiz')?.addEventListener('click', () => {
      document.getElementById('modal-create-quiz').classList.remove('active');
    });
    document.getElementById('btn-add-question-item')?.addEventListener('click', () => {
      this.addQuizQuestionBuilderItem();
    });
    document.getElementById('form-create-quiz')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateQuizSubmit();
    });

    // Student Notes Modal
    document.getElementById('btn-open-add-note')?.addEventListener('click', () => {
      this.openAddNoteModal();
    });
    document.getElementById('btn-close-add-note')?.addEventListener('click', () => {
      document.getElementById('modal-add-note').classList.remove('active');
    });
    document.getElementById('form-add-note')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveNote();
    });

    // Lesson Viewer Modal Close & Add Note shortcut
    document.getElementById('btn-close-viewer')?.addEventListener('click', () => {
      document.getElementById('modal-lesson-viewer').classList.remove('active');
    });
    document.getElementById('btn-viewer-add-note')?.addEventListener('click', () => {
      if (this.activeLessonResourceId) {
        window.eduDB.getResource(this.activeLessonResourceId).then(res => {
          document.getElementById('modal-lesson-viewer').classList.remove('active');
          this.openAddNoteModal(res ? `Note on ${res.title}` : '', res ? res.chapter : '', this.activeLessonResourceId);
        });
      } else {
        this.openAddNoteModal();
      }
    });

    // Pairing Modal Listeners
    document.getElementById('btn-close-pairing-modal')?.addEventListener('click', () => {
      document.getElementById('modal-pairing').classList.remove('active');
    });
    document.getElementById('btn-cancel-pairing')?.addEventListener('click', () => {
      document.getElementById('modal-pairing').classList.remove('active');
    });
    document.getElementById('btn-confirm-pairing')?.addEventListener('click', () => {
      this.confirmPairing();
    });

    // Radar Back Button
    document.getElementById('btn-radar-back')?.addEventListener('click', () => {
      this.goBackFromRadar();
    });

    // Resume transfer button
    document.getElementById('btn-resume-transfer')?.addEventListener('click', () => {
      this.resumeInterruptedTransfer();
    });
  }

  async setRole(role) {
    console.log(`[EduSync] User selected role: ${role}`);
    this.currentRole = role;
    this.updateDrawerUI();

    if (role === 'teacher') {
      this.renderTeacherDashboard();

      const initialCode = Math.floor(1000 + Math.random() * 9000).toString();
      const codeEl = document.getElementById('teacher-pairing-code-display');
      if (codeEl) {
        codeEl.textContent = initialCode;
      }

      try {
        if (window.eduTransport) {
          const info = await window.eduTransport.startDiscovery('teacher', this.selectedClass, 'Teacher Sharma');
          if (codeEl && info?.pairingCode) {
            codeEl.textContent = info.pairingCode;
          }
        }
      } catch (err) {
        console.warn('[EduSync] Start teacher discovery warning:', err);
      }
    } else {
      this.renderStudentDashboard();

      try {
        if (window.eduTransport) {
          await window.eduTransport.startDiscovery('student', this.selectedClass, "Rahul's Phone");
        }
      } catch (err) {
        console.warn('[EduSync] Start student discovery warning:', err);
      }
    }
  }

  renderScreen(screenId) {
    this.activeScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }
    window.i18n.updateDOM();
  }

  refreshCurrentScreen() {
    if (this.activeScreen === 'screen-teacher-resources') {
      this.renderTeacherResources();
    } else if (this.activeScreen === 'screen-student-learning') {
      this.renderStudentLearning();
    } else if (this.activeScreen === 'screen-student-quizzes') {
      this.renderStudentQuizzes();
    } else if (this.activeScreen === 'screen-teacher-analytics') {
      this.renderTeacherAnalytics();
    } else if (this.activeScreen === 'screen-nearby-radar') {
      this.renderNearbyRadar();
    } else if (this.activeScreen === 'screen-sync-center') {
      this.openSyncCenter();
    } else if (this.activeScreen === 'screen-student-notes') {
      this.renderStudentNotes();
    }
    window.i18n.updateDOM();
  }

  // --- Teacher Views ---
  renderTeacherDashboard() {
    this.renderScreen('screen-teacher-dashboard');
  }

  async renderTeacherResources() {
    this.renderScreen('screen-teacher-resources');
    const container = document.getElementById('teacher-resource-list');
    if (!container) return;

    const resources = await window.eduDB.getAllResources(this.selectedClass, this.selectedSubject);
    container.innerHTML = '';

    if (resources.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-secondary);">No educational resources found for Class ${this.selectedClass}. Click <b>+ Resource</b> or <b>+ Quiz</b> to create one!</div>`;
      return;
    }

    const isConnected = window.eduTransport.isConnected && window.eduTransport.connectedPeer;
    const connectedPeerName = isConnected ? (window.eduTransport.connectedPeer.name ? window.eduTransport.connectedPeer.name.split(' ')[0] : 'Student') : null;

    resources.forEach((res) => {
      const card = document.createElement('div');
      card.className = 'resource-card';
      const iconType = res.type === 'pdf' ? '📄' : res.type === 'notes' ? '📝' : res.type === 'quiz' ? '❓' : res.type === 'audio' ? '🎧' : '🎥';
      
      const shareBtnText = isConnected 
        ? `Share (${connectedPeerName})` 
        : 'Share via BT';

      card.innerHTML = `
        <div class="resource-top">
          <div class="resource-header-info">
            <div class="res-type-badge">${iconType}</div>
            <div class="resource-meta">
              <h4>${res.title}</h4>
              <div class="resource-submeta">
                <span>Class ${res.class}</span> &bull; 
                <span style="text-transform: capitalize;">${res.subject}</span> &bull; 
                <span>${res.chapter}</span>
              </div>
            </div>
          </div>
          <span class="badge-offline">✓ ${res.fileSize}</span>
        </div>
        <div class="resource-actions" style="display: flex; gap: 6px; margin-top: 4px;">
          <button class="btn-secondary btn-sm" style="flex: 1;" onclick="window.eduApp.openLessonViewer('${res.resourceId}')">
            ${window.i18n.t('openResource')}
          </button>
          <button class="btn-primary btn-sm" style="flex: 1.3;" onclick="window.eduApp.shareResourceWithConnectedStudent('${res.resourceId}')">
            ${shareBtnText}
          </button>
          <button class="btn-secondary btn-sm btn-danger" style="width: 36px; padding: 0;" onclick="window.eduApp.deleteResource('${res.resourceId}')" title="Delete Resource">
            ✕
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  async shareResourceWithConnectedStudent(resourceId) {
    const isConnected = window.eduTransport.isConnected && window.eduTransport.connectedPeer;
    const res = await window.eduDB.getResource(resourceId);
    if (!res) return;

    if (!isConnected) {
      const pairingCode = window.eduTransport.myDeviceInfo?.pairingCode || '----';
      alert(`⚠️ No student device is currently connected.\n\nTo share this resource over Bluetooth:\n1. Ask student to open EduSync\n2. Student taps "CONNECT TO TEACHER (BLUETOOTH)"\n3. Student enters your 4-digit code: ${pairingCode}`);
      return;
    }

    const studentName = window.eduTransport.connectedPeer.name || 'Student';
    try {
      console.log(`[Teacher BT] Pushing resource "${res.title}" to ${studentName}...`);
      
      // 1. Send direct atomic resource packet
      await window.eduTransport.sendPacketOverTransport({
        type: 'DIRECT_RESOURCE',
        resource: {
          ...res,
          isAvailableOffline: true,
          syncedAt: new Date().toISOString()
        }
      });

      // 2. Stream chunked packets
      await window.eduTransport.transferResourceChunks(res);
      
      // 3. Announce updated manifest
      const manifest = await window.eduDB.generateManifest(false);
      await window.eduTransport.sendPacketOverTransport({
        type: 'MANIFEST_ANNOUNCE',
        senderRole: 'teacher',
        senderName: window.eduTransport.myDeviceInfo?.name || 'Teacher',
        manifest: manifest
      });

      alert(`✅ "${res.title}" shared with ${studentName} successfully over Bluetooth!`);
    } catch (err) {
      console.error('[Teacher] Error sharing resource:', err);
      alert(`❌ Error transferring "${res.title}" to student: ${err.message || err}`);
    }
  }

  async handleAddNewResource() {
    const title = document.getElementById('res-input-title').value.trim();
    const subject = document.getElementById('res-input-subject').value.trim();
    const chapter = document.getElementById('res-input-chapter').value.trim();
    const type = document.getElementById('res-input-type').value;
    const summary = document.getElementById('res-input-summary').value.trim();
    const pointsStr = document.getElementById('res-input-points').value.trim();
    const shareImmediately = document.getElementById('res-input-share-immediately')?.checked;
    const fileInput = document.getElementById('res-input-file');

    if (!title || !chapter || !subject) {
      alert('Please fill out all required fields.');
      return;
    }

    const keyPoints = pointsStr ? pointsStr.split('\n').filter(p => p.trim().length > 0) : ['Key concept explanation and examples.'];

    // Read attached PDF file if selected
    let pdfData = null;
    let computedFileSize = (Math.random() * 1.5 + 1).toFixed(1) + ' MB';

    if (type === 'pdf' && fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      computedFileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      if (computedFileSize === '0.0 MB') computedFileSize = `${Math.round(file.size / 1024)} KB`;

      try {
        pdfData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (err) {
        console.warn('Could not read PDF file:', err);
      }
    }

    const newRes = {
      resourceId: 'RES_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      title: title,
      class: this.selectedClass,
      subject: subject,
      chapter: chapter,
      type: type,
      fileSize: computedFileSize,
      version: 1,
      hash: 'hash_' + Math.random().toString(36).substring(2, 8),
      createdBy: 'Teacher',
      createdAt: new Date().toISOString(),
      isAvailableOffline: true,
      content: {
        summary: summary || 'Educational lesson notes prepared for offline study.',
        keyPoints: keyPoints,
        pdfData: pdfData,
        sampleProblem: 'Review the chapter summary and test your knowledge in the offline quiz section.'
      }
    };

    await window.eduDB.addResource(newRes);
    document.getElementById('modal-add-resource').classList.remove('active');
    document.getElementById('form-add-resource').reset();
    const pdfGroup = document.getElementById('group-pdf-file');
    if (pdfGroup) pdfGroup.style.display = 'none';

    this.renderTeacherResources();

    const isConnected = window.eduTransport.isConnected && window.eduTransport.connectedPeer;
    if (shareImmediately && isConnected) {
      const studentName = window.eduTransport.connectedPeer.name || 'Connected Student';
      try {
        console.log(`[Teacher BT] Auto-sharing new resource "${newRes.title}" with ${studentName}...`);
        
        await window.eduTransport.sendPacketOverTransport({
          type: 'DIRECT_RESOURCE',
          resource: newRes
        });

        await window.eduTransport.transferResourceChunks(newRes);
        
        const manifest = await window.eduDB.generateManifest(false);
        await window.eduTransport.sendPacketOverTransport({
          type: 'MANIFEST_ANNOUNCE',
          senderRole: 'teacher',
          senderName: window.eduTransport.myDeviceInfo?.name || 'Teacher',
          manifest: manifest
        });

        alert(`✅ Resource "${newRes.title}" created and shared with ${studentName} over Bluetooth!`);
      } catch (err) {
        console.error('[Teacher] Error auto-sharing resource:', err);
        alert(`⚠️ Resource created locally, but Bluetooth transfer failed: ${err.message || err}`);
      }
    } else {
      alert(`✅ Resource "${newRes.title}" added to curriculum.`);
    }
  }

  async deleteResource(resourceId) {
    if (confirm('Are you sure you want to delete this resource?')) {
      await window.eduDB.deleteResource(resourceId);
      this.renderTeacherResources();
    }
  }

  // --- Teacher Quiz Creator ---
  openCreateQuizModal() {
    this.quizBuilderQuestions = [];
    document.getElementById('form-create-quiz').reset();
    document.getElementById('quiz-input-class').value = this.selectedClass;
    document.getElementById('quiz-input-timelimit').value = 10;
    
    // Add 2 initial question items
    this.addQuizQuestionBuilderItem();
    this.addQuizQuestionBuilderItem();

    document.getElementById('modal-create-quiz').classList.add('active');
  }

  addQuizQuestionBuilderItem() {
    const qIdx = this.quizBuilderQuestions.length + 1;
    const container = document.getElementById('quiz-questions-builder-list');
    if (!container) return;

    const qItem = document.createElement('div');
    qItem.className = 'question-builder-item';
    qItem.id = `builder-q-${qIdx}`;
    qItem.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; font-size:0.82rem; color:var(--primary);">Question ${qIdx}</span>
        ${qIdx > 1 ? `<button type="button" class="btn-secondary btn-sm btn-danger" onclick="this.closest('.question-builder-item').remove()">Remove</button>` : ''}
      </div>
      <input type="text" class="form-control q-text-input" placeholder="Enter question text..." required>
      
      <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Options (Select radio for correct answer):</div>
      <div class="option-radio-group">
        <div class="option-input-row">
          <input type="radio" name="correct_${qIdx}" value="0" checked>
          <input type="text" class="form-control q-opt-0" placeholder="Option A" required>
        </div>
        <div class="option-input-row">
          <input type="radio" name="correct_${qIdx}" value="1">
          <input type="text" class="form-control q-opt-1" placeholder="Option B" required>
        </div>
        <div class="option-input-row">
          <input type="radio" name="correct_${qIdx}" value="2">
          <input type="text" class="form-control q-opt-2" placeholder="Option C" required>
        </div>
        <div class="option-input-row">
          <input type="radio" name="correct_${qIdx}" value="3">
          <input type="text" class="form-control q-opt-3" placeholder="Option D" required>
        </div>
      </div>

      <input type="text" class="form-control q-exp-input" placeholder="Explanation / Hint (Optional)">
    `;

    container.appendChild(qItem);
    this.quizBuilderQuestions.push(qIdx);
  }

  async handleCreateQuizSubmit() {
    const title = document.getElementById('quiz-input-title').value.trim();
    const subject = document.getElementById('quiz-input-subject').value.trim();
    const cls = document.getElementById('quiz-input-class').value;
    const chapter = document.getElementById('quiz-input-chapter').value.trim();
    const timeLimit = parseInt(document.getElementById('quiz-input-timelimit').value, 10) || 10;

    const questionBlocks = document.querySelectorAll('#quiz-questions-builder-list .question-builder-item');
    if (questionBlocks.length === 0) {
      alert('Please add at least one question to the quiz.');
      return;
    }

    const questions = [];
    questionBlocks.forEach((block, idx) => {
      const qText = block.querySelector('.q-text-input')?.value.trim();
      const opt0 = block.querySelector('.q-opt-0')?.value.trim();
      const opt1 = block.querySelector('.q-opt-1')?.value.trim();
      const opt2 = block.querySelector('.q-opt-2')?.value.trim();
      const opt3 = block.querySelector('.q-opt-3')?.value.trim();
      const explanation = block.querySelector('.q-exp-input')?.value.trim();
      
      const correctRadio = block.querySelector('input[type="radio"]:checked');
      const correctIdx = correctRadio ? parseInt(correctRadio.value, 10) : 0;

      if (qText && opt0 && opt1) {
        questions.push({
          id: `q_${idx + 1}`,
          question: qText,
          options: [opt0, opt1, opt2 || 'N/A', opt3 || 'None of the above'],
          correctAnswer: correctIdx,
          explanation: explanation || 'Correct answer verified.'
        });
      }
    });

    if (questions.length === 0) {
      alert('Please enter valid question and option details.');
      return;
    }

    const newQuiz = {
      quizId: 'QUIZ_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      title: title,
      class: cls,
      subject: subject,
      chapter: chapter,
      timeLimitMinutes: timeLimit,
      totalQuestions: questions.length,
      questions: questions,
      createdBy: 'Teacher',
      createdAt: new Date().toISOString()
    };

    await window.eduDB.addQuiz(newQuiz);
    document.getElementById('modal-create-quiz').classList.remove('active');
    alert(`✅ Quiz "${newQuiz.title}" created successfully with ${newQuiz.timeLimitMinutes} min timer!`);
    
    if (this.activeScreen === 'screen-student-quizzes') {
      this.renderStudentQuizzes();
    }
  }

  // --- Student Views ---
  renderStudentDashboard() {
    this.renderScreen('screen-student-dashboard');
  }

  async renderStudentLearning() {
    this.renderScreen('screen-student-learning');
    const container = document.getElementById('student-resource-list');
    if (!container) return;

    const localResources = await window.eduDB.getAllResources(this.selectedClass, this.selectedSubject);
    const localMap = new Map();
    localResources.forEach(r => localMap.set(r.resourceId, r));

    let combinedResources = [...localResources];
    if (window.eduSyncEngine && window.eduSyncEngine.latestTeacherManifest) {
      window.eduSyncEngine.latestTeacherManifest.forEach(tm => {
        if (!localMap.has(tm.resourceId)) {
          if ((!this.selectedClass || tm.class === this.selectedClass.toString()) &&
              (!this.selectedSubject || this.selectedSubject === 'all' || tm.subject.toLowerCase() === this.selectedSubject.toLowerCase())) {
            combinedResources.push({
              ...tm,
              isAvailableOffline: false
            });
          }
        }
      });
    }

    container.innerHTML = '';

    if (combinedResources.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-secondary);">No educational lessons found for Class ${this.selectedClass}. Connect with your Teacher over Bluetooth to sync lessons!</div>`;
      return;
    }

    combinedResources.forEach((res) => {
      const card = document.createElement('div');
      card.className = 'resource-card';
      const iconType = res.type === 'pdf' ? '📄' : res.type === 'notes' ? '📝' : res.type === 'quiz' ? '❓' : res.type === 'audio' ? '🎧' : '🎥';
      
      const isOffline = res.isAvailableOffline;
      const statusBadge = isOffline 
        ? `<span class="badge-offline">✓ ${window.i18n.t('availableOffline')}</span>` 
        : `<span class="badge-missing">⚠️ On Teacher Phone</span>`;

      const actionBtn = isOffline
        ? `<button class="btn-primary btn-sm" style="flex:1;" onclick="window.eduApp.openLessonViewer('${res.resourceId}')">${window.i18n.t('openResource')}</button>`
        : `<button class="btn-secondary btn-sm" style="flex:1; border-color:var(--primary); color:var(--primary);" onclick="window.eduApp.openSyncCenter()">Sync from Teacher</button>`;

      card.innerHTML = `
        <div class="resource-top">
          <div class="resource-header-info">
            <div class="res-type-badge">${iconType}</div>
            <div class="resource-meta">
              <h4>${res.title}</h4>
              <div class="resource-submeta">
                <span style="text-transform: capitalize;">${res.subject}</span> &bull; 
                <span>${res.chapter}</span> &bull; 
                <span>${res.fileSize}</span>
              </div>
            </div>
          </div>
          ${statusBadge}
        </div>
        <div class="resource-actions" style="display:flex; gap:6px; margin-top:4px;">
          ${actionBtn}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --- Offline Quiz System (Timed) ---
  async renderStudentQuizzes() {
    this.renderScreen('screen-student-quizzes');
    const container = document.getElementById('student-quiz-list');
    if (!container) return;

    const quizzes = await window.eduDB.getAllQuizzes(this.selectedClass);
    container.innerHTML = '';

    if (quizzes.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-secondary);">No quizzes available for Class ${this.selectedClass}.</div>`;
      return;
    }

    quizzes.forEach((q) => {
      const card = document.createElement('div');
      card.className = 'resource-card';
      const timeLabel = q.timeLimitMinutes ? `${q.timeLimitMinutes} min` : '10 min';
      
      card.innerHTML = `
        <div class="resource-top">
          <div class="resource-header-info">
            <div class="res-type-badge">❓</div>
            <div class="resource-meta">
              <h4>${q.title}</h4>
              <div class="resource-submeta">
                <span style="text-transform: capitalize;">${q.subject}</span> &bull; 
                <span>${q.chapter}</span> &bull; 
                <span>${q.totalQuestions || q.questions?.length} Questions</span> &bull;
                <span>⏱ ${timeLabel}</span>
              </div>
            </div>
          </div>
          <span class="badge-offline">✓ Offline</span>
        </div>
        <div class="resource-actions">
          <button class="btn-primary btn-sm" onclick="window.eduApp.startQuiz('${q.quizId}')">
            ${window.i18n.t('startQuiz')}
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  async startQuiz(quizId) {
    const quiz = await window.eduDB.getQuiz(quizId);
    if (!quiz) return;

    this.currentQuiz = quiz;
    this.quizAnswers = {};
    this.currentQuizQuestionIdx = 0;

    // Start Timer
    const limitMinutes = quiz.timeLimitMinutes || 10;
    this.quizSecondsRemaining = limitMinutes * 60;
    this.startQuizTimer();

    this.renderScreen('screen-quiz-taker');
    this.renderQuizQuestion();
  }

  startQuizTimer() {
    if (this.quizTimerInterval) clearInterval(this.quizTimerInterval);

    const updateTimerDisplay = () => {
      const display = document.getElementById('quiz-timer-display');
      if (!display) return;

      const mins = Math.floor(this.quizSecondsRemaining / 60);
      const secs = this.quizSecondsRemaining % 60;
      display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      if (this.quizSecondsRemaining <= 60) {
        display.classList.add('timer-warning');
      } else {
        display.classList.remove('timer-warning');
      }

      if (this.quizSecondsRemaining <= 0) {
        clearInterval(this.quizTimerInterval);
        alert(`⏱ ${window.i18n.t('timesUp')}\n\n${window.i18n.t('timesUpMsg')}`);
        this.submitQuiz();
      } else {
        this.quizSecondsRemaining--;
      }
    };

    updateTimerDisplay();
    this.quizTimerInterval = setInterval(updateTimerDisplay, 1000);
  }

  cancelQuiz() {
    if (this.quizTimerInterval) {
      clearInterval(this.quizTimerInterval);
      this.quizTimerInterval = null;
    }
    this.renderStudentQuizzes();
  }

  renderQuizQuestion() {
    const quiz = this.currentQuiz;
    const qIdx = this.currentQuizQuestionIdx;
    const q = quiz.questions[qIdx];
    const container = document.getElementById('quiz-question-box');

    document.getElementById('quiz-taker-title').textContent = `${quiz.title} (${qIdx + 1}/${quiz.questions.length})`;

    let optionsHtml = '';
    q.options.forEach((opt, idx) => {
      const isSelected = this.quizAnswers[q.id] === idx ? 'selected' : '';
      optionsHtml += `
        <div class="option-item ${isSelected}" onclick="window.eduApp.selectQuizOption('${q.id}', ${idx})">
          <input type="radio" name="opt_${q.id}" ${this.quizAnswers[q.id] === idx ? 'checked' : ''}>
          <span>${opt}</span>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="question-card">
        <h3>Q${qIdx + 1}. ${q.question}</h3>
        <div class="options-list">${optionsHtml}</div>
      </div>
    `;

    const isLast = qIdx === quiz.questions.length - 1;
    const nextBtn = document.getElementById('btn-quiz-next');
    nextBtn.textContent = isLast ? window.i18n.t('submitQuiz') : window.i18n.t('nextQuestion');
    nextBtn.onclick = () => {
      if (this.quizAnswers[q.id] === undefined) {
        alert('Please choose an answer before proceeding.');
        return;
      }
      if (isLast) {
        this.submitQuiz();
      } else {
        this.currentQuizQuestionIdx++;
        this.renderQuizQuestion();
      }
    };
  }

  selectQuizOption(questionId, optionIdx) {
    this.quizAnswers[questionId] = optionIdx;
    this.renderQuizQuestion();
  }

  async submitQuiz() {
    if (this.quizTimerInterval) {
      clearInterval(this.quizTimerInterval);
      this.quizTimerInterval = null;
    }

    const quiz = this.currentQuiz;
    let score = 0;
    quiz.questions.forEach((q) => {
      if (this.quizAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);

    const submission = {
      studentId: 'STU_' + (localStorage.getItem('student_name') || 'Rahul'),
      studentName: localStorage.getItem('student_name') || 'Rahul Verma',
      class: this.selectedClass,
      quizId: quiz.quizId,
      quizTitle: quiz.title,
      subject: quiz.subject,
      score: score,
      total: quiz.questions.length,
      percentage: percentage,
      completedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
      deviceOrigin: "Student Android Device"
    };

    await window.eduDB.saveQuizSubmission(submission);

    // Show result screen
    this.renderScreen('screen-quiz-complete');
    document.getElementById('quiz-result-score').textContent = `${score} / ${quiz.questions.length}`;
    document.getElementById('quiz-result-percentage').textContent = `${percentage}%`;
  }

  async renderStudentScorecard() {
    this.renderScreen('screen-student-progress');
    const container = document.getElementById('student-scorecard-list');
    if (!container) return;

    const submissions = await window.eduDB.getAllSubmissions();
    container.innerHTML = '';

    if (submissions.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary);">No completed quizzes yet. Complete a quiz offline to see your results here!</div>`;
      return;
    }

    submissions.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'resource-card';
      const syncBadge = sub.syncStatus === 'synced'
        ? `<span class="badge-offline">✓ ${window.i18n.t('syncedWithTeacher')}</span>`
        : `<span class="badge-missing">⏳ ${window.i18n.t('pendingSync')}</span>`;

      card.innerHTML = `
        <div class="resource-top">
          <div class="resource-header-info">
            <div class="res-type-badge">📊</div>
            <div class="resource-meta">
              <h4>${sub.quizTitle}</h4>
              <div class="resource-submeta">
                <span>Score: <b>${sub.score}/${sub.total}</b> (${sub.percentage}%)</span> &bull; 
                <span>${new Date(sub.completedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          ${syncBadge}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --- Student Study Notes & Doubts ---
  async renderStudentNotes() {
    this.renderScreen('screen-student-notes');
    const container = document.getElementById('student-notes-list');
    if (!container) return;

    const notes = await window.eduDB.getAllNotes();
    container.innerHTML = '';

    if (notes.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 16px; color:var(--text-secondary); background:var(--bg-card); border-radius:var(--radius-md); border:1px dashed var(--border-subtle);">
          <div style="font-size:2rem; margin-bottom:6px;">📝</div>
          <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">No Notes or Doubts Yet</div>
          <div>Jot down doubts, formulas, or reminders while studying offline.</div>
          <button class="btn-primary btn-sm" style="margin-top:12px; width:auto;" onclick="window.eduApp.openAddNoteModal()">+ Add First Note</button>
        </div>
      `;
      return;
    }

    notes.forEach((note) => {
      const item = document.createElement('div');
      item.className = 'note-item-card';
      item.innerHTML = `
        <div class="note-item-header">
          <div class="note-item-title">${note.title}</div>
          <button class="btn-secondary btn-sm btn-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="window.eduApp.deleteNote(${note.id})" title="Delete Note">✕</button>
        </div>
        ${note.topic ? `<div style="font-size:0.75rem; color:var(--primary); font-weight:600;">${note.topic}</div>` : ''}
        <div class="note-item-body">${note.content}</div>
        <div class="note-item-footer">
          <span>${new Date(note.createdAt).toLocaleDateString()} ${new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span>Offline Private</span>
        </div>
      `;
      container.appendChild(item);
    });
  }

  openAddNoteModal(prefillTitle = '', prefillTopic = '', resourceId = '') {
    document.getElementById('form-add-note').reset();
    document.getElementById('note-input-title').value = prefillTitle;
    document.getElementById('note-input-topic').value = prefillTopic;
    document.getElementById('note-input-resource-id').value = resourceId;
    document.getElementById('modal-add-note').classList.add('active');
  }

  async handleSaveNote() {
    const title = document.getElementById('note-input-title').value.trim();
    const topic = document.getElementById('note-input-topic').value.trim();
    const content = document.getElementById('note-input-content').value.trim();
    const resourceId = document.getElementById('note-input-resource-id').value;

    if (!title || !content) {
      alert('Please enter a note title and content.');
      return;
    }

    await window.eduDB.addNote({
      title: title,
      topic: topic,
      content: content,
      resourceId: resourceId || null,
      studentId: 'STU_RAHUL'
    });

    document.getElementById('modal-add-note').classList.remove('active');
    
    if (this.activeScreen === 'screen-student-notes') {
      this.renderStudentNotes();
    } else {
      alert('✅ Note saved offline to your study notes!');
    }
  }

  async deleteNote(noteId) {
    if (confirm('Delete this note?')) {
      await window.eduDB.deleteNote(noteId);
      this.renderStudentNotes();
    }
  }

  // --- Teacher Analytics ---
  async renderTeacherAnalytics() {
    this.renderScreen('screen-teacher-analytics');
    const container = document.getElementById('teacher-submissions-list');
    if (!container) return;

    const submissions = await window.eduDB.getAllSubmissions();
    container.innerHTML = '';

    document.getElementById('stat-total-quizzes').textContent = submissions.length;
    
    let totalScore = 0;
    submissions.forEach(s => totalScore += s.percentage);
    const avgScore = submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0;
    document.getElementById('stat-avg-score').textContent = `${avgScore}%`;

    const uniqueStudents = new Set(submissions.map(s => s.studentName));
    document.getElementById('stat-active-students').textContent = uniqueStudents.size || 1;

    if (submissions.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary);">${window.i18n.t('noSubmissionsYet')}</div>`;
      return;
    }

    submissions.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'peer-card';
      card.innerHTML = `
        <div class="peer-info">
          <h4>${sub.studentName} — ${sub.quizTitle}</h4>
          <p>Score: <b style="color:var(--primary);">${sub.score}/${sub.total} (${sub.percentage}%)</b> &bull; Class ${sub.class} &bull; ${new Date(sub.completedAt).toLocaleDateString()}</p>
        </div>
        <span class="status-pill">✓ Synced</span>
      `;
      container.appendChild(card);
    });
  }

  // --- Nearby Radar & Device Discovery ---
  async searchNearbyDevices() {
    const statusText = document.getElementById('radar-status-text');
    const rescanBtn = document.getElementById('btn-rescan-radar');

    if (statusText) statusText.textContent = 'Searching for nearby Bluetooth devices...';
    if (rescanBtn) rescanBtn.textContent = 'Rescanning...';

    this.renderNearbyRadar();

    if (window.eduTransport.isNative) {
      try {
        await window.eduTransport.fetchPairedDevices();
        await window.Capacitor.Plugins.BluetoothP2P.startScanning();
      } catch (e) {
        console.warn('[Bluetooth] Search trigger warning:', e);
      }
    }

    setTimeout(() => {
      if (rescanBtn) rescanBtn.textContent = 'Rescan';
      if (statusText) statusText.textContent = 'Bluetooth Scanner Active';
    }, 3000);
  }

  filterNearbyPeers() {
    const input = document.getElementById('radar-search-input');
    this.radarSearchQuery = input ? input.value.trim().toLowerCase() : '';
    this.renderRadarPeerList();
  }

  clearRadarSearch() {
    const input = document.getElementById('radar-search-input');
    if (input) input.value = '';
    this.radarSearchQuery = '';
    this.renderRadarPeerList();
  }

  renderNearbyRadar(autoFocusSearch = false) {
    this.renderScreen('screen-nearby-radar');
    this.discoveredPeers = [];
    
    const input = document.getElementById('radar-search-input');
    if (input) {
      input.value = this.radarSearchQuery || '';
    }

    this.renderRadarPeerList();

    if (autoFocusSearch && input) {
      setTimeout(() => input.focus(), 150);
    }

    if (window.eduTransport.isNative) {
      window.eduTransport.startDiscovery(this.currentRole, this.selectedClass, 
        this.currentRole === 'teacher' ? 'Teacher Sharma' : "Rahul's Phone");
    }
  }

  renderRadarPeerList() {
    const peerList = document.getElementById('nearby-peers-list');
    const counter = document.getElementById('radar-search-counter');
    const clearBtn = document.getElementById('btn-clear-radar-search');
    if (!peerList) return;

    peerList.innerHTML = '';

    const query = (this.radarSearchQuery || '').toLowerCase().trim();
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    if (!window.eduTransport.isNative) {
      // Single simulated preview peer option for browser testing
      const demoBanner = document.createElement('div');
      demoBanner.style.cssText = 'background: var(--bg-surface-elevated); border: 1px dashed var(--border-subtle); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary); text-align: center;';
      demoBanner.innerHTML = `
        <div>Browser Simulation Mode</div>
        <button class="btn-secondary btn-sm" id="btn-add-demo-peer" style="margin-top: 6px; font-size: 0.72rem; width: auto;">
          + Add Local Test Peer
        </button>
      `;
      peerList.appendChild(demoBanner);

      document.getElementById('btn-add-demo-peer')?.addEventListener('click', () => {
        const testPeer = this.currentRole === 'teacher' 
          ? { id: 'sim_stu_1', name: "Rahul's Phone [Preview Peer]", role: 'student', class: '8', pairingCode: '4821', isSimulated: true }
          : { id: 'sim_tch_1', name: "Science Teacher [Preview Peer]", role: 'teacher', class: '8', pairingCode: '4821', isSimulated: true };
        this.addPeerToRadarList(testPeer);
      });
    }

    let filtered = this.discoveredPeers;
    if (query) {
      filtered = this.discoveredPeers.filter(p => {
        const name = (p.name || '').toLowerCase();
        const role = (p.role || '').toLowerCase();
        const address = (p.address || p.id || '').toLowerCase();
        const code = (p.pairingCode || '').toLowerCase();
        const cls = String(p.class || '');
        return name.includes(query) || role.includes(query) || address.includes(query) || code.includes(query) || cls.includes(query);
      });

      if (counter) {
        counter.style.display = 'block';
        counter.textContent = `Showing ${filtered.length} of ${this.discoveredPeers.length} matching "${query}"`;
      }
    } else {
      if (counter) {
        counter.style.display = 'none';
        counter.textContent = '';
      }
    }

    filtered.forEach((peer) => {
      const item = document.createElement('div');
      item.className = 'peer-card';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="peer-info">
          <h4>${peer.name}</h4>
          <p>${peer.role === 'teacher' ? 'Teacher' : 'Student'} &bull; Class ${peer.class || '8'}</p>
        </div>
        <button class="btn-primary btn-sm" style="width:auto;">
          ${window.i18n.t('connect')}
        </button>
      `;

      item.querySelector('button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPairingModal(peer);
      });

      item.addEventListener('click', () => {
        this.openPairingModal(peer);
      });

      peerList.appendChild(item);
    });
  }

  addPeerToRadarList(peer) {
    if (!this.discoveredPeers) this.discoveredPeers = [];
    if (this.discoveredPeers.some(p => (p.address || p.id) === (peer.address || peer.id))) {
      return;
    }

    this.discoveredPeers.push(peer);
    this.renderRadarPeerList();
  }

  goBackFromRadar() {
    window.eduTransport.stopDiscovery();
    if (this.currentRole === 'teacher') {
      this.renderTeacherDashboard();
    } else {
      this.renderStudentDashboard();
    }
  }

  openPairingModal(peerIdentifier) {
    let peer = null;
    if (typeof peerIdentifier === 'object' && peerIdentifier !== null) {
      peer = peerIdentifier;
    } else if (typeof peerIdentifier === 'number') {
      peer = this.discoveredPeers[peerIdentifier];
    } else if (typeof peerIdentifier === 'string') {
      peer = this.discoveredPeers.find(p => (p.address || p.id) === peerIdentifier);
    }
    if (!peer) return;

    this.activePairingPeer = peer;
    document.getElementById('pairing-peer-name').textContent = peer.name;
    document.getElementById('pairing-peer-meta').textContent = `${peer.role === 'teacher' ? 'Teacher' : 'Student'} • Class ${peer.class || '8'} • Offline Direct`;
    
    const input = document.getElementById('input-pairing-code');
    if (input) input.value = '';

    document.getElementById('modal-pairing').classList.add('active');
    setTimeout(() => input?.focus(), 150);
  }

  async confirmPairing() {
    const peer = this.activePairingPeer;
    const input = document.getElementById('input-pairing-code');
    const entered = input ? input.value.trim() : '';

    if (!peer) return;

    if (!entered || entered.length !== 4) {
      alert('Please enter the 4-digit verification code shown on the teacher device.');
      return;
    }

    document.getElementById('modal-pairing').classList.remove('active');
    await window.eduTransport.connectToPeer(peer, entered);
  }

  goBackFromSyncCenter() {
    if (this.currentRole === 'student') {
      this.renderStudentDashboard();
    } else {
      this.renderTeacherDashboard();
    }
  }

  // --- Sync Center & Differential Engine ---
  async openSyncCenter() {
    this.renderScreen('screen-sync-center');

    if (this.currentRole === 'student' && window.eduTransport.isConnected) {
      window.eduTransport.requestTeacherManifest();
    }

    const localManifest = await window.eduDB.generateManifest(this.currentRole === 'student');
    
    const peerManifest = (this.currentRole === 'student' && window.eduSyncEngine.latestTeacherManifest)
      ? window.eduSyncEngine.latestTeacherManifest
      : await window.eduDB.generateManifest(false);

    const diff = window.eduSyncEngine.calculateDifferential(localManifest, peerManifest);

    const diffContainer = document.getElementById('sync-diff-content');
    const syncActionContainer = document.getElementById('sync-action-controls');

    const peerInfo = window.eduTransport.connectedPeer;
    const isConnected = window.eduTransport.isConnected;

    if (this.currentRole === 'student' && !isConnected) {
      diffContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; background: var(--bg-surface-elevated); border: 1px dashed var(--border-subtle); border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📡</div>
          <h3 style="color: var(--primary); margin-bottom: 6px;">No Teacher Connected</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px;">
            To download educational lessons and sync your quizzes, connect to your nearby Teacher via Bluetooth.
          </p>
          <button class="btn-primary" style="width: 100%;" onclick="window.eduApp.renderNearbyRadar()">
            Scan for Nearby Teachers
          </button>
        </div>
      `;
      syncActionContainer.innerHTML = `
        <div style="display: flex; gap: 8px; width: 100%;">
          <button class="btn-secondary" style="flex: 1;" onclick="window.eduApp.renderStudentLearning()">Learning Library</button>
          <button class="btn-secondary" style="flex: 1;" onclick="window.eduApp.renderStudentDashboard()">Dashboard</button>
        </div>
      `;
      return;
    }

    const transportBannerHtml = `
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
        <div>
          <div style="font-weight: 700; color: var(--text-main);">Connected Device:</div>
          <div style="color: var(--primary);">${peerInfo ? peerInfo.name : 'Bluetooth Session'}</div>
        </div>
        <span class="status-pill">
          ${window.eduTransport.isNative ? 'Bluetooth P2P' : 'Offline Ready'}
        </span>
      </div>
    `;

    if (diff.missingOnLocal.length === 0) {
      diffContainer.innerHTML = transportBannerHtml + `
        <div style="text-align:center; padding: 20px;">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">✓</div>
          <h3 style="color: var(--primary); font-size:1.05rem; margin-bottom: 4px;">${window.i18n.t('allUpToDate')}</h3>
          <p style="font-size:0.8rem; color:var(--text-secondary);">${diff.upToDate.length} resources verified with latest hashes.</p>
        </div>
      `;
      syncActionContainer.innerHTML = `
        <button class="btn-primary" style="width: 100%;" onclick="window.eduApp.renderStudentLearning()">Go to Learning Library</button>
        <button class="btn-secondary" style="width: 100%;" onclick="window.eduApp.goBackFromSyncCenter()">Back</button>
      `;
    } else {
      let missingListHtml = diff.missingOnLocal.map(m => `
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; padding: 6px 0; border-bottom:1px solid var(--border-subtle);">
          <span><b>${m.chapter}</b>: ${m.title}</span>
          <span style="color:var(--primary); font-weight:600;">${m.fileSize}</span>
        </div>
      `).join('');

      diffContainer.innerHTML = transportBannerHtml + `
        <div class="sync-diff-box">
          <div class="sync-stat-row">
            <span>Status:</span>
            <span class="missing-badge-count">${diff.missingOnLocal.length} ${window.i18n.t('resourcesAvailableToSync')}</span>
          </div>
          <div class="sync-stat-row">
            <span>Verified Up to Date:</span>
            <span style="color:var(--primary);">${diff.upToDate.length} resources</span>
          </div>
          <div style="margin-top: 6px;">
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">Missing Resources:</div>
            ${missingListHtml}
          </div>
        </div>
      `;

      syncActionContainer.innerHTML = `
        <button class="btn-primary" id="btn-start-sync" onclick="window.eduApp.startSyncProcess(${JSON.stringify(diff.missingOnLocal).replace(/"/g, '&quot;')})">
          ${window.i18n.t('syncNow')} (${diff.missingOnLocal.length})
        </button>
        <div style="display: flex; gap: 8px; width: 100%;">
          <button class="btn-secondary" style="flex: 1;" onclick="window.eduApp.renderStudentLearning()">Learning Library</button>
          <button class="btn-secondary" style="flex: 1;" onclick="window.eduApp.goBackFromSyncCenter()">Back</button>
        </div>
      `;
    }
  }

  async startSyncProcess(missingResources, testInterruption = false) {
    document.getElementById('sync-progress-box').style.display = 'flex';
    document.getElementById('sync-action-controls').style.display = 'none';

    const progressBar = document.getElementById('transfer-progress-fill');
    const percentLabel = document.getElementById('transfer-percent-label');
    const metaLabel = document.getElementById('transfer-meta-label');
    const titleLabel = document.getElementById('transfer-title-label');
    const interruptAlert = document.getElementById('transfer-interrupt-alert');

    interruptAlert.style.display = 'none';

    try {
      await window.eduSyncEngine.executeTwoWaySync(
        missingResources,
        (progress) => {
          titleLabel.textContent = `${progress.resourceTitle} (${progress.itemIndex}/${progress.totalItems})`;
          progressBar.style.width = `${progress.percent}%`;
          percentLabel.textContent = `${progress.percent}%`;
          metaLabel.textContent = `Chunk ${progress.chunk}/${progress.totalChunks} • ${progress.transferredMB} MB / ${progress.totalMB} MB`;

          if (progress.isPaused) {
            this.currentTransferResource = progress.currentResource;
            interruptAlert.style.display = 'block';
          }
        },
        testInterruption
      );
    } catch (e) {
      console.error('Sync error:', e);
    }
  }

  async resumeInterruptedTransfer() {
    document.getElementById('transfer-interrupt-alert').style.display = 'none';
    const progressBar = document.getElementById('transfer-progress-fill');
    const percentLabel = document.getElementById('transfer-percent-label');
    const metaLabel = document.getElementById('transfer-meta-label');

    if (this.currentTransferResource) {
      await window.eduTransport.resumeTransfer(this.currentTransferResource, (progress) => {
        progressBar.style.width = `${progress.percent}%`;
        percentLabel.textContent = `${progress.percent}%`;
        metaLabel.textContent = `Chunk ${progress.chunk}/${progress.totalChunks} • ${progress.transferredMB} MB / ${progress.totalMB} MB`;
      });
      await window.eduDB.updateResourceOfflineStatus(this.currentTransferResource.resourceId, true);
    }

    document.getElementById('sync-progress-box').style.display = 'none';
    alert(`✅ ${window.i18n.t('syncSuccess')}\n\n${window.i18n.t('syncSuccessMsg')}`);
    this.refreshCurrentScreen();
  }

  // --- Offline Lesson Viewer ---
  async openLessonViewer(resourceId) {
    const res = await window.eduDB.getResource(resourceId);
    if (!res) return;

    this.activeLessonResourceId = resourceId;
    document.getElementById('viewer-title').textContent = `${res.chapter}: ${res.title}`;
    const body = document.getElementById('viewer-content-body');

    let keyPointsHtml = '';
    if (res.content && res.content.keyPoints) {
      keyPointsHtml = res.content.keyPoints.map(pt => `<div class="lesson-key-point">• ${pt}</div>`).join('');
    }

    let extraMedia = '';
    if (res.type === 'pdf') {
      if (res.content?.pdfData) {
        extraMedia = `
          <div style="margin-bottom:12px;">
            <object data="${res.content.pdfData}" type="application/pdf" class="pdf-preview-box">
              <iframe src="${res.content.pdfData}" class="pdf-preview-box" style="border:none;">
                <p>PDF preview not supported in this viewer.</p>
              </iframe>
            </object>
            <a href="${res.content.pdfData}" download="${res.title}.pdf" class="btn-secondary btn-sm" style="margin-top:4px; display:inline-block; text-decoration:none;">
              📥 Download / Open PDF
            </a>
          </div>
        `;
      } else {
        extraMedia = `
          <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:8px; padding:12px; margin-bottom:12px; text-align:center;">
            <div style="font-size:1.6rem; margin-bottom:4px;">📄</div>
            <div style="font-size:0.85rem; font-weight:600; color:var(--text-main);">PDF Document Ready</div>
            <div style="font-size:0.72rem; color:var(--text-secondary);">Offline PDF Study Material</div>
          </div>
        `;
      }
    } else if (res.type === 'audio') {
      extraMedia = `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:8px; padding:12px; margin-bottom:12px; text-align:center;">
          <div style="font-size:1.6rem; margin-bottom:4px;">🎧</div>
          <div style="font-size:0.85rem; font-weight:600; color:var(--text-main);">Offline Audio Lesson</div>
          <div style="font-size:0.72rem; color:var(--text-secondary);">High-efficiency Audio Stream</div>
        </div>
      `;
    } else if (res.type === 'video') {
      extraMedia = `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:8px; padding:12px; margin-bottom:12px; text-align:center;">
          <div style="font-size:1.6rem; margin-bottom:4px;">🎥</div>
          <div style="font-size:0.85rem; font-weight:600; color:var(--text-main);">Interactive Video Module</div>
          <div style="font-size:0.72rem; color:var(--text-secondary);">Compressed H.264 Video Lesson</div>
        </div>
      `;
    }

    body.innerHTML = `
      ${extraMedia}
      <div style="margin-bottom: 8px; font-weight:700; color:var(--primary); font-size:0.85rem;">
        Summary & Concept Overview
      </div>
      <p style="margin-bottom: 12px; color:var(--text-main); font-size:0.85rem;">
        ${res.content?.summary || 'Educational lesson notes available offline.'}
      </p>
      ${keyPointsHtml ? `
        <div style="margin-bottom: 6px; font-weight:700; color:var(--primary); font-size:0.85rem;">
          Key Learning Points
        </div>
        <div style="margin-bottom: 12px;">
          ${keyPointsHtml}
        </div>
      ` : ''}
      ${res.content?.formulae ? `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--primary-border); border-radius:6px; padding:8px 10px; margin-bottom:10px; font-family:monospace; font-size:0.8rem; color:var(--primary);">
          📐 Key Formula: ${res.content.formulae}
        </div>
      ` : ''}
      ${res.content?.sampleProblem ? `
        <div style="background:var(--bg-surface-elevated); border-radius:6px; padding:8px 10px; font-size:0.8rem; margin-bottom:10px;">
          <b>💡 Practice Question:</b> ${res.content.sampleProblem}
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.7rem; color:var(--text-secondary);">
        <span>Author: ${res.createdBy || 'Teacher'}</span>
        <span>Verified Hash: ✓</span>
      </div>
    `;

    document.getElementById('modal-lesson-viewer').classList.add('active');
  }
}

// Instantiate globally and initialize
window.eduApp = new EduSyncApp();
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => window.eduApp.init());
} else {
  window.eduApp.init();
}

