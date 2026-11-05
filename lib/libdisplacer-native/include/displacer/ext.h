#ifndef DISPLACER_EXT_H
#define DISPLACER_EXT_H

#include "displacer/vis.h"
#include "displacer/widgets.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ───────── Dialog ───────── */
typedef enum { DS_DIALOG_SM, DS_DIALOG_MD, DS_DIALOG_LG, DS_DIALOG_XL, DS_DIALOG_FULL } ds_dialog_size;

typedef struct {
  const char* title; const char* body;
  ds_bounds bounds;
  uint8_t open;
  ds_dialog_size size;
} ds_dialog;

void ds_dialog_init(ds_dialog* dlg, const char* title, const char* body);
void ds_dialog_render(ds_dialog* dlg, ds_canvas* c);

/* ───────── Input ───────── */
typedef enum { DS_INPUT_TEXT, DS_INPUT_SEARCH, DS_INPUT_PASSWORD } ds_input_variant;
typedef enum { DS_INPUT_SM, DS_INPUT_MD, DS_INPUT_LG } ds_input_size;
typedef enum { DS_INPUT_OK, DS_INPUT_ERROR, DS_INPUT_WARN } ds_input_status;

typedef struct {
  char buffer[256];
  uint16_t cursor;
  ds_bounds bounds;
  const char* placeholder;
  const char* label;
  const char* hint;
  uint8_t focused;
  ds_input_variant variant;
  ds_input_size size;
  ds_input_status status;
} ds_input;

void ds_input_init(ds_input* inp, const char* placeholder);
void ds_input_render(ds_input* inp, ds_canvas* c);
void ds_input_key(ds_input* inp, uint32_t keycode, uint8_t shift);

/* ───────── Navigation Bar ───────── */
typedef struct {
  const char* items[8];
  uint8_t count, active;
  ds_bounds bounds;
} ds_navbar;

void ds_navbar_init(ds_navbar* nav, const char** items, uint8_t count);
void ds_navbar_render(ds_navbar* nav, ds_canvas* c);
uint8_t ds_navbar_handle(ds_navbar* nav, float mx, float my);

/* ───────── Nav Item (sub-component) ───────── */
typedef struct {
  const char* label;
  const char* badge;
  uint8_t active, disabled;
  ds_bounds bounds;
} ds_nav_item;

void ds_nav_item_init(ds_nav_item* ni, const char* label, const char* badge, uint8_t active, uint8_t disabled);
void ds_nav_item_render(ds_nav_item* ni, ds_canvas* c);

/* ───────── Tabs ───────── */
typedef struct {
  const char* tabs[8];
  uint8_t count, active;
  ds_bounds bounds;
} ds_tabs;

void ds_tabs_init(ds_tabs* tabs, const char** items, uint8_t count);
void ds_tabs_render(ds_tabs* tabs, ds_canvas* c);
uint8_t ds_tabs_handle(ds_tabs* tabs, float mx, float my);

/* ───────── Chat Bubble ───────── */
typedef enum { DS_CHAT_USER, DS_CHAT_ASSISTANT, DS_CHAT_SYSTEM } ds_chat_role;

typedef struct {
  const char* text; ds_chat_role role;
  ds_bounds bounds;
} ds_chat_bubble;

void ds_chat_bubble_init(ds_chat_bubble* b, const char* text, ds_chat_role role);
void ds_chat_bubble_render(ds_chat_bubble* b, ds_canvas* c);

/* ───────── Table ───────── */
#define DS_TABLE_MAX_COLS 16
#define DS_TABLE_MAX_ROWS 100

typedef enum { DS_SORT_NONE, DS_SORT_ASC, DS_SORT_DESC } ds_sort_dir;

typedef struct {
  const char* headers[DS_TABLE_MAX_COLS];
  const char* rows[DS_TABLE_MAX_ROWS][DS_TABLE_MAX_COLS];
  uint8_t cols, rows_count;
  uint8_t sort_col;
  ds_sort_dir sort_dir;
  ds_bounds bounds;
} ds_table;

void ds_table_init(ds_table* t, const char** headers, uint8_t cols);
void ds_table_add_row(ds_table* t, const char** cells);
void ds_table_sort_by(ds_table* t, uint8_t col);
void ds_table_render(ds_table* t, ds_canvas* c);

/* ───────── User Avatar ───────── */
typedef struct {
  const char* name; const char* detail;
  ds_bounds bounds;
  uint8_t online;
} ds_user_avatar;

void ds_user_avatar_init(ds_user_avatar* a, const char* name);
void ds_user_avatar_render(ds_user_avatar* a, ds_canvas* c);

/* ───────── Filter Bar ───────── */
typedef struct {
  char query[64];
  ds_bounds bounds;
  uint8_t focused;
} ds_filter_bar;

void ds_filter_bar_init(ds_filter_bar* f);
void ds_filter_bar_render(ds_filter_bar* f, ds_canvas* c);
void ds_filter_bar_key(ds_filter_bar* f, uint32_t keycode);

