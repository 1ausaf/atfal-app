export type ReligiousCheckpoint = {
  id: string;
  order: number;
  title: string;
  description: string;
  position: { x: number; y: number };
  isMandatory: boolean;
  ageBand: string;
  focus: string;
  learningGoals: string[];
  skills: string[];
  sourceRefsInternal: string[];
  memorizationBlocks?: Array<{
    title: string;
    section?: "quran" | "prayers" | "hadith" | "religiousKnowledge";
    arabicText?: string;
    transliteration?: string;
    translation?: string;
    imagePath?: string;
  }>;
  categories: Record<string, { lessons: string[]; tasks: string[]; memorize: string[] }>;
  content: {
    arabic: string;
    english: string;
    quiz: string;
  };
};

export function getNormalizedCheckpointCategories(checkpoint: ReligiousCheckpoint): {
  quran: { lessons: string[]; tasks: string[]; memorize: string[] };
  prayers: { lessons: string[]; tasks: string[]; memorize: string[] };
  hadith: { lessons: string[]; tasks: string[]; memorize: string[] };
  religiousKnowledge: { lessons: string[]; tasks: string[]; memorize: string[] };
} {
  const empty = { lessons: [], tasks: [], memorize: [] };
  const quran = checkpoint.categories.quran ?? empty;
  const prayers = checkpoint.categories.prayers ?? checkpoint.categories.worship ?? empty;
  const hadith = checkpoint.categories.hadith ?? empty;
  const religiousKnowledge = checkpoint.categories.religiousKnowledge ?? checkpoint.categories.knowledge ?? checkpoint.categories.character ?? checkpoint.categories.community ?? empty;
  return { quran, prayers, hadith, religiousKnowledge };
}

