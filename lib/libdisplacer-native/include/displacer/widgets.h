#ifndef DISPLACER_WIDGETS_H
#define DISPLACER_WIDGETS_H

#include "displacer/displacer.h"
#include "displacer/vis.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ───────── Button ───────── */
typedef enum {
  DS_BTN_PRIMARY, DS_BTN_ACCENT, DS_BTN_GHOST, DS_BTN_OUTLINE, DS_BTN_DANGER, DS_BTN_LINK
} ds_button_variant;
typedef enum { DS_BTN_SM, DS_BTN_MD, DS_BTN_LG, DS_BTN_XL } ds_button_size;

typedef struct {
  ds_widget base;               /* retained-mode base */
  ds_bounds bounds; /* legacy — same as base.bounds */
  ds_button_variant variant;
  ds_button_size size;
  const char* text;
} ds_button;

ds_button* ds_button_create(ds_button_variant variant, const char* text);
void ds_button_init(ds_button* btn, ds_button_variant variant, const char* text);
void ds_button_render(ds_button* btn, ds_canvas* c);
void ds_button_set_bounds(ds_button* btn, float x, float y, float w, float h);
uint8_t ds_button_handle(ds_button* btn, float mx, float my);

/* ───────── Label ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* text;
  ds_colorf color;
  float size;
  uint8_t bold;
} ds_label;

ds_label* ds_label_create(const char* text);
void ds_label_init(ds_label* lbl, const char* text);
void ds_label_render(ds_label* lbl, ds_canvas* c);

/* ───────── Card ───────── */
typedef enum { DS_CARD_SURFACE, DS_CARD_RAISED, DS_CARD_OUTLINE, DS_CARD_GLASS, DS_CARD_INTERACTIVE } ds_card_variant;

typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  ds_card_variant variant;
  const char* title;
  const char* body;
} ds_card;

ds_card* ds_card_create(ds_card_variant var, const char* title, const char* body);
void ds_card_init(ds_card* card, ds_card_variant var, const char* title, const char* body);
void ds_card_render(ds_card* card, ds_canvas* c);

/* ───────── Pill ───────── */
typedef enum { DS_PILL_DEFAULT, DS_PILL_PRIMARY, DS_PILL_ACCENT, DS_PILL_SUCCESS, DS_PILL_WARN, DS_PILL_ERROR, DS_PILL_INFO } ds_pill_variant;

typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  ds_pill_variant variant;
  const char* text;
  uint8_t closable;
} ds_pill;

ds_pill* ds_pill_create(const char* text, ds_pill_variant var);
void ds_pill_init(ds_pill* p, const char* text, ds_pill_variant var);
void ds_pill_render(ds_pill* p, ds_canvas* c);

/* ───────── Metric ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* label;
  const char* value;
  const char* trend;
  uint8_t trend_up;
} ds_metric;

void ds_metric_init(ds_metric* m, const char* label, const char* value);
void ds_metric_render(ds_metric* m, ds_canvas* c);

/* ───────── Progress ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  float value, max;
  ds_colorf color;
} ds_progress;

void ds_progress_init(ds_progress* p, float value, float max);
void ds_progress_render(ds_progress* p, ds_canvas* c);

/* ───────── Toast ───────── */
typedef enum { DS_TOAST_INFO, DS_TOAST_SUCCESS, DS_TOAST_WARN, DS_TOAST_ERROR } ds_toast_variant;

typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  ds_toast_variant variant;
  const char* message;
  float lifetime, elapsed;
} ds_toast;

void ds_toast_init(ds_toast* t, const char* msg, ds_toast_variant var);
void ds_toast_render(ds_toast* t, ds_canvas* c);

/* ───────── Menu ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* items[8];
  uint8_t count, selected;
} ds_menu;

void ds_menu_init(ds_menu* m, const char** items, uint8_t count);
void ds_menu_render(ds_menu* m, ds_canvas* c);
uint8_t ds_menu_handle(ds_menu* m, float mx, float my);

/* ───────── Container (legacy) ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  ds_colorf bg;
  float padding;
} ds_container_legacy;

void ds_container_init(ds_container_legacy* con, float x, float y, float w, float h);
void ds_container_render(ds_container_legacy* con, ds_canvas* c);

/* ───────── Stat Card ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* label, *value, *icon;
  ds_colorf accent;
} ds_stat_card;

void ds_stat_card_init(ds_stat_card* s, const char* label, const char* value, const char* icon);
void ds_stat_card_render(ds_stat_card* s, ds_canvas* c);

/* ───────── Sparkline ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const float* data;
  uint32_t count;
  ds_colorf color;
} ds_sparkline;

void ds_sparkline_init(ds_sparkline* s, const float* data, uint32_t count);
void ds_sparkline_render(ds_sparkline* s, ds_canvas* c);

/* ───────── Gauge ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  float value, max, size;
  const char* label;
  ds_colorf color;
} ds_gauge;

void ds_gauge_init(ds_gauge* g, float val, float max, const char* label);
void ds_gauge_render(ds_gauge* g, ds_canvas* c);

/* ───────── Audio controls (parity with libdisplacer-ts audio/audio.ts) ───────── */

