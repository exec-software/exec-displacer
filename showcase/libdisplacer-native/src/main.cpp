/**
 * Displacer Native Sandbox — Interactive Component Showcase
 * All widgets rendered with bitmap font. Mouse/keyboard interactive.
 * SPACE to navigate pages, ESC to quit, 1-6 themes, L language.
 */

#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <cstring>
#include <SDL2/SDL.h>
#include "displacer/displacer.h"
#include "displacer/vis.h"
#include "displacer/widgets.h"
#include "displacer/ext.h"
#include "displacer/font.h"
#include "displacer/core.h"

static const int W = 900, H = 650;

/* ─── Persistent interactive state ─── */
static struct {
  int hovered_btn;         /* index into btn_labels or -1 */
  int hovered_pill;
  int active_tab;
  int active_nav;
  int active_theme;
  int focused_input;       /* 0 = none, 1 = search input */
  int selected_menu;
  int toggled_count;       /* click counter demo */
  uint32_t last_click_time;
  /* Mouse for button hover */
  float mouse_x, mouse_y;
  int mouse_down;
  /* Layout regions for hit-testing */
  ds_bounds btn_region;    /* bounds of the button row */
  ds_bounds tabs_region;
  ds_bounds nav_region;
  ds_bounds menu_region;
  ds_bounds table_region;
  /* Table sort state */
  ds_table demo_table;
  uint8_t table_sorted;
} state;

/* ─── Demo data ─── */
static const char* btn_labels[] = {"Primary", "Accent", "Ghost", "Outline", "Danger", "Link"};
static const ds_button_variant btn_vars[] = {DS_BTN_PRIMARY, DS_BTN_ACCENT, DS_BTN_GHOST, DS_BTN_OUTLINE, DS_BTN_DANGER, DS_BTN_LINK};
static const char* pill_labels[] = {"Default", "Primary", "Accent", "Success", "Warning", "Error", "Info"};
static const ds_pill_variant pill_vars[] = {DS_PILL_DEFAULT, DS_PILL_PRIMARY, DS_PILL_ACCENT, DS_PILL_SUCCESS, DS_PILL_WARN, DS_PILL_ERROR, DS_PILL_INFO};
static const char* tab_labels[] = {"Code", "Preview", "Blame", "History"};
static const char* nav_labels[] = {"Dashboard", "Projects", "Settings", "Admin"};

static void render_section_label(ds_canvas* c, const char* label, float x, float y) {
  ds_font_text(c, label, x, y, ds_colorf_hex(ds_current_theme->fg_muted));
}

static void render_buttons(ds_canvas* c, float x, float y, float w) {
  ds_layout l = {DS_LAYOUT_STACK, DS_DIR_ROW, DS_GAP_SM, DS_ALIGN_CENTER, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, {x, y, w, 28}};
  ds_layout_child ch[6];
  for (int i = 0; i < 6; i++) { ch[i].flex = 1; ch[i].fixed_w = 0; ch[i].fixed_h = 24; }
  ds_layout_compute(&l, ch, 6);
  state.btn_region = l.container;
  for (int i = 0; i < 6; i++) {
    ds_button bt; ds_button_init(&bt, btn_vars[i], btn_labels[i]);
    bt.bounds = ch[i].bounds;
    ds_widget_set_state(&bt.base, DS_STATE_HOVERED, (state.hovered_btn == i));
    ds_widget_set_state(&bt.base, DS_STATE_PRESSED, (state.hovered_btn == i && state.mouse_down));
    ds_button_render(&bt, c);
  }
}

static void render_pills(ds_canvas* c, float x, float y, float w) {
  ds_layout l = {DS_LAYOUT_STACK, DS_DIR_ROW, DS_GAP_SM, DS_ALIGN_CENTER, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, {x, y, w, 22}};
  ds_layout_child ch[7];
  for (int i = 0; i < 7; i++) { ch[i].flex = 1; ch[i].fixed_w = 0; ch[i].fixed_h = 0; }
  ds_layout_compute(&l, ch, 7);
  for (int i = 0; i < 7; i++) { ds_pill p; ds_pill_init(&p, pill_labels[i], pill_vars[i]); p.bounds = ch[i].bounds; ds_pill_render(&p, c); }
}

static void render_cards(ds_canvas* c, float x, float y, float w) {
  ds_layout l = {DS_LAYOUT_STACK, DS_DIR_ROW, DS_GAP_MD, DS_ALIGN_START, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, {x, y, w, 70}};
  ds_layout_child ch[3];
  for (int i = 0; i < 3; i++) { ch[i].flex = 1; ch[i].fixed_w = 0; ch[i].fixed_h = 70; }
  ds_layout_compute(&l, ch, 3);
  ds_card_variant cv[] = {DS_CARD_SURFACE, DS_CARD_RAISED, DS_CARD_GLASS};
  const char* ct[] = {"Surface Card", "Raised Card", "Glass Card"};
  const char* cs[] = {"Default container", "Elevated", "Blurred backdrop"};
  for (int i = 0; i < 3; i++) { ds_card card; ds_card_init(&card, cv[i], ct[i], cs[i]); card.bounds = ch[i].bounds; ds_card_render(&card, c); }
}