export const MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS: ReligiousCheckpoint[] = [
  {
    id: "cp-1",
    order: 1,
    title: "Foundation Start",
    description: "Start with identity, habits, and introduction to worship.",
    position: { x: 18, y: 94 },
    isMandatory: true,
    ageBand: "Age 7",
    focus: "Basic identity, habits, and worship introduction",
    learningGoals: [
      "Learn basic phrases: Bismillah, Salam, Alhamdulillah",
      "Introduction to Wudu",
      "Learn Azan",
      "Begin mosque familiarity",
    ],
    skills: [
      "Recognize why prayer is important",
      "Begin Quran reading (first 10 parts)",
    ],
    sourceRefsInternal: [
      "Syllabus Part 2: pp. 14-16",
      "Syllabus Part 1: pp. 14-16",
    ],
    memorizationBlocks: [
      {
        title: "Kalimah Tayyiba",
        section: "religiousKnowledge",
        transliteration: "La ilaha illallahu Muhammadur Rasulullah",
        translation: "There is none worthy of worship except Allah; Muhammad is the Messenger of Allah.",
        imagePath: "/religious-knowledge/foundations/foundations-page-01.png",
      },
      {
        title: "Adhaan",
        section: "prayers",
        transliteration: "Allahu Akbar, Allahu Akbar ... Hayya alas-Salah ... Hayya alal-Falah",
        imagePath: "/religious-knowledge/foundations/foundations-page-07.png",
      },
      {
        title: "Durood",
        section: "prayers",
        transliteration: "Allahumma salli ala Muhammadin wa ala aali Muhammad",
        imagePath: "/religious-knowledge/foundations/foundations-page-14.png",
      },
      {
        title: "Wudu Steps (Ablution)",
        section: "prayers",
        translation: "Niyyah, wash hands, rinse mouth, rinse nose, wash face, wash arms to elbows, wipe head/ears, wash feet to ankles in order.",
        imagePath: "/religious-knowledge/foundations/foundations-page-11.png",
      },
      {
        title: "Khulafa-e-Rashideen and Khulafa-e-Ahmadiyya",
        section: "religiousKnowledge",
        translation: "Know the names in order and their role as rightly guided successors.",
        imagePath: "/religious-knowledge/foundations/foundations-page-02.png",
      },
      {
        title: "Quran Surah Memorization Set",
        section: "quran",
        translation: "Memorize the surahs listed in the Foundations guide under checkpoint requirements.",
        imagePath: "/religious-knowledge/foundations/foundations-page-08.png",
      },
      {
        title: "Foundations Arabic Content (Reference Page Set)",
        section: "hadith",
        translation: "Use these pages for exact Arabic memorization text where shown in the guide.",
        imagePath: "/religious-knowledge/foundations/foundations-page-12.png",
      },
      {
        title: "Foundations Additional Content",
        section: "religiousKnowledge",
        imagePath: "/religious-knowledge/foundations/foundations-page-17.png",
      },
    ],
    categories: {
      quran: {
        lessons: ["Foundations Quran memorization list", "Begin reading routine and revision discipline"],
        tasks: ["Memorize the surahs listed in the Foundations PDF", "Daily recitation with parent/teacher check"],
        memorize: ["Listed Quran surahs from Foundations guide"],
      },
      prayers: {
        lessons: ["What is Wudu?", "What is Adhaan?", "How and when to recite Durood"],
        tasks: ["Memorize full Wudu steps in order", "Memorize Adhaan", "Memorize Durood"],
        memorize: ["Wudu steps", "Adhaan", "Durood"],
      },
      hadith: {
        lessons: ["Checkpoint 1 hadith material from Foundations guide"],
        tasks: ["Memorize hadith entries listed in the guide"],
        memorize: ["Foundations hadith set"],
      },
      religiousKnowledge: {
        lessons: ["Kalimah Tayyiba", "Khulafa-e-Rashideen", "Khulafa-e-Ahmadiyya"],
        tasks: ["Memorize Kalimah", "Learn and recall successor names in sequence"],
        memorize: ["Kalimah Tayyiba", "Khulafa names"],
      },
    },
    content: {
      arabic: "Bismillah, Assalamu Alaikum, Alhamdulillah, basic Azan lines.",
      english: "Identity habits, Wudu introduction, prayer importance.",
      quiz: "Can you identify when to say each basic phrase?",
    },
  },
  {
    id: "cp-2",
    order: 2,
    title: "Practice and Etiquette",
    description: "Learn proper behavior in prayer and mosque settings.",
    position: { x: 66, y: 86 },
    isMandatory: true,
    ageBand: "Age 7",
    focus: "Practice and etiquette",
    learningGoals: [
      "Full etiquette of Salat",
      "Mosque etiquette",
      "First Hadith memorization",
      "Atfal/Nasirat pledge",
    ],
    skills: [
      "Perform Wudu correctly",
      "Attend mosque properly",
    ],
    sourceRefsInternal: ["Syllabus Part 2: pp. 16-20"],
    categories: {
      quran: {
        lessons: ["Respect during recitation"],
        tasks: ["Sit calmly during class recitation"],
        memorize: [],
      },
      worship: {
        lessons: ["Salat etiquette checklist", "Wudu revision"],
        tasks: ["Practice full Wudu without prompts"],
        memorize: ["Niyyah (intention phrases)"],
      },
      knowledge: {
        lessons: ["Intro Hadith for manners"],
        tasks: ["Memorize first Hadith with meaning"],
        memorize: ["First selected Hadith"],
      },
      character: {
        lessons: ["Prayer behavior discipline"],
        tasks: ["Practice standing quietly in rows"],
        memorize: [],
      },
      community: {
        lessons: ["Mosque respect and pledge"],
        tasks: ["Recite Atfal/Nasirat pledge"],
        memorize: ["Atfal/Nasirat pledge lines"],
      },
    },
    content: {
      arabic: "Selected Hadith and pledge lines.",
      english: "Salat and mosque etiquette, Wudu correctness.",
      quiz: "What should you do before, during, and after Salat?",
    },
  },
  {
    id: "cp-3",
    order: 3,
    title: "Quran Development",
    description: "Begin meaningful Quran memorization.",
    position: { x: 30, y: 78 },
    isMandatory: true,
    ageBand: "Age 8-9",
    focus: "Quran memorization development",
    learningGoals: [
      "Memorize Surah Al-Falaq and An-Nas",
      "Continue Quran reading up to 20 parts",
    ],
    skills: [
      "Basic memorization ability",
      "Understand protection prayers",
    ],
    sourceRefsInternal: ["Syllabus Part 2: pp. 22-23, 28"],
    categories: {
      quran: {
        lessons: ["Meaning and recitation of Al-Falaq and An-Nas"],
        tasks: ["Memorize both surahs with tajwid guidance"],
        memorize: ["Surah Al-Falaq", "Surah An-Nas"],
      },
      worship: {
        lessons: ["Use protection surahs in daily routine"],
        tasks: ["Recite before sleep with parent check"],
        memorize: [],
      },
      knowledge: {
        lessons: ["What do these surahs protect us from?"],
        tasks: ["Explain one verse meaning in your own words"],
        memorize: [],
      },
      character: { lessons: ["Consistency in daily recitation"], tasks: ["Daily revision streak"], memorize: [] },
      community: { lessons: ["Recite in group setting"], tasks: ["Recite in class circle"], memorize: [] },
    },
    content: {
      arabic: "Surah Al-Falaq and Surah An-Nas (full).",
      english: "Protection prayers and ongoing Quran reading.",
      quiz: "Can you recite and explain key meanings?",
    },
  },
  {
    id: "cp-4",
    order: 4,
    title: "Daily Life Islam",
    description: "Apply Islam to daily behavior and social habits.",
    position: { x: 74, y: 70 },
    isMandatory: true,
    ageBand: "Age 8-9",
    focus: "Daily life Islamic habits",
    learningGoals: [
      "Eating etiquette",
      "Gathering etiquette",
      "Names of Allah (basic attributes)",
      "Additional Hadith",
    ],
    skills: ["Social Islamic behavior", "Respect in gatherings"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 24-26, 30-31"],
    categories: {
      quran: { lessons: ["Duas linked to daily habits"], tasks: ["Recite before eating"], memorize: [] },
      worship: { lessons: ["Adab as worship"], tasks: ["Practice sunnah manners"], memorize: ["Food dua"] },
      knowledge: {
        lessons: ["Names of Allah basics", "New Hadith"],
        tasks: ["Memorize two names with meaning"],
        memorize: ["Selected Asma ul Husna", "One additional Hadith"],
      },
      character: { lessons: ["Gathering manners"], tasks: ["Apply turn-taking and listening"], memorize: [] },
      community: { lessons: ["Respectful social conduct"], tasks: ["Practice adab in Jama'at setting"], memorize: [] },
    },
    content: {
      arabic: "Food dua, selected Hadith, selected Names of Allah.",
      english: "Eating and gathering etiquette in practical life.",
      quiz: "How do we show Islamic manners at home and mosque?",
    },
  },
  {
    id: "cp-5",
    order: 5,
    title: "Core Memorization",
    description: "Build a strong Quran memorization foundation.",
    position: { x: 24, y: 62 },
    isMandatory: true,
    ageBand: "Age 10-11",
    focus: "Core memorization and Tawheed understanding",
    learningGoals: [
      "Memorize Surah Al-Ikhlas",
      "Memorize Ayatul Kursi",
      "Memorize selected verses from Surah Baqarah",
    ],
    skills: ["Strong memorization discipline", "Understanding Tawheed"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 28-29"],
    categories: {
      quran: {
        lessons: ["Tawheed-focused verses"],
        tasks: ["Memorize and recite with fluency"],
        memorize: ["Surah Al-Ikhlas", "Ayatul Kursi", "Selected Baqarah verses"],
      },
      worship: { lessons: ["Use memorized verses in prayer"], tasks: ["Recite in voluntary prayer"], memorize: [] },
      knowledge: { lessons: ["Meaning of Tawheed"], tasks: ["Explain Ayatul Kursi summary"], memorize: [] },
      character: { lessons: ["Memorization discipline"], tasks: ["Follow revision timetable"], memorize: [] },
      community: { lessons: ["Peer recitation circles"], tasks: ["Recite in small group"], memorize: [] },
    },
    content: {
      arabic: "Surah Al-Ikhlas, Ayatul Kursi, selected Surah Baqarah verses.",
      english: "Tawheed and memorization discipline.",
      quiz: "Can you recite accurately and explain Tawheed basics?",
    },
  },
  {
    id: "cp-6",
    order: 6,
    title: "Religious Depth",
    description: "Expand reflection, understanding, and respectful communication.",
    position: { x: 68, y: 54 },
    isMandatory: true,
    ageBand: "Age 10-11",
    focus: "Deeper understanding",
    learningGoals: [
      "Learn Salat meanings",
      "Hadith memorization",
      "Promised Messiah revelation focus",
      "Meeting and gathering etiquette",
    ],
    skills: ["Deeper reflection in prayer", "Respectful communication"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 30-32"],
    categories: {
      quran: { lessons: ["Verse meaning in Salat"], tasks: ["Map meanings to recited lines"], memorize: [] },
      worship: { lessons: ["Khushu in prayer"], tasks: ["Reflect after each prayer"], memorize: [] },
      knowledge: {
        lessons: ["Selected Hadith", "Promised Messiah teachings overview"],
        tasks: ["Memorize one new Hadith and explain lesson"],
        memorize: ["Selected Hadith"],
      },
      character: { lessons: ["Speech etiquette"], tasks: ["Practice respectful disagreement"], memorize: [] },
      community: { lessons: ["Meeting manners"], tasks: ["Apply adab in class meetings"], memorize: [] },
    },
    content: {
      arabic: "Selected Hadith text and key Salat lines with meaning.",
      english: "Prayer reflection and respectful communication.",
      quiz: "How does understanding meaning improve Salat quality?",
    },
  },
  {
    id: "cp-7",
    order: 7,
    title: "Discipline Stage",
    description: "Build personal responsibility with structured religious routine.",
    position: { x: 35, y: 46 },
    isMandatory: true,
    ageBand: "Age 12",
    focus: "Personal responsibility and consistency",
    learningGoals: ["Regular 5 daily prayers", "Daily Quran recitation", "Build structured routine"],
    skills: ["Time management", "Religious consistency"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 7-11 (general expectations)"],
    categories: {
      quran: { lessons: ["Daily recitation habit"], tasks: ["Set fixed recitation time"], memorize: [] },
      worship: { lessons: ["5 prayers routine"], tasks: ["Track prayer consistency"], memorize: [] },
      knowledge: { lessons: ["Routine planning in Islam"], tasks: ["Create weekly ibadat planner"], memorize: [] },
      character: { lessons: ["Self-discipline"], tasks: ["Keep punctuality record"], memorize: [] },
      community: { lessons: ["Accountability with mentor"], tasks: ["Weekly progress check-in"], memorize: [] },
    },
    content: {
      arabic: "Daily recitation targets (student selected surahs/duas).",
      english: "Routine building for prayer and Quran consistency.",
      quiz: "Can you maintain a full week of structured routine?",
    },
  },
  {
    id: "cp-8",
    order: 8,
    title: "Character Building",
    description: "Strengthen inner values and social service habits.",
    position: { x: 78, y: 38 },
    isMandatory: true,
    ageBand: "Age 12",
    focus: "Internal development",
    learningGoals: [
      "Develop patience",
      "Develop truthfulness",
      "Develop obedience",
      "Begin social service",
    ],
    skills: ["Emotional control", "Strong moral identity"],
    sourceRefsInternal: ["Syllabus Part 2: p. 11"],
    categories: {
      quran: { lessons: ["Verses on patience and honesty"], tasks: ["Reflective journaling"], memorize: [] },
      worship: { lessons: ["Dua for good character"], tasks: ["Daily dua after prayer"], memorize: [] },
      knowledge: { lessons: ["Traits of believers"], tasks: ["Identify real-life examples"], memorize: [] },
      character: { lessons: ["Patience, truthfulness, obedience"], tasks: ["Weekly behavior goals"], memorize: [] },
      community: { lessons: ["Intro service projects"], tasks: ["Participate in one service action"], memorize: [] },
    },
    content: {
      arabic: "Selected duas for good character and patience.",
      english: "Patience, truthfulness, obedience, and service.",
      quiz: "How did you apply one character trait this week?",
    },
  },
  {
    id: "cp-9",
    order: 9,
    title: "Advanced Learning",
    description: "Grow intellectually through study and language development.",
    position: { x: 28, y: 30 },
    isMandatory: true,
    ageBand: "Age 13-14",
    focus: "Advanced learning and independent study",
    learningGoals: [
      "Continue Quran memorization",
      "Study religious books",
      "Learn multiple languages (Arabic, Urdu encouraged)",
    ],
    skills: ["Independent learning", "Critical thinking"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 9-10"],
    categories: {
      quran: { lessons: ["Next memorization plan"], tasks: ["Weekly hifz target"], memorize: ["Assigned verses"] },
      worship: { lessons: ["Apply learning to worship quality"], tasks: ["Short reflection after Salat"], memorize: [] },
      knowledge: { lessons: ["Book study skills"], tasks: ["Summarize one chapter"], memorize: [] },
      character: { lessons: ["Discipline in study"], tasks: ["Independent revision plan"], memorize: [] },
      community: { lessons: ["Share a learning takeaway"], tasks: ["Present in class"], memorize: [] },
    },
    content: {
      arabic: "Assigned advanced memorization segments.",
      english: "Book study and language growth for deeper understanding.",
      quiz: "Can you teach one concept from your reading?",
    },
  },
  {
    id: "cp-10",
    order: 10,
    title: "Community Role",
    description: "Participate actively and build leadership responsibility.",
    position: { x: 64, y: 22 },
    isMandatory: true,
    ageBand: "Age 13-14",
    focus: "Active participation and leadership habits",
    learningGoals: [
      "Participate in Jama'at activities",
      "Participate in financial schemes",
      "Develop leadership habits",
    ],
    skills: ["Responsibility in community", "Teamwork"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 9-10"],
    categories: {
      quran: { lessons: ["Recitation in community settings"], tasks: ["Lead a short recitation"], memorize: [] },
      worship: { lessons: ["Worship through service"], tasks: ["Volunteer role in event"], memorize: [] },
      knowledge: { lessons: ["Understanding Jama'at systems"], tasks: ["Explain one scheme purpose"], memorize: [] },
      character: { lessons: ["Team responsibility"], tasks: ["Take ownership of a task"], memorize: [] },
      community: { lessons: ["Service and contribution"], tasks: ["Join at least one Jama'at activity"], memorize: [] },
    },
    content: {
      arabic: "Event duas and service-related reminders.",
      english: "Jama'at participation, teamwork, and leadership habits.",
      quiz: "How did you contribute to Jama'at this month?",
    },
  },
  {
    id: "cp-11",
    order: 11,
    title: "Application Stage",
    description: "Live Islam fully and begin mentoring others.",
    position: { x: 24, y: 14 },
    isMandatory: true,
    ageBand: "Age 15",
    focus: "Application of full learning",
    learningGoals: [
      "Practice teachings daily",
      "Teach others basic Islam",
      "Strengthen connection with Khilafat",
    ],
    skills: ["Mentorship", "Confidence in faith"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 7-8"],
    categories: {
      quran: { lessons: ["Teach a memorized passage"], tasks: ["Guide junior on recitation"], memorize: [] },
      worship: { lessons: ["Consistent ibadat lifestyle"], tasks: ["Maintain full daily routine"], memorize: [] },
      knowledge: { lessons: ["Teaching fundamentals"], tasks: ["Prepare one mini-lesson"], memorize: [] },
      character: { lessons: ["Role-model behavior"], tasks: ["Mentor younger atfal"], memorize: [] },
      community: { lessons: ["Khilafat connection"], tasks: ["Follow and discuss Friday sermon"], memorize: [] },
    },
    content: {
      arabic: "Selected texts you can confidently teach others.",
      english: "Mentorship, daily application, and Khilafat connection.",
      quiz: "Can you teach one beginner topic confidently?",
    },
  },
  {
    id: "cp-12",
    order: 12,
    title: "Completion and Leadership",
    description: "Final mastery and readiness for lifelong service.",
    position: { x: 58, y: 6 },
    isMandatory: true,
    ageBand: "Age 15",
    focus: "Full waqf readiness and leadership",
    learningGoals: [
      "Full syllabus mastery",
      "Prepare for lifelong service",
      "Develop tabligh mindset",
    ],
    skills: ["Leadership", "Representation of Islam"],
    sourceRefsInternal: ["Syllabus Part 2: pp. 6-8"],
    categories: {
      quran: { lessons: ["Cumulative revision"], tasks: ["Final recitation check"], memorize: ["Assigned final revision set"] },
      worship: { lessons: ["Sustained ibadat roadmap"], tasks: ["Build post-course routine"], memorize: [] },
      knowledge: { lessons: ["Mission and purpose"], tasks: ["Reflective summary of syllabus"], memorize: [] },
      character: { lessons: ["Leader identity"], tasks: ["Model adab and discipline"], memorize: [] },
      community: { lessons: ["Tabligh and service readiness"], tasks: ["Present a faith-sharing plan"], memorize: [] },
    },
    content: {
      arabic: "Final cumulative memorization review.",
      english: "Leadership, representation, and lifelong service.",
      quiz: "Can you demonstrate full readiness and leadership mindset?",
    },
  },
];
