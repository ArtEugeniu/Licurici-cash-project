# Licurici — Design System (Etapa 1)

Tokens, mixins și clase reutilizabile în `client/src/assets/styles/`.

## Fișiere

| Fișier | Conținut |
|--------|----------|
| `_variables.scss` | Culori, spacing, tipografie, shadows, CSS vars (`:root`) |
| `_mixins.scss` | Mixins SCSS pentru btn, input, card, table, tabs, modal |
| `_components.scss` | Clase globale `.btn`, `.card`, `.input`, `.tabs`, `.modal`, `.table` |
| `global.scss` | Reset + import design system |

## Clase disponibile

### Layout
- `.page` — container pagină (max-width, padding)
- `.page-title` — titlu secțiune
- `.page-subtitle` — subtitlu

### Butoane
- `.btn` — primary (violet)
- `.btn--secondary` — contur
- `.btn--danger` — roșu
- `.btn--ghost` — transparent
- `.btn--lg` — mărime mare
- `.btn--block` — lățime 100%

### Formulare
- `.input`, `.select`, `.textarea`
- `.field`, `.field__label`, `.field__hint`, `.field__error`

### Carduri
- `.card`, `.card--interactive`, `.card--sm`, `.card--lg`
- `.card__title`, `.card__body`

### Tab-uri
- `.tabs`, `.tabs__tab`, `.tabs__tab--active`, `.tabs__panel`

### Tabele
- `.table-wrapper`, `.table`

### Modale (Etapa 3)
- `.modal-backdrop`, `.modal`, `.modal__title`, `.modal__body`, `.modal__actions`

### Bannere
- `.banner`, `.banner--success`, `.banner--warning`, `.banner--danger`, `.banner--info`

### Status
- `.app-status`, `.app-status--loading`, `.app-status--empty`

## CSS variables (runtime)

```css
var(--color-primary)
var(--color-bg)
var(--color-surface)
var(--color-text)
var(--color-success)
var(--color-danger)
/* etc. — vezi _variables.scss :root */
```

## Exemplu migrare buton

```scss
// înainte
.my-button {
  background-color: #5300ff;
  padding: 5px 10px;
  ...
}

// după (HTML)
<button className="btn">Salvează</button>
<button className="btn btn--secondary">Anulează</button>
<button className="btn btn--danger">Șterge</button>
```

## Exemplu migrare SCSS local

```scss
@use '../../assets/styles/variables' as *;
@use '../../assets/styles/mixins' as *;

.my-card {
  @include card-base;
  @include card-padding('md');
}
```
