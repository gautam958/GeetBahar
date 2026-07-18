// Geet Bahar — Bundled bilingual content.
// This is the source of truth for first paint: the page is fully readable
// the instant it loads, with no dependency on the Azure backend. If a real
// backend is configured (see config.js), api.js will layer live edits on
// top of this later — but nothing is ever empty by default.

window.I18N_DATA = {
  hi: {
    org: { name: "गीत बहार संगीत समूह" },
    nav: { admin: "एडमिन" },
    hero: {
      eyebrow: "झारखंड सरकार सूचीबद्ध · देवघर से",
      title_hi: "श्रावणी मेला की धुन, हर मंच तक",
      title_en: "गीत बहार संगीत समूह",
      lede: "देवघर के श्रावणी मेले में रचा-बसा ऑर्केस्ट्रा और लोक प्रस्तुतियाँ, साथ ही सरकार-अनुमोदित जन संचार और नुक्कड़ नाटक कार्यक्रम — मंदिर प्रांगण से लेकर झारखंड के हर मंच तक लय पहुँचाते हुए।",
      cta_primary: "उपलब्धता देखें",
      cta_secondary: "प्रस्तुतियाँ देखें",
      stat1: "आयोजित कार्यक्रम",
      stat2: "जिलों में पहुँच",
      stat3: "प्रशिक्षित कलाकार"
    },
    about: {
      eyebrow: "हम कौन हैं",
      lead_hi: "उत्तम कुमार के नेतृत्व में, संगीत और सामाजिक जागरूकता का संगम",
      p1: "गीत बहार संगीत समूह की स्थापना देवघर में उत्तम कुमार द्वारा की गई, ताकि क्षेत्र की ऑर्केस्ट्रा और लोक परंपराएं मंदिर उत्सवों और सरकारी मंचों दोनों के लिए तैयार रहें। यह समूह झारखंड सरकार के साथ पंजीकृत और सांस्कृतिक-संचार कार्यक्रमों के लिए सूचीबद्ध है।",
      p2: "हर श्रावण मास में, कांवड़िए रातभर चलकर बैद्यनाथ धाम पहुँचते हैं — गीत बहार का ऑर्केस्ट्रा वर्षों से इस यात्रा के साथ प्रस्तुति देता रहा है, भीड़, मौसम और मेले के मिज़ाज के अनुसार अपनी प्रस्तुति को ढालते हुए।",
      p3: "उत्सव के मौसम के बाहर, यही कलाकार जन संचार कार्यक्रमों और नुक्कड़ नाटकों में अपनी मंच-कला ले जाते हैं — स्वास्थ्य, शिक्षा और नागरिक संदेशों को कुछ ऐसा बनाते हुए जिसे गाँव का चौराहा सच में रुककर देखे।",
      chip1: "झारखंड सरकार पंजीकृत",
      chip2: "सूचीबद्ध — जन संचार",
      chip3: "सूचीबद्ध — नुक्कड़ नाटक"
    },
    services: {
      eyebrow: "हम क्या प्रस्तुत करते हैं",
      title: "छह प्रारूप, एक ही टोली",
      intro: "दो घंटे के विवाह ऑर्केस्ट्रा से लेकर जिला-स्तरीय जागरूकता अभियान तक — वही मुख्य टीम प्रारूप बदलती है, स्तर नहीं।",
      s1: { name: "श्रावणी मेला ऑर्केस्ट्रा", desc: "श्रावण मास भर कांवड़िया मार्ग पर प्रतिरात्रि आयोजित बड़े स्तर का शास्त्रीय व लोक ऑर्केस्ट्रा।" },
      s2: { name: "जन संचार कार्यक्रम", desc: "सरकार-अनुमोदित जन संचार प्रस्तुतियाँ — स्वास्थ्य, साक्षरता और नागरिक-नीति संदेश खुले चौराहों के लिए।" },
      s3: { name: "नुक्कड़ नाटक", desc: "उस भीड़ के लिए बनाया गया सड़क नाटक जो रुकने की योजना में नहीं थी — छोटे, तीखे दृश्य, एक बार में एक नागरिक संदेश।" },
      s4: { name: "निजी कार्यक्रम ऑर्केस्ट्रा", desc: "विवाह, उद्घाटन और उत्सव — उन्हीं कलाकारों द्वारा जो मेले में बजाते हैं, आपके स्थल और अतिथि संख्या के अनुसार।" },
      s5: { name: "कलाकार प्रशिक्षण", desc: "देवघर के युवा गायकों और वादकों के लिए मार्गदर्शन, समूह के अपने प्रदर्शन कैलेंडर के इर्द-गिर्द।" },
      s6: { name: "पूर्ण आयोजन प्रबंधन", desc: "ध्वनि, मंच और प्रकाश व्यवस्था पूरी तरह संभाली जाती है, ताकि एक ही कॉल में सब तय हो।" }
    },
    gallery: { eyebrow: "अभिलेखागार से", title: "तस्वीरें एवं रिकॉर्डिंग", tab_photos: "तस्वीरें", tab_videos: "वीडियो" },
    rates: {
      eyebrow: "मूल्य सूची",
      title: "निजी कार्यक्रम एवं सरकारी दरें",
      p1: { name: "स्टैंडर्ड", dur: "2 घंटे", i1: "मुख्य गायन सहित ऑर्केस्ट्रा", i2: "साउंड सिस्टम व माइक्रोफोन", i3: "बेसिक स्टेज लाइटिंग" },
      p2: { name: "प्रीमियम", dur: "3 घंटे", i1: "पूर्ण ऑर्केस्ट्रा + लोक नर्तक", i2: "स्टेज बैकड्रॉप व सजावट", i3: "स्थल पर कार्यक्रम समन्वय" },
      p3: { name: "डीलक्स", dur: "4+ घंटे", i1: "विस्तारित टोली + अतिथि कलाकार", i2: "समर्पित इवेंट मैनेजर", i3: "कस्टम सेटलिस्ट परामर्श" },
      govt_note: "जन संचार (₹5,000/कार्यक्रम) और नुक्कड़ नाटक (₹3,000/कार्यक्रम) की सरकारी दरें झारखंड सरकार के साथ सूचीबद्ध दरों के अनुसार हैं। बहु-जिला अभियानों के लिए वॉल्यूम दरें उपलब्ध हैं — लिखित उद्धरण हेतु संपर्क करें।"
    },
    contact: {
      eyebrow: "संपर्क करें", title: "अपने कार्यक्रम के बारे में बताएं",
      phone: "फोन", email: "ईमेल", address: "पता", address_val: "देवघर, झारखंड, भारत",
      hours: "व्यावसायिक घंटे", hours_val: "सोम–शुक्र, सुबह 10 – शाम 6"
    },
    form: {
      name: "नाम", phone: "फोन", email: "ईमेल", eventDate: "कार्यक्रम तिथि", eventType: "कार्यक्रम प्रकार",
      wedding: "विवाह", govt: "सरकारी कार्यक्रम", corporate: "कॉर्पोरेट", other: "अन्य", message: "संदेश"
    },
    buttons: { submit: "पूछताछ भेजें" },
    footer: { tagline: "झारखंड भर में संस्कृति का प्रसारण" }
  },
  en: {
    org: { name: "Geet Bahar Musical Group" },
    nav: { admin: "Admin" },
    hero: {
      eyebrow: "Govt. of Jharkhand Empanelled · Est. Deoghar",
      title_hi: "श्रावणी मेला की धुन, हर मंच तक",
      title_en: "Geet Bahar Musical Group",
      lede: "Orchestral and folk performances rooted in Deoghar's Shravani Mela, plus government-approved Jan Sanchar and Nukkad Natak outreach programs — carrying rhythm from temple courtyards to district stages across Jharkhand.",
      cta_primary: "Check availability",
      cta_secondary: "Watch performances",
      stat1: "Programs staged",
      stat2: "Districts reached",
      stat3: "Trained performers"
    },
    about: {
      eyebrow: "Who we are",
      lead_hi: "Led by Uttam Kumar — where music meets public awareness",
      p1: "Geet Bahar Musical Group was founded in Deoghar by Uttam Kumar to keep the region's orchestral and folk traditions performance-ready for both temple festivals and government platforms. The group is registered with the Government of Jharkhand and empanelled for cultural and communication programs.",
      p2: "Every Shravan month, kanwariyas walk through the night toward Baidyanath Dham — Geet Bahar's orchestras have performed alongside that procession for years, timing arrangements to the crowd, the weather, and the mood of a mela that runs on very little sleep and a lot of devotion.",
      p3: "Outside the festival season, the same musicians and actors carry that stagecraft into Jan Sanchar mass-communication programs and Nukkad Natak street theatre — turning health, education, and civic messages into something a village square will actually stop and watch.",
      chip1: "Govt. of Jharkhand Registered",
      chip2: "Empanelled — Jan Sanchar",
      chip3: "Empanelled — Nukkad Natak"
    },
    services: {
      eyebrow: "What we stage",
      title: "Six formats, one troupe",
      intro: "From a two-hour wedding orchestra to a district-wide awareness drive — the same core team adapts the format, not the standard.",
      s1: { name: "Shravani Mela Orchestra", desc: "Large-format classical and folk orchestra performed nightly through the Shravan month alongside the kanwariya procession route." },
      s2: { name: "Jan Sanchar Programs", desc: "Government-approved mass communication performances — health, literacy, and civic-policy messaging staged for open public squares." },
      s3: { name: "Nukkad Natak", desc: "Street theatre built for a crowd that wasn't planning to stop walking — short, sharp scenes carrying one civic message at a time." },
      s4: { name: "Private Event Orchestra", desc: "Weddings, inaugurations, and celebrations scored with the same musicians who play the Mela — sized to your venue and guest list." },
      s5: { name: "Performer Training", desc: "Mentorship for young vocalists and instrumentalists in Deoghar, built around the group's own performance calendar." },
      s6: { name: "Full Event Production", desc: "Sound, stage, and lighting handled end-to-end, so a district office or a wedding family only has to make one call." }
    },
    gallery: { eyebrow: "From the archive", title: "Photos & recordings", tab_photos: "Photos", tab_videos: "Videos" },
    rates: {
      eyebrow: "Pricing",
      title: "Private events & government rates",
      p1: { name: "Standard", dur: "2 hours", i1: "Orchestra with lead vocals", i2: "Sound system & microphones", i3: "Basic stage lighting" },
      p2: { name: "Premium", dur: "3 hours", i1: "Full orchestra + folk dancers", i2: "Stage backdrop & decoration", i3: "Event coordination on-site" },
      p3: { name: "Deluxe", dur: "4+ hours", i1: "Extended ensemble + guest artists", i2: "Dedicated event manager", i3: "Custom setlist consultation" },
      govt_note: "Government rates for Jan Sanchar (₹5,000/program) and Nukkad Natak (₹3,000/program) follow empanelled rates with the Government of Jharkhand. Volume rates available for multi-district drives — contact us for a written quote."
    },
    contact: {
      eyebrow: "Get in touch", title: "Tell us about your event",
      phone: "Phone", email: "Email", address: "Address", address_val: "Deoghar, Jharkhand, India",
      hours: "Business hours", hours_val: "Mon–Fri, 10 AM – 6 PM"
    },
    form: {
      name: "Name", phone: "Phone", email: "Email", eventDate: "Event date", eventType: "Event type",
      wedding: "Wedding", govt: "Government program", corporate: "Corporate", other: "Other", message: "Message"
    },
    buttons: { submit: "Send inquiry" },
    footer: { tagline: "Broadcasting culture across Jharkhand" }
  }
};

// Sample gallery content so the gallery section is never empty on first load.
window.SAMPLE_GALLERY = {
  photos: [
    { title: "Shravani Mela 2025 — Night procession", desc: "Orchestra performing alongside the kanwariya route", color: "#E8641C" },
    { title: "Nukkad Natak — health awareness", desc: "Street theatre staged for a district health drive", color: "#8B1E3F" },
    { title: "Wedding orchestra, Deoghar", desc: "Premium package, 3-hour evening set", color: "#F2A93B" },
    { title: "Jan Sanchar — literacy program", desc: "Public square performance, Godda district", color: "#1B1F3B" }
  ],
  videos: [
    { title: "Performance highlights, 2025", desc: "Compilation across five district programs", color: "#8B1E3F" },
    { title: "Shravani Mela full set (excerpt)", desc: "20-minute orchestral excerpt from the main procession night", color: "#E8641C" }
  ]
};