/* ───────── Open File Dialog (Blueprint) ───────── */
typedef struct {
  const char* filename;
  const char* path;
  uint8_t open;
  ds_bounds bounds;
  char selected[64];
} ds_file_dialog;

void ds_file_dialog_init(ds_file_dialog* dlg);
void ds_file_dialog_render(ds_file_dialog* dlg, ds_canvas* c);
uint8_t ds_file_dialog_handle(ds_file_dialog* dlg, float mx, float my);

/* ───────── Bar Chart ───────── */
#define DS_BAR_MAX_SERIES 4
#define DS_BAR_MAX_LABELS 20

typedef struct {
  const char* label;
  float values[DS_BAR_MAX_LABELS];
  uint32_t count;
  ds_colorf color;
} ds_bar_series;

typedef struct {
  ds_bar_series series[DS_BAR_MAX_SERIES];
  uint32_t series_count;
  const char* labels[DS_BAR_MAX_LABELS];
  uint32_t label_count;
  uint8_t stacked;
  float height;
  ds_bounds bounds;
} ds_bar_chart;

void ds_bar_chart_init(ds_bar_chart* bc);
void ds_bar_chart_add_series(ds_bar_chart* bc, const char* label, const float* values, uint32_t count);
void ds_bar_chart_render(ds_bar_chart* bc, ds_canvas* c);

/* ───────── Scatter Plot ───────── */
#define DS_SCATTER_MAX 100

typedef struct {
  float x, y;
  float r;
  ds_colorf color;
} ds_scatter_point;

typedef struct {
  ds_scatter_point points[DS_SCATTER_MAX];
  uint32_t count;
  float height;
  ds_bounds bounds;
  ds_colorf color;
} ds_scatter_plot;

void ds_scatter_plot_init(ds_scatter_plot* sp);
void ds_scatter_plot_add(ds_scatter_plot* sp, float x, float y);
void ds_scatter_plot_render(ds_scatter_plot* sp, ds_canvas* c);

/* ───────── Heatmap ───────── */
#define DS_HEATMAP_MAX 12

typedef struct {
  float data[DS_HEATMAP_MAX][DS_HEATMAP_MAX];
  uint32_t rows, cols;
  const char* x_labels[DS_HEATMAP_MAX];
  const char* y_labels[DS_HEATMAP_MAX];
  float height;
  ds_bounds bounds;
} ds_heatmap;

void ds_heatmap_init(ds_heatmap* hm, uint32_t rows, uint32_t cols);
void ds_heatmap_set(ds_heatmap* hm, uint32_t r, uint32_t c, float v);
void ds_heatmap_render(ds_heatmap* hm, ds_canvas* c);

/* ───────── Stream Chart (realtime line) ───────── */
#define DS_STREAM_MAX 80

typedef struct {
  float data[DS_STREAM_MAX];
  uint32_t count, max_points;
  float vmin, vmax;
  ds_colorf color;
  ds_colorf fill_color;
  ds_bounds bounds;
} ds_stream_chart;

void ds_stream_chart_init(ds_stream_chart* sc, uint32_t max_points);
void ds_stream_chart_push(ds_stream_chart* sc, float value);
void ds_stream_chart_render(ds_stream_chart* sc, ds_canvas* c);

/* ───────── Log Viewer ───────── */
typedef enum { DS_LOG_DEBUG, DS_LOG_INFO, DS_LOG_WARN, DS_LOG_ERROR } ds_log_level;

typedef struct {
  ds_log_level level;
  const char* message;
  const char* source;
} ds_log_entry;

#define DS_LOG_MAX 100

typedef struct {
  ds_log_entry entries[DS_LOG_MAX];
  uint32_t count;
  uint32_t scroll;
  ds_bounds bounds;
} ds_log_viewer;

void ds_log_viewer_init(ds_log_viewer* lv);
void ds_log_viewer_add(ds_log_viewer* lv, ds_log_level level, const char* message, const char* source);
void ds_log_viewer_render(ds_log_viewer* lv, ds_canvas* c);

/* ───────── Account Card ───────── */
typedef struct {
  const char* name;
  const char* email;
  const char* role;
  ds_bounds bounds;
} ds_account_card;

void ds_account_card_init(ds_account_card* ac, const char* name, const char* email, const char* role);
void ds_account_card_render(ds_account_card* ac, ds_canvas* c);

/* ───────── Tool Window ───────── */
typedef struct {
  const char* label;
  uint8_t collapsed;
  ds_bounds bounds;
} ds_tool_window;

void ds_tool_window_init(ds_tool_window* tw, const char* label);
void ds_tool_window_render(ds_tool_window* tw, ds_canvas* c);

/* ───────── Marquee ───────── */
typedef struct {
  const char* text;
  float speed;
  float offset;
  ds_bounds bounds;
} ds_marquee;

void ds_marquee_init(ds_marquee* m, const char* text);
void ds_marquee_render(ds_marquee* m, ds_canvas* c);

#ifdef __cplusplus
}
#endif

#endif /* DISPLACER_EXT_H */
