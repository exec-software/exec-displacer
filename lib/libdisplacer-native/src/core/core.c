#include "displacer/core.h"
#include <string.h>
#include <stdlib.h>
#include <math.h>

/* ─── Theme Engine ─── */

const ds_theme DS_THEME_LIGHT = {
  .page = 0xfbf1c7, .surface = 0xebdbb2, .surface_alt = 0xd5c4a1, .raised = 0xf9f5d7,
  .fg = 0x3c3836, .fg_muted = 0x7c6f64, .fg_subtle = 0xa89984,
  .border = 0xbdae93, .border_muted = 0xd5c4a1,
  .primary = 0xb16286, .primary_hover = 0x9d6075,
  .accent = 0xd65d0e, .accent_hover = 0xc04f08,
  .semantic_info = 0x458588, .semantic_success = 0x689d6a,
  .semantic_warning = 0xd79921, .semantic_error = 0xcc241d,
  .jewels = {0xb16286, 0x458588, 0x689d6a, 0xcc241d, 0xd79921, 0xd65d0e, 0xa89984}
};

const ds_theme DS_THEME_DARK = {
  .page = 0x1d2021, .surface = 0x282828, .surface_alt = 0x3c3836, .raised = 0x32302f,
  .fg = 0xebdbb2, .fg_muted = 0xa89984, .fg_subtle = 0x7c6f64,
  .border = 0x504945, .border_muted = 0x3c3836,
  .primary = 0xb16286, .primary_hover = 0xc47a9a,
  .accent = 0xd65d0e, .accent_hover = 0xe06a15,
  .semantic_info = 0x83a598, .semantic_success = 0x8ec07c,
  .semantic_warning = 0xfabd2f, .semantic_error = 0xfb4934,
  .jewels = {0xb16286, 0x83a598, 0x8ec07c, 0xfb4934, 0xfabd2f, 0xfe8019, 0xa89984}
};

const ds_theme DS_THEME_DARK_ARCANA = {
  .page = 0x0d0d1a, .surface = 0x16162a, .surface_alt = 0x1e1e3a, .raised = 0x1a1a32,
  .fg = 0xe0d0f0, .fg_muted = 0x9080b0, .fg_subtle = 0x605080,
  .border = 0x2a2a4a, .border_muted = 0x1e1e3a,
  .primary = 0xb16286, .primary_hover = 0xc47a9a,
  .accent = 0x6366f1, .accent_hover = 0x818cf8,
  .semantic_info = 0x458588, .semantic_success = 0x689d6a,
  .semantic_warning = 0xd79921, .semantic_error = 0xef4444,
  .jewels = {0xb16286, 0x6366f1, 0x689d6a, 0xef4444, 0xd79921, 0xf59e0b, 0x9080b0}
};

const ds_theme DS_THEME_PARCHMENT = {
  .page = 0xf5e6c8, .surface = 0xe8d5a8, .surface_alt = 0xd4c08a, .raised = 0xfaefd8,
  .fg = 0x4a3728, .fg_muted = 0x8b7355, .fg_subtle = 0xb8a080,
  .border = 0xc4a87a, .border_muted = 0xdcc8a0,
  .primary = 0xb16286, .primary_hover = 0x9d6075,
  .accent = 0xc87d2e, .accent_hover = 0xb06a20,
  .semantic_info = 0x457588, .semantic_success = 0x588d6a,
  .semantic_warning = 0xb88921, .semantic_error = 0xac241d,
  .jewels = {0xb16286, 0x457588, 0x588d6a, 0xac241d, 0xb88921, 0xc87d2e, 0xb8a080}
};

/* Neutral graphite surfaces with violet reserved for focus and primary actions. */
const ds_theme DS_THEME_MYSTIC = {
  .page = 0x0e1014, .surface = 0x15181d, .surface_alt = 0x1c2128, .raised = 0x252b34,
  .fg = 0xe6e9ef, .fg_muted = 0xaab1bd, .fg_subtle = 0x8992a1,
  .border = 0x697485, .border_muted = 0x343c48,
  .primary = 0xac74ff, .primary_hover = 0xba88ff,
  .accent = 0x7e9fbd, .accent_hover = 0x91afca,
  .semantic_info = 0x76a0c2, .semantic_success = 0x7eae91,
  .semantic_warning = 0xc9a56a, .semantic_error = 0xca7b82,
  .jewels = {0xac74ff, 0x76a0c2, 0x7eae91, 0xca7b82, 0xc9a56a, 0x7e9fbd, 0x8992a1}
};