static void render_metrics(ds_canvas* c, float x, float y, float w) {
  ds_layout l = {DS_LAYOUT_STACK, DS_DIR_ROW, DS_GAP_MD, DS_ALIGN_START, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, {x, y, w, 56}};
  ds_layout_child ch[3];
  for (int i = 0; i < 3; i++) { ch[i].flex = 1; ch[i].fixed_w = 0; ch[i].fixed_h = 0; }
  ds_layout_compute(&l, ch, 3);
  ds_metric m[3];
  ds_metric_init(&m[0], "Tokens/s", "1,247"); m[0].trend = "+12%"; m[0].trend_up = 1;
  ds_metric_init(&m[1], "Latency", "42ms"); m[1].trend = "-8ms"; m[1].trend_up = 1;
  ds_metric_init(&m[2], "Memory", "38GB"); m[2].trend = "74%"; m[2].trend_up = 0;
  for (int i = 0; i < 3; i++) { m[i].bounds = ch[i].bounds; ds_metric_render(&m[i], c); }
}

static void render_statcards(ds_canvas* c, float x, float y, float w) {
  ds_layout l = {DS_LAYOUT_STACK, DS_DIR_ROW, DS_GAP_MD, DS_ALIGN_START, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, {x, y, w, 56}};
  ds_layout_child ch[3];
  for (int i = 0; i < 3; i++) { ch[i].flex = 1; ch[i].fixed_w = 0; ch[i].fixed_h = 56; }
  ds_layout_compute(&l, ch, 3);
  ds_stat_card s[3];
  ds_stat_card_init(&s[0], "Sessions", "12", "*");
  ds_stat_card_init(&s[1], "GPU", "82%", "o"); s[1].accent = ds_colorf_hex(ds_current_theme->accent);
  ds_stat_card_init(&s[2], "Uptime", "99.8%", "."); s[2].accent = ds_colorf_hex(ds_current_theme->semantic_success);
  for (int i = 0; i < 3; i++) { s[i].bounds = ch[i].bounds; ds_stat_card_render(&s[i], c); }
}

static void render_tabs_nav(ds_canvas* c, float x, float y, float w) {
  ds_tabs tabs; ds_tabs_init(&tabs, tab_labels, 4);
  tabs.bounds = (ds_bounds){x, y, w * 0.5f, 0}; tabs.active = state.active_tab;
  state.tabs_region = tabs.bounds;
  ds_tabs_render(&tabs, c);
  ds_navbar nav; ds_navbar_init(&nav, nav_labels, 4);
  nav.bounds = (ds_bounds){x, y + 40, w * 0.6f, 0}; nav.active = state.active_nav;
  state.nav_region = nav.bounds;
  ds_navbar_render(&nav, c);
}

static void render_progress(ds_canvas* c, float x, float y, float w) {
  float gap = 8, bar_h = 10;
  ds_progress p1, p2, p3;
  ds_progress_init(&p1, 73, 100); p1.bounds = (ds_bounds){x, y, w * 0.4f, bar_h};
  ds_progress_init(&p2, 45, 100); p2.bounds = (ds_bounds){x, y + bar_h + gap, w * 0.4f, bar_h}; p2.color = ds_colorf_hex(ds_current_theme->accent);
  ds_progress_init(&p3, 100, 100); p3.bounds = (ds_bounds){x, y + (bar_h + gap) * 2, w * 0.4f, bar_h}; p3.color = ds_colorf_hex(ds_current_theme->semantic_success);
  ds_progress_render(&p1, c); ds_progress_render(&p2, c); ds_progress_render(&p3, c);
}

static void render_chat(ds_canvas* c, float x, float y, float w) {
  ds_chat_bubble ch[3];
  ds_chat_bubble_init(&ch[0], "User: What models are loaded?", DS_CHAT_USER);
  ch[0].bounds = (ds_bounds){x + 20, y, w - 20, 0};
  ds_chat_bubble_render(&ch[0], c);
  ds_chat_bubble_init(&ch[1], "Assistant: Three demo models are available.", DS_CHAT_ASSISTANT);
  ch[1].bounds = (ds_bounds){x, y + 42, w, 0};
  ds_chat_bubble_render(&ch[1], c);
  ds_chat_bubble_init(&ch[2], "Assistant switched to the Research project", DS_CHAT_SYSTEM);
  ch[2].bounds = (ds_bounds){x, y + 94, w, 0};
  ds_chat_bubble_render(&ch[2], c);
}

