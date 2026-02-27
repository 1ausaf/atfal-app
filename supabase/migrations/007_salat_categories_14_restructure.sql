-- Restructure Salat course to 14 categories with Arabic and Surahs subsections

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'salat_categories' AND c.contype = 'c'
  LIMIT 1;
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE salat_categories DROP CONSTRAINT %I', conname);
  END IF;
END $$;
ALTER TABLE salat_categories ADD CONSTRAINT salat_categories_order_range CHECK ("order" >= 1 AND "order" <= 14);

ALTER TABLE salat_categories ADD COLUMN IF NOT EXISTS subsections JSONB;

-- Shift order 6..13 to 7..14 in reverse order to avoid unique constraint violation
UPDATE salat_categories SET "order" = 14 WHERE "order" = 13;
UPDATE salat_categories SET "order" = 13 WHERE "order" = 12;
UPDATE salat_categories SET "order" = 12 WHERE "order" = 11;
UPDATE salat_categories SET "order" = 11 WHERE "order" = 10;
UPDATE salat_categories SET "order" = 10 WHERE "order" = 9;
UPDATE salat_categories SET "order" = 9 WHERE "order" = 8;
UPDATE salat_categories SET "order" = 8 WHERE "order" = 7;
UPDATE salat_categories SET "order" = 7 WHERE "order" = 6;

INSERT INTO salat_categories ("order", title, title_ar, content_en, subsections) VALUES (
  6,
  'Surahs',
  'السُوَر',
  'After Surah Al-Fatiha, recite a portion of the Holy Quran — at least three verses or a short chapter. Below: Surah Al-Ikhlas, Surah An-Nas, and Surah Al-Falaq.',
  '[
    {"title": "Surah Al-Ikhlas", "title_ar": "سورة الإخلاص", "content_ar": "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ هُوَ اللهُ أَحَدٌ ۝ اَللهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَّهُ كُفُوًا أَحَدٌ ۝", "content_en": "In the name of Allah, the Gracious, the Merciful. Say, He is Allah, the One; Allah, the Independent and Besought of all. He begets not, nor is He begotten; And there is none like unto Him."},
    {"title": "Surah An-Nas", "title_ar": "سورة الناس", "content_ar": "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ ۝", "content_en": "In the name of Allah, the Gracious, the Merciful. Say, I seek refuge with the Lord of mankind, the King of mankind, the God of mankind, from the evil of the sneaking whisperer, who whispers into the hearts of mankind, from among the jinn and mankind."},
    {"title": "Surah Al-Falaq", "title_ar": "سورة الفلق", "content_ar": "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝", "content_en": "In the name of Allah, the Gracious, the Merciful. Say, I seek refuge with the Lord of the daybreak, from the evil of that which He created, and from the evil of the dark night when it penetrates, and from the evil of those who blow on the knots, and from the evil of the envier when he envies."}
  ]'::jsonb
)
ON CONFLICT ("order") DO NOTHING;

