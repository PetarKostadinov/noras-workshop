import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const policies = {
  en: {
    privacy: {
      title: 'Privacy Policy',
      intro: 'This policy explains how Nora’s Workshop handles personal information when you browse the shop, create an account, place an order, or contact us.',
      sections: [
        ['Who is responsible', [
          'Nora’s Workshop, based in Burgas, Bulgaria, is responsible for the personal information handled through this website. Privacy questions and requests can be sent to petar_vs@outlook.com.',
        ]],
        ['Information we collect', [
          'Account information: your name, email address, hashed password, account role, and authentication information.',
          'Review information: your public account name, star rating, written review, submission date, and whether the account has a verified paid purchase of that product.',
          'Order information: contact email, purchased products, quantities, prices, delivery name and address, payment method, transaction references, payment status, and fulfillment status.',
          'Shopping information stored in your browser: cart contents, delivery details, payment-method selection, language, analytics preference, and a random per-order access token when you check out as a guest.',
          'Usage information: page views and ecommerce interactions are sent to Google Analytics only after you allow analytics.',
          'We do not collect or store raw card numbers, expiry dates, or security codes. Card details are entered on Stripe-hosted Checkout, and PayPal credentials are handled by PayPal.',
        ]],
        ['Why we use information', [
          'To provide accounts, carts, checkout, payment confirmation, order history, customer support, fraud prevention, and website security.',
          'To perform the purchase contract and take steps you request before purchasing.',
          'To meet applicable accounting, tax, legal, and regulatory obligations.',
          'To understand and improve the shop when you have consented to analytics.',
        ]],
        ['Services that receive information', [
          'Hosting and database providers process information needed to operate the website and store accounts and orders.',
          'Stripe and PayPal process payments and return transaction status information to the shop.',
          'Google Analytics receives usage and ecommerce-event information only after consent.',
          'Cloudinary hosts product images uploaded by administrators; customer payment details are not sent to Cloudinary.',
          'Providers may process information outside the European Economic Area under their applicable safeguards and contractual terms.',
        ]],
        ['Retention and security', [
          'Account information is retained while the account is active or as needed to provide the service. Order information may be retained for periods required by accounting, tax, dispute, and legal obligations.',
          'Analytics retention is controlled in the connected Google Analytics property. Browser storage remains until it is cleared, replaced, or removed through the relevant shop action.',
          'The shop uses encrypted HTTPS connections, hashed passwords, authenticated order access, and hosted payment providers. No online system can guarantee absolute security.',
        ]],
        ['Your choices and rights', [
          'Depending on applicable law, you may request access, correction, deletion, restriction, objection, or a portable copy of your personal information.',
          'You may withdraw analytics consent at any time through Analytics settings in the footer. Withdrawal does not affect processing that occurred before it.',
          'You may also complain to the Bulgarian Commission for Personal Data Protection or another competent supervisory authority.',
        ]],
      ],
    },
    cookies: {
      title: 'Cookie and Browser Storage Policy',
      intro: 'This policy describes the cookies and browser storage used by Nora’s Workshop and how you can control optional analytics.',
      sections: [
        ['Essential browser storage', [
          'The shop uses first-party local storage for your cart, account session, guest-order access, delivery details, selected payment method, language, and analytics preference. These values make the features you request persist between pages and visits.',
          'Declining analytics does not prevent you from browsing, signing in, adding products to the cart, or completing checkout.',
        ]],
        ['Google Analytics', [
          'Google Analytics is optional and remains unloaded until you select Allow analytics. It measures page views and ecommerce events such as product views, cart actions, checkout steps, and completed purchases.',
          'When enabled, Google may set cookies such as _ga and _ga_<container-id>. Their duration and processing depend on the Google Analytics property settings and Google’s policies.',
          'Advertising storage, advertising user data, and advertising personalization remain disabled by this website’s consent configuration.',
        ]],
        ['Payment providers', [
          'PayPal and Stripe may use their own necessary or security technologies when you choose and open their payment services. Their use is governed by their respective privacy and cookie information.',
        ]],
        ['Manage your choice', [
          'You can accept or decline analytics with equal access to the shop. Use Analytics settings in the footer to change your choice at any time.',
          'You can also clear website data through your browser. Doing so removes saved preferences and may sign you out or clear the cart.',
        ]],
      ],
    },
  },
  bg: {
    privacy: {
      title: 'Политика за поверителност',
      intro: 'Тази политика обяснява как Nora’s Workshop обработва лични данни, когато разглеждате магазина, създавате профил, правите поръчка или се свързвате с нас.',
      sections: [
        ['Кой носи отговорност', ['Nora’s Workshop, базирана в Бургас, България, отговаря за личните данни, обработвани чрез този уебсайт. Въпроси и искания относно поверителността могат да бъдат изпращани на petar_vs@outlook.com.']],
        ['Каква информация събираме', [
          'Данни за профила: име, имейл адрес, хеширана парола, роля и информация за удостоверяване.',
          'Данни за отзиви: публичното име на профила, оценка със звезди, написан отзив, дата и дали профилът има потвърдена платена покупка на продукта.',
          'Данни за поръчката: имейл за контакт, продукти, количества, цени, име и адрес за доставка, начин на плащане, референции за транзакции и статус на плащането и изпълнението.',
          'Информация в браузъра: съдържание на количката, данни за доставка, избран начин на плащане, език, избор за анализи и случаен ключ за достъп до конкретна поръчка без профил.',
          'Данни за използването: прегледи на страници и действия в магазина се изпращат към Google Analytics само след разрешение.',
          'Не събираме и не съхраняваме номера на карти, срокове на валидност или кодове за сигурност. Картовите данни се въвеждат в Stripe Checkout, а данните за PayPal се обработват от PayPal.',
        ]],
        ['Защо използваме информацията', [
          'За профили, количка, плащане, потвърждение на плащането, история на поръчките, обслужване, предотвратяване на измами и сигурност.',
          'За изпълнение на договора за покупка и действията, поискани от вас преди покупката.',
          'За изпълнение на приложими счетоводни, данъчни и законови задължения.',
          'За подобряване на магазина, когато сте дали съгласие за анализи.',
        ]],
        ['Услуги, които получават информация', [
          'Доставчиците на хостинг и база данни обработват необходимата информация за работата на сайта и съхранението на профили и поръчки.',
          'Stripe и PayPal обработват плащания и връщат информация за статуса на транзакциите.',
          'Google Analytics получава данни за използването и електронната търговия само след съгласие.',
          'Cloudinary съхранява продуктови изображения, качени от администратори; клиентски платежни данни не се изпращат към Cloudinary.',
          'Доставчиците могат да обработват информация извън Европейското икономическо пространство съгласно приложимите гаранции и договорни условия.',
        ]],
        ['Съхранение и сигурност', [
          'Данните за профила се пазят, докато той е активен или докато са нужни за услугата. Данните за поръчки могат да се пазят за срокове, изисквани от счетоводни, данъчни и законови задължения.',
          'Срокът за анализи се управлява в Google Analytics. Данните в браузъра остават до изчистване, замяна или премахване чрез съответното действие в магазина.',
          'Магазинът използва HTTPS, хеширани пароли, защитен достъп до поръчки и външни платежни доставчици. Никоя онлайн система не може да гарантира абсолютна сигурност.',
        ]],
        ['Вашите права и избори', [
          'Според приложимото право можете да поискате достъп, корекция, изтриване, ограничаване, възражение или преносимо копие на личните си данни.',
          'Можете да оттеглите съгласието за анализи чрез Настройки за анализи във футъра. Оттеглянето не засяга обработването преди него.',
          'Можете да подадете жалба до Комисията за защита на личните данни или друг компетентен надзорен орган.',
        ]],
      ],
    },
    cookies: {
      title: 'Политика за бисквитки и данни в браузъра',
      intro: 'Тази политика описва бисквитките и данните в браузъра, използвани от Nora’s Workshop, и управлението на незадължителните анализи.',
      sections: [
        ['Необходими данни в браузъра', [
          'Магазинът използва локално хранилище за количката, сесията на профила, достъпа до гост поръчки, данните за доставка, избрания начин на плащане, езика и избора за анализи. Те запазват поисканите функции между страниците и посещенията.',
          'Отказът от анализи не пречи на разглеждането, входа, количката или завършването на поръчка.',
        ]],
        ['Google Analytics', [
          'Google Analytics е незадължителен и не се зарежда, докато не изберете Разрешавам анализите. Измерва прегледи на страници и действия като разглеждане на продукт, количка, стъпки на поръчката и завършени покупки.',
          'При разрешение Google може да задава бисквитки като _ga и _ga_<идентификатор>. Срокът и обработването зависят от настройките на Google Analytics и политиките на Google.',
          'Рекламното съхранение, рекламните потребителски данни и персонализирането на реклами остават изключени.',
        ]],
        ['Платежни доставчици', ['PayPal и Stripe могат да използват собствени необходими технологии за сигурност, когато отворите техните платежни услуги. Използването им се урежда от техните политики за поверителност и бисквитки.']],
        ['Управление на избора', [
          'Можете да приемете или откажете анализите при еднакъв достъп до магазина. Използвайте Настройки за анализи във футъра, за да промените избора си.',
          'Можете да изчистите данните на сайта от браузъра. Това премахва предпочитанията и може да излезете от профила или да изчистите количката.',
        ]],
      ],
    },
  },
};

