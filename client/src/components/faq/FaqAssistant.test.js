import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import FaqAssistant from './FaqAssistant';

async function renderAssistant(language = 'en') {
  const instance = i18next.createInstance().use(initReactI18next);
  await instance.init({
    lng: language,
    fallbackLng: 'en',
    resources: { en: { translation: {} }, bg: { translation: {} } },
  });
  render(
    <MemoryRouter>
      <I18nextProvider i18n={instance}>
        <FaqAssistant />
      </I18nextProvider>
    </MemoryRouter>
  );
  return instance;
}

async function click(element) {
  await act(async () => userEvent.click(element));
}

async function type(element, value) {
  await act(async () => userEvent.type(element, value));
}

async function press(keys) {
  await act(async () => userEvent.keyboard(keys));
}

test('starts closed and opens an accessible dialog', async () => {
  await renderAssistant();
  expect(screen.queryByRole('dialog')).toBeNull();

  await click(screen.getByRole('button', { name: 'Open FAQ help' }));

  expect(screen.getByRole('dialog', { name: 'Workshop help' })).not.toBeNull();
});

test('answers a suggested question with a policy link', async () => {
  await renderAssistant();
  await click(screen.getByRole('button', { name: 'Open FAQ help' }));
  await click(screen.getByRole('button', { name: 'How much is shipping?' }));

  expect(screen.getByText(/Standard shipping is \$10/)).not.toBeNull();
  expect(screen.getByRole('link', { name: 'Shipping information' }).getAttribute('href')).toBe('/help/shipping');
});

test('shows popular topics and contact for an unknown typed question', async () => {
  await renderAssistant();
  await click(screen.getByRole('button', { name: 'Open FAQ help' }));
  await type(screen.getByLabelText('Ask a question'), 'Do you sell bicycles?');
  await click(screen.getByRole('button', { name: 'Send' }));

  expect(screen.getByText(/couldn’t find a confident answer/i)).not.toBeNull();
  expect(screen.getByRole('button', { name: 'How much is shipping?' })).not.toBeNull();
  expect(screen.getByRole('link', { name: 'Contact Nora' }).getAttribute('href')).toBe('mailto:petar_vs@outlook.com');
});

test('does not submit whitespace-only input', async () => {
  await renderAssistant();
  await click(screen.getByRole('button', { name: 'Open FAQ help' }));
  await type(screen.getByLabelText('Ask a question'), '   ');
  await click(screen.getByRole('button', { name: 'Send' }));

  expect(screen.queryByText(/couldn’t find/i)).toBeNull();
});

test('Escape closes the dialog and restores trigger focus', async () => {
  await renderAssistant();
  const trigger = screen.getByRole('button', { name: 'Open FAQ help' });
  await click(trigger);
  await press('{Escape}');

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test('changing language clears the conversation and localizes the dialog', async () => {
  const instance = await renderAssistant();
  await click(screen.getByRole('button', { name: 'Open FAQ help' }));
  await click(screen.getByRole('button', { name: 'How much is shipping?' }));

  await act(async () => instance.changeLanguage('bg'));

  expect(screen.getByRole('dialog', { name: 'Помощ от работилницата' })).not.toBeNull();
  expect(screen.queryByText(/Standard shipping is/)).toBeNull();
});
