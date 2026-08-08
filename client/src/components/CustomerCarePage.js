import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const careContent = {
  en: {
    shipping: {
      eyebrow: 'From the workshop to you',
      title: 'Shipping and delivery',
      intro: 'Clear costs and careful packaging for every handmade order.',
      cards: [
        ['Shipping cost', 'Standard shipping is $10. Shipping is free when the merchandise subtotal is more than $100. The complete shipping charge, tax, and order total are shown before the order is placed.'],
        ['Where we deliver', 'Delivery availability depends on the destination. Contact the workshop before ordering if you need international delivery or delivery to a time-sensitive event.'],
        ['Preparation and timing', 'Handmade and personalized products may require preparation time. Because preparation and carrier estimates are not currently calculated by the website, contact us before ordering when you have a required date.'],
        ['Packaging and status', 'Orders are checked and carefully packaged before dispatch. Signed-in customers can review payment and fulfillment status from Order history.'],
      ],
      note: 'Need an estimate for an event date? Tell us the product, quantity, destination, and required date before placing the order.',
    },
    returns: {
      eyebrow: 'Buy with confidence',
      title: 'Returns and order concerns',
      intro: 'We want every order to arrive as expected. These terms do not reduce any mandatory consumer rights that apply to you.',
      cards: [
        ['Standard returns', 'For eligible non-personalized goods purchased online, contact us within 14 days after delivery if you wish to withdraw from the purchase. Return postage and suitable packaging are normally the customer’s responsibility.'],
        ['Personalized products', 'The statutory cooling-off right generally does not apply to products made to your specifications or clearly personalized. We will identify personalization with you before work begins.'],
        ['Condition of returned goods', 'You may inspect a product as you would in a shop. Please return it safely packaged and without use beyond what is needed for inspection. A reduction may apply if handling has diminished its value.'],
        ['Refunds', 'Eligible refunds include the product amount and the cost of standard outbound delivery. A refund may be held until the goods are returned or you provide evidence of dispatch, and is sent through the original payment method.'],
        ['Damaged, defective, or incorrect items', 'Contact us promptly with your order number and clear photographs. These cases are handled separately from change-of-mind returns, and your legal rights for non-conforming goods remain unaffected.'],
        ['How to start', 'Email petar_vs@outlook.com with your order number, the item concerned, and the reason for contacting us. Please wait for return instructions before sending a parcel.'],
      ],
      note: 'If you need to change an address or request cancellation, contact us immediately. Changes cannot be guaranteed after preparation or payment processing has begun.',
    },
    faq: {
      eyebrow: 'Helpful answers',
      title: 'Frequently asked questions',
      intro: 'Quick answers about handmade products, checkout, payment, and delivery.',
      questions: [
        ['Can I request a personalized product?', 'Yes. Contact the workshop before ordering to discuss names, colors, quantities, dimensions, timing, and pricing. Personalized work may have different return conditions.'],
        ['How much is shipping?', 'Standard shipping is $10 and becomes free when the merchandise subtotal is more than $100. The final total appears during order review.'],
        ['How long will my order take?', 'Timing depends on the product, quantity, personalization, destination, and carrier. The website does not yet calculate a delivery date, so please contact us before ordering for an event deadline.'],
        ['Which payment methods are supported?', 'The shop supports PayPal and card payment through Stripe-hosted Checkout. Nora’s Workshop does not receive or store your raw card details.'],
        ['When is my order confirmed?', 'An order is confirmed for preparation after its payment is verified. You can revisit the order page or Order history to check its payment and fulfillment status.'],
        ['Can I change or cancel an order?', 'Contact us immediately with your order number. We will help where possible, but changes or cancellation cannot be guaranteed after personalized production or payment processing begins.'],
        ['What if my item arrives damaged or incorrect?', 'Email us promptly with the order number and clear photographs of the item and packaging so we can assess and resolve the issue.'],
        ['Do I need an account?', 'The current checkout requires an account so order ownership, payment confirmation, and order history can be protected. Your cart remains saved while you register or sign in.'],
        ['What currency does the shop use?', 'Prices and payments are currently processed in US dollars (USD). Your bank or payment provider may apply currency-conversion charges.'],
      ],
    },
  },
  bg: {
    shipping: {
      eyebrow: 'От работилницата до вас',
      title: 'Доставка',
      intro: 'Ясни разходи и внимателно опаковане за всяка ръчно изработена поръчка.',
      cards: [
        ['Цена на доставката', 'Стандартната доставка е $10. Доставката е безплатна, когато междинната сума на продуктите е над $100. Пълната цена за доставка, данъкът и общата сума се показват преди поръчката.'],
        ['Къде доставяме', 'Възможността за доставка зависи от дестинацията. Свържете се с работилницата преди поръчка за международна доставка или доставка за събитие с конкретна дата.'],
        ['Подготовка и срокове', 'Ръчно изработените и персонализираните продукти може да изискват време за подготовка. Сайтът все още не изчислява срок за изработка и доставка, затова се свържете с нас при необходима дата.'],
        ['Опаковка и статус', 'Поръчките се проверяват и опаковат внимателно преди изпращане. Влезлите потребители могат да следят плащането и изпълнението от История на поръчките.'],
      ],
      note: 'Нуждаете се от срок за събитие? Изпратете продукта, количеството, дестинацията и необходимата дата преди поръчка.',
    },
    returns: {
      eyebrow: 'Пазарувайте уверено',
      title: 'Връщане и проблеми с поръчка',
      intro: 'Искаме всяка поръчка да пристигне според очакванията. Тези условия не ограничават задължителните ви потребителски права.',
      cards: [
        ['Стандартно връщане', 'За допустими неперсонализирани стоки, закупени онлайн, се свържете с нас до 14 дни след доставката, ако желаете да се откажете от покупката. Разходите за връщане и подходяща опаковка обикновено са за клиента.'],
        ['Персонализирани продукти', 'Законовото право на отказ обикновено не се прилага за продукти, изработени по ваши спецификации или ясно персонализирани. Ще уточним персонализацията преди започване на работата.'],
        ['Състояние на върнатите стоки', 'Можете да прегледате продукта както в магазин. Върнете го безопасно опакован и без употреба извън необходимото за преглед. При намалена стойност може да бъде приложено приспадане.'],
        ['Възстановяване на суми', 'Допустимите възстановявания включват стойността на продукта и стандартната първоначална доставка. Сумата може да бъде задържана до получаване на стоката или доказателство за изпращане и се връща чрез първоначалния начин на плащане.'],
        ['Повреден, дефектен или грешен продукт', 'Свържете се с нас своевременно с номер на поръчка и ясни снимки. Тези случаи се обработват отделно от връщането при промяна на решението и законовите ви права остават непроменени.'],
        ['Как да започнете', 'Пишете на petar_vs@outlook.com с номер на поръчката, продукта и причината. Изчакайте инструкции, преди да изпратите пратка.'],
      ],
      note: 'За промяна на адрес или отказ се свържете незабавно. Промени не могат да бъдат гарантирани след започване на изработка или обработване на плащането.',
    },
    faq: {
      eyebrow: 'Полезни отговори',
      title: 'Често задавани въпроси',
      intro: 'Кратки отговори за ръчната изработка, поръчката, плащането и доставката.',
      questions: [
        ['Мога ли да поръчам персонализиран продукт?', 'Да. Свържете се с работилницата преди поръчка, за да уточним имена, цветове, количества, размери, срок и цена. За персонализирана изработка може да важат различни условия за връщане.'],
        ['Колко струва доставката?', 'Стандартната доставка е $10 и е безплатна при междинна сума на продуктите над $100. Финалната сума се показва при прегледа на поръчката.'],
        ['Колко време отнема поръчката?', 'Срокът зависи от продукта, количеството, персонализацията, дестинацията и куриера. Сайтът все още не изчислява дата за доставка, затова се свържете с нас за краен срок на събитие.'],
        ['Какви начини на плащане се поддържат?', 'Магазинът поддържа PayPal и картово плащане чрез Stripe Checkout. Nora’s Workshop не получава и не съхранява пълните данни на картата.'],
        ['Кога поръчката е потвърдена?', 'Поръчката се потвърждава за подготовка след проверено плащане. Можете да проверявате плащането и изпълнението от страницата на поръчката или История на поръчките.'],
        ['Мога ли да променя или отменя поръчка?', 'Свържете се незабавно с номера на поръчката. Ще помогнем, когато е възможно, но промяна или отказ не могат да се гарантират след започване на персонализирана изработка или обработка на плащането.'],
        ['Какво да направя при повреден или грешен продукт?', 'Изпратете своевременно имейл с номера на поръчката и ясни снимки на продукта и опаковката, за да оценим и разрешим проблема.'],
        ['Необходим ли е профил?', 'Текущата поръчка изисква профил, за да защити собствеността на поръчката, потвърждението на плащане и историята. Количката остава запазена при регистрация или вход.'],
        ['В каква валута са цените?', 'Цените и плащанията в момента са в щатски долари (USD). Вашата банка или платежен доставчик може да начисли такса за превалутиране.'],
      ],
    },
  },
};