static void render_input_filter(ds_canvas* c, float x, float y, float w) {
  ds_input inp; ds_input_init(&inp, "Search...");
  inp.bounds = (ds_bounds){x, y, w * 0.6f, 0}; inp.focused = (state.focused_input == 1);
  if (inp.focused && inp.buffer[0] == 0) strcpy(inp.buffer, "Hello");
  inp.cursor = strlen(inp.buffer);
  ds_input_render(&inp, c);
  ds_filter_bar fb; ds_filter_bar_init(&fb);
  fb.bounds = (ds_bounds){x, y + 54, w * 0.6f, 0};
  ds_filter_bar_render(&fb, c);
}

static void render_toasts(ds_canvas* c, float x, float y, float w) {
  ds_toast t[4];
  ds_toast_init(&t[0], "Job completed", DS_TOAST_SUCCESS); t[0].lifetime = 0;
  ds_toast_init(&t[1], "GPU at 85%", DS_TOAST_WARN); t[1].lifetime = 0;
  ds_toast_init(&t[2], "Build failed!", DS_TOAST_ERROR); t[2].lifetime = 0;
  ds_toast_init(&t[3], "Model deployed", DS_TOAST_INFO); t[3].lifetime = 0;
  ds_layout l = {DS_LAYOUT_STACK, DS_DIR_COLUMN, DS_GAP_XS, DS_ALIGN_START, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, {x, y, w, 120}};
  ds_layout_child ch[4];
  for (int i = 0; i < 4; i++) { ch[i].flex = 1; ch[i].fixed_w = 0; ch[i].fixed_h = 0; }
  ds_layout_compute(&l, ch, 4);
  for (int i = 0; i < 4; i++) { t[i].bounds = ch[i].bounds; ds_toast_render(&t[i], c); }
}

static void render_table(ds_canvas* c, float x, float y, float w) {
  const char* hdrs[] = {"Name", "Role", "Status", "Score"};
  ds_table_init(&state.demo_table, hdrs, 4);
  const char* r1[] = {"Alex", "Admin", "Active", "98"};
  const char* r2[] = {"Sam", "Admin", "Active", "92"};
  const char* r3[] = {"Taylor", "Admin", "Busy", "87"};
  const char* r4[] = {"Jordan", "Member", "Away", "75"};
  const char* r5[] = {"Demo Agent", "Agent", "Active", "100"};
  ds_table_add_row(&state.demo_table, r1); ds_table_add_row(&state.demo_table, r2);
  ds_table_add_row(&state.demo_table, r3); ds_table_add_row(&state.demo_table, r4);
  ds_table_add_row(&state.demo_table, r5);
  state.demo_table.bounds = (ds_bounds){x, y, w, 0};
  state.table_region = state.demo_table.bounds;
  ds_table_render(&state.demo_table, c);
}