UPDATE salat_categories SET title = 'Niyaah', title_ar = 'نية', content_ar = 'إِنِّي وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ', content_en = 'I have turned my full attention towards Him, Who has created the heavens and the earth, being ever inclined (towards Him), and I am not among those who associate partners with Allah. Recited before a set of prayers.' WHERE "order" = 1;
UPDATE salat_categories SET title = 'Takbir', title_ar = 'تكبير', content_ar = 'اللهُ أَكْبَرُ', content_en = 'Allahu Akbar — Allah is the Greatest. Recited to begin prayer, and before all posture changes except after Ruku''.' WHERE "order" = 2;
UPDATE salat_categories SET title = 'Thanaa', title_ar = 'ثناء', content_ar = 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ', content_en = 'Glory to Thee, O Allah, praiseworthy and blessed is Thy name and exalted is Thy majesty and there is no worthy of worship except Thee alone.' WHERE "order" = 3;
UPDATE salat_categories SET title = 'Ta''awwudh', title_ar = 'تعوذ', content_ar = 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', content_en = 'I seek refuge with Allah from Satan, the accursed.' WHERE "order" = 4;
UPDATE salat_categories SET title = 'Surah Al Fatiha', title_ar = 'سورة الفاتحة', content_ar = 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ ۝ اَلْحَمْدُ لِلهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اِهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ۝', content_en = 'In the name of Allah, the Gracious, the Merciful. All praise belongs to Allah, Lord of all the worlds, The Gracious, the Merciful, Master of the Day of Judgment. Thee alone do we worship and Thee alone do we implore for help. Guide us in the right path — The path of those on whom Thou hast bestowed Thy blessings, those who have not incurred Thy displeasure, and those who have not gone astray. Say ''Ameen'' (آمِينَ) at the end — meaning ''O Allah! Accept our supplications''. This can be said aloud or silently.' WHERE "order" = 5;
UPDATE salat_categories SET title = 'Ruku''', title_ar = 'ركوع', content_ar = 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', content_en = 'Holy is my Lord, the Most Great. Recited in a bowing position with hands on knees.' WHERE "order" = 7;
UPDATE salat_categories SET title = 'Tasmi''', title_ar = 'تسميع', content_ar = 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ', content_en = 'Allah listens to him who praises Him. The Imam recites this out loud to signal the congregation to change posture.' WHERE "order" = 8;
UPDATE salat_categories SET title = 'Tahmid', title_ar = 'تحميد', content_ar = 'رَبَّنَا وَلَكَ الْحَمْدُ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ', content_en = 'Our Lord, Thine is the praise, the praise which is bountiful, pure and full of blessings. Recited silently after Tasmi''.' WHERE "order" = 9;
UPDATE salat_categories SET title = 'Sajdah', title_ar = 'سجدة', content_ar = 'سُبْحَانَ رَبِّيَ الْأَعْلَى', content_en = 'Glory to my Lord, the Most High. A posture of utmost humility, submission and helplessness.' WHERE "order" = 10;
UPDATE salat_categories SET title = 'Jilsah', title_ar = 'جلسة', content_ar = 'اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَعَافِنِي، وَاجْبُرْنِي، وَارْزُقْنِي، وَارْفَعْنِي', content_en = 'Lord forgive me and have mercy on me and guide me and grant me security and make good my shortcomings and provide for me and raise me up in status. Sitting position after the first Sajdah.' WHERE "order" = 11;
UPDATE salat_categories SET title = 'Qa''dah', title_ar = 'قعدة', content_ar = 'اَلتَّحِيَّاتُ لِلهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، اَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ، اَلسَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَّا إِلَهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ — اَللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَّعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَّجِيدٌ، اَللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَّعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَّجِيدٌ', content_en = 'Tashahhud: All Salutation is due to Allah and all Prayer and everything pure. Peace be upon thee, O Prophet, and the mercy of Allah and His blessings; and peace be on us and on all righteous servants of Allah. I bear witness that there is none worthy of worship except Allah, and I bear witness that Muhammad is His servant and Messenger. (When reaching Ashhadu, raise the forefinger of the right hand, then drop it upon completion.) Durud: O Allah, Bless Muhammad (SA) and the people of Muhammad (SA), as Thou didst bless Abraham and the people of Abraham. Thou art indeed the Praiseworthy, the Glorious. Prosper, O Allah, Muhammad (SA) and the people of Muhammad (SA), as Thou didst prosper Abraham and the people of Abraham. Thou are the Praiseworthy, the Glorious.' WHERE "order" = 12;
UPDATE salat_categories SET title = 'Short Prayers', title_ar = 'قصيرة دعاء', content_ar = 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَّفِي الْآخِرَةِ حَسَنَةً وَّقِنَا عَذَابَ النَّارِ — رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَوةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ', content_en = 'Short Prayer 1 (2:202): Our Lord, grant us good in this world as well as good in the world to come, and protect us from the torment of the Fire. Short Prayer 2 (14:41-42): My Lord, make me observe Prayer, and my children too. Our Lord! bestow Thy grace on me and accept my prayer. Our Lord, grant forgiveness to me and to my parents and to the believers on the day when the reckoning will take place.' WHERE "order" = 13;
UPDATE salat_categories SET title = 'Salam', title_ar = 'السلام', content_ar = 'اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ', content_en = 'Assalamu ''Alaikum wa Rahmatullah. Peace be upon you and the mercy of Allah. The Imam turns to the right and then the left, saying this. End of prayer.' WHERE "order" = 14;
