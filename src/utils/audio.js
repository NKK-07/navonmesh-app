// NAVONMESH Web Speech API Helper for Low-Literacy Farmer Audio Support

export function speakText(text, langCode = 'en') {
  if (!('speechSynthesis' in window)) {
    alert("Audio speech synthesis is not supported on this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; // Slightly slower speed for high clarity in rural settings
  utterance.pitch = 1.0;

  // Language BCP-47 mapping for speech synthesis
  const langMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    as: 'as-IN',
    ne: 'ne-NP',
    mni: 'hi-IN', // Hindi/Indian accent fallback if Manipuri unavailable
    kha: 'en-IN', // Indian English fallback for Khasi
    mizo: 'en-IN', // Indian English fallback for Mizo
    nag: 'hi-IN'  // Hindi/Indian English fallback for Nagamese
  };

  utterance.lang = langMap[langCode] || 'en-IN';

  window.speechSynthesis.speak(utterance);
}

export function speakCurrentStatus(state, langCode = 'en') {
  const temp = Math.round(state.temperature);
  const humid = Math.round(state.humidity);
  const bat = Math.round(state.batterySoc);
  const crop = state.activeCrop.name;
  const days = state.shelfLifeDays;

  let speechMessage = "";

  if (langCode === 'hi') {
    speechMessage = `कोल्ड स्टोरेज तापमान ${temp} डिग्री है। नमी ${humid} प्रतिशत है। बैटरी ${bat} प्रतिशत है। फसल ${crop} है। शेष सुरक्षित समय ${days} दिन है। स्थिति सुरक्षित है।`;
  } else if (langCode === 'as') {
    speechMessage = `উষ্ণতা ${temp} ডিগ্ৰী। আৰ্দ্ৰতা ${humid} শতাংশ। বেটাৰী ${bat} শতাংশ। শাক পাচলি ${crop}। বাকী সময় ${days} দিন। অৱস্থা সুৰক্ষিত।`;
  } else if (langCode === 'ne') {
    speechMessage = `तापक्रम ${temp} डिग्री छ। आद्रता ${humid} प्रतिशत छ। ब्याट्री ${bat} प्रतिशत छ। बाली ${crop} हो। बाँकी अवधि ${days} दिन छ।`;
  } else {
    speechMessage = `Cold storage temperature is ${temp} degrees Celsius. Humidity is ${humid} percent. Battery is ${bat} percent. Stored produce is ${crop}. Estimated remaining shelf life is ${days} days. System is healthy.`;
  }

  speakText(speechMessage, langCode);
}