/* ─── Page 1: showcase ─── */
void render_showcase(ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  ds_canvas_clear(c, ds_colorf_hex(t->page));
  float Wf = (float)W, Hf = (float)H;

  char title_buf[96];
  snprintf(title_buf, sizeof(title_buf), "Displacer Native  —  %s  |  Lang: %s",
    state.active_theme == 0 ? _("theme.light") :
    state.active_theme == 1 ? _("theme.dark") :
    state.active_theme == 2 ? _("theme.arcana") :
    state.active_theme == 3 ? _("theme.parchment") :
    state.active_theme == 4 ? _("theme.mystic") : _("theme.clay"),
    ds_lang_active() == DS_LANG_DE ? "DE" :
    ds_lang_active() == DS_LANG_RO ? "RO" :
    ds_lang_active() == DS_LANG_RU ? "RU" :
    ds_lang_active() == DS_LANG_FR ? "FR" :
    ds_lang_active() == DS_LANG_ES ? "ES" : "EN");
  ds_font_text(c, title_buf, 12, 10, ds_colorf_hex(t->primary));

  ds_bounds body_area = {8, 32, Wf - 16, Hf - 56};
  float split = 0.55f;
  ds_bounds left_col = {body_area.x, body_area.y, body_area.w * split - 8, body_area.h};
  ds_bounds right_col = {body_area.x + body_area.w * split + 8, body_area.y, body_area.w * (1 - split) - 8, body_area.h};

  #define L_SEC 8
  ds_layout ll = {DS_LAYOUT_STACK, DS_DIR_COLUMN, DS_GAP_MD, DS_ALIGN_START, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, left_col};
  ds_layout_child lc[L_SEC];
  for (int i = 0; i < L_SEC; i++) { lc[i].flex = 0; lc[i].fixed_w = 0; lc[i].fixed_h = 0; }
  ds_layout_compute(&ll, lc, L_SEC);

  render_section_label(c, "Buttons", lc[0].bounds.x, lc[0].bounds.y);
  render_buttons(c, lc[0].bounds.x, lc[0].bounds.y + 14, lc[0].bounds.w);
  render_section_label(c, "Pills", lc[1].bounds.x, lc[1].bounds.y);
  render_pills(c, lc[1].bounds.x, lc[1].bounds.y + 14, lc[1].bounds.w);
  render_section_label(c, "Cards", lc[2].bounds.x, lc[2].bounds.y);
  render_cards(c, lc[2].bounds.x, lc[2].bounds.y + 14, lc[2].bounds.w);
  render_section_label(c, "Metrics", lc[3].bounds.x, lc[3].bounds.y);
  render_metrics(c, lc[3].bounds.x, lc[3].bounds.y + 14, lc[3].bounds.w);
  render_section_label(c, "StatCards", lc[4].bounds.x, lc[4].bounds.y);
  render_statcards(c, lc[4].bounds.x, lc[4].bounds.y + 14, lc[4].bounds.w);
  render_section_label(c, "Tabs + Nav", lc[5].bounds.x, lc[5].bounds.y);
  render_tabs_nav(c, lc[5].bounds.x, lc[5].bounds.y + 14, lc[5].bounds.w);
  render_section_label(c, "Progress", lc[6].bounds.x, lc[6].bounds.y);
  render_progress(c, lc[6].bounds.x, lc[6].bounds.y + 14, lc[6].bounds.w);

  #define R_SEC 5
  ds_layout rl = {DS_LAYOUT_STACK, DS_DIR_COLUMN, DS_GAP_MD, DS_ALIGN_START, 0, 0, 0, 0, {0,0,0,0}, {0,0,0,0}, right_col};
  ds_layout_child rc[R_SEC];
  for (int i = 0; i < R_SEC; i++) { rc[i].flex = 0; rc[i].fixed_w = 0; rc[i].fixed_h = 0; }
  ds_layout_compute(&rl, rc, R_SEC);

  render_section_label(c, "Chat", rc[0].bounds.x, rc[0].bounds.y);
  render_chat(c, rc[0].bounds.x, rc[0].bounds.y + 14, rc[0].bounds.w);
  render_section_label(c, "Input", rc[1].bounds.x, rc[1].bounds.y);
  render_input_filter(c, rc[1].bounds.x, rc[1].bounds.y + 14, rc[1].bounds.w);
  render_section_label(c, "Toasts", rc[2].bounds.x, rc[2].bounds.y);
  render_toasts(c, rc[2].bounds.x, rc[2].bounds.y + 14, rc[2].bounds.w);
  render_section_label(c, "Table", rc[3].bounds.x, rc[3].bounds.y);
  render_table(c, rc[3].bounds.x, rc[3].bounds.y + 14, rc[3].bounds.w);

  ds_canvas_fill_rect(c, 0, Hf - 20, Wf, 20, ds_colorf_hex(t->surface));
  ds_font_text(c, "  SPACE/LEFT/RIGHT navigate  |  ESC quit  |  1-4: Theme  |  L: Lang  |  Click: interact", 8, Hf - 15, ds_colorf_hex(t->fg_subtle));
}