function LegalPage() {
  const { policy } = useParams();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage === 'bg' ? 'bg' : 'en';
  const content = policies[language][policy] || policies[language].privacy;

  return (
    <article className="legal-page">
      <Helmet><title>{content.title} | Nora’s Workshop</title></Helmet>
      <header className="legal-heading">
        <span>{language === 'bg' ? 'Доверие и прозрачност' : 'Trust and transparency'}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
        <small>{language === 'bg' ? 'Последна актуализация: 8 август 2026 г.' : 'Last updated: August 8, 2026'}</small>
      </header>

      <div className="legal-layout">
        <nav className="legal-navigation" aria-label={language === 'bg' ? 'Правни документи' : 'Legal documents'}>
          <Link className={policy === 'privacy' ? 'active' : ''} to="/legal/privacy">{language === 'bg' ? 'Поверителност' : 'Privacy'}</Link>
          <Link className={policy === 'cookies' ? 'active' : ''} to="/legal/cookies">{language === 'bg' ? 'Бисквитки' : 'Cookies'}</Link>
        </nav>
        <div className="legal-content">
          {content.sections.map(([heading, paragraphs]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          {policy === 'cookies' && (
            <button type="button" className="legal-preferences-button" onClick={() => window.dispatchEvent(new Event('open-analytics-preferences'))}>
              {language === 'bg' ? 'Промяна на настройките за анализи' : 'Change analytics settings'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default LegalPage;
