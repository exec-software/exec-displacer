#ifndef DISPLACER_H
#define DISPLACER_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

#include "vis.h"

/* ───────── Version ───────── */
#define DISPLACER_VERSION_MAJOR 1
#define DISPLACER_VERSION_MINOR 0
#define DISPLACER_VERSION_PATCH 0

const char* displacer_version(void);

/* ───────── Color ───────── */
typedef struct {
  uint8_t r, g, b;
  float a;
} ds_color;

ds_color ds_color_hex(uint32_t hex);
ds_color ds_color_rgba(uint8_t r, uint8_t g, uint8_t b, float a);
uint32_t ds_color_to_hex(ds_color c);

ds_color ds_color_primary(void);
ds_color ds_color_accent(void);
ds_color ds_color_surface(void);

/* ───────── Widget tree (retained-mode) ───────── */

/* Forward declarations for all widget types */
typedef struct ds_widget ds_widget;
typedef struct ds_container_widget ds_container_widget;

/* Widget type identifiers */
typedef enum {
  DS_WIDGET_CONTAINER = 0,
  DS_WIDGET_BUTTON,
  DS_WIDGET_LABEL,
  DS_WIDGET_CARD,
  DS_WIDGET_PILL,
  DS_WIDGET_METRIC,
  DS_WIDGET_PROGRESS,
  DS_WIDGET_INPUT,
  DS_WIDGET_VIEW,
  DS_WIDGET_SCROLL,
  DS_WIDGET_CHAT,
  DS_WIDGET_TABLE,
  DS_WIDGET_TABS,
  DS_WIDGET_NAVBAR,
  DS_WIDGET_TOAST,
  DS_WIDGET_MENU,
  DS_WIDGET_DIALOG,
  DS_WIDGET_COUNT
} ds_widget_type;

/* Layout direction for flex containers — defined in core.h */
#include "core.h"

/* Size mode for layout */
typedef enum { DS_SIZE_FIXED, DS_SIZE_CONTENT, DS_SIZE_FILL } ds_size_mode;

/* Size hints a widget provides to the layout engine */
typedef struct {
  float min_w, min_h;       /* minimum size */
  float pref_w, pref_h;     /* preferred (natural) size */
  float max_w, max_h;       /* maximum size (0 = unbounded) */
  float flex_grow;          /* flex grow factor (0 = fixed) */
  ds_size_mode width_mode;  /* how width is determined */
  ds_size_mode height_mode; /* how height is determined */
} ds_size_hints;

/* Widget state flags */
typedef enum {
  DS_STATE_DEFAULT  = 0,
  DS_STATE_HOVERED  = 1 << 0,
  DS_STATE_PRESSED  = 1 << 1,
  DS_STATE_FOCUSED  = 1 << 2,
  DS_STATE_DISABLED = 1 << 3,
  DS_STATE_ACTIVE   = 1 << 4,
  DS_STATE_CHECKED  = 1 << 5,
} ds_widget_state;

/* Base widget struct — every widget embeds this as its first field */
struct ds_widget {
  ds_widget_type type;
  ds_bounds bounds;          /* computed position + size */

  /* Tree */
  ds_widget* parent;
  ds_widget* first_child;
  ds_widget* last_child;
  ds_widget* next_sibling;
  ds_widget* prev_sibling;
  uint32_t child_count;

  /* Layout */
  ds_size_hints hints;
  float margin[4];           /* top, right, bottom, left */
  float padding[4];          /* top, right, bottom, left */

  /* State */
  ds_widget_state state;

  /* Identity */
  const char* id;
  void* userdata;

  /* Virtual render — called each frame */
  void (*render)(ds_widget* self, struct ds_canvas* canvas);

  /* Event handlers */
  void (*on_click)(ds_widget* self);
  void (*on_change)(ds_widget* self, const char* value);
  void (*on_focus)(ds_widget* self);
  void (*on_blur)(ds_widget* self);

  /* Internal */
  bool needs_layout;
};

/* ───────── Container (widget with children) ───────── */
struct ds_container_widget {
  ds_widget base;
  int direction;            /* DS_DIR_ROW or DS_DIR_COLUMN from core.h */
  int align_x;              /* DS_ALIGN_* from core.h */
  int align_y;
  float gap;
  uint32_t columns;
};

/* ───────── Widget tree API ───────── */
ds_widget* ds_widget_alloc(ds_widget_type type, size_t struct_size);
void ds_widget_free(ds_widget* w);

/* Tree management */
void ds_widget_add_child(ds_widget* parent, ds_widget* child);
void ds_widget_remove_child(ds_widget* parent, ds_widget* child);
ds_widget* ds_widget_find(ds_widget* root, const char* id);
void ds_widget_destroy_tree(ds_widget* root);

/* Layout */
void ds_widget_set_hints(ds_widget* w, ds_size_hints hints);
void ds_widget_set_margin(ds_widget* w, float top, float right, float bottom, float left);
void ds_widget_set_padding(ds_widget* w, float top, float right, float bottom, float left);
void ds_widget_layout(ds_widget* root, float x, float y, float width, float height);
void ds_widget_set_needs_layout(ds_widget* w);

/* State */
void ds_widget_set_state(ds_widget* w, ds_widget_state flags, bool on);
bool ds_widget_has_state(ds_widget* w, ds_widget_state flags);

/* Traversal */
ds_widget* ds_widget_hit_test(ds_widget* root, float mx, float my);
ds_widget* ds_widget_focus_next(ds_widget* root);

/* ───────── Event system ───────── */

/* Dispatch an event through the tree using core.h ds_event.
   Updates hover/focus state automatically.
   Returns the widget that handled the event (or NULL). */
ds_widget* ds_widget_dispatch_event(ds_widget* root, ds_event* ev);

/* Container helpers */
ds_container_widget* ds_container_create(void);
void ds_container_set_direction(ds_container_widget* c, int dir);
void ds_container_set_gap(ds_container_widget* c, float gap);

/* Convenience: create a tree root */
ds_container_widget* ds_app_create(float width, float height);

#ifdef __cplusplus
}
#endif

#endif /* DISPLACER_H */