/* ─── Page 3: extras ─── */
void render_extras(ds_canvas* c, float elapsed) {
  const ds_theme* t = ds_current_theme;
  ds_canvas_clear(c, ds_colorf_hex(t->page));
  float Wf = (float)W, Hf = (float)H;

  ds_font_text(c, "Page 3/3 — New Ports", 12, 10, ds_colorf_hex(t->primary));

  ds_bounds col1 = {8, 30, Wf * 0.5f - 12, Hf - 56};
  ds_bounds col2 = {Wf * 0.5f + 4, 30, Wf * 0.5f - 12, Hf - 56};

  ds_layout ll = {DS_LAYOUT_STACK, DS_DIR_COLUMN, DS_GAP_MD, DS_ALIGN_START};
  ll.container = col1;
  ds_layout_child lc[5];
  for (int i = 0; i < 5; i++) { lc[i].flex = 0; lc[i].fixed_h = 0; }
  ds_layout_compute(&ll, lc, 5);

  render_section_label(c, "Sparkline", lc[0].bounds.x, lc[0].bounds.y);
  float sp_data[] = {10,25,18,42,35,58,62,48,72,68,85,78,92};
  ds_sparkline sp; ds_sparkline_init(&sp, sp_data, 13);
  sp.bounds = (ds_bounds){lc[0].bounds.x, lc[0].bounds.y + 14, lc[0].bounds.w, 24}; sp.color = ds_colorf_hex(t->primary);
  ds_sparkline_render(&sp, c);

  render_section_label(c, "Gauge", lc[1].bounds.x, lc[1].bounds.y);
  ds_gauge gauge; ds_gauge_init(&gauge, 73, 100, "GPU");
  gauge.bounds = (ds_bounds){lc[1].bounds.x, lc[1].bounds.y + 14, 0, 0};
  ds_gauge_render(&gauge, c);

  render_section_label(c, "Typing + Model Badge", lc[2].bounds.x, lc[2].bounds.y);
  ds_typing typing; ds_typing_init(&typing);
  typing.elapsed = elapsed;
  typing.bounds = (ds_bounds){lc[2].bounds.x, lc[2].bounds.y + 14, 40, 16};
  ds_typing_render(&typing, c);
  ds_model_badge mb; ds_model_badge_init(&mb, "Qwen3-32B", "Q4_K_M", 32768, DS_MODEL_ONLINE);
  mb.bounds = (ds_bounds){lc[2].bounds.x + 50, lc[2].bounds.y + 12, 0, 0};
  ds_model_badge_render(&mb, c);

  render_section_label(c, "Account Card", lc[3].bounds.x, lc[3].bounds.y);
  ds_account_card ac; ds_account_card_init(&ac, "Taylor", "taylor@example.com", "Admin");
  ac.bounds = (ds_bounds){lc[3].bounds.x, lc[3].bounds.y + 14, lc[3].bounds.w, 0};
  ds_account_card_render(&ac, c);

  render_section_label(c, "Tool Window", lc[4].bounds.x, lc[4].bounds.y);
  ds_tool_window tw; ds_tool_window_init(&tw, "Terminal");
  tw.bounds = (ds_bounds){lc[4].bounds.x, lc[4].bounds.y + 14, lc[4].bounds.w, 80};
  ds_tool_window_render(&tw, c);

  ds_layout rl = {DS_LAYOUT_STACK, DS_DIR_COLUMN, DS_GAP_MD, DS_ALIGN_START};
  rl.container = col2;
  ds_layout_child rc[5];
  for (int i = 0; i < 5; i++) { rc[i].flex = 0; rc[i].fixed_h = 0; }
  ds_layout_compute(&rl, rc, 5);

  render_section_label(c, "Bar Chart", rc[0].bounds.x, rc[0].bounds.y);
  ds_bar_chart bc; ds_bar_chart_init(&bc);
  float s1[] = {30, 55, 42, 78, 61};
  float s2[] = {45, 38, 62, 51, 73};
  ds_bar_chart_add_series(&bc, "Tokens", s1, 5);
  ds_bar_chart_add_series(&bc, "Memory", s2, 5);
  bc.bounds = (ds_bounds){rc[0].bounds.x, rc[0].bounds.y + 14, rc[0].bounds.w, 120};
  ds_bar_chart_render(&bc, c);

  render_section_label(c, "Scatter Plot", rc[1].bounds.x, rc[1].bounds.y);
  ds_scatter_plot sp2; ds_scatter_plot_init(&sp2);
  for (int i = 0; i < 20; i++) ds_scatter_plot_add(&sp2, (float)(rand() % 100), (float)(rand() % 100));
  sp2.bounds = (ds_bounds){rc[1].bounds.x, rc[1].bounds.y + 14, rc[1].bounds.w, 120};
  ds_scatter_plot_render(&sp2, c);

  render_section_label(c, "Heatmap", rc[2].bounds.x, rc[2].bounds.y);
  ds_heatmap hm; ds_heatmap_init(&hm, 4, 6);
  for (int r = 0; r < 4; r++) for (int ci = 0; ci < 6; ci++) hm.data[r][ci] = (float)(rand() % 100);
  hm.bounds = (ds_bounds){rc[2].bounds.x, rc[2].bounds.y + 14, rc[2].bounds.w, 120};
  ds_heatmap_render(&hm, c);

  render_section_label(c, "Log Viewer", rc[3].bounds.x, rc[3].bounds.y);
  ds_log_viewer lv; ds_log_viewer_init(&lv);
  ds_log_viewer_add(&lv, DS_LOG_INFO, "System initialized", "kernel");
  ds_log_viewer_add(&lv, DS_LOG_WARN, "GPU at 85% capacity", "monitor");
  ds_log_viewer_add(&lv, DS_LOG_ERROR, "OOM on device 0", "cuda");
  ds_log_viewer_add(&lv, DS_LOG_DEBUG, "Cache miss ratio 0.04", "perf");
  lv.bounds = (ds_bounds){rc[3].bounds.x, rc[3].bounds.y + 14, rc[3].bounds.w, 100};
  ds_log_viewer_render(&lv, c);

  render_section_label(c, "Marquee", rc[4].bounds.x, rc[4].bounds.y);
  ds_marquee mq; ds_marquee_init(&mq, "◆ Models loaded: Qwen3-32B  DeepSeek-V4  Mistral-7B  ◆ GPU: 82%  ◆ Uptime: 99.8%");
  mq.offset = elapsed * 60;
  mq.bounds = (ds_bounds){rc[4].bounds.x, rc[4].bounds.y + 14, rc[4].bounds.w, 0};
  ds_marquee_render(&mq, c);

  ds_canvas_fill_rect(c, 0, Hf - 20, Wf, 20, ds_colorf_hex(t->surface));
  ds_font_text(c, "  Page 3/3 — SPACE/LEFT/RIGHT to navigate", 8, Hf - 15, ds_colorf_hex(t->fg_subtle));
}

