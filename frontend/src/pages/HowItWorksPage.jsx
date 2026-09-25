import React, { useState } from 'react';
import { 
  PlayCircle, Eye, ShieldCheck, Cpu, Activity, Award, CheckCircle, 
  ArrowRight, FileText, Printer, MapPin, AlertTriangle, Layers, 
  HelpCircle, Camera, CheckSquare, Sparkles, UserCheck, Stethoscope, 
  Clock, Download, ChevronRight, Globe, Network, GitBranch, Binary,
  Sliders, Server, ArrowDown, Database, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HowItWorksPage({ setActiveTab }) {
  const { language, lang, toggleLanguage } = useLanguage();
  const currentLang = language || lang || 'en';
  const isHi = currentLang === 'hi';

  const [activeSection, setActiveSection] = useState('workflow'); // 'workflow', 'architecture', 'severity', 'hardware', 'faq'
  const [activeStep, setActiveStep] = useState(0);

  // Workflow 6 Steps content in English and Hindi (Zero offline claim, API-based)
  const steps = [
    {
      num: '01',
      title: isHi ? 'रोगी पंजीकरण और आंख का चयन' : 'Patient Registration & Eye Selection',
      tag: isHi ? 'चरण 1: जनसांख्यिकी' : 'Step 1: Demographics',
      desc: isHi 
        ? 'रोगी का पूरा नाम, 14-अंकीय आभा (ABHA) स्वास्थ्य आईडी, आयु और लिंग दर्ज करें। इसके बाद जांची जाने वाली आंख (दाहिनी OD या बायें OS) और स्वास्थ्य केंद्र का स्थान चुनें।'
        : 'Enter patient full name, 14-digit ABHA health ID, age, and gender. Next, select the examined eye (Right Eye OD or Left Eye OS) and your health camp location.',
      bullets: isHi ? [
        'आयुष्मान भारत (ABDM M3) अनुपालन स्वास्थ्य मेटाडेटा रिकॉर्ड किया जाता है।',
        'आंख की पार्श्वता चुनें: OD (दाहिनी आंख) या OS (बायें आंख)।',
        'स्थान दर्ज करें (जैसे पुणे, भोपाल, लखनऊ) ताकि नजदीकी डॉक्टर खोज प्रणाली सक्रिय हो सके।',
        'मधुमेह का इतिहास और अंतिम HbA1c स्तर नोट करें।'
      ] : [
        'Ayushman Bharat (ABDM M3) compliant demographic record creation.',
        'Choose laterality: OD (Right Eye) or OS (Left Eye).',
        'Enter camp city/district (e.g. Pune, Bhopal, Lucknow) for instant doctor matching.',
        'Record diabetes history and last HbA1c control level.'
      ],
      tip: isHi 
        ? 'सुझाव: यदि रोगी के पास आभा आईडी नहीं है, तो प्रणाली स्वचालित रूप से एक अनूठा स्क्रीनिंग टोकन प्रदान करती है।'
        : 'Tip: If patient does not have an ABHA ID, the system automatically assigns a unique screening reference token.'
    },
    {
      num: '02',
      title: isHi ? 'फंडस छवि कैप्चर एवं गुणवत्ता जांच' : 'Fundus Photography Capture & Quality Filter',
      tag: isHi ? 'चरण 2: छवि इनपुट' : 'Step 2: Fundus Input',
      desc: isHi 
        ? 'गैर-मायड्रिएटिक फंडस कैमरे या स्मार्टफोन स्लिट-लैंप एडाप्टर से 45° मैकुला-केंद्रित रेटिना फोटो अपलोड करें। दृष्टि केयर का स्वचालित लाप्लासियन फ़िल्टर तुरंत धुंधली या खराब छवियों को अस्वीकार कर देता है।'
        : 'Upload a 45° macula-centered retinal photograph captured using a non-mydriatic fundus camera or smartphone attachment. The automatic Laplacian filter rejects blurs in under 40ms.',
      bullets: isHi ? [
        'JPG, PNG, या TIFF प्रारूपों का समर्थन करता है।',
        'स्वचालित लाप्लासियन गुणवत्ता फ़िल्टर: गैर-रेटिना या अत्यधिक धुंधली छवियों को तुरंत रोकता है।',
        'तुरंत डेमो विकल्प: त्वरित परीक्षण के लिए पहले से मौजूद 5 नैदानिक नमूना स्कैन में से कोई भी चुनें।',
        'बिना पुतली फैलाए (Non-mydriatic) सामान्य प्रकाश में काम करता है।'
      ] : [
        'Supports standard JPG, PNG, and TIFF fundus image formats.',
        'Automated Laplacian quality gatekeeper: instantly flags blurs and non-retinal uploads.',
        'Instant Demo option: select any of 5 pre-configured clinical sample scans in 1 click.',
        'Optimized for non-mydriatic captures without requiring chemical eye dilation.'
      ],
      tip: isHi 
        ? 'सुझाव: सर्वोत्तम परिणामों के लिए रोगी को हरे फिक्सेशन बिंदु पर देखने को कहें और कमरे में हल्की रोशनी रखें।'
        : 'Tip: For clearest scans, ask patient to look at the green fixation LED inside the optical tube in a semi-darkened room.'
    },
    {
      num: '03',
      title: isHi ? 'मल्टी-मॉडल एआई न्यूरल विश्लेषण (API-आधारित)' : 'Multi-Model AI Neural Diagnostic Inference (API-Based)',
      tag: isHi ? 'चरण 3: एआई विश्लेषण' : 'Step 3: Multi-Model Inference',
      desc: isHi 
        ? 'बटन दबाते ही उच्च-प्रदर्शन PyTorch बैकएंड एपीआई तुरंत छवि को प्रोसेस करती है। U-Net पिक्सेल-स्तर पर घावों का विभाजन करता है और ResNet-50 ग्रैड-सीएएम++ ध्यान हीटमैप तैयार करता है।'
        : 'Upon clicking Analyze, the high-performance PyTorch backend API processes the retinal scan. U-Net generates pixel-level lesion masks while ResNet-50 synthesizes Grad-CAM++ saliency heatmaps.',
      bullets: isHi ? [
        'एपीआई-आधारित मल्टी-मॉडल पाइपलाइन: U-Net और ResNet-50 का समन्वित संयोजन।',
        'मल्टी-घाव विभाजन: माइक्रोएन्यूरिज्म, रक्तस्राव, हार्ड एक्सयूडेट्स और कॉटन वूल स्पॉट्स की पहचान।',
        'ग्रैड-सीएएम++ दृश्य तर्क: यह दिखाता है कि एआई ने किस घाव को देखकर गंभीरता का निर्णय लिया।',
        'द्रुत गति: तेज एपीआई प्रतिक्रिया समय के साथ संपूर्ण ट्राइएज परिणाम तैयार होता है।'
      ] : [
        'API-Based Multi-Model Pipeline: coordinated ensemble of U-Net segmentation and ResNet-50 classification.',
        'Multi-lesion segmentation: detects microaneurysms, hemorrhages, and hard exudates.',
        'Grad-CAM++ visual reasoning: pinpoints the exact pathological clusters driving the diagnosis.',
        'Rapid response: fast inference API delivering complete clinical results in seconds.'
      ],
      tip: isHi 
        ? 'सुझाव: "लाइव विश्लेषण" टैब पर जाकर आप ऑप्टिकल स्कैन और हीटमैप को अगल-बगल देख सकते हैं।'
        : 'Tip: Open the Live Analysis tab to inspect side-by-side lesion overlays and macular thickness profiles.'
    },
    {
      num: '04',
      title: isHi ? 'स्क्रीनिंग परिणाम एवं ट्राइएज वर्गीकरण' : 'Clinical Triage Result & Referral Priority',
      tag: isHi ? 'चरण 4: परिणाम समीक्षा' : 'Step 4: Triage Results',
      desc: isHi 
        ? 'प्रणाली तुरंत अंतर्राष्ट्रीय नैदानिक डायबिटिक रेटिनोपैथी (ICDR) स्टेज 0 से 4, एआई आत्मविश्वास प्रतिशत और अनुशंसित डॉक्टर परामर्श समय सीमा प्रदर्शित करती है।'
        : 'The system immediately outputs the international ICDR DR severity stage (0 to 4), AI confidence score, and clear consultation timelines.',
      bullets: isHi ? [
        'स्टेज 0 (सामान्य) से स्टेज 4 (प्रोलिफेरेटिव PDR) तक स्पष्ट वर्गीकरण।',
        'अनुशंसित समय सीमा: नियमित वार्षिक जांच से लेकर 24-48 घंटों के आपातकालीन रेफरल तक।',
        'एआई विश्लेषण देखें (डार्क कार्ड): क्यों एआई ने यह परिणाम दिया, इसकी पूरी व्याख्या।',
        'सामुदायिक स्वास्थ्य कार्यकर्ता चेकलिस्ट: बीपी, रक्त शर्करा और मरीज परामर्श।'
      ] : [
        'Clear classification from Stage 0 (No DR) through Stage 4 (Proliferative PDR).',
        'Timeframe guidance: from routine 12-month checkup to urgent 24-48h emergency referral.',
        'View AI Analysis (Dark Card): visual proof justifying why the severity tier was assigned.',
        'Health worker checklist: blood pressure, glucose monitoring, and counseling steps.'
      ],
      tip: isHi 
        ? 'सुझाव: परिणाम स्क्रीन पर दिया गया प्रमुख डार्क "एआई विश्लेषण देखें" बटन आपको मॉडल के हीटमैप पर ले जाता है।'
        : 'Tip: The prominent dark "View AI Analysis" button allows clinicians to visually verify every finding.'
    },
    {
      num: '05',
      title: isHi ? 'नजदीकी नेत्र विशेषज्ञ खोजें' : 'Nearby Eye Specialist & Hospital Locator',
      tag: isHi ? 'चरण 5: रेफरल सहायता' : 'Step 5: Doctor Locator',
      desc: isHi 
        ? 'परिणाम पृष्ठ पर इनबिल्ट डॉक्टर लोकेटर मरीज के शिविर शहर या जीपीएस का उपयोग करके निकटतम सरकारी व निजी नेत्र अस्पतालों और रेटिना सर्जनों की सूची दिखाता है।'
        : 'The built-in doctor locator uses the patient camp city or GPS to display nearby government eye hospitals, vitreoretinal surgeons, phone numbers, and driving directions.',
      bullets: isHi ? [
        'जीपीएस ऑटो-डिटेक्ट या शहर/पिनकोड खोज (जैसे भोपाल, इंदौर, पुणे, सतारा, दिल्ली आदि)।',
        'प्रत्यक्ष टेलीफोन कॉल और गूगल मैप्स नेविगेशन लिंक।',
        'सरकारी जिला अस्पताल (सिविल सर्जन) और निजी नेत्र क्लीनिक दोनों शामिल।',
        'पूर्ण निर्देशिका मोडल में 15+ अस्पतालों की विस्तृत सूची उपलब्ध।'
      ] : [
        'GPS auto-detection or city/pincode search across all Indian states and districts.',
        'Direct phone dial and 1-click Google Maps turn-by-turn navigation.',
        'Includes both Government District Hospitals and private tertiary eye centers.',
        'Full Directory Modal reveals 15+ specialized ophthalmic centers per region.'
      ],
      tip: isHi 
        ? 'सुझाव: मरीज को रेफर करते समय स्थानीय अस्पताल का फोन नंबर और पता तुरंत पर्ची पर साझा करें।'
        : 'Tip: Instantly counsel rural patients by pointing them to their closest district eye surgeon.'
    },
    {
      num: '06',
      title: isHi ? 'रेफरल पर्ची प्रिंट करें एवं ABDM रिपोर्ट' : 'Print Referral Slip & ABDM Clinical Report',
      tag: isHi ? 'चरण 6: रिकॉर्ड एवं प्रिंट' : 'Step 6: Referral Slip',
      desc: isHi 
        ? 'मरीज को देने के लिए 1-पेज की आधिकारिक रेफरल पर्ची तुरंत प्रिंट करें या सीधे पीडीएफ डाउनलोड करें। इसके अलावा पूर्ण क्लिनिकल रिपोर्ट को DICOM/PDF में निर्यात या आभा रिकॉर्ड में भेजें।'
        : 'Print the clean 1-page Official Clinical Referral Slip or save as direct PDF for the patient. You can also export the full ABDM clinical report or push to ABHA records.',
      bullets: isHi ? [
        'परिणाम पर्ची प्रिंट / सहेजें: ए4 पोर्ट्रेट में 100% स्पष्ट, कोई खाली पन्ना नहीं।',
        'पीडीएफ पर्ची डाउनलोड: सीधे आपके डिवाइस में पीडीएफ फाइल डाउनलोड होती है।',
        'पूर्ण क्लिनिकल रिपोर्ट: मेडिकल ऑफिसर के डिजिटल हस्ताक्षर, बायोमार्कर तालिका और वैधानिक सूचना सहित।',
        'आभा (ABHA) में पुश करें: राष्ट्रीय स्वास्थ्य प्राधिकरण के डिजिटल लॉकर में भेजने की सुविधा।'
      ] : [
        'Print Result Slip: crystal-clear A4 referral slip with zero blank pages.',
        'Save PDF Slip: 1-click direct file download for digital record archiving.',
        'Full ABDM Clinical Report: includes digital signature, biomarker table, and statutory notice.',
        'Push to ABHA Record: integrates with the National Health Authority patient portal.'
      ],
      tip: isHi 
        ? 'सुझाव: रेफरल पर्ची पर दोनों मूल फंडस स्कैन और एआई हीटमैप छपते हैं ताकि जिला अस्पताल का डॉक्टर तुरंत समझ सके।'
        : 'Tip: The printed referral slip includes dual visual thumbnails so receiving surgeons need no re-scan.'
    }
  ];

  // ICDR Severity Table Data
  const severityStages = [
    {
      stage: '0',
      badge: isHi ? 'स्टेज 0 • सामान्य' : 'Stage 0 • Normal',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
      title: isHi ? 'कोई डायबिटिक रेटिनोपैथी नहीं' : 'No Apparent DR (Normal)',
      findings: isHi ? 'स्वच्छ रेटिना, कोई माइक्रोएन्यूरिज्म या रक्तस्राव नहीं।' : 'Clear fundus, zero microaneurysms or retinal hemorrhages.',
      action: isHi ? 'नियमित वार्षिक नेत्र जांच' : 'Routine annual screening at local health center',
      timeframe: isHi ? '12 महीने के भीतर' : 'Within 12 Months'
    },
    {
      stage: '1',
      badge: isHi ? 'स्टेज 1 • हल्का' : 'Stage 1 • Mild',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
      title: isHi ? 'हल्की गैर-प्रोलिफेरेटिव रेटिनोपैथी (Mild NPDR)' : 'Mild Non-Proliferative DR (Mild NPDR)',
      findings: isHi ? 'केवल कुछ छोटे माइक्रोएन्यूरिज्म मौजूद हैं।' : 'Microaneurysms only; subtle isolated focal red dots.',
      action: isHi ? 'सख्त रक्त शर्करा नियंत्रण और अनुवर्ती जांच' : 'Strict glycaemic control and optometrist follow-up',
      timeframe: isHi ? '6 से 12 महीने के भीतर' : 'Within 6 to 12 Months'
    },
    {
      stage: '2',
      badge: isHi ? 'स्टेज 2 • मध्यम' : 'Stage 2 • Moderate',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
      title: isHi ? 'मध्यम गैर-प्रोलिफेरेटिव रेटिनोपैथी (Moderate NPDR)' : 'Moderate Non-Proliferative DR (Moderate NPDR)',
      findings: isHi ? 'माइक्रोएन्यूरिज्म, रेटिनल रक्तस्राव, हार्ड एक्सयूडेट्स या कॉटन वूल स्पॉट्स।' : 'Multiple microaneurysms, dot/blot hemorrhages, and lipid hard exudates.',
      action: isHi ? 'विस्तृत आंख जांच और बायोमाइक्रोस्कोपी हेतु विशेषज्ञ परामर्श' : 'Referral for dilated biomicroscopy & Macular SD-OCT',
      timeframe: isHi ? '3 से 4 सप्ताह के भीतर' : 'Within 3 to 4 Weeks'
    },
    {
      stage: '3',
      badge: isHi ? 'स्टेज 3 • गंभीर' : 'Stage 3 • Severe',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300',
      title: isHi ? 'गंभीर गैर-प्रोलिफेरेटिव रेटिनोपैथी (Severe NPDR)' : 'Severe Non-Proliferative DR (Severe NPDR)',
      findings: isHi ? '4 चतुर्थांशों में >20 रक्तस्राव, 2 चतुर्थांशों में शिरापरक बीडिंग, या 1 चतुर्थांश में IRMA (4-2-1 नियम)।' : '4-2-1 rule: >20 hemorrhages in 4 quadrants, venous beading in 2, or IRMA in 1.',
      action: isHi ? 'रेटिना विशेषज्ञ को तत्काल रेफरल (एंटी-वीईजीएफ या लेजर योजना)' : 'Urgent vitreoretinal referral; evaluate for panretinal photocoagulation',
      timeframe: isHi ? '7 से 14 दिनों के भीतर' : 'Within 7 to 14 Days'
    },
    {
      stage: '4',
      badge: isHi ? 'स्टेज 4 • प्रोलिफेरेटिव' : 'Stage 4 • Proliferative',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300',
      title: isHi ? 'प्रोलिफेरेटिव डायबिटिक रेटिनोपैथी (PDR)' : 'Proliferative Diabetic Retinopathy (PDR)',
      findings: isHi ? 'नई नाजुक रक्त वाहिकाओं का बढ़ना (नियोवैस्कुलराइजेशन), विट्रियस रक्तस्राव, या रेटिनल डिटैचमेंट जोखिम।' : 'Neovascularization of disc/elsewhere (NVD/NVE) or vitreous hemorrhage.',
      action: isHi ? 'आपातकालीन तृतीयक अस्पताल रेफरल (लेजर या विट्रेक्टॉमी सर्जरी)' : 'Emergency tertiary hospital referral for anti-VEGF injection or vitrectomy',
      timeframe: isHi ? '24 से 48 घंटे के भीतर' : 'Within 24 to 48 Hours'
    }
  ];

  // Real Algorithms & Architectural FAQ Content (NO offline claim)
  const faqs = [
    {
      q: isHi ? '1. दृष्टि केयर में वास्तव में कौन से एआई मॉडल, एल्गोरिदम और आर्किटेक्चर उपयोग किए जाते हैं?' : '1. What AI models, algorithms, and architectures are actually used in Drishti Care?',
      a: isHi ? (
        <div className="space-y-2 text-xs sm:text-sm">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            दृष्टि केयर एक अत्याधुनिक मल्टी-मॉडल डीप लर्निंग पाइपलाइन पर काम करता है जिसमें निम्नलिखित प्रमुख एल्गोरिदम शामिल हैं:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
            <li><strong>PyTorch U-Net (घाव विभाजन):</strong> स्किप-कनेक्शन के साथ एनकोडर-डिकोडर नेटवर्क, जो IDRiD और DIARETDB1 डेटासेट पर प्रशिक्षित है। यह माइक्रोएन्यूरिज्म (MA), रक्तस्राव (HE), हार्ड एक्सयूडेट्स (EX) और कॉटन वूल स्पॉट्स (SE) का पिक्सेल-स्तर पर विभाजन करता है।</li>
            <li><strong>ResNet-50 / DenseNet (गंभीरता क्लासिफायर):</strong> डीप कन्वेन्शनल न्यूरल नेटवर्क, जो Kaggle EyePACS और IDRiD पर प्रशिक्षित है। यह सॉफ्टमैक्स प्रोबेबिलिटी के साथ ICDR स्टेज 0 से 4 तक 5-स्तरीय गंभीरता वर्गीकरण प्रदान करता है।</li>
            <li><strong>Grad-CAM++ (व्याख्यात्मक एआई):</strong> जेनरलाइज्ड क्लास एक्टिवेशन मैपिंग जो अंतिम कन्वेन्शनल लेयर के द्वितीय-क्रम ग्रेडिएंट्स (2nd-order gradients) की गणना करके थर्मल ध्यान हीटमैप उत्पन्न करता है।</li>
            <li><strong>लाप्लासियन वेरियंस फ़िल्टर (गुणवत्ता फ़िल्टर):</strong> OpenCV-आधारित लाप्लासियन ऑपरेटर <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">Var(∇²I) &gt; 100</code> जो अनुमान से पहले धुंधली या अमान्य छवियों को 40ms से कम समय में अस्वीकार करता है।</li>
            <li><strong>फास्टएपीआई (FastAPI) आरईएसटी इंजन:</strong> अतुल्यकालिक (Asynchronous) पायथन बैकएंड जो मल्टी-मॉडल पाइपलाइन का समन्वय करता है।</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-2 text-xs sm:text-sm">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Drishti Care operates on a production multi-model deep learning pipeline incorporating the following verified algorithms:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
            <li><strong>PyTorch U-Net (Lesion Segmentation):</strong> Encoder-decoder network with skip connections trained on IDRiD and DIARETDB1 datasets. Performs pixel-level semantic segmentation for microaneurysms (MA), hemorrhages (HE), hard exudates (EX), and soft exudates (SE).</li>
            <li><strong>ResNet-50 / DenseNet Backbone (ICDR Staging):</strong> Deep convolutional residual network trained on Kaggle EyePACS and IDRiD to classify fundus scans across the 5 ICDR clinical severity stages (0 to 4) with softmax confidence scoring.</li>
            <li><strong>Grad-CAM++ (Visual Explainability):</strong> Generalized Class Activation Mapping computing second-order partial gradients over the final convolutional layer feature maps to synthesize high-resolution spatial saliency heatmaps.</li>
            <li><strong>Laplacian Variance Quality Gate:</strong> OpenCV deterministic spatial frequency operator <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">Var(∇²I) &gt; 100</code> validating image focus and illumination in &lt;40ms prior to neural inference.</li>
            <li><strong>FastAPI & PyTorch REST Engine:</strong> High-throughput asynchronous backend service orchestrating model execution, JSON structured triage payloads, and base64 heatmap synthesis.</li>
          </ul>
        </div>
      )
    },
    {
      q: isHi ? '2. यदि फंडस छवि धुंधली या खराब ली गई हो तो क्या होगा?' : '2. What happens if a captured fundus image is blurry or dark?',
      a: isHi 
        ? 'प्रणाली में एक स्वचालित लाप्लासियन गुणवत्ता फ़िल्टर (<40ms) लगा है। यदि छवि धुंधली, अत्यधिक अंधेरी या गैर-रेटिना है, तो यह तुरंत त्रुटि दिखाती है और कार्यकर्ता को पुनः स्पष्ट फोटो लेने का निर्देश देती है ताकि कोई गलत परिणाम न निकले।'
        : 'Drishti Care features an automated image quality gatekeeper (<40ms). If an image is blurry, poorly illuminated, or not a retinal scan, it immediately rejects it and prompts the operator to recapture, preventing diagnostic errors.'
    },
    {
      q: isHi ? '3. क्या यह एक अंतिम चिकित्सा निदान है?' : '3. Is this an official autonomous medical diagnosis?',
      a: isHi 
        ? 'यह एक एआई-सहायता प्राप्त क्लिनिकल ट्राइएज स्क्रीनिंग टूल है। यह दृष्टि हानि को रोकने के लिए उच्च जोखिम वाले मरीजों की शीघ्र पहचान और रेफरल को प्राथमिकता देने के लिए डिज़ाइन किया गया है। किसी भी चिकित्सीय निर्णय के लिए नेत्र रोग विशेषज्ञ की पुष्टि आवश्यक है।'
        : 'Drishti Care is an AI-assisted clinical triage tool engineered for mass screening. It prioritizes specialist referrals and flags urgent cases early. Final medical diagnosis and treatment planning must be confirmed by a licensed ophthalmologist.'
    },
    {
      q: isHi ? '4. नजदीकी डॉक्टर खोज प्रणाली कैसे काम करती है?' : '4. How does the nearby eye doctor locator work?',
      a: isHi 
        ? 'यह उपयोगकर्ता के डिवाइस की जीपीएस लोकेशन या रोगी पंजीकरण के समय दर्ज किए गए शिविर शहर (जैसे पुणे, भोपाल, सतारा आदि) का उपयोग करती है। यह निकटतम सरकारी जिला अस्पतालों और निजी नेत्र सर्जनों की वास्तविक दूरी, संपर्क नंबर और गूगल मैप्स लिंक प्रदान करती है।'
        : 'It detects your device GPS or uses the camp location entered in Step 1. It queries an integrated registry of certified eye hospitals, civil district centers, and retina surgeons, giving phone contacts and instant 1-click Google Maps routes.'
    },
    {
      q: isHi ? '5. क्या रिपोर्ट आयुष्मान भारत (ABDM) अनुपालन करती है?' : '5. Is the clinical report compliant with Ayushman Bharat (ABDM)?',
      a: isHi 
        ? 'हाँ! रेफरल पर्ची और क्लिनिकल रिपोर्ट राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA) के ABDM M3 मानकों के अनुरूप हैं, जिसमें 14-अंकीय आभा आईडी, डीआईसीओएम मेटाडेटा और सत्यापन टोकन शामिल हैं।'
        : 'Yes! The clinical reports and referral slips adhere to National Health Authority (NHA) ABDM M3 specifications, including patient ABHA identifiers, SNOMED-CT/ICD-10 coding, and verifiable digital tokens.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border-2 border-sky-800/50">
        
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{isHi ? "संपूर्ण परिचालन एवं आर्किटेक्चर गाइड" : "OPERATIONAL WORKFLOW & ARCHITECTURE GUIDE"}</span>
            </span>

            <button
              onClick={toggleLanguage}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{isHi ? "Read in English" : "हिंदी में देखें"}</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isHi ? (
              <>दृष्टि केयर का उपयोग कैसे करें: <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">कार्यप्रणाली एवं आर्किटेक्चर</span></>
            ) : (
              <>How Drishti Care Works: <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Workflow & Multi-Model Pipeline</span></>
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {isHi 
              ? "सामुदायिक स्वास्थ्य कार्यकर्ताओं, चिकित्सकों और स्वास्थ्य अधिकारियों के लिए बिंदु-पर-देखभाल रेटिना स्क्रीनिंग, मल्टी-मॉडल एआई आर्किटेक्चर (U-Net + ResNet-50 + Grad-CAM++) और ABDM रेफरल पर्ची की संपूर्ण मार्गदर्शिका।"
              : "A comprehensive operational walkthrough covering the multi-model neural pipeline (PyTorch U-Net + ResNet-50 + Grad-CAM++), clinical triage classification, doctor locator, and ABDM referral generation."}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab('screening')}
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-2 text-sm border border-sky-300"
            >
              <PlayCircle className="w-5 h-5 fill-slate-950 text-sky-400" />
              <span>{isHi ? "लाइव स्क्रीनिंग शुरू करें" : "Start Live Screening Demo"}</span>
            </button>

            <button
              onClick={() => setActiveSection('architecture')}
              className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-xl border border-slate-700 transition-all text-sm flex items-center space-x-2"
            >
              <Network className="w-4 h-4 text-sky-400" />
              <span>{isHi ? "सिस्टम आर्किटेक्चर आरेख देखें" : "View Architecture Diagram"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        <button
          onClick={() => setActiveSection('workflow')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSection === 'workflow'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{isHi ? "6-चरणीय कार्यप्रवाह" : "6-Step Workflow"}</span>
        </button>

        <button
          onClick={() => setActiveSection('architecture')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSection === 'architecture'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>{isHi ? "सिस्टम आर्किटेक्चर (आरेख)" : "System Architecture (Diagram)"}</span>
        </button>

        <button
          onClick={() => setActiveSection('severity')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSection === 'severity'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{isHi ? "ICDR गंभीरता तालिका (0-4)" : "Severity Staging (0 to 4)"}</span>
        </button>

        <button
          onClick={() => setActiveSection('hardware')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSection === 'hardware'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{isHi ? "कैमरा एवं हार्डवेयर सेटअप" : "Hardware Setup"}</span>
        </button>

        <button
          onClick={() => setActiveSection('faq')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
            activeSection === 'faq'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isHi ? "एल्गोरिदम एवं प्रश्न (FAQ)" : "Algorithms & FAQs"}</span>
        </button>
      </div>

      {/* SECTION 1: 6-STEP WORKFLOW */}
      {activeSection === 'workflow' && (
        <div className="space-y-8">
          
          {/* Quick Step Buttons Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {steps.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  activeStep === idx 
                    ? 'bg-slate-950 text-white border-sky-500 shadow-lg scale-[1.02]' 
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-black ${activeStep === idx ? 'text-sky-400' : 'text-slate-400'}`}>
                    {st.num}
                  </span>
                  {activeStep === idx && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  )}
                </div>
                <p className="font-extrabold text-xs line-clamp-2">{st.title}</p>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <span className="text-xs font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                  {steps[activeStep].tag}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {steps[activeStep].title}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isHi ? "← पिछला" : "← Previous"}
                </button>
                <span className="text-xs font-bold text-slate-400">
                  {activeStep + 1} / {steps.length}
                </span>
                <button
                  disabled={activeStep === steps.length - 1}
                  onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isHi ? "अगला →" : "Next →"}
                </button>
              </div>
            </div>

            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {steps[activeStep].desc}
            </p>

            {/* Bullets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {steps[activeStep].bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>

            {/* Pro Tip Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-semibold">{steps[activeStep].tip}</p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setActiveTab('screening')}
                className="bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all flex items-center space-x-2 shadow"
              >
                <span>{isHi ? "इस चरण को अभी आज़माएं (स्क्रीनिंग)" : "Try This Step Live (Go to Screening)"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* SECTION 2: SYSTEM ARCHITECTURE DIAGRAM */}
      {activeSection === 'architecture' && (
        <div className="space-y-8">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider">
                <Network className="w-3.5 h-3.5" />
                <span>{isHi ? "मल्टी-मॉडल पाइपलाइन आरेख" : "MULTI-MODEL PIPELINE ARCHITECTURE"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {isHi ? "सिस्टम आर्किटेक्चर एवं डेटा प्रवाह आरेख" : "System Architecture & End-to-End Dataflow"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
                {isHi 
                  ? "दृष्टि केयर एक मॉड्यूलर, एंड-टू-एंड डीप लर्निंग पाइपलाइन लागू करता है जो कच्चे ऑप्टिकल फंडस इनपुट से लेकर पिक्सेल-स्तरीय घाव विभाजन, ग्रैड-सीएएम++ दृश्य तर्क और राष्ट्रीय स्वास्थ्य प्राधिकरण (ABDM M3) सारांश तक प्रवाहित होता है।"
                  : "Drishti Care implements a modular multi-model deep learning pipeline progressing from raw 45° fundus photography to pixel-level U-Net lesion segmentation, Grad-CAM++ saliency, and ABDM referral generation."}
              </p>
            </div>

            {/* VISUAL ARCHITECTURE FLOWCHART DIAGRAM */}
            <div className="space-y-6">
              
              {/* STAGE 1: Ingestion & Quality Gate */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4 bg-slate-950 text-white p-5 rounded-2xl border-2 border-slate-800 shadow space-y-2">
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase">
                    <Camera className="w-4 h-4" />
                    <span>{isHi ? "लेयर 1: फंडस इनपुट" : "Layer 1: Fundus Ingestion"}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-white">45° Optical Fundus Capture</h4>
                  <p className="text-xs text-slate-400">Non-mydriatic RGB photo (JPG / PNG / TIFF) • 512×512 Normalized Tensor</p>
                  <span className="inline-block bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-mono px-2 py-0.5 rounded">
                    Input: [Batch, 3, 512, 512]
                  </span>
                </div>

                <div className="hidden md:flex md:col-span-1 justify-center">
                  <ArrowRight className="w-6 h-6 text-sky-500 animate-pulse" />
                </div>

                <div className="md:col-span-7 bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow space-y-2">
                  <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase">
                    <Sliders className="w-4 h-4" />
                    <span>{isHi ? "लेयर 2: लाप्लासियन गुणवत्ता गेटकीपर" : "Layer 2: Laplacian Quality Gatekeeper (<40ms)"}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Deterministic Spatial Frequency Filter</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Calculates Laplacian operator variance: <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900 dark:text-amber-200">Var(∇²I) &gt; 100</code>. Rejects blurs, optical crescents, and non-retinal uploads automatically.
                  </p>
                </div>
              </div>

              {/* Vertical Connector */}
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>

              {/* STAGE 2: DUAL-CHANNEL MULTI-MODEL CORE */}
              <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border-2 border-sky-600/70 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center font-bold">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                        {isHi ? "कोर एआई इंजन" : "CORE DEEP LEARNING ENGINE"}
                      </span>
                      <h3 className="text-lg font-black text-white">
                        {isHi ? "मल्टी-मॉडल न्यूरल पाइपलाइन (PyTorch)" : "Multi-Model Neural Pipeline (PyTorch Inference)"}
                      </h3>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">
                    FastAPI Orchestrated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Model A: U-Net */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                        MODEL A: SEGMENTATION
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">IDRiD / DIARETDB1</span>
                    </div>
                    <h4 className="font-extrabold text-base text-white">PyTorch U-Net Architecture</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Encoder-decoder with dense skip connections. Segments microvascular pathologies across 4 specific biomarker classes:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-rose-400">
                        • Microaneurysms (MA)
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-amber-400">
                        • Hard Exudates (EX)
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-red-400">
                        • Hemorrhages (HE)
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-sky-300">
                        • Cotton Wool (SE)
                      </div>
                    </div>
                  </div>

                  {/* Model B: ResNet-50 + Grad-CAM++ */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                        MODEL B: CLASSIFICATION & SALIENCY
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">EyePACS / IDRiD</span>
                    </div>
                    <h4 className="font-extrabold text-base text-white">ResNet-50 &amp; Grad-CAM++ Engine</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Multi-stage convolutional classifier predicting ICDR severity stages (0 to 4) paired with 2nd-order gradient saliency mapping:
                    </p>
                    <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                        <span>Classification Output:</span>
                        <strong className="text-white font-mono">ICDR Stage 0 - 4 (Softmax)</strong>
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                        <span>Saliency Attribution:</span>
                        <strong className="text-emerald-400 font-mono">Grad-CAM++ Heatmap</strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Vertical Connector */}
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>

              {/* STAGE 3: Decision Engine & Biomarkers */}
              <div className="bg-sky-50 dark:bg-sky-950/40 p-6 rounded-3xl border-2 border-sky-200 dark:border-sky-800 space-y-3">
                <div className="flex items-center space-x-2 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase">
                  <Stethoscope className="w-4 h-4" />
                  <span>{isHi ? "लेयर 3: क्लिनिकल निर्णय समर्थन एवं बायोमार्कर परिमाणक" : "Layer 3: Clinical Decision Support & Biomarker Quantifier"}</span>
                </div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Deterministic Referral Rule Engine &amp; ICD-10 Mapping
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Synthesizes U-Net lesion area fractions with ResNet ICDR classifications to compute clinical urgency windows (Routine 12m, Follow-up 6m, Specialist 3-4w, Urgent 7-14d, Emergency 24-48h).
                </p>
              </div>

              {/* Vertical Connector */}
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>

              {/* STAGE 4: Delivery Layer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                  <Printer className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">ABDM Referral Slip</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-contrast 1-page printable clinical referral slip with dual fundus &amp; Grad-CAM++ scan thumbnails.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">Doctor Geo-Locator</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Integrated district hospital registry querying verified eye surgeons via user GPS or camp city name.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                  <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">ABHA Record Export</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Full DICOM / PDF diagnostic report compliant with National Health Authority Ayushman Bharat standards.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* SECTION 3: SEVERITY STAGING GUIDE */}
      {activeSection === 'severity' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isHi ? "ICDR डायबिटिक रेटिनोपैथी गंभीरता वर्गीकरण" : "International Clinical Diabetic Retinopathy (ICDR) Staging"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isHi 
                ? "दृष्टि केयर मरीज के फंडस स्कैन को 5 अंतर्राष्ट्रीय गंभीरता चरणों में वर्गीकृत करता है, और प्रत्येक चरण के लिए स्पष्ट नैदानिक कार्रवाई और रेफरल समय सीमा निर्धारित करता है।"
                : "Drishti Care classifies each fundus photograph into one of 5 internationally standardized tiers, specifying the immediate clinical action and follow-up window."}
            </p>

            <div className="space-y-4 pt-4">
              {severityStages.map((stg) => (
                <div key={stg.stage} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${stg.color}`}>
                        {stg.badge}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {stg.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{stg.timeframe}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {isHi ? "नेत्र निष्कर्ष" : "Retinal Manifestations"}
                      </p>
                      <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{stg.findings}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {isHi ? "अनुशंसित कार्रवाई" : "Recommended Action"}
                      </p>
                      <p className="text-sky-700 dark:text-sky-300 font-bold mt-0.5">{stg.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: HARDWARE SETUP */}
      {activeSection === 'hardware' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {isHi ? "उपकरण एवं फंडस कैमरा सेटअप गाइड" : "Hardware & Fundus Camera Setup Guide"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {isHi 
                  ? "दृष्टि केयर को किसी भी मानक गैर-मायड्रिएटिक डेस्कटॉप या स्मार्टफोन-आधारित पोर्टेबल फंडस कैमरे के साथ आसानी से जोड़ा जा सकता है।"
                  : "Drishti Care works seamlessly with all non-mydriatic desktop cameras as well as low-cost smartphone retinal imaging attachments."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {isHi ? "डेस्कटॉप गैर-मायड्रिएटिक कैमरे" : "Desktop Non-Mydriatic Units"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isHi 
                    ? "जैसे Zeiss Visucam, Topcon TRC-NW400, Canon CR-2, Forus 3nethra Neo। इनमें 45° मैकुला-केंद्रित दृश्य कैप्चर करें और सीधे सॉफ्टवेयर में अपलोड करें।"
                    : "Such as Forus 3nethra, Zeiss Visucam, Topcon TRC-NW, Canon CR-2. Save the 45° macula-centered capture and upload directly to the inference API."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {isHi ? "पोर्टेबल एवं स्मार्टफोन फंडस अटैचमेंट" : "Smartphone & Portable Attachments"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isHi 
                    ? "जैसे Remidio Fundus on Phone (FOP), Volk iNview, Ocular CellScope। ग्रामीण स्वास्थ्य शिविरों में हाथ से ले जाने योग्य सेटअप के लिए सर्वोत्तम।"
                    : "Such as Remidio Fundus on Phone (FOP), Volk iNview, and 20D/28D lens smartphone adapters for mobile screening camps in remote villages."}
                </p>
              </div>
            </div>

            {/* 4 Golden Rules */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                {isHi ? "उच्च गुणवत्ता फंडस फोटोग्राफी के 4 स्वर्णिम नियम" : "4 Golden Rules for High-Quality Retinal Captures"}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2">
                  <span className="font-black text-sky-600 dark:text-sky-400">1.</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {isHi ? "कमरे में हल्की रोशनी या आई-कप का उपयोग करें ताकि प्राकृतिक रूप से पुतली फैल सके।" : "Dim the examination room or use a rubber eye-cup for natural physiological pupil dilation."}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2">
                  <span className="font-black text-sky-600 dark:text-sky-400">2.</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {isHi ? "रोगी की ठुड्डी को चिन-रेस्ट पर स्थिर रखें और पलकें न झपकाने का निर्देश दें।" : "Ensure steady chin-rest positioning and ask patient to blink once, then keep eye open."}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2">
                  <span className="font-black text-sky-600 dark:text-sky-400">3.</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {isHi ? "फिक्सेशन लाइट को मैकुला और ऑप्टिक डिस्क के केंद्र में संरेखित करें।" : "Align internal green fixation light so the fovea and optic disc are symmetrically centered."}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2">
                  <span className="font-black text-sky-600 dark:text-sky-400">4.</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {isHi ? "लेंस पर धूल या उंगलियों के निशान साफ रखें ताकि प्रकाश में चकाचौंध (Glaze) न आए।" : "Keep objective lens clean and dust-free to eliminate corneal reflections and crescent glares."}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 5: REAL ALGORITHMS & FAQS */}
      {activeSection === 'faq' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isHi ? "एल्गोरिदम एवं तकनीकी प्रश्न (FAQ)" : "Algorithms & Technical FAQ"}
            </h2>

            <div className="space-y-3 pt-2">
              {faqs.map((faq, fIdx) => (
                <div key={fIdx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="text-sky-600 dark:text-sky-400 font-black">Q.</span>
                    <span>{faq.q}</span>
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-5 font-medium">
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-teal-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-2xl font-black">
            {isHi ? "परीक्षण के लिए तैयार? अभी स्क्रीनिंग शुरू करें" : "Ready to Experience It? Start Screening Now"}
          </h3>
          <p className="text-sky-100 text-xs sm:text-sm">
            {isHi 
              ? "बिना किसी उपकरण के भी आप पूर्व-कॉन्फ़िगर नमूनों के साथ तुरंत डेमो देख सकते हैं।" 
              : "No fundus camera? Select from pre-configured sample scans for an instant live demo."}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('screening')}
          className="bg-slate-950 hover:bg-black text-white font-black px-8 py-4 rounded-2xl text-sm transition-all shadow-2xl flex items-center space-x-2 shrink-0 border border-sky-300"
        >
          <PlayCircle className="w-5 h-5 text-sky-400" />
          <span>{isHi ? "स्क्रीनिंग डेमो चलाएं" : "Launch Screening Simulator"}</span>
        </button>
      </div>

    </div>
  );
}
