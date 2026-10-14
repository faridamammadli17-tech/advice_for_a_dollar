import { type StaticPage } from './pages';

/**
 * The content pages in Azerbaijani, the same shape as pages.ts. Privacy and
 * Terms describe what the code does, so they must be corrected in both
 * languages whenever the code changes.
 */

export const howItWorksAz: StaticPage = {
  slug: 'how-it-works',
  title: 'Necə işləyir',
  intro: 'Doqquz addım var və yalnız ilk beşi sizin üzərinizdədir.',
  sections: [
    {
      heading: 'Siz nə edirsiniz',
      bullets: [
        'Nə baş verdiyini yazırsınız. Səliqəli və ya yaxşı əsaslandırılmış olmaq məcburi deyil.',
        'Linkinizi itirsəniz deyə gizli söz seçirsiniz.',
        'Şəxsi qalacağını, yoxsa paylaşıla biləcəyini seçirsiniz.',
        'Bir manat, istəsəniz daha çox ödəyirsiniz.',
        'Sizə verilən sehrli linki saxlayırsınız.',
      ],
    },
    {
      heading: 'Sonra nə olur',
      bullets: [
        'Fəridə oxuyur və cavab yazır — adətən 24 saat ərzində, sıx vaxtlarda isə təxminən iki günə qədər.',
        'Linkinizlə qayıdırsınız.',
        'Məsləhətinizi oxuyursunuz.',
        'Lazım olsa, bir əlavə mesaj göndərirsiniz — Fəridə bir dəfə də cavab yazır. Bununla bağlanır.',
      ],
    },
    {
      heading: 'Bu nə deyil',
      paragraphs: [
        'Bu, terapiya deyil və peşəkar psixoloji yardım deyil. Bu, bir insanın yazdıqlarınızı oxuyub dürüst cavab verməsidir.',
        'Təcili və ya təhlükəli bir şey varsa, bu, düzgün kömək növü deyil. Zəhmət olmasa təcili yardım xidmətlərinə müraciət edin.',
      ],
    },
  ],
};

export const aboutAz: StaticPage = {
  slug: 'about',
  title: 'Haqqında',
  sections: [
    {
      heading: '“Advice for a Dollar” nədir?',
      paragraphs: [
        'Advice for a Dollar — ürəyinizdə nə varsa yazıb həqiqi bir insandan cavab ala biləcəyiniz təşəbbüs və saytdır.',
        'Bu fikir bir gecə saat 2-də ağlıma gəldi. O anlardan doğdu ki, çətin vaxtlarda hamımız ürəyimizi tamamilə yad birinə boşaltmaq istəmişik — bizi tanımayan, həyatımız haqqında əvvəlcədən fikri olmayan, amma yenə də deməyə mənalı bir sözü ola biləcək birinə.',
        'Bu, terapiya deyil və mən həkim ya da ruhi sağlamlıq mütəxəssisi deyiləm. Mən sadəcə, öz təvazökar fikrimcə, dinləməyə, baxışımı bölüşməyə və ümid edirəm ki, sizi bir az daha görünən hiss etdirməyə hazır olan bacarıqlı bir insan və empatam.',
        'Bəzən mütəxəssis lazım olmur. Sadəcə dinləyən biri lazım olur.',
      ],
    },
    {
      heading: 'Necə işləyir?',
      paragraphs: [
        'Bir probleminiz, bir fikriniz, bir dilemmanız, ya da sadəcə ürəyinizi boşaltmaq istədiyiniz bir şey var — və tamamilə yad birinin bu barədə nə düşündüyünü eşitmək istəyirsiniz.',
        'Sayta girirsiniz, paylaşmaq istədiyinizi yazırsınız və oxumağım üçün 1 AZN ödəyirsiniz. Sonra, müraciətlərin sayından asılı olaraq, bir-iki gün ərzində cavab alırsınız.',
      ],
    },
  ],
};