/* Knob — rotary control (270-degree sweep). Value-driven; the host maps
   pointer drag to value via ds_knob_drag(). */
typedef struct {
  ds_widget base;
  float value, min, max;
  const char* label;
  const char* unit;
  float size;         /* diameter in px; 0 => 60 */
} ds_knob;

void  ds_knob_init(ds_knob* k, float value, float min, float max, const char* label);
void  ds_knob_render(ds_knob* k, ds_canvas* c);
/* Apply a vertical drag delta (pixels; up = increase) and return new value. */
float ds_knob_drag(ds_knob* k, float dy);

/* Fader — linear slider. vertical != 0 draws bottom-to-top. */
typedef struct {
  ds_widget base;
  float value, min, max;
  int vertical;
} ds_fader;

void  ds_fader_init(ds_fader* f, float value, float min, float max, int vertical);
void  ds_fader_render(ds_fader* f, ds_canvas* c);
/* Map a pointer position inside base.bounds to a value (and store it). */
float ds_fader_value_at(ds_fader* f, float mx, float my);

/* Meter — level display (0..1), green->amber->red, optional peak hold (<0 hides). */
typedef struct {
  ds_widget base;
  float value;   /* 0..1 */
  float peak;    /* 0..1, <0 hides */
  int vertical;
} ds_meter;

void ds_meter_init(ds_meter* m, int vertical);
void ds_meter_render(ds_meter* m, ds_canvas* c);

/* XY pad — 2D positioner, x/y in [0,1] (y up). */
typedef struct {
  ds_widget base;
  float x, y;
  int grid;
} ds_xy_pad;

void ds_xy_pad_init(ds_xy_pad* p, float x, float y);
void ds_xy_pad_render(ds_xy_pad* p, ds_canvas* c);
/* Map a pointer position inside base.bounds to x,y in [0,1] (and store). */
void ds_xy_pad_set_from(ds_xy_pad* p, float mx, float my);

/* ───────── Status Bar ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  ds_colorf bg;
} ds_status_bar;

void ds_status_bar_init(ds_status_bar* s, float x, float y, float w);
void ds_status_bar_render(ds_status_bar* s, ds_canvas* c);

/* ───────── Typing Indicator ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  float elapsed;
} ds_typing;

void ds_typing_init(ds_typing* t);
void ds_typing_render(ds_typing* t, ds_canvas* c);

/* ───────── Model Badge ───────── */
typedef enum { DS_MODEL_ONLINE, DS_MODEL_BUSY, DS_MODEL_ERROR } ds_model_status;

typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* model, *quant;
  uint32_t context;
  ds_model_status status;
} ds_model_badge;

void ds_model_badge_init(ds_model_badge* b, const char* model, const char* quant, uint32_t ctx, ds_model_status st);
void ds_model_badge_render(ds_model_badge* b, ds_canvas* c);

/* ───────── Menu Item ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* label, *shortcut;
  uint8_t danger;
} ds_menu_item;

void ds_menu_item_init(ds_menu_item* mi, const char* label, const char* shortcut, uint8_t danger);
void ds_menu_item_render(ds_menu_item* mi, ds_canvas* c);

/* ───────── View ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  const char* label, *icon;
} ds_view;

void ds_view_init(ds_view* v, const char* label, const char* icon);
void ds_view_render(ds_view* v, ds_canvas* c);

/* ───────── Scroll View ───────── */
typedef struct {
  ds_widget base;
  ds_bounds bounds; /* legacy — same as base.bounds */
  float scroll_x, scroll_y;
} ds_scroll_view;

void ds_scroll_view_init(ds_scroll_view* sv, float x, float y, float w, float h);
void ds_scroll_view_begin(ds_scroll_view* sv, ds_canvas* c);
void ds_scroll_view_end(ds_scroll_view* sv, ds_canvas* c);

#ifdef __cplusplus
}
#endif

#endif /* DISPLACER_WIDGETS_H */
