import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import keepsakeImage from '../assets/noras-workshop-keepsake-box.jpg';
import weddingImage from '../assets/noras-workshop-wedding-decor.jpg';

const copy = {
  en: {
    eyebrow: 'The story behind the details',
    title: 'A workshop for meaningful moments',
    intro: 'Nora’s Workshop brings together handmade gifts, event details, and photography-studio décor designed to make celebrations feel considered and personal.',
    storyTitle: 'Made with a reason',
    story: [
      'The most memorable spaces are shaped by small details: a thoughtful keepsake, a welcoming table, a backdrop that gives a photograph its atmosphere.',
      'The workshop collection is built around those details. Each piece is presented with its materials, purpose, availability, and place within a larger celebration in mind.',
    ],
    values: [
      ['Thoughtful by design', 'Pieces are chosen and styled to complement meaningful occasions rather than follow disposable trends.'],
      ['Personal where it matters', 'Custom enquiries begin with the names, colors, dimensions, quantities, and date that make the project yours.'],
      ['Care from start to finish', 'Clear product information, protected payment, careful packaging, and accessible support are part of the experience.'],
    ],
    processTitle: 'How a custom idea begins',
    processIntro: 'For personalized gifts, coordinated event details, or studio styling, contact the workshop before ordering.',
    steps: [
      ['01', 'Share the occasion', 'Tell us what you are creating, who it is for, and the feeling you want it to have.'],
      ['02', 'Define the details', 'Include colors, dimensions, quantity, destination, budget, and the date you need it.'],
      ['03', 'Confirm the plan', 'Availability, preparation, delivery expectations, and pricing should be agreed before personalized work begins.'],
      ['04', 'Prepare with care', 'The finished pieces are checked and thoughtfully packaged before they leave the workshop.'],
    ],
    closingTitle: 'Let’s make the details feel personal',
    closing: 'Explore the ready-to-shop collection or start a conversation about a gift, celebration, or studio project.',
    shop: 'Explore the collection',
    contact: 'Contact the workshop',
  },
  bg: {
    eyebrow: 'Историята зад детайлите',
    title: 'Работилница за значими моменти',
    intro: 'Nora’s Workshop събира ръчно изработени подаръци, детайли за събития и декор за фотографски студиа, създадени да направят празниците обмислени и лични.',
    storyTitle: 'Създадено с причина',
    story: [
      'Най-запомнящите се пространства се изграждат от малки детайли: личен подарък, приветлива маса или декор, който придава атмосфера на снимката.',
      'Колекцията на работилницата е изградена около тези детайли. Всеки продукт е представен с мисъл за материалите, предназначението, наличността и мястото му в по-големия празник.',
    ],
    values: [
      ['Обмислен дизайн', 'Продуктите са подбрани и стилизирани за значими поводи, а не за краткотрайни тенденции.'],
      ['Лично, където има значение', 'Персоналните запитвания започват с имената, цветовете, размерите, количествата и датата, които правят проекта ваш.'],
      ['Грижа от начало до край', 'Ясната продуктова информация, защитеното плащане, внимателната опаковка и достъпната помощ са част от изживяването.'],
    ],
    processTitle: 'Как започва персоналната идея',
    processIntro: 'За персонализирани подаръци, съчетан декор за събитие или студийно оформление се свържете с работилницата преди поръчка.',
    steps: [
      ['01', 'Споделете повода', 'Разкажете какво създавате, за кого е и какво усещане искате да носи.'],
      ['02', 'Уточнете детайлите', 'Добавете цветове, размери, количество, дестинация, бюджет и необходима дата.'],
      ['03', 'Потвърдете плана', 'Наличността, подготовката, доставката и цената трябва да бъдат уточнени преди започване на персонализирана работа.'],
      ['04', 'Подготовка с грижа', 'Готовите продукти се проверяват и опаковат внимателно, преди да напуснат работилницата.'],
    ],
    closingTitle: 'Нека детайлите бъдат лични',
    closing: 'Разгледайте готовата колекция или започнете разговор за подарък, празник или студиен проект.',
    shop: 'Разгледайте колекцията',
    contact: 'Свържете се с работилницата',
  },
};

function AboutPage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage === 'bg' ? 'bg' : 'en';
  const content = copy[language];

  return (
    <article className="about-page">
      <Helmet>
        <title>{language === 'bg' ? 'За работилницата' : 'About the workshop'} | Nora’s Workshop</title>
        <meta name="description" content={content.intro} />
      </Helmet>

      <section className="about-hero">
        <div className="about-hero-copy">
          <span>{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p>
          <div className="about-actions"><Link to="/search">{content.shop}</Link><a href="mailto:petar_vs@outlook.com">{content.contact}</a></div>
        </div>
        <div className="about-hero-media"><img src={weddingImage} alt={language === 'bg' ? 'Ръчно изработен сватбен декор' : 'Handmade wedding décor'} loading="eager" decoding="async" /></div>
      </section>

      <section className="about-story">
        <div><span>Nora’s Workshop</span><h2>{content.storyTitle}</h2></div>
        <div>{content.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="about-values" aria-label={language === 'bg' ? 'Нашите ценности' : 'Our values'}>
        {content.values.map(([title, description], index) => (
          <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{description}</p></article>
        ))}
      </section>

      <section className="about-process">
        <div className="about-process-media"><img src={keepsakeImage} alt={language === 'bg' ? 'Персонализиран подарък от работилницата' : 'Personalized workshop keepsake'} loading="lazy" decoding="async" /></div>
        <div className="about-process-content">
          <span>{language === 'bg' ? 'Персонализирани проекти' : 'Personal projects'}</span><h2>{content.processTitle}</h2><p>{content.processIntro}</p>
          <ol>{content.steps.map(([number, title, description]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        </div>
      </section>

      <section className="about-closing">
        <span><i className="fas fa-heart" aria-hidden="true"></i></span><h2>{content.closingTitle}</h2><p>{content.closing}</p>
        <div className="about-actions"><Link to="/search">{content.shop}</Link><a href="mailto:petar_vs@outlook.com">{content.contact}</a></div>
      </section>
    </article>
  );
}

export default AboutPage;