export const faqAz: StaticPage = {
  slug: 'faq',
  title: 'Suallar',
  sections: [
    {
      heading: 'Kim cavab verir?',
      paragraphs: [
        'Fəridə. Hər dəfə bir insan. Burada heç nəyi maşın yazmır — nə qaralama kimi, nə təklif kimi, nə də doldurma kimi.',
      ],
    },
    {
      heading: 'Niyə ümumiyyətlə pul alınır?',
      paragraphs: [
        'Bir manat kiminsə susmasına səbəb olmayacaq qədər azdır və bunun yad birindən istənilən bir yaxşılıq olmadığını göstərəcək qədər həqiqidir. İstəsəniz, daha çox ödəyə bilərsiniz.',
      ],
    },
    {
      heading: 'Hesab lazımdır?',
      paragraphs: [
        'Xeyr. Hesab, parol və giriş yoxdur. Əvəzinə şəxsi link, itirsəniz deyə də gizli söz alırsınız.',
      ],
    },
    {
      heading: 'Yazdığımı kimsə görəcək?',
      paragraphs: [
        'Yalnız paylaşılmasını istəmisinizsə və yalnız Fəridə oxuyub dərc etmək qərarına gələndən sonra. İstəmək dərc olunmaq demək deyil. Şəxsi müraciətləri Fəridə və siz görürsünüz, başqa heç kim.',
      ],
    },
    {
      heading: 'Fikrimi dəyişə bilərəm?',
      paragraphs: [
        'Bəli. Müraciətinizi istənilən vaxt linkinizlə silə bilərsiniz. Bu, mətni və cavabı məhv edir, link isə işləməyi dayandırır.',
      ],
    },
    {
      heading: 'Cavab nə qədər çəkir?',
      paragraphs: ['Adətən 24 saat ərzində, sıx vaxtlarda isə təxminən iki günə qədər.'],
    },
    {
      heading: 'Cavabdan sonra danışmağa davam edə bilərəm?',
      paragraphs: [
        'Bir əlavə mesaj göndərə bilərsiniz, Fəridə bir dəfə də cavab yazır. Yazışma bundan ibarətdir. Bu, çat deyil və bu, qəsdən belədir — beləcə bir insanın həqiqətən davam etdirə biləcəyi bir şey olaraq qalır.',
      ],
    },
  ],
};

export const communityGuidelinesAz: StaticPage = {
  slug: 'community-guidelines',
  title: 'Burada nəyə icazə verilmir',
  intro:
    'Qısası: öz həyatınız haqqında yazın və bu yerdən kiməsə zərər vermək üçün istifadə etməyin. Qalanı detaldır.',
  sections: [
    {
      heading: 'Müraciətin rədd edilməsinə səbəb olanlar',
      bullets: [
        'Nifrət nitqi, ya da bir şəxsə və ya qrupa yönəlmiş təhqir.',
        'Hər hansı formada təqib və ya hədə.',
        'Başqa bir şəxsin adını açmaq və ya ifşa etmək — həqiqi adlar, iş yerləri, ünvanlar, fotolar, telefon nömrələri.',
        'Kimisə təhlükəyə ata biləcək göstərişlər.',
        'Spam, reklam və ya başqa yerə trafik yönəltmək üçün qoyulan linklər.',
      ],
    },
    {
      heading: 'Bunu kiməsə qarşı istifadə etmək',
      paragraphs: [
        'Bura başqa bir şəxsə qarşı iş qurmaq və ya onun cavab verə bilməyəcəyi bir şeyi onun haqqında dərc etmək yeri deyil. Müraciət əsasən başqasını ifşa etməkdən ibarətdirsə, dərc olunmayacaq.',
      ],
    },
    {
      heading: 'Detalları dəyişmək olar',
      paragraphs: [
        'Adları və tanıdan detalları dəyişməyiniz məsləhətdir. Bu, problemi daha az həqiqi etmir və həm sizi, həm də hekayədəki başqalarını qoruyur.',
      ],
    },
  ],
};

