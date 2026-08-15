export const FAQ_CONTENT = {
  en: {
    popularIds: ['shipping-cost', 'delivery-time', 'returns'],
    ui: {
      title: 'Workshop help',
      welcome: 'Hi! I’m Nora’s AI workshop assistant. Choose a question or type your own.',
      privacy: 'Please don’t share order numbers, addresses, or payment details here.',
      fallback: 'I couldn’t answer that right now. Please try again or contact Nora.',
      contact: 'Contact Nora', open: 'Open FAQ help', close: 'Close FAQ help', inputLabel: 'Ask a question', inputPlaceholder: 'Type your question…', send: 'Send', thinking: 'Thinking…',
      shippingLink: 'Shipping information', returnsLink: 'Return policy', moreLink: 'Learn more',
    },
    entries: [
      { id: 'shipping-cost', question: 'How much is shipping?', answer: 'Standard shipping is $10 and is free when the merchandise subtotal is more than $100. The final total appears during order review.', keywords: ['how much is shipping', 'shipping cost', 'delivery cost', 'free shipping'], href: '/help/shipping' },
      { id: 'delivery-time', question: 'How long will my order take?', answer: 'Timing depends on the product, quantity, personalization, destination, and carrier. Contact the workshop before ordering when you have an event deadline.', keywords: ['how long will my order take', 'delivery time', 'arrival', 'deadline', 'order'], href: '/help/shipping' },
      { id: 'returns', question: 'Can I return an item?', answer: 'Eligible non-personalized goods can generally be returned after you contact the workshop within 14 days of delivery. Personalized items usually have different return conditions.', keywords: ['can i return an item', 'returns', 'return product', 'refund'], href: '/help/returns' },
      { id: 'custom-orders', question: 'Can I request a personalized product?', answer: 'Yes. Contact the workshop before ordering to discuss names, colors, quantities, dimensions, timing, and pricing.', keywords: ['personalized product', 'custom order', 'customized', 'made for me'], href: '/about' },
      { id: 'payments', question: 'Which payment methods are supported?', answer: 'The shop supports PayPal and card payment through Stripe-hosted Checkout. Nora’s Workshop does not receive or store raw card details.', keywords: ['payment methods', 'pay by card', 'paypal', 'stripe', 'payment'] },
      { id: 'accounts', question: 'Do I need an account?', answer: 'No. You can check out as a guest. An account is optional and lets you keep an order history and manage your profile.', keywords: ['need an account', 'guest checkout', 'register', 'sign in', 'account'] },
    ],
  },
  bg: {
    popularIds: ['shipping-cost', 'delivery-time', 'returns'],
    ui: {
      title: 'Помощ от работилницата',
      welcome: 'Здравейте! Аз съм AI помощникът на работилницата на Нора. Изберете въпрос или напишете свой.',
      privacy: 'Моля, не споделяйте номера на поръчки, адреси или платежни данни тук.',
      fallback: 'В момента не успях да отговоря. Опитайте отново или се свържете с Нора.',
      contact: 'Свържете се с Нора', open: 'Отворете FAQ помощника', close: 'Затворете FAQ помощника', inputLabel: 'Задайте въпрос', inputPlaceholder: 'Напишете въпроса си…', send: 'Изпрати', thinking: 'Мисля…',
      shippingLink: 'Информация за доставка', returnsLink: 'Условия за връщане', moreLink: 'Научете повече',
    },
    entries: [
      { id: 'shipping-cost', question: 'Колко струва доставката?', answer: 'Стандартната доставка е $10 и е безплатна при междинна сума на продуктите над $100. Финалната сума се показва при прегледа на поръчката.', keywords: ['колко струва доставката', 'цена на доставка', 'безплатна доставка'], href: '/help/shipping' },
      { id: 'delivery-time', question: 'Колко време отнема поръчката?', answer: 'Срокът зависи от продукта, количеството, персонализацията, дестинацията и куриера. Свържете се с работилницата преди поръчка при краен срок за събитие.', keywords: ['колко време отнема поръчката', 'срок за доставка', 'кога ще пристигне', 'краен срок', 'поръчка'], href: '/help/shipping' },
      { id: 'returns', question: 'Мога ли да върна продукт?', answer: 'Допустимите неперсонализирани стоки обикновено могат да бъдат върнати, ако се свържете с работилницата до 14 дни след доставката. За персонализирани продукти обикновено важат различни условия.', keywords: ['мога ли да върна продукт', 'връщане', 'върна', 'възстановяване'], href: '/help/returns' },
      { id: 'custom-orders', question: 'Мога ли да поръчам персонализиран продукт?', answer: 'Да. Свържете се с работилницата преди поръчка, за да уточним имена, цветове, количества, размери, срок и цена.', keywords: ['персонализиран продукт', 'поръчка по поръчка', 'изработка', 'по мой дизайн'], href: '/about' },
      { id: 'payments', question: 'Какви начини на плащане се поддържат?', answer: 'Магазинът поддържа PayPal и картово плащане чрез Stripe Checkout. Nora’s Workshop не получава и не съхранява пълните данни на картата.', keywords: ['начини на плащане', 'плащане с карта', 'paypal', 'stripe', 'плащане'] },
      { id: 'accounts', question: 'Необходим ли е профил?', answer: 'Не. Можете да поръчате като гост. Профилът е по желание и ви дава история на поръчките и управление на личните данни.', keywords: ['необходим ли е профил', 'поръчка като гост', 'регистрация', 'вход', 'профил'] },
    ],
  },
};
