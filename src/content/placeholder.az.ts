import { type Copy } from './placeholder';

/**
 * The owner's copy in Azerbaijani: the same shape as `copy` in
 * placeholder.ts, translated. Anything marked PLACEHOLDER there is a
 * placeholder here too, and the release build refuses on both. Farida's name
 * is written Fəridə; the site's name is kept as it is, as a name.
 */
export const copyAz: Copy = {
  siteName: 'Advice for a Dollar',

  hero: {
    writeLine: 'İçinizdə daşıdığınız şeyi yazın',
    writeHint: 'Mümkün qədər ətraflı yazmağa çalışın',
    writePrompt: 'Ürəyinizdə nə var?',
    writePlaceholder: 'İstənilən yerdən başlayın. Səliqəli olmaq məcburi deyil.',
    primaryCta: 'Məsləhət alın',
    secondaryCta: 'Başqalarının problemlərini oxuyun',
  },

  whyADollar: {
    heading: 'Niyə bir manat?',
    body: [
      'Mənim AGE_PLACEHOLDER yaşım var. Orta məktəbdə, universitetdə oxumuşam, işsiz olmuşam, işləmişəm, yaxşı pul qazanmışam, heç nə qazanmamışam — varlı, kasıb, ağlınıza gələn hər şey.',
      'Və bir tətbiq, ya da nə olursa olsun, yükləyəndə ilk baxdığım şey qiymət idi. Birinci. İndi də belə edirəm.',
      'İstəmirəm ki, bu amil — qiymət — aramıza girsin. Düşünürəm və qəti inanıram ki, insanların görünməyə və eşidilməyə ehtiyacı var.',
      'Ona görə də buradakı qiymət simvolikdir. Domen üçündür və gələcəkdə psixoloqlarla əməkdaşlıq edib insanlara tək başıma bacardığımdan daha çox kömək etmək imkanı üçündür.',
    ],
    notTherapy:
      'Bu, terapiya deyil və peşəkar psixoloji yardım deyil. Bu, bir insanın başqa bir insana cavab yazmasıdır.',
  },

  example: {
    category: 'Həqiqi nümunə gözlənilir',
    problem:
      'PLACEHOLDER — Fəridənin seçdiyi həqiqi bir problem bura gələcək. Bu, kiminsə həqiqətən göndərdiyi və icazəsi ilə dərc olunan bir problem, ya da onun nümunə kimi yazdığı bir problem olacaq.',
    advice:
      'PLACEHOLDER — Fəridənin həqiqi cavabı bura gələcək. Bu yer üçün heç nə uydurulmur. O yazana qədər bölmə açıq-aşkar boş qalır.',
    awaitingOwnerContent: true,
  },

  trust: {
    heading: 'Bunu əslində kim oxuyur',
    oneHuman: 'Bütün məsləhətləri müxtəlif rollara girən bir həqiqi insan yazır.',
    points: [
      {
        title: 'Anonim qalırsınız',
        body: 'Hesab, ad, e-poçt tələb olunmur. Giriş əvəzinə şəxsi link alırsınız.',
      },
      {
        title: 'Siz istəməsəniz, heç nə ictimai olmur',
        body: 'Yazarkən şəxsi və ya ictimai olacağını özünüz seçirsiniz. İctimai olanlar hər hansı yerdə görünməzdən əvvəl oxunur və təsdiqlənir.',
      },
      {
        title: 'Mühakimə yoxdur, bot da yoxdur',
        body: 'Burada heç nəyi maşın yazmır. Bu, sizin üçün vacibdirsə, burada da vacibdir.',
      },
    ],
  },

  finalCta: {
    heading: 'Hələ də içinizdə daşıyırsınız?',
    body: 'Yazmaq bir neçə dəqiqə, göndərmək bir manat çəkir.',
    button: 'Probleminizi yazın',
  },

  ask: {
    privacyNudge:
      'Zəhmət olmasa həqiqi adlar, iş yerləri və ya sizi ya başqasını tanıdan heç nə yazmayın. Lazımdırsa, detalları dəyişin.',
    secretWordHeading: 'Gizli söz seçin',
    secretWordWhy:
      'Şəxsi linkinizi itirsəniz, müraciətin sizə aid olduğunu bununla sübut edəcəksiniz. Yadda saxlayacağınız və heç kimin təxmin edə bilməyəcəyi bir şey seçin.',
    visibilityHeading: 'Şəxsi, yoxsa başqaları ilə paylaşılsın?',
    visibilityWhy:
      'Hər ikisinin qiyməti eynidir. İctimai problemlər hər hansı yerdə görünməzdən əvvəl Fəridə tərəfindən oxunur və təsdiqlənir, həmişə adınız olmadan.',
    paymentHeading: 'İstədiyiniz qədər ödəyin',
    paymentWhy: 'Minimum bir manat. İstəsəniz və imkanınız varsa, daha çox.',
  },

  responseTime: 'Adətən 24 saat ərzində, sıx vaxtlarda isə təxminən iki günə qədər.',

  footer: {
    tagline: 'Bir insan, cavab yazır.',
    cookieNote: 'Bu sayt izləmə kukiləri qoymur.',
  },
};