/* Flat charcoal surfaces with a ZBrush-orange primary and teal accent. The default theme. */
const ds_theme DS_THEME_CLAY = {
  .page = 0x141414, .surface = 0x1a1a1a, .surface_alt = 0x222222, .raised = 0x262626,
  .fg = 0xece9e5, .fg_muted = 0x9c9893, .fg_subtle = 0x6e6a65,
  .border = 0x2a2a2a, .border_muted = 0x212121,
  .primary = 0xf2661a, .primary_hover = 0xff7f33,
  .accent = 0x33b7a6, .accent_hover = 0x4fd1bf,
  .semantic_info = 0x5ea8e8, .semantic_success = 0x6cc07f,
  .semantic_warning = 0xe3b341, .semantic_error = 0xe05252,
  .jewels = {0xf2661a, 0x5ea8e8, 0x6cc07f, 0xe05252, 0xe3b341, 0x33b7a6, 0x6e6a65}
};

static ds_theme applied_theme;
const ds_theme* ds_current_theme = &DS_THEME_CLAY;

void ds_theme_apply(const ds_theme* theme) {
  if (!theme) return;
  applied_theme = *theme;
  ds_current_theme = &applied_theme;
}

/* ─── Localization ─── */

#define MAX_KEYS 256
#define MAX_LANGS 8

typedef struct { char key[48]; char val[128]; } ds_translation;

typedef struct {
  char name[32];
  ds_translation strings[MAX_KEYS];
  uint16_t count;
} ds_lang;

static ds_lang langs[MAX_LANGS];
static uint16_t lang_count = 0;
static ds_lang_id active_lang = 0;
static bool langs_initialized = false;

/* Keep the built-in IDs useful even before the first lazy initialization call. */
ds_lang_id DS_LANG_EN = 0;
ds_lang_id DS_LANG_DE = 1;
ds_lang_id DS_LANG_RO = 2;
ds_lang_id DS_LANG_RU = 3;
ds_lang_id DS_LANG_FR = 4;
ds_lang_id DS_LANG_ES = 5;

static ds_lang_id _lang_register(const char* name) {
  if (!name || lang_count >= MAX_LANGS) return 0;
  ds_lang_id id = lang_count++;
  strncpy(langs[id].name, name, sizeof(langs[id].name) - 1);
  langs[id].name[sizeof(langs[id].name) - 1] = '\0';
  langs[id].count = 0;
  return id;
}

static void _lang_string(ds_lang_id lang_id, const char* key, const char* value) {
  if (!key || !value || lang_id >= lang_count || langs[lang_id].count >= MAX_KEYS) return;
  ds_lang* l = &langs[lang_id];
  uint16_t i = l->count++;
  strncpy(l->strings[i].key, key, sizeof(l->strings[i].key) - 1);
  strncpy(l->strings[i].val, value, sizeof(l->strings[i].val) - 1);
  l->strings[i].key[sizeof(l->strings[i].key) - 1] = '\0';
  l->strings[i].val[sizeof(l->strings[i].val) - 1] = '\0';
}

ds_lang_id ds_lang_register(const char* name) {
  ds_lang_init();
  return _lang_register(name);
}

void ds_lang_set(ds_lang_id id) {
  ds_lang_init();
  if (id < lang_count) active_lang = id;
}

ds_lang_id ds_lang_active(void) {
  ds_lang_init();
  return active_lang;
}

void ds_lang_string(ds_lang_id lang_id, const char* key, const char* value) {
  ds_lang_init();
  _lang_string(lang_id, key, value);
}

const char* ds_lang_get(const char* key) {
  ds_lang_init();
  if (!key) return NULL;
  ds_lang* l = &langs[active_lang];
  for (uint16_t i = 0; i < l->count; i++)
    if (strcmp(l->strings[i].key, key) == 0)
      return l->strings[i].val;
  // Fallback to English (lang 0)
  if (active_lang != 0) {
    ds_lang* en = &langs[0];
    for (uint16_t i = 0; i < en->count; i++)
      if (strcmp(en->strings[i].key, key) == 0)
        return en->strings[i].val;
  }
  return key;
}