/* ─── Page 4: Retained-mode demo ─── */
static ds_container_widget* retained_root = NULL;

static void build_retained_demo(void) {
  if (retained_root) { ds_widget_destroy_tree(&retained_root->base); retained_root = NULL; }

  retained_root = ds_app_create(W, H);
  retained_root->direction = DS_DIR_COLUMN;
  retained_root->gap = 12;
  ds_widget_set_padding(&retained_root->base, 16, 16, 16, 16);

  /* Row 1: buttons */
  ds_container_widget* row1 = ds_container_create();
  row1->direction = DS_DIR_ROW; row1->gap = 8;

  ds_button* b1 = ds_button_create(DS_BTN_PRIMARY, "Primary");
  ds_widget_set_hints(&b1->base, (ds_size_hints){0,0,100,36,0,0,0,DS_SIZE_FIXED,DS_SIZE_FIXED});

  ds_button* b2 = ds_button_create(DS_BTN_ACCENT, "Accent");
  ds_widget_set_hints(&b2->base, (ds_size_hints){0,0,100,36,0,0,0,DS_SIZE_FIXED,DS_SIZE_FIXED});

  ds_button* b3 = ds_button_create(DS_BTN_OUTLINE, "Outline");
  ds_widget_set_hints(&b3->base, (ds_size_hints){0,0,100,36,0,0,0,DS_SIZE_FIXED,DS_SIZE_FIXED});

  ds_widget_add_child(&row1->base, &b1->base);
  ds_widget_add_child(&row1->base, &b2->base);
  ds_widget_add_child(&row1->base, &b3->base);

  /* Row 2: pills */
  ds_container_widget* row2 = ds_container_create();
  row2->direction = DS_DIR_ROW; row2->gap = 6;

  const char* plabels[] = {"Default","Primary","Accent","Success"};
  ds_pill_variant pvars[] = {DS_PILL_DEFAULT,DS_PILL_PRIMARY,DS_PILL_ACCENT,DS_PILL_SUCCESS};
  for (int i = 0; i < 4; i++) {
    ds_pill* p = ds_pill_create(plabels[i], pvars[i]);
    ds_widget_set_hints(&p->base, (ds_size_hints){0,0,0,0,0,0,0,DS_SIZE_CONTENT,DS_SIZE_CONTENT});
    ds_widget_add_child(&row2->base, &p->base);
  }

  /* Row 3: cards (flex row) */
  ds_container_widget* row3 = ds_container_create();
  row3->direction = DS_DIR_ROW; row3->gap = 12;

  ds_card* c1 = ds_card_create(DS_CARD_SURFACE, "Surface", "Default container");
  ds_widget_set_hints(&c1->base, (ds_size_hints){0,0,0,80,0,0,1,DS_SIZE_CONTENT,DS_SIZE_FIXED});
  ds_card* c2 = ds_card_create(DS_CARD_RAISED, "Raised", "With elevation");
  ds_widget_set_hints(&c2->base, (ds_size_hints){0,0,0,80,0,0,1,DS_SIZE_CONTENT,DS_SIZE_FIXED});
  ds_card* c3 = ds_card_create(DS_CARD_GLASS, "Glass", "Blurred backdrop");
  ds_widget_set_hints(&c3->base, (ds_size_hints){0,0,0,80,0,0,1,DS_SIZE_CONTENT,DS_SIZE_FIXED});

  ds_widget_add_child(&row3->base, &c1->base);
  ds_widget_add_child(&row3->base, &c2->base);
  ds_widget_add_child(&row3->base, &c3->base);

  /* Assemble tree */
  ds_widget_add_child(&retained_root->base, &row1->base);
  ds_widget_add_child(&retained_root->base, &row2->base);
  ds_widget_add_child(&retained_root->base, &row3->base);

  /* Layout */
  ds_widget_layout(&retained_root->base, 0, 0, W, H);
}