function CustomerCarePage() {
  const { topic } = useParams();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage === 'bg' ? 'bg' : 'en';
  const content = careContent[language][topic] || careContent[language].faq;

  return (
    <article className="care-page">
      <Helmet><title>{content.title} | Nora’s Workshop</title></Helmet>
      <header className="care-heading">
        <span>{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p>
      </header>
      <nav className="care-navigation" aria-label={language === 'bg' ? 'Помощ за клиенти' : 'Customer care'}>
        <Link className={topic === 'shipping' ? 'active' : ''} to="/help/shipping">{language === 'bg' ? 'Доставка' : 'Shipping'}</Link>
        <Link className={topic === 'returns' ? 'active' : ''} to="/help/returns">{language === 'bg' ? 'Връщане' : 'Returns'}</Link>
        <Link className={topic === 'faq' ? 'active' : ''} to="/help/faq">FAQ</Link>
      </nav>

      {content.cards && (
        <div className="care-card-grid">
          {content.cards.map(([title, body]) => <section className="care-card" key={title}><h2>{title}</h2><p>{body}</p></section>)}
        </div>
      )}
      {content.questions && (
        <div className="care-faq">
          {content.questions.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>{question}<i className="fas fa-chevron-down" aria-hidden="true"></i></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      )}
      {content.note && <aside className="care-note"><i className="far fa-envelope" aria-hidden="true"></i><p>{content.note}<a href="mailto:petar_vs@outlook.com">petar_vs@outlook.com</a></p></aside>}
    </article>
  );
}

export default CustomerCarePage;
