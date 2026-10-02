import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'hi' | 'bn' | 'en' | 'mr' | 'te' | 'ta' | 'gu' | 'kn' | 'ur';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;        // Native name (e.g. हिन्दी, বাংলা)
  englishName: string; // Hindi, Bengali
  flag: string;
  speakers: string;    // e.g. "52.8 Cr", "9.7 Cr"
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳', speakers: '52.8 Cr', region: 'North & Central India' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', flag: '🇮🇳', speakers: '9.7 Cr', region: 'West Bengal & Tripura' },
  { code: 'en', name: 'English', englishName: 'English', flag: '🌐', speakers: 'Official', region: 'Pan-India & Global' },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi', flag: '🇮🇳', speakers: '8.3 Cr', region: 'Maharashtra & Goa' },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', flag: '🇮🇳', speakers: '8.1 Cr', region: 'Andhra Pradesh & Telangana' },
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', flag: '🇮🇳', speakers: '6.9 Cr', region: 'Tamil Nadu & Puducherry' },
  { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', flag: '🇮🇳', speakers: '5.5 Cr', region: 'Gujarat' },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', flag: '🇮🇳', speakers: '4.4 Cr', region: 'Karnataka' },
  { code: 'ur', name: 'اردو', englishName: 'Urdu', flag: '🇮🇳', speakers: '5.1 Cr', region: 'Pan-India' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  // Bengali
  bn: {
    app_name: 'TrackMitra',
    tagline: 'দাদা কা ভরসা ২৪ ঘণ্টা সেফটি',
    test_mode_banner: '🧪 টেস্ট মোড - পেমেন্ট অফ - ফ্রি ৫ ফ্রেন্ডস টেস্টিং',
    nav_home: 'হোম',
    nav_map: 'লাইভ ম্যাপ',
    nav_chat: 'চ্যাট',
    nav_groups: 'গ্রুপসমূহ',
    status_active: '২৪ ঘণ্টা সক্রিয়',
    status_trial: 'ট্রায়াল',
    status_standby: 'স্ট্যান্ডবাই',
    status_offline: 'অফলাইন',
    search_placeholder: 'গ্রুপ বা সদস্য খুঁজুন...',
    direct_call: 'সরাসরি কল',
    chip_live_radar: 'লাইভ রাডার',
    chip_ai_observer: 'এআই অবজারভার',
    chip_aadhaar: 'আধার ভেরিফাইড',
    chip_group_lock: 'গ্রুপ লক',
    sos_alert: 'জরুরী এসওএস',
    sos_press_hold: '৩ সেকেন্ড চেপে রাখুন',
    sos_dispatched: 'জরুরী এসওএস সিগন্যাল পাঠানো হয়েছে',
    video_conference: 'ইমার্জেন্সি ভিডিও কনফারেন্স',
    swipe_up_video: 'লাইভ ভিডিও কনফারেন্সের জন্য উপরে সোয়াইপ করুন',
    create_group_btn: 'নতুন সেফটি গ্রুপ তৈরি করুন',
    add_member: 'সদস্য যোগ করুন',
    invite_link: 'ইনভাইট লিঙ্ক',
    whatsapp_invite: 'হোয়াটসঅ্যাপ ইনভাইট',
    members_count: 'সদস্য সংখ্যা',
    safe_zone: 'সুরক্ষিত অঞ্চল',
    threat_monitoring: 'হুমকি নজরদারি',
    battery_shield: 'ব্যাটারি শিল্ড',
    select_language: 'ভাষা নির্বাচন করুন',
    choose_preferred_language: 'আপনার পছন্দের ভারতীয় ভাষা বেছে নিন',
    mobile_mode: 'মোবাইল স্ক্রিন ভিউ (Samsung F51)',
    mobile_mode_desc: 'রিয়েল স্মার্টফোন ফ্রেম প্রিভিউ',
    switch_view: 'স্ক্রিন ভিউ পরিবর্তন',
  },

  // Hindi
  hi: {
    app_name: 'TrackMitra',
    tagline: 'दादा का भरोसा 24 घंटे सुरक्षा',
    test_mode_banner: '🧪 टेस्ट मोड - पेमेंट बंद - मुफ्त 5 मित्र टेस्टिंग',
    nav_home: 'होम',
    nav_map: 'लाइव मैप',
    nav_chat: 'चैट',
    nav_groups: 'ग्रुप्स',
    status_active: '24 घंटे सक्रिय',
    status_trial: 'ट्रायल',
    status_standby: 'स्टैंडबाय',
    status_offline: 'ऑफलाइन',
    search_placeholder: 'ग्रुप या सदस्य खोजें...',
    direct_call: 'सीधी कॉल',
    chip_live_radar: 'लाइव रडार',
    chip_ai_observer: 'AI आब्जर्वर',
    chip_aadhaar: 'आधार सत्यापित',
    chip_group_lock: 'ग्रुप लॉक',
    sos_alert: 'आपातकालीन SOS',
    sos_press_hold: '3 सेकंड दबाए रखें',
    sos_dispatched: 'आपातकालीन SOS अलर्ट भेज दिया गया',
    video_conference: 'आपातकालीन वीडियो कॉन्फ्रेंस',
    swipe_up_video: 'लाइव वीडियो कॉन्फ्रेंस के लिए ऊपर स्वाइप करें',
    create_group_btn: 'नया सुरक्षा ग्रुप बनाएं',
    add_member: 'सदस्य जोड़ें',
    invite_link: 'आमंत्रण लिंक',
    whatsapp_invite: 'व्हाट्सएप आमंत्रण',
    members_count: 'सदस्य संख्या',
    safe_zone: 'सुरक्षित क्षेत्र',
    threat_monitoring: 'खतरा निगरानी',
    battery_shield: 'बैटरी शील्ड',
    select_language: 'भाषा चुनें',
    choose_preferred_language: 'अपनी पसंदीदा भारतीय भाषा चुनें',
    mobile_mode: 'मोबाइल स्क्रीन व्यू (Samsung F51)',
    mobile_mode_desc: 'असली स्मार्टफोन फ्रेम प्रीव्यू',
    switch_view: 'स्क्रीन व्यू बदलें',
  },

  // English
  en: {
    app_name: 'TrackMitra',
    tagline: 'DADA KA BHAROSA 24H Traveling Escort',
    test_mode_banner: '🧪 TEST MODE - Payment OFF - 5 Friends Testing',
    nav_home: 'Home',
    nav_map: 'Live Map',
    nav_chat: 'Chat',
    nav_groups: 'Groups',
    status_active: '24H ACTIVE',
    status_trial: 'TRIAL',
    status_standby: 'STANDBY',
    status_offline: 'OFFLINE',
    search_placeholder: 'Search groups, members...',
    direct_call: 'Direct Call',
    chip_live_radar: 'Live Radar',
    chip_ai_observer: 'AI Observer',
    chip_aadhaar: 'Aadhaar Verified',
    chip_group_lock: 'Group Lock',
    sos_alert: 'EMERGENCY SOS',
    sos_press_hold: 'PRESS & HOLD 3 SEC',
    sos_dispatched: 'Emergency SOS alert dispatched',
    video_conference: 'Emergency Video Conference',
    swipe_up_video: 'Swipe up for Live Emergency Video Conference',
    create_group_btn: 'Create New Safety Group',
    add_member: 'Add Member',
    invite_link: 'Invite Link',
    whatsapp_invite: 'WhatsApp Invite',
    members_count: 'Members Count',
    safe_zone: 'Safe Zone',
    threat_monitoring: 'Threat Monitoring',
    battery_shield: 'Battery Shield',
    select_language: 'Select Language',
    choose_preferred_language: 'Choose your preferred Indian language',
    mobile_mode: 'Mobile Screen View (Samsung F51)',
    mobile_mode_desc: 'Real smartphone frame preview',
    switch_view: 'Switch Screen View',
  },

  // Marathi
  mr: {
    app_name: 'TrackMitra',
    tagline: 'दादा का भरोसा 24 तास सुरक्षा',
    test_mode_banner: '🧪 टेस्ट मोड - पेमेंट बंद - मोफत 5 मित्र टेस्टिंग',
    nav_home: 'मुख्यपृष्ठ',
    nav_map: 'थेट नकाशा',
    nav_chat: 'गप्पा',
    nav_groups: 'गट',
    status_active: '24 तास सक्रिय',
    status_trial: 'ट्रायल',
    status_standby: 'स्टँडबाय',
    status_offline: 'ऑफलाइन',
    search_placeholder: 'गट किंवा सदस्य शोधा...',
    direct_call: 'थेट कॉल',
    chip_live_radar: 'थेट रडार',
    chip_ai_observer: 'AI निरीक्षक',
    chip_aadhaar: 'आधार पडताळणी',
    chip_group_lock: 'गट लॉक',
    sos_alert: 'तातडीचे SOS',
    sos_press_hold: '3 सेकंद दाबून ठेवा',
    sos_dispatched: 'तातडीचा SOS इशारा पाठवला गेला',
    video_conference: 'तातडीची व्हिडिओ परिषद',
    swipe_up_video: 'थेट व्हिडिओ परिषदेसाठी वर स्वाइप करा',
    create_group_btn: 'नवीन सुरक्षा गट तयार करा',
    add_member: 'सदस्य जोडा',
    invite_link: 'आमंत्रण लिंक',
    whatsapp_invite: 'व्हॉट्सअॅप आमंत्रण',
    members_count: 'सदस्य संख्या',
    safe_zone: 'सुरक्षित क्षेत्र',
    threat_monitoring: 'धोका देखरेख',
    battery_shield: 'बॅटरी शिल्ड',
    select_language: 'भाषा निवडा',
    choose_preferred_language: 'आपली पसंतीची भारतीय भाषा निवडा',
    mobile_mode: 'मोबाइल स्क्रीन व्ह्यू (Samsung F51)',
    mobile_mode_desc: 'खरा स्मार्टफोन फ्रेम पूर्वावलोकन',
    switch_view: 'स्क्रीन व्ह्यू बदला',
  },

  // Telugu
  te: {
    app_name: 'TrackMitra',
    tagline: 'దాదా కా భరోసా 24 గంటల భద్రత',
    test_mode_banner: '🧪 టెస్ట్ మోడ్ - చెల్లింపు లేదు - ఉచిత 5 స్నేహితుల టెస్టింగ్',
    nav_home: 'హోమ్',
    nav_map: 'లైవ్ మ్యాప్',
    nav_chat: 'చాట్',
    nav_groups: 'గ్రూపులు',
    status_active: '24 గంటలు యాక్టివ్',
    status_trial: 'ట్రయల్',
    status_standby: 'స్టాండ్‌బై',
    status_offline: 'ఆఫ్‌లైన్',
    search_placeholder: 'గ్రూపులు లేదా సభ్యులను వెతకండి...',
    direct_call: 'డైరెక్ట్ కాల్',
    chip_live_radar: 'లైవ్ రాడార్',
    chip_ai_observer: 'AI అబ్జర్వర్',
    chip_aadhaar: 'ఆధార్ ధృవీకరించబడింది',
    chip_group_lock: 'గ్రూప్ లాక్',
    sos_alert: 'అత్యవసర SOS',
    sos_press_hold: '3 సెకన్లు నొక్కి పట్టుకోండి',
    sos_dispatched: 'అత్యవసర SOS హెచ్చరిక పంపబడింది',
    video_conference: 'అత్యవసర వీడియో కాన్ఫరెన్స్',
    swipe_up_video: 'లైవ్ వీడియో కాన్ఫరెన్స్ కోసం పైకి స్వైప్ చేయండి',
    create_group_btn: 'కొత్త సేఫ్టీ గ్రూప్ సృష్టించండి',
    add_member: 'సభ్యుడిని జోడించండి',
    invite_link: 'ఆహ్వాన లింక్',
    whatsapp_invite: 'వాట్సాప్ ఆహ్వానం',
    members_count: 'సభ్యుల సంఖ్య',
    safe_zone: 'సురక్షిత ప్రాంతం',
    threat_monitoring: 'ముప్పు పర్యవేక్షణ',
    battery_shield: 'బ్యాటరీ షీల్డ్',
    select_language: 'భాషను ఎంచుకోండి',
    choose_preferred_language: 'మీకు నచ్చిన భారతీయ భాషను ఎంచుకోండి',
    mobile_mode: 'మొబైల్ స్క్రీన్ వ్యూ (Samsung F51)',
    mobile_mode_desc: 'నిజమైన స్మార్ట్‌ఫోన్ ఫ్రేమ్ ప్రివ్యూ',
    switch_view: 'స్క్రీన్ వ్యూ మార్చండి',
  },

  // Tamil
  ta: {
    app_name: 'TrackMitra',
    tagline: 'தாதா கா பரோசா 24 மணி நேர பாதுகாப்பு',
    test_mode_banner: '🧪 சோதனை முறை - கட்டணம் இல்லை - இலவச 5 நண்பர்கள் சோதனை',
    nav_home: 'முகப்பு',
    nav_map: 'நேரலை வரைபடம்',
    nav_chat: 'அரட்டை',
    nav_groups: 'குழுக்கள்',
    status_active: '24 மணி நேரம் செயலில்',
    status_trial: 'சோதனை',
    status_standby: 'காத்திருப்பு',
    status_offline: 'ஆஃப்லைன்',
    search_placeholder: 'குழுக்கள் அல்லது உறுப்பினர்களைத் தேடுங்கள்...',
    direct_call: 'நேரடி அழைப்பு',
    chip_live_radar: 'நேரலை ரேடார்',
    chip_ai_observer: 'AI பார்வையாளர்',
    chip_aadhaar: 'ஆதார் சரிபார்க்கப்பட்டது',
    chip_group_lock: 'குழு பூட்டு',
    sos_alert: 'அவசர SOS',
    sos_press_hold: '3 வினாடிகள் அழுத்திப் பிடிக்கவும்',
    sos_dispatched: 'அவசர SOS எச்சரிக்கை அனுப்பப்பட்டது',
    video_conference: 'அவசர வீடியோ மாநாடு',
    swipe_up_video: 'நேரலை வீடியோ மாநாட்டிற்கு மேலே ஸ்வைப் செய்யவும்',
    create_group_btn: 'புதிய பாதுகாப்புக் குழுவை உருவாக்கவும்',
    add_member: 'உறுப்பினரைச் சேர்க்கவும்',
    invite_link: 'அழைப்பு இணைப்பு',
    whatsapp_invite: 'வாட்ஸ்அப் அழைப்பு',
    members_count: 'உறுப்பினர்கள் எண்ணிக்கை',
    safe_zone: 'பாதுகாப்பான மண்டலம்',
    threat_monitoring: 'அச்சுறுத்தல் கண்காணிப்பு',
    battery_shield: 'பேட்டரி கவசம்',
    select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    choose_preferred_language: 'உங்கள் விருப்பமான இந்திய மொழியைத் தேர்வுசெய்யவும்',
    mobile_mode: 'மொபைல் திரை காட்சி (Samsung F51)',
    mobile_mode_desc: 'உண்மையான ஸ்மார்ட்போன் சட்ட முன்னோட்டம்',
    switch_view: 'திரைக் காட்சியை மாற்றவும்',
  },

  // Gujarati
  gu: {
    app_name: 'TrackMitra',
    tagline: 'દાદા કા ભરોસો 24 કલાક સુરક્ષા',
    test_mode_banner: '🧪 ટેસ્ટ મોડ - પેમેન્ટ બંધ - મફત 5 મિત્રો ટેસ્ટિંગ',
    nav_home: 'હોમ',
    nav_map: 'લાઇવ નકશો',
    nav_chat: 'ચેટ',
    nav_groups: 'જૂથો',
    status_active: '24 કલાક સક્રિય',
    status_trial: 'ટ્રાયલ',
    status_standby: 'સ્ટેન્ડબાય',
    status_offline: 'ઑફલાઇન',
    search_placeholder: 'જૂથો અથવા સભ્યો શોધો...',
    direct_call: 'ડાયરેક્ટ કૉલ',
    chip_live_radar: 'લાઇવ રડાર',
    chip_ai_observer: 'AI નિરીક્ષક',
    chip_aadhaar: 'આધાર ચકાસાયેલ',
    chip_group_lock: 'જૂથ લૉક',
    sos_alert: 'કટોકટી SOS',
    sos_press_hold: '3 સેકન્ડ દબાવી રાખો',
    sos_dispatched: 'કટોકટી SOS ચેતવણી મોકલાઈ',
    video_conference: 'કટોકટી વિડિઓ કૉન્ફરન્સ',
    swipe_up_video: 'લાઇવ વિડિઓ કૉન્ફરન્સ માટે ઉપર સ્વાઇપ કરો',
    create_group_btn: 'નવું સુરક્ષા જૂથ બનાવો',
    add_member: 'સભ્ય ઉમેરો',
    invite_link: 'આમંત્રણ લિંક',
    whatsapp_invite: 'વ્હોટ્સએપ આમંત્રણ',
    members_count: 'સભ્યોની સંખ્યા',
    safe_zone: 'સુરક્ષિત ક્ષેત્ર',
    threat_monitoring: 'જોખમ દેખરેખ',
    battery_shield: 'બૅટરી શિલ્ડ',
    select_language: 'ભાષા પસંદ કરો',
    choose_preferred_language: 'તમારી પસંદગીની ભારતીય ભાષા પસંદ કરો',
    mobile_mode: 'મોબાઇલ સ્ક્રીન વ્યૂ (Samsung F51)',
    mobile_mode_desc: 'વાસ્તવિક સ્માર્ટફોન ફ્રેમ પ્રીવ્યૂ',
    switch_view: 'સ્ક્રીન વ્યૂ બદલો',
  },

  // Kannada
  kn: {
    app_name: 'TrackMitra',
    tagline: 'ದಾದಾ ಕಾ ಭರೋಸಾ 24 ಗಂಟೆಗಳ ಭದ್ರತೆ',
    test_mode_banner: '🧪 ಟೆಸ್ಟ್ ಮೋಡ್ - ಪಾವತಿ ಇಲ್ಲ - ಉಚಿತ 5 ಸ್ನೇಹಿತರ ಪರೀಕ್ಷೆ',
    nav_home: 'ಮುಖಪುಟ',
    nav_map: 'ಲೈವ್ ನಕ್ಷೆ',
    nav_chat: 'ಚಾಟ್',
    nav_groups: 'ಗುಂಪುಗಳು',
    status_active: '24 ಗಂಟೆ ಸಕ್ರಿಯ',
    status_trial: 'ಪ್ರಯೋಗ',
    status_standby: 'ಸ್ಟ್ಯಾಂಡ್‌ಬೈ',
    status_offline: 'ಆಫ್‌ಲೈನ್',
    search_placeholder: 'ಗುಂಪುಗಳು ಅಥವಾ ಸದಸ್ಯರನ್ನು ಹುಡುಕಿ...',
    direct_call: 'ನೇರ ಕರೆ',
    chip_live_radar: 'ಲೈವ್ ರಾಡಾರ್',
    chip_ai_observer: 'AI ವೀಕ್ಷಕ',
    chip_aadhaar: 'ಆಧಾರ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    chip_group_lock: 'ಗುಂಪು ಲಾಕ್',
    sos_alert: 'ತುರ್ತು SOS',
    sos_press_hold: '3 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಹಿಡಿದುಕೊಳ್ಳಿ',
    sos_dispatched: 'ತುರ್ತು SOS ಎಚ್ಚರಿಕೆ ರವಾನಿಸಲಾಗಿದೆ',
    video_conference: 'ತುರ್ತು ವೀಡಿಯೊ ಸಮ್ಮೇಳನ',
    swipe_up_video: 'ಲೈವ್ ವೀಡಿಯೊ ಸಮ್ಮೇಳನಕ್ಕಾಗಿ ಮೇಲಕ್ಕೆ ಸ್ವೈಪ್ ಮಾಡಿ',
    create_group_btn: 'ಹೊಸ ಸುರಕ್ಷತಾ ಗುಂಪು ರಚಿಸಿ',
    add_member: 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ',
    invite_link: 'ಆಹ್ವಾನ ಲಿಂಕ್',
    whatsapp_invite: 'ವಾಟ್ಸಾಪ್ ಆಹ್ವಾನ',
    members_count: 'ಸದಸ್ಯರ ಸಂಖ್ಯೆ',
    safe_zone: 'ಸುರಕ್ಷಿತ ವಲಯ',
    threat_monitoring: 'ಬೆದರಿಕೆ ಮೇಲ್ವಿಚಾರಣೆ',
    battery_shield: 'ಬ್ಯಾಟರಿ ಶೀಲ್ಡ್',
    select_language: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    choose_preferred_language: 'ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಭಾರತೀಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    mobile_mode: 'ಮೊಬೈಲ್ ಪರದೆ ವೀಕ್ಷಣೆ (Samsung F51)',
    mobile_mode_desc: 'ನೈಜ ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಫ್ರೇಮ್ ಪೂರ್ವವೀಕ್ಷಣೆ',
    switch_view: 'ಪರದೆ ವೀಕ್ಷಣೆ ಬದಲಾಯಿಸಿ',
  },

  // Urdu
  ur: {
    app_name: 'TrackMitra',
    tagline: 'دادا کا بھروسہ 24 گھنٹے سیکیورٹی',
    test_mode_banner: '🧪 ٹیسٹ موڈ - پیمنٹ بند - مفت 5 دوست ٹیسٹنگ',
    nav_home: 'ہوم',
    nav_map: 'لائیو نقشہ',
    nav_chat: 'چیٹ',
    nav_groups: 'گروپس',
    status_active: '24 گھنٹے فعال',
    status_trial: 'ٹرائل',
    status_standby: 'اسٹینڈ بائی',
    status_offline: 'آف لائن',
    search_placeholder: 'گروپس یا ممبران تلاش کریں...',
    direct_call: 'براہ راست کال',
    chip_live_radar: 'لائیو راڈار',
    chip_ai_observer: 'AI مبصر',
    chip_aadhaar: 'آدھار تصدیق شدہ',
    chip_group_lock: 'گروپ لاک',
    sos_alert: 'ہنگامی SOS',
    sos_press_hold: '3 سیکنڈ دبائے رکھیں',
    sos_dispatched: 'ہنگامی SOS الرٹ روانہ کر دیا گیا',
    video_conference: 'ہنگامی ویڈیو کانفرنس',
    swipe_up_video: 'لائیو ویڈیو کانفرنس کے لیے اوپر سوائپ کریں',
    create_group_btn: 'نیا حفاظتی گروپ بنائیں',
    add_member: 'ممبر شامل کریں',
    invite_link: 'دعوت نامہ لنک',
    whatsapp_invite: 'واٹس ایپ دعوت نامہ',
    members_count: 'ممبران کی تعداد',
    safe_zone: 'محفوظ زون',
    threat_monitoring: 'خطرے کی نگرانی',
    battery_shield: 'بیٹری شیلڈ',
    select_language: 'زبان منتخب کریں',
    choose_preferred_language: 'اپنی پسندیدہ ہندوستانی زبان منتخب کریں',
    mobile_mode: 'موبائل اسکرین ویو (Samsung F51)',
    mobile_mode_desc: 'اصلی اسمارٹ فون فریم پیش نظارہ',
    switch_view: 'اسکرین ویو تبدیل کریں',
  }
};

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
  isLangModalOpen: boolean;
  setIsLangModalOpen: (open: boolean) => void;
  activeLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('trackmitra_lang') as LanguageCode;
      if (saved && TRANSLATIONS[saved]) return saved;
    }
    return 'bn'; // Default to Bengali as per user language & app theme
  });

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('trackmitra_lang', lang);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.bn;
    if (langDict[key]) return langDict[key];
    const fallbackDict = TRANSLATIONS.en;
    if (fallbackDict && fallbackDict[key]) return fallbackDict[key];
    return defaultText || key;
  };

  const activeLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[1];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        isLangModalOpen,
        setIsLangModalOpen,
        activeLanguageInfo
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