static void render_tree(ds_widget* w, ds_canvas* canvas) {
  if (!w) return;
  if (w->render) w->render(w, canvas);
  for (ds_widget* c = w->first_child; c; c = c->next_sibling)
    render_tree(c, canvas);
}

void render_retained(ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  ds_canvas_clear(c, ds_colorf_hex(t->page));

  if (!retained_root) build_retained_demo();

  ds_font_text(c, "Page 4/4 — Retained Mode (click buttons, hover state, auto-layout)", 12, 10, ds_colorf_hex(t->primary));
  render_tree(&retained_root->base, c);

  /* Info bar */
  char buf[128];
  snprintf(buf, sizeof(buf), "  Page 4/4 — %u widgets  |  Click buttons to test event dispatch",
    retained_root->base.child_count);
  ds_canvas_fill_rect(c, 0, H - 20, W, 20, ds_colorf_hex(t->surface));
  ds_font_text(c, buf, 8, H - 15, ds_colorf_hex(t->fg_subtle));
}

/* ─── Event routing ─── */
static int _in_bounds(ds_bounds b, float mx, float my) {
  return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
}

static void handle_mouse_move(float mx, float my) {
  state.mouse_x = mx; state.mouse_y = my;
  state.hovered_btn = -1;
  if (_in_bounds(state.btn_region, mx, my)) {
    float iw = state.btn_region.w / 6;
    int idx = (int)((mx - state.btn_region.x) / iw);
    if (idx >= 0 && idx < 6) state.hovered_btn = idx;
  }
}

static void handle_click(float mx, float my) {
  state.mouse_down = 1;
  /* Tabs */
  if (_in_bounds(state.tabs_region, mx, my)) {
    float iw = state.tabs_region.w / 4;
    int idx = (int)((mx - state.tabs_region.x) / iw);
    if (idx >= 0 && idx < 4) state.active_tab = idx;
  }
  /* Nav */
  if (_in_bounds(state.nav_region, mx, my)) {
    float iw = state.nav_region.w / 4;
    int idx = (int)((mx - state.nav_region.x) / iw);
    if (idx >= 0 && idx < 4) state.active_nav = idx;
  }
  /* Table sort */
  if (_in_bounds(state.table_region, mx, my)) {
    float col_w = state.table_region.w / 4;
    int col = (int)((mx - state.table_region.x) / col_w);
    if (col >= 0 && col < 4) ds_table_sort_by(&state.demo_table, col);
  }
  /* Input focus */
  state.focused_input = 1;
  state.toggled_count++;
}

static void handle_mouse_up() {
  state.mouse_down = 0;
}

