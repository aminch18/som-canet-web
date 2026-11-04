'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-wrap')) closeMenu();
});
window.matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
let preparedMessage = '';
if (form) {
  const initialIntent = new URLSearchParams(window.location.search).get('motiu');
  if (['proposta', 'participar', 'consulta'].includes(initialIntent)) {
    document.querySelector('#intent').value = initialIntent;
  }
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = document.querySelector('#intent').selectedOptions[0].textContent;
  preparedMessage = `Hola, SOM CANET!\n\nEm dic ${String(data.get('name')).trim()}.\n\n${String(data.get('message')).trim()}\n\nUna salutació,\n${String(data.get('name')).trim()}`;
  const url = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(preparedMessage)}`;
  formStatus.textContent = 'Missatge preparat. Si s’obre el teu correu, revisa’l i envia’l des d’allà.';
  formStatus.hidden = false;
  document.querySelector('#mail-fallback').hidden = false;
  window.location.href = url;
});
document.querySelector('#copy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(preparedMessage);
    formStatus.textContent = `Missatge copiat. Enganxa’l al teu correu i envia’l a ${form.dataset.email}.`;
  } catch {
    formStatus.textContent = 'No s’ha pogut copiar automàticament. Pots seleccionar el text que apareix a continuació.';
    let fallback = document.querySelector('#copy-fallback');
    if (!fallback) {
      fallback = document.createElement('textarea');
      fallback.id = 'copy-fallback';
      fallback.readOnly = true;
      fallback.setAttribute('aria-label', 'Missatge preparat per copiar');
      document.querySelector('#mail-fallback').append(fallback);
    }
    fallback.value = preparedMessage;
    fallback.focus();
    fallback.select();
  }
});

}

const archiveSearch = document.querySelector('#archive-search');
if (archiveSearch) {
  let selectedCategory = 'all';
  const cards = [...document.querySelectorAll('.archive-card[data-category]')];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ca');
  function filterArchive() {
    const query = normalize(archiveSearch.value.trim());
    let count = 0;
    cards.forEach(card => {
      const matches = (selectedCategory === 'all' || card.dataset.category === selectedCategory) && normalize(card.textContent).includes(query);
      card.hidden = !matches;
      if (matches) count += 1;
    });
    document.querySelector('#archive-count').textContent = `${count} ${count === 1 ? 'recurs' : 'recursos'}`;
    document.querySelector('#archive-empty').hidden = count !== 0;
  }
  archiveSearch.addEventListener('input', filterArchive);
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      filterArchive();
    });
  });
}

// Rendered original PDF pages stay readable without a browser PDF plugin.
document.querySelectorAll('.pdf-reader').forEach(reader => {
  const pages = JSON.parse(reader.dataset.pages);
  const select = reader.querySelector('.reader-select');
  const image = reader.querySelector('.reader-image');
  const previous = reader.querySelector('.reader-prev');
  const next = reader.querySelector('.reader-next');
  const stage = reader.querySelector('.reader-stage');
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Pàgina del document; desplaça’t per llegir-la');
  function showPage(index) {
    image.src = pages[index];
    image.alt = `${image.dataset.documentTitle} · Pàgina ${index + 1}`;
    reader.querySelector('.reader-enlarge').href = pages[index];
    select.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    reader.querySelector('.reader-status').textContent = `Pàgina ${index + 1} de ${pages.length}`;
    stage.scrollTop = 0;
  }
  select.addEventListener('change', () => showPage(Number(select.value)));
  previous.addEventListener('click', () => showPage(Math.max(0, Number(select.value) - 1)));
  next.addEventListener('click', () => showPage(Math.min(pages.length - 1, Number(select.value) + 1)));
});