const char* _(const char* key) { return ds_lang_get(key); }

void ds_lang_init(void) {
  if (langs_initialized) return;

  DS_LANG_EN = _lang_register("en");
  DS_LANG_DE = _lang_register("de");
  DS_LANG_RO = _lang_register("ro");
  DS_LANG_RU = _lang_register("ru");
  DS_LANG_FR = _lang_register("fr");
  DS_LANG_ES = _lang_register("es");

  /* English */
  _lang_string(DS_LANG_EN, "common.save", "Save");
  _lang_string(DS_LANG_EN, "common.cancel", "Cancel");
  _lang_string(DS_LANG_EN, "common.delete", "Delete");
  _lang_string(DS_LANG_EN, "common.edit", "Edit");
  _lang_string(DS_LANG_EN, "common.search", "Search");
  _lang_string(DS_LANG_EN, "common.loading", "Loading...");
  _lang_string(DS_LANG_EN, "common.error", "Error");
  _lang_string(DS_LANG_EN, "common.success", "Success");
  _lang_string(DS_LANG_EN, "common.noData", "No data");
  _lang_string(DS_LANG_EN, "common.ok", "OK");
  _lang_string(DS_LANG_EN, "dialog.confirm", "Are you sure?");
  _lang_string(DS_LANG_EN, "dialog.close", "Close");
  _lang_string(DS_LANG_EN, "theme.light", "Light");
  _lang_string(DS_LANG_EN, "theme.dark", "Dark");
  _lang_string(DS_LANG_EN, "theme.arcana", "Arcana");
  _lang_string(DS_LANG_EN, "theme.parchment", "Parchment");
  _lang_string(DS_LANG_EN, "theme.mystic", "Mystic");
  _lang_string(DS_LANG_EN, "theme.clay", "Clay");

  /* German */
  _lang_string(DS_LANG_DE, "common.save", "Speichern");
  _lang_string(DS_LANG_DE, "common.cancel", "Abbrechen");
  _lang_string(DS_LANG_DE, "common.delete", "Löschen");
  _lang_string(DS_LANG_DE, "common.edit", "Bearbeiten");
  _lang_string(DS_LANG_DE, "common.search", "Suchen");
  _lang_string(DS_LANG_DE, "common.loading", "Laden...");
  _lang_string(DS_LANG_DE, "common.error", "Fehler");
  _lang_string(DS_LANG_DE, "common.success", "Erfolg");
  _lang_string(DS_LANG_DE, "theme.light", "Hell");
  _lang_string(DS_LANG_DE, "theme.dark", "Dunkel");

  /* Romanian */
  _lang_string(DS_LANG_RO, "common.save", "Salvează");
  _lang_string(DS_LANG_RO, "common.cancel", "Anulează");
  _lang_string(DS_LANG_RO, "common.delete", "Șterge");
  _lang_string(DS_LANG_RO, "common.edit", "Editează");
  _lang_string(DS_LANG_RO, "common.search", "Caută");
  _lang_string(DS_LANG_RO, "common.loading", "Se încarcă...");
  _lang_string(DS_LANG_RO, "common.error", "Eroare");
  _lang_string(DS_LANG_RO, "common.success", "Succes");
  _lang_string(DS_LANG_RO, "theme.light", "Luminos");
  _lang_string(DS_LANG_RO, "theme.dark", "Întunecat");

  /* Russian */
  _lang_string(DS_LANG_RU, "common.save", "Сохранить");
  _lang_string(DS_LANG_RU, "common.cancel", "Отмена");
  _lang_string(DS_LANG_RU, "common.delete", "Удалить");
  _lang_string(DS_LANG_RU, "common.edit", "Редактировать");
  _lang_string(DS_LANG_RU, "common.search", "Поиск");
  _lang_string(DS_LANG_RU, "common.loading", "Загрузка...");
  _lang_string(DS_LANG_RU, "common.error", "Ошибка");
  _lang_string(DS_LANG_RU, "theme.light", "Светлая");
  _lang_string(DS_LANG_RU, "theme.dark", "Темная");

  /* French */
  _lang_string(DS_LANG_FR, "common.save", "Enregistrer");
  _lang_string(DS_LANG_FR, "common.cancel", "Annuler");
  _lang_string(DS_LANG_FR, "common.delete", "Supprimer");
  _lang_string(DS_LANG_FR, "common.edit", "Modifier");
  _lang_string(DS_LANG_FR, "common.search", "Rechercher");
  _lang_string(DS_LANG_FR, "common.loading", "Chargement...");
  _lang_string(DS_LANG_FR, "common.error", "Erreur");
  _lang_string(DS_LANG_FR, "theme.light", "Clair");
  _lang_string(DS_LANG_FR, "theme.dark", "Sombre");

  /* Spanish */
  _lang_string(DS_LANG_ES, "common.save", "Guardar");
  _lang_string(DS_LANG_ES, "common.cancel", "Cancelar");
  _lang_string(DS_LANG_ES, "common.delete", "Eliminar");
  _lang_string(DS_LANG_ES, "common.edit", "Editar");
  _lang_string(DS_LANG_ES, "common.search", "Buscar");
  _lang_string(DS_LANG_ES, "common.loading", "Cargando...");
  _lang_string(DS_LANG_ES, "common.error", "Error");
  _lang_string(DS_LANG_ES, "theme.light", "Claro");
  _lang_string(DS_LANG_ES, "theme.dark", "Oscuro");
  langs_initialized = true;
}

