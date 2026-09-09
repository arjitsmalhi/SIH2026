// RuralRise Localization Engine (English & Hindi)
const i18n = {
  currentLang: localStorage.getItem('ruralrise_lang') || localStorage.getItem('edusync_lang') || 'en',

  translations: {
    en: {
      appName: 'RuralRise',
      appTagline: 'Learn Offline. Sync Anywhere.',
      selectRole: 'Select Your Role to Begin',
      teacher: 'Teacher',
      student: 'Student',
      teacherDesc: 'Organize subjects, share lessons & monitor student progress offline.',
      studentDesc: 'Access offline classes, take quizzes & sync your work with nearby teachers.',
      welcomeTeacher: 'Welcome, Teacher',
      welcomeStudent: 'Welcome, Student',
      class: 'Class',
      selectClass: 'Select Class',
      availableOffline: 'Available Offline',
      downloading: 'Syncing...',
      missing: 'Not on this device',
      
      // Teacher Navigation & Actions
      myResources: 'My Resources',
      nearbyStudents: 'Nearby Students',
      syncCenter: 'Sync Center',
      studentProgress: 'Student Progress',
      addResource: 'Add Resource',
      shareWithStudents: 'Share with Nearby Students',
      addNewLesson: 'Add New Lesson / Resource',
      
      // Student Navigation & Actions
      myLearning: 'My Learning Library',
      myQuizzes: 'Offline Quizzes',
      myProgress: 'My Scorecard',
      syncWithTeacher: 'Sync with Teacher',
      findNearbyTeachers: 'Find Nearby Teachers',
      backToLearningLibrary: 'My Learning Library',
      
      // Resource Details & Viewer
      resourceTitle: 'Resource Title',
      subject: 'Subject',
      chapter: 'Chapter',
      type: 'Resource Type',
      fileSize: 'Size',
      version: 'Version',
      actions: 'Actions',
      openResource: 'Open Lesson',
      downloadResource: 'Sync to Device',
      deleteResource: 'Delete',
      doneReading: 'Done Reading',
      
      // Doubts Feature
      askDoubt: 'Ask a Doubt',
      askDoubtTitle: 'Have a Doubt in this Lesson?',
      doubtPrompt: 'Type your question or query below. It will be saved offline and synced with your teacher.',
      doubtPlaceholder: 'Describe your doubt or question clearly (e.g., How does the transposition method work in step 2?)...',
      yourName: 'Your Name / Student ID',
      submitDoubt: 'Post Doubt',
      doubtPosted: 'Doubt Recorded Offline',
      doubtPostedMsg: 'Your doubt has been saved! It will automatically sync to your teacher during your next Bluetooth connection.',
      lessonDoubts: 'Doubts Asked on this Lesson',
      noDoubtsLesson: 'No doubts posted for this lesson yet. Feel free to ask anytime!',
      studentDoubts: 'Student Doubts & Questions',
      allDoubts: 'All Doubts',
      doubtStatusPending: 'Pending Teacher Review',
      doubtStatusResolved: 'Answered / Resolved',
      
      // Resource Types
      pdf: 'PDF Document',
      notes: 'Interactive Notes',
      quiz: 'Practice Quiz',
      video: 'Video Lesson',
      audio: 'Audio Explanation',
      
      // Subjects
      mathematics: 'Mathematics',
      science: 'Science',
      english: 'English',
      socialScience: 'Social Science',
      
      // Quizzes
      startQuiz: 'Start Quiz',
      nextQuestion: 'Next Question',
      submitQuiz: 'Submit Quiz',
      quizComplete: 'Quiz Complete',
      score: 'Score',
      savedOffline: 'Saved Offline',
      savedOfflineMsg: 'Your result is saved safely. It will automatically sync when you connect to your teacher.',
      syncedWithTeacher: 'Synced with Teacher',
      pendingSync: 'Pending Sync',
      reviewAnswers: 'Review Answers',
      tryAgain: 'Try Again',
      
      // Sync & Pairing
      nearbyDevices: 'Nearby Devices Radar',
      searchingNearby: 'Scanning for nearby RuralRise devices...',
      connect: 'Connect',
      connectedTo: 'Connected to',
      disconnect: 'Disconnect',
      teacherVerification: 'Device Verification Code',
      enterCode: 'Enter 4-digit code shown on peer device:',
      verifyAndConnect: 'Verify & Pair',
      comparingManifests: 'Comparing educational manifests...',
      manifestDiffTitle: 'Smart Content Synchronization',
      allUpToDate: 'All learning materials are up to date!',
      resourcesAvailableToSync: 'resources ready to sync',
      syncNow: 'Start Smart Sync',
      syncingContent: 'Synchronizing Educational Content',
      transferInterrupted: 'Connection interrupted. Transfer paused.',
      resumeTransfer: 'Resume Transfer',
      syncSuccess: 'Sync Complete!',
      syncSuccessMsg: 'All missing educational resources and student quiz results were transferred successfully without using the internet.',
      
      // Analytics
      quizSubmissions: 'Student Quiz Submissions',
      classAverage: 'Class Average',
      quizzesTaken: 'Total Quizzes Taken',
      activeLearners: 'Active Learners',
      noSubmissionsYet: 'No quiz submissions synced yet. Connect with students to sync their results.',
      
      // General UI & Theme
      dashboard: 'Dashboard',
      menu: 'Menu',
      helpAbout: 'Help / About',
      switchRole: 'Switch Role',
      navigation: 'Navigation',
      aboutTitle: 'About RuralRise',
      aboutDesc: 'RuralRise is an offline-first educational platform designed for rural schools. It enables teachers and students to share lessons, complete quizzes, ask doubts, and sync student progress peer-to-peer using Bluetooth without needing any internet connection.',
      versionLabel: 'Version',
      appMode: 'Mode',
      offlineMeshReady: '100% Offline P2P Mesh',
      back: 'Back',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      language: 'Language',
      switchLanguage: 'हिंदी में बदलें',
      status: 'Status',
      mode: 'Mode',
      theme: 'Theme',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      offlineModeBadge: '100% Offline Ready',
      p2pActiveBadge: 'P2P Mesh Ready'
    },
    hi: {
      appName: 'रूरलराइज़ (RuralRise)',
      appTagline: 'ऑफ़लाइन सीखें। कहीं भी सिंक करें।',
      selectRole: 'शुरू करने के लिए अपनी भूमिका चुनें',
      teacher: 'शिक्षक (Teacher)',
      student: 'विद्यार्थी (Student)',
      teacherDesc: 'पाठ्यक्रम व्यवस्थित करें, पाठ साझा करें और बिना इंटरनेट प्रगति देखें।',
      studentDesc: 'ऑफ़लाइन पाठ पढ़ें, क्विज़ हल करें और पास के शिक्षक से सिंक करें।',
      welcomeTeacher: 'नमस्ते, शिक्षक महोदय',
      welcomeStudent: 'नमस्ते, विद्यार्थी',
      class: 'कक्षा',
      selectClass: 'कक्षा चुनें',
      availableOffline: 'ऑफ़लाइन उपलब्ध',
      downloading: 'सिंक हो रहा है...',
      missing: 'इस डिवाइस पर उपलब्ध नहीं',
      
      // Teacher Navigation & Actions
      myResources: 'मेरी अध्ययन सामग्री',
      nearbyStudents: 'आस-पास के विद्यार्थी',
      syncCenter: 'सिंक केंद्र',
      studentProgress: 'विद्यार्थी प्रगति',
      addResource: 'नई सामग्री जोड़ें',
      shareWithStudents: 'विद्यार्थियों के साथ साझा करें',
      addNewLesson: 'नया पाठ / सामग्री जोड़ें',
      
      // Student Navigation & Actions
      myLearning: 'मेरी शिक्षण लाइब्रेरी',
      myQuizzes: 'ऑफ़लाइन क्विज़',
      myProgress: 'मेरा प्रगति पत्र (Scorecard)',
      syncWithTeacher: 'शिक्षक के साथ सिंक करें',
      findNearbyTeachers: 'पास के शिक्षक खोजें',
      backToLearningLibrary: 'मेरी शिक्षण लाइब्रेरी',
      
      // Resource Details & Viewer
      resourceTitle: 'पाठ का नाम',
      subject: 'विषय',
      chapter: 'अध्याय',
      type: 'सामग्री का प्रकार',
      fileSize: 'आकार',
      version: 'संस्करण',
      actions: 'कार्रवाई',
      openResource: 'पाठ खोलें',
      downloadResource: 'डिवाइस में सिंक करें',
      deleteResource: 'हटाएं',
      doneReading: 'पढ़ाई पूरी हुई',
      
      // Doubts Feature
      askDoubt: 'शंका / प्रश्न पूछें',
      askDoubtTitle: 'क्या इस पाठ में कोई शंका है?',
      doubtPrompt: 'अपना प्रश्न नीचे लिखें। यह ऑफ़लाइन सुरक्षित रहेगा और शिक्षक से कनेक्ट होने पर सिंक हो जाएगा।',
      doubtPlaceholder: 'अपनी शंका या प्रश्न विस्तार से लिखें (उदा. चरण 2 में पक्षांतरण विधि कैसे काम करती है?)...',
      yourName: 'आपका नाम / रोल नंबर',
      submitDoubt: 'शंका भेजें',
      doubtPosted: 'शंका ऑफ़लाइन दर्ज हुई',
      doubtPostedMsg: 'आपकी शंका सुरक्षित हो गई है! अगली बार ब्लूटूथ से जुड़ने पर यह आपके शिक्षक के पास पहुंच जाएगी।',
      lessonDoubts: 'इस पाठ पर पूछी गई शंकाएं',
      noDoubtsLesson: 'इस पाठ पर अभी तक कोई शंका नहीं पूछी गई है। आप कभी भी पूछ सकते हैं!',
      studentDoubts: 'विद्यार्थियों की शंकाएं व प्रश्न',
      allDoubts: 'सभी शंकाएं',
      doubtStatusPending: 'शिक्षक की समीक्षा प्रतीक्षित',
      doubtStatusResolved: 'समाधान / उत्तर दिया गया',
      
      // Resource Types
      pdf: 'पीडीएफ़ दस्तावेज़',
      notes: 'डिजिटल नोट्स',
      quiz: 'अभ्यास क्विज़',
      video: 'वीडियो पाठ',
      audio: 'ऑडियो व्याख्या',
      
      // Subjects
      mathematics: 'गणित (Mathematics)',
      science: 'विज्ञान (Science)',
      english: 'अंग्रेज़ी (English)',
      socialScience: 'सामाजिक विज्ञान (Social Science)',
      
      // Quizzes
      startQuiz: 'क्विज़ शुरू करें',
      nextQuestion: 'अगला प्रश्न',
      submitQuiz: 'क्विज़ जमा करें',
      quizComplete: 'क्विज़ पूर्ण हुआ',
      score: 'प्राप्तांक (Score)',
      savedOffline: 'ऑफ़लाइन सुरक्षित किया गया',
      savedOfflineMsg: 'आपका परिणाम सुरक्षित है। शिक्षक से कनेक्ट होते ही यह अपने-आप सिंक हो जाएगा।',
      syncedWithTeacher: 'शिक्षक से सिंक हो चुका है',
      pendingSync: 'सिंक होना बाकी',
      reviewAnswers: 'उत्तरों की समीक्षा करें',
      tryAgain: 'पुनः प्रयास करें',
      
      // Sync & Pairing
      nearbyDevices: 'आस-पास के डिवाइस रडार',
      searchingNearby: 'आस-पास के रूरलराइज़ डिवाइस खोजे जा रहे हैं...',
      connect: 'कनेक्ट करें',
      connectedTo: 'जुड़ा हुआ है',
      disconnect: 'डिस्कनेक्ट',
      teacherVerification: 'डिवाइस सत्यापन कोड',
      enterCode: 'अन्य डिवाइस पर दिखने वाला 4-अंकों का कोड दर्ज करें:',
      verifyAndConnect: 'सत्यापित और कनेक्ट करें',
      comparingManifests: 'पाठ्यक्रम सूचियों की तुलना हो रही है...',
      manifestDiffTitle: 'स्मार्ट शिक्षण सामग्री सिंक',
      allUpToDate: 'सभी अध्ययन सामग्री पहले से अपडेट है!',
      resourcesAvailableToSync: 'सामग्रियां सिंक के लिए तैयार हैं',
      syncNow: 'स्मार्ट सिंक शुरू करें',
      syncingContent: 'शिक्षण सामग्री स्थानांतरित हो रही है',
      transferInterrupted: 'कनेक्शन टूटा। स्थानांतरण रुका।',
      resumeTransfer: 'फिर से शुरू करें (Resume)',
      syncSuccess: 'सिंक पूर्ण हुआ!',
      syncSuccessMsg: 'सभी छूटी हुई अध्ययन सामग्री और क्विज़ परिणाम बिना इंटरनेट के सफलतापूर्वक सिंक हो गए हैं।',
      
      // Analytics
      quizSubmissions: 'विद्यार्थी क्विज़ परिणाम',
      classAverage: 'कक्षा का औसत',
      quizzesTaken: 'कुल पूर्ण क्विज़',
      activeLearners: 'सक्रिय शिक्षार्थी',
      noSubmissionsYet: 'अभी कोई परिणाम सिंक नहीं हुआ है। विद्यार्थियों से कनेक्ट करके सिंक करें।',
      
      // General UI & Theme
      dashboard: 'डैशबोर्ड',
      menu: 'मेनू',
      helpAbout: 'सहायता / विवरण',
      switchRole: 'भूमिका बदलें',
      navigation: 'नेविगेशन',
      aboutTitle: 'रूरलराइज़ के बारे में',
      aboutDesc: 'रूरलराइज़ ग्रामीण विद्यालयों के लिए डिज़ाइन किया गया एक ऑफ़लाइन शिक्षा मंच है। यह शिक्षकों और विद्यार्थियों को बिना इंटरनेट ब्लूटूथ के माध्यम से पाठ साझा करने, क्विज़ हल करने, शंकाएं पूछने और अंक सिंक करने की सुविधा देता है।',
      versionLabel: 'संस्करण',
      appMode: 'मोड',
      offlineMeshReady: '100% ऑफ़लाइन पीयर-टू-पीयर',
      back: 'वापस',
      close: 'बंद करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      language: 'भाषा',
      switchLanguage: 'Switch to English',
      status: 'स्थिति',
      mode: 'मोड',
      theme: 'थीम (Theme)',
      darkMode: 'डार्क मोड (Dark)',
      lightMode: 'लाइट मोड (Light)',
      offlineModeBadge: '100% ऑफ़लाइन तैयार',
      p2pActiveBadge: 'पीयर-टू-पीयर तैयार'
    }
  },

  t(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    if (this.translations['en'] && this.translations['en'][key]) {
      return this.translations['en'][key];
    }
    return key;
  },

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('ruralrise_lang', lang);
      document.documentElement.lang = lang;
      this.updateDOM();
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
  },

  toggleLanguage() {
    const nextLang = this.currentLang === 'en' ? 'hi' : 'en';
    this.setLanguage(nextLang);
  },

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
        el.setAttribute('placeholder', translation);
      } else {
        el.textContent = translation;
      }
    });
  }
};

window.i18n = i18n;