export const privacyAz: StaticPage = {
  slug: 'privacy',
  title: 'Məxfilik',
  intro:
    'Bu layihə mümkün qədər az məlumat toplayır. Bu, heç nə toplamamaq demək deyil və əksini iddia etmək dürüst olmazdı — ona görə də nəyin saxlanıldığı burada dəqiq yazılıb.',
  sections: [
    {
      heading: 'Nə saxlanılır',
      bullets: [
        'Yazdıqlarınız və cavab.',
        'Şəxsi linkinizin kodu — sizi geri buraxan şey odur.',
        'Gizli sözünüzü yoxlamaq üçün məlumat — qarışdırılmış şəkildə, heç vaxt sözün özü yox.',
        'Ödəniş əməliyyatının qeydi, məbləğ də daxil olmaqla.',
        'Vaxt möhürləri və müraciətin baxılıb-baxılmadığı, dərc olunub-olunmadığı.',
        'E-poçt ünvanınız — yalnız verməyi seçmisinizsə və yalnız altı ay.',
        'İtirilmiş linkin bərpasına və ya sahib girişinə cəhd edən hər kəsin şəbəkə ünvanı — təxmin etməni dayandırmaq üçün, on beş dəqiqəlik. Sonra silinir.',
      ],
    },
    {
      heading: 'Nə heç vaxt soruşulmur',
      bullets: ['Adınız.', 'Yaşınız, cinsiniz və ya ölkəniz.', 'Parol və ya hər hansı növ hesab.'],
    },
    {
      heading: 'Müraciətinizi kim görə bilər',
      paragraphs: [
        'Şəxsi müraciəti Fəridə və siz, linkinizlə, görürsünüz. Başqa heç kim.',
        'İctimai müraciəti əvvəlcə Fəridə görür. Yalnız o təsdiqləsə ictimai görünür və həmişə adınız olmadan.',
      ],
    },
    {
      heading: 'E-poçt və altı ay',
      paragraphs: [
        'E-poçt ünvanı versəniz, bir şey üçün istifadə olunur: cavabınızın hazır olduğunu sizə bildirmək üçün. Göndərişdən altı ay sonra silinir.',
        'Bilməyə dəyər bir nəticə: itirilmiş linki bərpa etməyin bir yolu da e-poçtunuzdur. Həmin altı aydan sonra bu yol bağlanır və geriyə gizli sözünüz və tarix qalır.',
      ],
    },
    {
      heading: 'Silmək',
      paragraphs: [
        'Müraciətinizi istənilən vaxt linkinizlə silə bilərsiniz. Mətn və cavab məhv edilir. Ödənişin qeydi saxlanılır, çünki geri qaytarma və mühasibatlıq üçün lazımdır — orada əməliyyat nömrəsi, məbləğ və tarixlər var, yazdıqlarınız yox.',
      ],
    },
    {
      heading: 'Kukilər və izləmə',
      paragraphs: [
        'Bu sayt izləmə kukiləri qoymur və sizi izləyən analitika işlətmir. Brauzeriniz dil və görünüş seçiminizi, yazarkən isə mətninizin qaralamasını saxlayır — hər ikisi öz cihazınızda qalır.',
      ],
    },
  ],
};

export const termsAz: StaticPage = {
  slug: 'terms',
  title: 'Şərtlər',
  awaitingOwnerContent: true,
  intro:
    'PLACEHOLDER — bu səhifəyə mühəndis yox, hüquqşünas lazımdır. Aşağıdakılar xidmətin əslində necə işlədiyini təsvir edir ki, həqiqi şərtləri yazan şəxsin başlamaq üçün dəqiq bir əsası olsun.',
  sections: [
    {
      heading: 'Xidmət nədir',
      paragraphs: [
        'Bir insan göndərdiyinizi oxuyur və şəxsi cavab yazır. Bu, terapiya deyil, tibbi məsləhət deyil, hüquqi və ya maliyyə məsləhəti deyil, peşəkar psixoloji yardım deyil.',
      ],
    },
    {
      heading: 'Nə alırsınız',
      paragraphs: [
        'Bir yazılı cavab — adətən 24 saat ərzində, ən çox təxminən iki günə. Sizdən bir əlavə mesaj və bir son cavab.',
      ],
    },
    {
      heading: 'Geri qaytarma',
      paragraphs: [
        'Ödəniş əməliyyat qeydi üzrə geri qaytarıla bilər. Bunun üçün heç bir əlaqə məlumatı verməyiniz lazım deyil.',
      ],
    },
    {
      heading: 'Cavablana bilməyən müraciətlər',
      paragraphs: [
        'Təcili təhlükəsizlik narahatlığı yaradan müraciət ödənişdən əvvəl dayandırılır və heç vaxt dərc olunmur. Bu halda heç nə ödənilmir.',
      ],
    },
  ],
};