/* ─── Layout Engine ─── */

/* clamp helper */
static float _clampf(float v, float lo, float hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

float ds_layout_compute(ds_layout* l, ds_layout_child* children, uint32_t count) {
  if (!l || !children || count == 0) return 0;
  float px = l->padding[0], py = l->padding[1], pb = l->padding[2], pl = l->padding[3];
  float mx = l->margin[0], my = l->margin[1], mb = l->margin[2], m3 = l->margin[3];
  float cx = l->container.x + m3, cy = l->container.y + mx;
  float cw = l->container.w - m3 - my;
  float ch = l->container.h - mx - mb;
  float ax = cx + pl, ay = cy + px;
  float aw = cw - pl - py;
  float ah = ch - px - pb;
  float gap = (float)l->gap;
  float used = 0;

  if (l->type == DS_LAYOUT_STACK) {
    if (l->dir == DS_DIR_ROW) {
      float total_flex = 0, total_fixed = 0;
      for (uint32_t i = 0; i < count; i++) {
        if (children[i].fixed_w > 0) total_fixed += children[i].fixed_w;
        else total_flex += children[i].flex;
      }
      float rem = aw - total_fixed - gap * (count > 0 ? count - 1 : 0);
      if (rem < 0) rem = 0;
      float x = ax;
      for (uint32_t i = 0; i < count; i++) {
        ds_layout_child* c = &children[i];
        c->bounds.w = c->fixed_w > 0 ? c->fixed_w : (total_flex > 0 ? rem * (c->flex / total_flex) : 80);
        float child_h = c->fixed_h > 0 ? c->fixed_h : ah;
        if (l->align == DS_ALIGN_STRETCH) child_h = ah;
        float yoff = 0;
        if (l->align == DS_ALIGN_CENTER) yoff = (ah - child_h) * 0.5f;
        else if (l->align == DS_ALIGN_END) yoff = ah - child_h;
        else if (l->align == DS_ALIGN_STRETCH) yoff = 0;
        c->bounds.x = x;
        c->bounds.y = ay + yoff;
        c->bounds.h = child_h;
        x += c->bounds.w + gap;
        used = fmaxf(used, c->bounds.y + c->bounds.h);
      }
      used -= ay;
    } else {
      /* COLUMN */
      float total_flex = 0, total_fixed = 0;
      for (uint32_t i = 0; i < count; i++) {
        if (children[i].fixed_h > 0) total_fixed += children[i].fixed_h;
        else total_flex += children[i].flex;
      }
      float rem = ah - total_fixed - gap * (count > 0 ? count - 1 : 0);
      if (rem < 0) rem = 0;
      float y = ay;
      for (uint32_t i = 0; i < count; i++) {
        ds_layout_child* c = &children[i];
        c->bounds.h = c->fixed_h > 0 ? c->fixed_h : (total_flex > 0 ? rem * (c->flex / total_flex) : 24);
        float child_w = c->fixed_w > 0 ? c->fixed_w : aw;
        if (l->align == DS_ALIGN_STRETCH) child_w = aw;
        float xoff = 0;
        if (l->align == DS_ALIGN_CENTER) xoff = (aw - child_w) * 0.5f;
        else if (l->align == DS_ALIGN_END) xoff = aw - child_w;
        else if (l->align == DS_ALIGN_STRETCH) xoff = 0;
        c->bounds.x = ax + xoff;
        c->bounds.y = y;
        c->bounds.w = child_w;
        y += c->bounds.h + gap;
        used = y - ay;
      }
    }
  } else if (l->type == DS_LAYOUT_GRID) {
    uint32_t cols = l->cols > 0 ? l->cols : 4;
    float col_w = cols > 0 ? (aw - gap * (cols - 1)) / (float)cols : aw;
    if (col_w < 0) col_w = 0;
    float row_h = col_w;
    for (uint32_t i = 0; i < count; i++) {
      uint32_t col = i % cols;
      uint32_t row = i / cols;
      children[i].bounds.x = ax + col * (col_w + gap);
      children[i].bounds.y = ay + row * (row_h + gap);
      children[i].bounds.w = col_w;
      children[i].bounds.h = row_h;
      used = (children[i].bounds.y + row_h) - ay;
    }
  } else if (l->type == DS_LAYOUT_SPLIT) {
    float sp = _clampf(l->split, 0.1f, 0.9f);
    float divider = 4.0f;
    if (l->dir == DS_DIR_ROW) {
      float w1 = (aw - divider) * sp;
      float w2 = (aw - divider) * (1.0f - sp);
      children[0].bounds = (ds_bounds){ax, ay, w1, ah};
      children[1].bounds = (ds_bounds){ax + w1 + divider, ay, w2, ah};
      used = ah;
    } else {
      float h1 = (ah - divider) * sp;
      float h2 = (ah - divider) * (1.0f - sp);
      children[0].bounds = (ds_bounds){ax, ay, aw, h1};
      children[1].bounds = (ds_bounds){ax, ay + h1 + divider, aw, h2};
      used = aw;
    }
  } else if (l->type == DS_LAYOUT_ALBUM) {
    float item_sz = l->item_size > 0 ? l->item_size : 120;
    uint32_t cols_that_fit = (uint32_t)(aw / (item_sz + gap));
    if (cols_that_fit < 1) cols_that_fit = 1;
    float actual_w = (aw - gap * (cols_that_fit - 1)) / (float)cols_that_fit;
    if (actual_w < 0) actual_w = item_sz;
    used = 0;
    for (uint32_t i = 0; i < count; i++) {
      uint32_t col = i % cols_that_fit;
      uint32_t row = i / cols_that_fit;
      children[i].bounds.x = ax + col * (actual_w + gap);
      children[i].bounds.y = ay + row * (actual_w + gap);
      children[i].bounds.w = actual_w;
      children[i].bounds.h = actual_w;
      used = (children[i].bounds.y + actual_w) - ay;
    }
  } else if (l->type == DS_LAYOUT_TOOLWIN) {
    if (count < 3) return 0;
    float title_h = 28.0f;
    float status_h = 20.0f;
    children[0].bounds = (ds_bounds){cx, cy, cw, title_h};
    children[1].bounds = (ds_bounds){cx, cy + title_h, cw, ch - title_h - status_h};
    children[2].bounds = (ds_bounds){cx, cy + ch - status_h, cw, status_h};
    used = ch;
  }
  return used + px + pb;
}

void ds_layout_container(ds_bounds* out, ds_bounds parent, ds_container_size size, float pad) {
  float max_w = (float)size;
  if (max_w <= 0 || max_w >= parent.w) {
    out->x = parent.x + pad;
    out->y = parent.y;
    out->w = parent.w - pad * 2;
    out->h = parent.h;
    return;
  }
  out->x = parent.x + (parent.w - max_w) * 0.5f;
  out->y = parent.y;
  out->w = max_w;
  out->h = parent.h;
}
