#ifndef DISPLACER_CORE_H
#define DISPLACER_CORE_H

#include "displacer/vis.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ───────── Event System ───────── */
typedef enum {
  DS_EV_NONE,
  DS_EV_MOUSE_MOVE,
  DS_EV_MOUSE_DOWN,
  DS_EV_MOUSE_UP,
  DS_EV_KEY_DOWN,
  DS_EV_KEY_UP,
} ds_event_type;

typedef struct {
  ds_event_type type;
  union {
    struct { float x, y; uint8_t button; } mouse;
    struct { uint32_t keycode; uint8_t shift; uint8_t ctrl; } key;
  } as;
} ds_event;

typedef uint8_t (*ds_event_handler)(void* widget, ds_event ev);

/* ───────── Localization (l10n) ───────── */
#define DS_LANG_MAX 16

/* Localization state is process-global and UI-thread-only. Call ds_lang_init before
 * starting worker threads; later registration, selection, and lookup stay on that
 * same UI thread. */

typedef uint32_t ds_lang_id;

/* Register a language by name, returns its ID */
ds_lang_id ds_lang_register(const char* name);
/* Initialize built-in languages. Idempotent; language APIs also call this lazily. */
void ds_lang_init(void);
/* Set the active language */
void ds_lang_set(ds_lang_id id);
ds_lang_id ds_lang_active(void);

/* Define a translation key-value pair for a language */
void ds_lang_string(ds_lang_id lang, const char* key, const char* value);

/* Translate a key in the active language. Returns key if not found. */
const char* _(const char* key);
const char* ds_lang_get(const char* key);

/* Pre-registered languages */
extern ds_lang_id DS_LANG_EN;
extern ds_lang_id DS_LANG_DE;
extern ds_lang_id DS_LANG_RO;
extern ds_lang_id DS_LANG_RU;
extern ds_lang_id DS_LANG_FR;
extern ds_lang_id DS_LANG_ES;

/* ───────── Theme Engine ───────── */
typedef struct {
  uint32_t page;        /* Background page color */
  uint32_t surface;     /* Card/surface color */
  uint32_t surface_alt; /* Alternate surface */
  uint32_t raised;      /* Elevated surface */
  uint32_t fg;          /* Default text */
  uint32_t fg_muted;    /* Secondary text */
  uint32_t fg_subtle;   /* Tertiary text */
  uint32_t border;      /* Default border */
  uint32_t border_muted;/* Subtle border */
  uint32_t primary;     /* Primary action/focus accent */
  uint32_t primary_hover;
  uint32_t accent;      /* Secondary accent */
  uint32_t accent_hover;
  uint32_t semantic_info;
  uint32_t semantic_success;
  uint32_t semantic_warning;
  uint32_t semantic_error;
  uint32_t jewels[7];   /* Amethyst, Sapphire, Emerald, Ruby, Topaz, Citrine, Quartz */
} ds_theme;

/* Built-in themes */
extern const ds_theme DS_THEME_LIGHT;
extern const ds_theme DS_THEME_DARK;
extern const ds_theme DS_THEME_DARK_ARCANA;
extern const ds_theme DS_THEME_PARCHMENT;
extern const ds_theme DS_THEME_MYSTIC;
extern const ds_theme DS_THEME_CLAY;

#define DS_THEME_COUNT 6

/* Currently active theme; starts as DS_THEME_CLAY, Displacer's default */
extern const ds_theme* ds_current_theme;

/* Apply a theme (copies it, sets ds_current_theme) */
void ds_theme_apply(const ds_theme* theme);

/* Convenience: get themed colors */
static inline uint32_t ds_clr_page(void) { return ds_current_theme->page; }
static inline uint32_t ds_clr_surface(void) { return ds_current_theme->surface; }
static inline uint32_t ds_clr_primary(void) { return ds_current_theme->primary; }
static inline uint32_t ds_clr_accent(void) { return ds_current_theme->accent; }
static inline uint32_t ds_clr_fg(void) { return ds_current_theme->fg; }
static inline uint32_t ds_clr_muted(void) { return ds_current_theme->fg_muted; }
static inline uint32_t ds_clr_border(void) { return ds_current_theme->border; }

/* ───────── Layout Engine ───────── */
typedef enum {
  DS_LAYOUT_STACK,
  DS_LAYOUT_GRID,
  DS_LAYOUT_SPLIT,
  DS_LAYOUT_ALBUM,
  DS_LAYOUT_TOOLWIN
} ds_layout_type;

typedef enum {
  DS_DIR_COLUMN,
  DS_DIR_ROW
} ds_layout_dir;

typedef enum {
  DS_ALIGN_START,
  DS_ALIGN_CENTER,
  DS_ALIGN_END,
  DS_ALIGN_STRETCH
} ds_layout_align;

typedef enum {
  DS_GAP_XS = 4,
  DS_GAP_SM = 8,
  DS_GAP_MD = 16,
  DS_GAP_LG = 24,
  DS_GAP_XL = 48
} ds_gap;

typedef enum {
  DS_CONT_XS = 480,
  DS_CONT_SM = 640,
  DS_CONT_MD = 768,
  DS_CONT_LG = 1024,
  DS_CONT_XL = 1280,
  DS_CONT_FLUID = 0,
  DS_CONT_ULTRAWIDE = 0
} ds_container_size;

typedef struct {
  ds_bounds bounds;
  float fixed_w;
  float fixed_h;
  float flex;
} ds_layout_child;

typedef struct {
  ds_layout_type type;
  ds_layout_dir dir;
  ds_gap gap;
  ds_layout_align align;
  uint8_t wrap;
  uint32_t cols;
  float split;
  float item_size;
  float padding[4];
  float margin[4];
  ds_bounds container;
} ds_layout;

/* Compute positions for N children within a layout. Returns the total used height. */
float ds_layout_compute(ds_layout* layout, ds_layout_child* children, uint32_t count);

/* Container helpers */
void ds_layout_container(ds_bounds* out, ds_bounds parent, ds_container_size size, float padding);

#ifdef __cplusplus
}
#endif

#endif /* DISPLACER_CORE_H */