/* ─── Main ─── */
int main(int argc, char** argv) {
  if (argc > 2) {
    std::fprintf(stderr, "Usage: %s [font.ttf]\n", argv[0]);
    return 1;
  }
  memset(&state, 0, sizeof(state));
  state.hovered_btn = -1;
  state.active_tab = 1;
  state.focused_input = 1;
  state.active_theme = 5; /* Clay, the default theme */

  SDL_Init(SDL_INIT_VIDEO);
  SDL_Window* win = SDL_CreateWindow("Displacer Native", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, W, H, SDL_WINDOW_SHOWN);
  SDL_Renderer* ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED);
  SDL_Texture* tex = SDL_CreateTexture(ren, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STREAMING, W, H);

  int running = 1, page = 0; SDL_Event ev;
  ds_canvas* canvas = ds_canvas_create(W, H);
  uint32_t start_ticks = SDL_GetTicks();

  /* An optional font comes from the command line or DISPLACER_FONT. */
  const char* font_path = argc == 2 ? argv[1] : std::getenv("DISPLACER_FONT");
  if (font_path && *font_path) {
    if (!ds_font_load_ttf(font_path, 14.0f)) {
      printf("Note: TTF font could not be loaded, using bitmap fallback\n");
    }
  }

  while (running) {
    while (SDL_PollEvent(&ev)) {
      if (ev.type == SDL_QUIT) running = 0;
      else if (ev.type == SDL_KEYDOWN) {
        if (ev.key.keysym.sym == SDLK_ESCAPE) running = 0;
        if (ev.key.keysym.sym == SDLK_SPACE || ev.key.keysym.sym == SDLK_RIGHT) page = (page + 1) % 4;
        if (ev.key.keysym.sym == SDLK_LEFT) page = (page + 3) % 4;
        if (ev.key.keysym.sym == SDLK_1) {
          ds_theme_apply(&DS_THEME_LIGHT); state.active_theme = 0;
        }
        if (ev.key.keysym.sym == SDLK_2) {
          ds_theme_apply(&DS_THEME_DARK); state.active_theme = 1;
        }
        if (ev.key.keysym.sym == SDLK_3) {
          ds_theme_apply(&DS_THEME_DARK_ARCANA); state.active_theme = 2;
        }
        if (ev.key.keysym.sym == SDLK_4) {
          ds_theme_apply(&DS_THEME_PARCHMENT); state.active_theme = 3;
        }
        if (ev.key.keysym.sym == SDLK_5) {
          ds_theme_apply(&DS_THEME_MYSTIC); state.active_theme = 4;
        }
        if (ev.key.keysym.sym == SDLK_6) {
          ds_theme_apply(&DS_THEME_CLAY); state.active_theme = 5;
        }
        if (ev.key.keysym.sym == SDLK_l) ds_lang_set((ds_lang_active() + 1) % 6);
      } else if (ev.type == SDL_MOUSEMOTION) {
        if (page == 3 && retained_root) {
          ds_event de; de.type = DS_EV_MOUSE_MOVE; de.as.mouse.x = (float)ev.motion.x; de.as.mouse.y = (float)ev.motion.y;
          ds_widget_dispatch_event(&retained_root->base, &de);
        }
        handle_mouse_move((float)ev.motion.x, (float)ev.motion.y);
      } else if (ev.type == SDL_MOUSEBUTTONDOWN) {
        if (page == 3 && retained_root) {
          ds_event de; de.type = DS_EV_MOUSE_DOWN; de.as.mouse.x = (float)ev.button.x; de.as.mouse.y = (float)ev.button.y; de.as.mouse.button = ev.button.button;
          ds_widget_dispatch_event(&retained_root->base, &de);
        }
        handle_click((float)ev.button.x, (float)ev.button.y);
      } else if (ev.type == SDL_MOUSEBUTTONUP) {
        if (page == 3 && retained_root) {
          ds_event de; de.type = DS_EV_MOUSE_UP; de.as.mouse.x = (float)ev.button.x; de.as.mouse.y = (float)ev.button.y; de.as.mouse.button = ev.button.button;
          ds_widget_dispatch_event(&retained_root->base, &de);
        }
        handle_mouse_up();
      }
    }

    if (page == 0) render_showcase(canvas);
    else if (page == 1) {
      const ds_theme* t = ds_current_theme;
      float Wf = (float)W, Hf = (float)H;
      ds_canvas_clear(canvas, ds_colorf_hex(t->page));
      ds_font_text(canvas, "Page 2/3 — Visualizations", 12, 10, ds_colorf_hex(t->primary));
      float data[50];
      for (int i = 0; i < 50; i++) data[i] = 50 + 30 * sinf(i * 0.15f) + 10 * cosf(i * 0.07f);
      ds_canvas_fill_rect(canvas, 20, 34, Wf - 40, (Hf - 60) * 0.45f, ds_colorf_hex(t->surface));
      ds_canvas_draw_rect(canvas, 20, 34, Wf - 40, (Hf - 60) * 0.45f, ds_colorf_hex(t->border_muted));
      ds_chart_plot_lines(canvas, data, 50, ds_colorf_hex(t->primary), 0, 100);
      float bd[12];
      for (int i = 0; i < 12; i++) bd[i] = 20 + (float)rand() / RAND_MAX * 60;
      float by = 40 + (Hf - 60) * 0.5f;
      ds_canvas_fill_rect(canvas, 20, by, Wf - 40, (Hf - 60) * 0.4f, ds_colorf_hex(t->surface));
      ds_canvas_draw_rect(canvas, 20, by, Wf - 40, (Hf - 60) * 0.4f, ds_colorf_hex(t->border_muted));
      ds_chart_plot_bars(canvas, bd, 12, ds_colorf_hex(t->accent), 0, 100);
    } else if (page == 2) {
      float elapsed = (SDL_GetTicks() - start_ticks) / 1000.0f;
      render_extras(canvas, elapsed);
    } else {
      render_retained(canvas);
    }

    void* pixels; int pitch;
    SDL_LockTexture(tex, NULL, &pixels, &pitch);
    uint32_t* src = ds_canvas_pixels(canvas);
    for (int y = 0; y < H; y++) memcpy((uint8_t*)pixels + y * pitch, src + y * W, W * 4);
    SDL_UnlockTexture(tex);
    SDL_RenderClear(ren); SDL_RenderCopy(ren, tex, NULL, NULL);
    SDL_RenderPresent(ren);
    SDL_Delay(16);
  }

  ds_canvas_destroy(canvas);
  SDL_DestroyTexture(tex); SDL_DestroyRenderer(ren); SDL_DestroyWindow(win);
  SDL_Quit();
  return 0;
}
