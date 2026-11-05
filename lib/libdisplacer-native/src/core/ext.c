#include "displacer/ext.h"
#include "displacer/font.h"
#include "displacer/core.h"
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

/* ─── Dialog ─── */
void ds_dialog_init(ds_dialog* dlg, const char* title, const char* body) {
  memset(dlg, 0, sizeof(*dlg)); dlg->title = title; dlg->body = body; dlg->size = DS_DIALOG_MD;
}
void ds_dialog_render(ds_dialog* dlg, ds_canvas* c) {
  if (!dlg->open) return;
  float cw = ds_canvas_width(c), ch = ds_canvas_height(c);
  float dw = dlg->size == DS_DIALOG_SM ? 280 : dlg->size == DS_DIALOG_MD ? 360 : dlg->size == DS_DIALOG_LG ? 520 : dlg->size == DS_DIALOG_XL ? 680 : cw - 40;
  float dh = dlg->size == DS_DIALOG_FULL ? ch - 40 : dlg->size == DS_DIALOG_XL ? 400 : dlg->size == DS_DIALOG_LG ? 320 : dlg->size == DS_DIALOG_MD ? 200 : 160;
  float dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  // Backdrop
  ds_canvas_fill_rect(c, 0, 0, cw, ch, ds_colorf_rgba(0, 0, 0, 0.4f));
  // Dialog box
  dlg->bounds.x = dx; dlg->bounds.y = dy; dlg->bounds.w = dw; dlg->bounds.h = dh;
  ds_canvas_fill_rounded_rect(c, dx, dy, dw, dh, 12, ds_colorf_hex(ds_current_theme->raised));
  ds_canvas_draw_rounded_rect(c, dx, dy, dw, dh, 12, 1.5f, ds_colorf_hex(ds_current_theme->border));
  // Title
  ds_font_text(c, dlg->title ? dlg->title : "Dialog", dx + 16, dy + 12, ds_colorf_hex(ds_current_theme->fg));
  // Close button
  ds_canvas_fill_rect(c, dx + dw - 24, dy + 10, 14, 14, ds_colorf_rgba(0.8f, 0.14f, 0.11f, 0.8f));
  // Body text
  if (dlg->body) ds_font_text(c, dlg->body, dx + 16, dy + 36, ds_colorf_hex(ds_current_theme->fg_muted));
}

/* ─── Input ─── */
void ds_input_init(ds_input* inp, const char* placeholder) {
  memset(inp, 0, sizeof(*inp)); inp->placeholder = placeholder; inp->size = DS_INPUT_MD; inp->variant = DS_INPUT_TEXT;
}
void ds_input_render(ds_input* inp, ds_canvas* c) {
  float x = inp->bounds.x, y = inp->bounds.y, w = inp->bounds.w ? inp->bounds.w : 200;
  float h = inp->size == DS_INPUT_SM ? 26 : inp->size == DS_INPUT_LG ? 38 : 32;
  const ds_theme* t = ds_current_theme;
  uint32_t border_col = inp->status == DS_INPUT_ERROR ? 0xcc241d : inp->status == DS_INPUT_WARN ? 0xd79921 : inp->focused ? t->primary : t->border_muted;
  // Label
  if (inp->label) ds_font_text(c, inp->label, x, y - 14, ds_colorf_hex(t->fg_muted));
  // Input box
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 6, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 6, 1.5f, ds_colorf_hex(border_col));
  // Text buffer
  if (inp->buffer[0]) {
    float tx = x + 8, ty = y + h / 2 - 4;
    ds_font_text(c, inp->buffer, tx, ty, ds_colorf_hex(t->fg));
    if (inp->focused) {
      float cx = tx + (int)inp->cursor * 5;
      ds_canvas_fill_rect(c, cx, ty, 2, 8, ds_colorf_hex(t->primary));
    }
  } else if (inp->placeholder) {
    ds_font_text(c, inp->placeholder, x + 8, y + h / 2 - 4, ds_colorf_hex(t->fg_subtle));
    if (inp->focused) ds_canvas_fill_rect(c, x + 8, y + h / 2 - 4, 2, 8, ds_colorf_hex(t->primary));
  }
  // Hint
  if (inp->hint) ds_font_text(c, inp->hint, x, y + h + 2, ds_colorf_hex(t->fg_subtle));
}
void ds_input_key(ds_input* inp, uint32_t key, uint8_t shift) {
  (void)shift;
  if (key == 8 && inp->cursor > 0) { inp->buffer[--inp->cursor] = 0; return; }
  if (key >= 32 && key <= 126 && inp->cursor < 255) { inp->buffer[inp->cursor++] = (char)key; inp->buffer[inp->cursor] = 0; }
}

/* ─── Navigation ─── */
void ds_navbar_init(ds_navbar* nav, const char** items, uint8_t count) {
  memset(nav, 0, sizeof(*nav)); nav->count = count > 8 ? 8 : count;
  for (uint8_t i = 0; i < nav->count; i++) nav->items[i] = items[i];
}
void ds_navbar_render(ds_navbar* nav, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = nav->bounds.x, y = nav->bounds.y, w = nav->bounds.w;
  float iw = w / nav->count;
  for (uint8_t i = 0; i < nav->count; i++) {
    if (!nav->items[i]) continue;
    float ix = x + i * iw;
    if (i == nav->active) ds_canvas_fill_rect(c, ix, y, iw, 36, ds_colorf_hex(t->primary));
    ds_font_text(c, nav->items[i], ix + iw / 2 - strlen(nav->items[i]) * 3.5f, y + 12, i == nav->active ? ds_colorf_hex(t->raised) : ds_colorf_hex(t->fg));
  }
  ds_canvas_fill_rect(c, x, y + 36, w, 1, ds_colorf_hex(t->border));
}
uint8_t ds_navbar_handle(ds_navbar* nav, float mx, float my) {
  if (my < nav->bounds.y || my > nav->bounds.y + 36) return 0;
  float iw = nav->bounds.w / nav->count;
  uint8_t idx = (mx - nav->bounds.x) / iw;
  if (idx < nav->count) { nav->active = idx; return 1; }
  return 0;
}

/* ─── Nav Item ─── */
void ds_nav_item_init(ds_nav_item* ni, const char* label, const char* badge, uint8_t active, uint8_t disabled){ memset(ni,0,sizeof(*ni)); ni->label=label; ni->badge=badge; ni->active=active; ni->disabled=disabled; }
void ds_nav_item_render(ds_nav_item* ni, ds_canvas* c){
  float x=ni->bounds.x,y=ni->bounds.y,w=ni->bounds.w?ni->bounds.w:160;
  const ds_theme* t=ds_current_theme;
  if(ni->active){ ds_colorf pc = ds_colorf_hex(t->primary); ds_canvas_fill_rect(c, x, y, w, 28, ds_colorf_rgba(pc.r, pc.g, pc.b, 0.12f)); }
  ds_colorf col=ni->disabled?ds_colorf_hex(t->fg_subtle):ni->active?ds_colorf_hex(t->primary):ds_colorf_hex(t->fg);
  ds_font_text(c, ni->label, x+10, y+7, col);
  if(ni->badge){ ds_canvas_fill_rect(c, x+w-((int)strlen(ni->badge)*5+12), y+6, (int)strlen(ni->badge)*5+8, 16, ds_colorf_hex(t->primary)); ds_font_text(c, ni->badge, x+w-((int)strlen(ni->badge)*5+8), y+8, ds_colorf_hex(t->raised)); }
}

/* ─── Tabs ─── */
void ds_tabs_init(ds_tabs* tabs, const char** items, uint8_t count) {
  memset(tabs, 0, sizeof(*tabs)); tabs->count = count > 8 ? 8 : count;
  for (uint8_t i = 0; i < tabs->count; i++) tabs->tabs[i] = items[i];
}
void ds_tabs_render(ds_tabs* tabs, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = tabs->bounds.x, y = tabs->bounds.y;
  float iw = tabs->bounds.w / tabs->count;
  for (uint8_t i = 0; i < tabs->count; i++) {
    if (!tabs->tabs[i]) continue;
    float ix = x + i * iw;
    if (i == tabs->active) {
      ds_canvas_fill_rect(c, ix, y + 28 - 2, iw, 2, ds_colorf_hex(t->primary));
    }
    float tx = ix + iw / 2 - strlen(tabs->tabs[i]) * 3.5f, ty = y + 8;
    ds_colorf tc = (i == tabs->active) ? ds_colorf_hex(t->primary) : ds_colorf_hex(t->fg_muted);
    if (tabs->tabs[i]) ds_font_text(c, tabs->tabs[i], tx, ty, tc);
  }
  ds_canvas_fill_rounded_rect(c, x, y + 28, tabs->bounds.w, 1, 0, ds_colorf_hex(t->border));
}
uint8_t ds_tabs_handle(ds_tabs* tabs, float mx, float my) {
  if (my < tabs->bounds.y || my > tabs->bounds.y + 28) return 0;
  float iw = tabs->bounds.w / tabs->count;
  uint8_t idx = (mx - tabs->bounds.x) / iw;
  if (idx < tabs->count) { tabs->active = idx; return 1; }
  return 0;
}

/* ─── Chat Bubble ─── */
void ds_chat_bubble_init(ds_chat_bubble* b, const char* text, ds_chat_role role) {
  memset(b, 0, sizeof(*b)); b->text = text; b->role = role;
}
void ds_chat_bubble_render(ds_chat_bubble* b, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = b->bounds.x, y = b->bounds.y, w = b->bounds.w ? b->bounds.w : 300;
  float tw = strlen(b->text ? b->text : "") * 6 + 20;
  float bw = tw > w ? w : tw;
  float bh = 20 + (strlen(b->text ? b->text : "") / 35 + 1) * 12;
  ds_colorf bg;
  if (b->role == DS_CHAT_USER) bg = ds_colorf_rgba((t->primary>>16&0xff)/255.0f, (t->primary>>8&0xff)/255.0f, (t->primary&0xff)/255.0f, 0.12f);
  else if (b->role == DS_CHAT_SYSTEM) bg = ds_colorf_rgba((t->surface_alt>>16&0xff)/255.0f, (t->surface_alt>>8&0xff)/255.0f, (t->surface_alt&0xff)/255.0f, 0.5f);
  else bg = ds_colorf_hex(t->surface);
  ds_canvas_fill_rounded_rect(c, x, y, bw, bh, 10, bg);
  if (b->role != DS_CHAT_SYSTEM) ds_canvas_draw_rounded_rect(c, x, y, bw, bh, 10, 1.5f, ds_colorf_hex(t->border));
  ds_font_text(c, b->text, x + 10, y + 8, ds_colorf_hex(t->fg));
}

/* ─── Table ─── */
void ds_table_init(ds_table* t, const char** headers, uint8_t cols) {
  memset(t, 0, sizeof(*t)); t->cols = cols > DS_TABLE_MAX_COLS ? DS_TABLE_MAX_COLS : cols;
  for (uint8_t i = 0; i < t->cols; i++) t->headers[i] = headers[i];
}
void ds_table_add_row(ds_table* t, const char** cells) {
  if (t->rows_count >= DS_TABLE_MAX_ROWS) return;
  for (uint8_t i = 0; i < t->cols && i < DS_TABLE_MAX_COLS; i++) t->rows[t->rows_count][i] = cells[i];
  t->rows_count++;
}
void ds_table_sort_by(ds_table* t, uint8_t col) {
  if (col >= t->cols) return;
  if (t->sort_col == col) {
    t->sort_dir = t->sort_dir == DS_SORT_NONE ? DS_SORT_ASC : t->sort_dir == DS_SORT_ASC ? DS_SORT_DESC : DS_SORT_NONE;
  } else {
    t->sort_col = col;
    t->sort_dir = DS_SORT_ASC;
  }
}
void ds_table_render(ds_table* t, ds_canvas* c) {
  const ds_theme* th = ds_current_theme;
  float x = t->bounds.x, y = t->bounds.y, w = t->bounds.w;
  float col_w = w / t->cols;
  // Render headers with sort indicator
  for (uint8_t i = 0; i < t->cols; i++) {
    ds_canvas_fill_rounded_rect(c, x + i * col_w, y, col_w, 24, 4, ds_colorf_hex(th->surface));
    ds_canvas_draw_rounded_rect(c, x + i * col_w, y, col_w, 24, 4, 1, ds_colorf_hex(th->border_muted));
    char hdr_buf[64];
    if (t->headers[i]) {
      snprintf(hdr_buf, sizeof(hdr_buf), "%s%s", t->headers[i], i == t->sort_col ? (t->sort_dir == DS_SORT_ASC ? " ^" : " v") : "");
      ds_font_text(c, hdr_buf, x + i * col_w + 6, y + 7, i == t->sort_col ? ds_colorf_hex(th->primary) : ds_colorf_hex(th->fg));
    }
  }
  ds_canvas_fill_rect(c, x, y + 24, w, 1, ds_colorf_hex(th->border));
  // Build sorted row indices
  uint8_t order[DS_TABLE_MAX_ROWS];
  for (uint8_t i = 0; i < t->rows_count; i++) order[i] = i;
  if (t->sort_dir != DS_SORT_NONE && t->sort_col < t->cols) {
    for (uint8_t i = 1; i < t->rows_count; i++) {
      for (uint8_t j = i; j > 0; j--) {
        const char* a = t->rows[order[j-1]][t->sort_col];
        const char* b = t->rows[order[j]][t->sort_col];
        int cmp = strcmp(a ? a : "", b ? b : "");
        if (t->sort_dir == DS_SORT_DESC) cmp = -cmp;
        if (cmp <= 0) break;
        uint8_t tmp = order[j-1]; order[j-1] = order[j]; order[j] = tmp;
      }
    }
  }
  for (uint8_t ri = 0; ri < t->rows_count; ri++) {
    uint8_t r = order[ri];
    float ry = y + 28 + ri * 20;
    if (ri % 2) ds_canvas_fill_rect(c, x, ry, w, 20, ds_colorf_rgba((th->surface_alt>>16&0xff)/255.0f, (th->surface_alt>>8&0xff)/255.0f, (th->surface_alt&0xff)/255.0f, 0.3f));
    for (uint8_t i = 0; i < t->cols; i++) {
      if (t->rows[r][i]) ds_font_text(c, t->rows[r][i], x + i * col_w + 6, ry + 5, ds_colorf_hex(th->fg));
    }
  }
}

/* ─── User Avatar ─── */
void ds_user_avatar_init(ds_user_avatar* a, const char* name) {
  memset(a, 0, sizeof(*a)); a->name = name;
}
void ds_user_avatar_render(ds_user_avatar* a, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = a->bounds.x, y = a->bounds.y;
  ds_canvas_fill_circle(c, x + 16, y + 16, 16, ds_colorf_hex(t->primary));
  if (a->name) {
    char initial[2] = {a->name[0], 0};
    ds_font_text(c, initial, x + 12, y + 12, ds_colorf_hex(t->raised));
  }
  if (a->online) ds_canvas_fill_circle(c, x + 24, y + 24, 4, ds_colorf_hex(t->semantic_success));
  if (a->name) ds_font_text(c, a->name, x + 36, y + 8, ds_colorf_hex(t->fg));
  if (a->detail) ds_font_text(c, a->detail, x + 36, y + 18, ds_colorf_hex(t->fg_muted));
}

/* ─── Filter Bar ─── */
void ds_filter_bar_init(ds_filter_bar* f) { memset(f, 0, sizeof(*f)); }
void ds_filter_bar_render(ds_filter_bar* f, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = f->bounds.x, y = f->bounds.y, w = f->bounds.w ? f->bounds.w : 200;
  ds_canvas_fill_rounded_rect(c, x, y, w, 28, 6, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, 28, 6, 1.5f, f->focused ? ds_colorf_hex(t->primary) : ds_colorf_hex(t->border));
  float tx = x + 8, ty = y + 9;
  if (f->query[0]) ds_font_text(c, f->query, tx, ty, ds_colorf_hex(t->fg));
  else ds_font_text(c, "Search...", tx, ty, ds_colorf_hex(t->fg_subtle));
}
void ds_filter_bar_key(ds_filter_bar* f, uint32_t keycode) {
  uint16_t len = strlen(f->query);
  if (keycode == 8 && len > 0) { f->query[len - 1] = 0; return; }
  if (keycode >= 32 && keycode <= 126 && len < 63) { f->query[len] = (char)keycode; f->query[len + 1] = 0; }
}

/* ─── File Dialog ─── */
void ds_file_dialog_init(ds_file_dialog* dlg) {
  memset(dlg, 0, sizeof(*dlg)); dlg->path = "."; dlg->filename = "untitled.txt";
}
void ds_file_dialog_render(ds_file_dialog* dlg, ds_canvas* c) {
  if (!dlg->open) return;
  const ds_theme* t = ds_current_theme;
  float cw = ds_canvas_width(c), ch = ds_canvas_height(c);
  ds_canvas_fill_rect(c, 0, 0, cw, ch, ds_colorf_rgba(0, 0, 0, 0.4f));
  float dw = 500, dh = 340, dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  dlg->bounds.x = dx; dlg->bounds.y = dy; dlg->bounds.w = dw; dlg->bounds.h = dh;
  ds_canvas_fill_rounded_rect(c, dx, dy, dw, dh, 12, ds_colorf_hex(t->raised));
  ds_canvas_draw_rounded_rect(c, dx, dy, dw, dh, 12, 1.5f, ds_colorf_hex(t->border));
  ds_font_text(c, dlg->filename ? dlg->filename : "Open File", dx + 16, dy + 12, ds_colorf_hex(t->fg));
  // File list (simulated)
  const char* files[] = {"documents/", "images/", "projects/", "readme.md", "main.cpp", "config.yaml", "notes.txt"};
  for (uint8_t i = 0; i < 7; i++) {
    float fy = dy + 40 + i * 28;
    ds_colorf fg = ds_colorf_hex(t->fg);
    if (i == 3) { fg = ds_colorf_hex(t->primary); ds_canvas_fill_rect(c, dx + 8, fy, dw - 16, 24, ds_colorf_rgba((t->primary>>16&0xff)/255.0f, (t->primary>>8&0xff)/255.0f, (t->primary&0xff)/255.0f, 0.1f)); }
    float fxx = dx + 16, fyy = fy + 7;
    if (files[i]) ds_font_text(c, files[i], fxx, fyy, fg);
  }
  // Close button
  ds_canvas_fill_rect(c, dx + dw - 22, dy + 8, 14, 14, ds_colorf_rgba(0.8f, 0.14f, 0.11f, 0.8f));
}
uint8_t ds_file_dialog_handle(ds_file_dialog* dlg, float mx, float my) {
  (void)dlg; (void)mx; (void)my; return 0;
}

/* ─── Bar Chart ─── */
void ds_bar_chart_init(ds_bar_chart* bc){ memset(bc,0,sizeof(*bc)); bc->height=160; }
void ds_bar_chart_add_series(ds_bar_chart* bc, const char* label, const float* values, uint32_t count){
  if(bc->series_count>=DS_BAR_MAX_SERIES)return;
  ds_bar_series* s=&bc->series[bc->series_count++];
  s->label=label; s->count=count>DS_BAR_MAX_LABELS?DS_BAR_MAX_LABELS:count;
  for(uint32_t i=0;i<s->count;i++)s->values[i]=values[i];
  s->color=ds_colorf_hex(bc->series_count==1?0xb16286:bc->series_count==2?0xd65d0e:bc->series_count==3?0x458588:0x689d6a);
}
void ds_bar_chart_render(ds_bar_chart* bc, ds_canvas* c){
  float x=bc->bounds.x,y=bc->bounds.y,w=bc->bounds.w?bc->bounds.w:300,h=bc->height;
  float pad_l=36,pad_r=12,pad_t=16,pad_b=24,cw=w-pad_l-pad_r,ch=h-pad_t-pad_b;
  const ds_theme* t=ds_current_theme;
  uint32_t n=0; for(uint32_t i=0;i<bc->series_count&&i<DS_BAR_MAX_SERIES;i++)if(bc->series[i].count>n)n=bc->series[i].count;
  float grp_w=cw/n,bar_w=grp_w*0.6f/bc->series_count;
  float max_val=0;
  for(uint32_t i=0;i<bc->series_count;i++)for(uint32_t j=0;j<bc->series[i].count;j++)if(bc->series[i].values[j]>max_val)max_val=bc->series[i].values[j];
  if(max_val<1)max_val=1;
  // Grid
  for(uint32_t i=0;i<=4;i++){float gy=pad_t+(ch/4)*i; ds_canvas_draw_line(c,(int)(x+pad_l),(int)(y+gy),(int)(x+w-pad_r),(int)(y+gy),ds_colorf_hex(t->border_muted));}
  // Bars
  for(uint32_t si=0;si<bc->series_count;si++){
    ds_bar_series* s=&bc->series[si];
    for(uint32_t vi=0;vi<s->count;vi++){
      float bx=x+pad_l+vi*grp_w+grp_w*0.2f+si*bar_w, bw=bar_w*0.85f, bar_h=(s->values[vi]/max_val)*ch;
      ds_canvas_fill_rect(c, bx, y+pad_t+ch-bar_h, bw, bar_h, s->color);
    }
  }
}

/* ─── Scatter Plot ─── */
void ds_scatter_plot_init(ds_scatter_plot* sp){ memset(sp,0,sizeof(*sp)); sp->height=160; sp->color=ds_colorf_hex(0xb16286); }
void ds_scatter_plot_add(ds_scatter_plot* sp, float px, float py){
  if(sp->count>=DS_SCATTER_MAX)return;
  sp->points[sp->count].x=px; sp->points[sp->count].y=py; sp->points[sp->count].r=4; sp->count++;
}
void ds_scatter_plot_render(ds_scatter_plot* sp, ds_canvas* c){
  float x=sp->bounds.x,y=sp->bounds.y,w=sp->bounds.w?sp->bounds.w:300,h=sp->height;
  float pad_l=36,pad_r=12,pad_t=16,pad_b=24,cw=w-pad_l-pad_r,ch=h-pad_t-pad_b;
  const ds_theme* t=ds_current_theme;
  float max_x=1,max_y=1;
  for(uint32_t i=0;i<sp->count;i++){if(sp->points[i].x>max_x)max_x=sp->points[i].x; if(sp->points[i].y>max_y)max_y=sp->points[i].y;}
  // Grid
  for(uint32_t i=0;i<=4;i++){
    float gy=pad_t+(ch/4)*i; ds_canvas_draw_line(c,(int)(x+pad_l),(int)(y+gy),(int)(x+w-pad_r),(int)(y+gy),ds_colorf_hex(t->border_muted));
    float gx=pad_l+(cw/4)*i; ds_canvas_draw_line(c,(int)(x+gx),(int)(y+pad_t),(int)(x+gx),(int)(y+h-pad_b),ds_colorf_hex(t->border_muted));
  }
  for(uint32_t i=0;i<sp->count;i++){
    float cx=x+pad_l+(sp->points[i].x/max_x)*cw, cy=y+pad_t+ch-(sp->points[i].y/max_y)*ch;
    ds_canvas_fill_circle(c, (int)cx, (int)cy, sp->points[i].r, sp->points[i].color.r>0?sp->points[i].color:sp->color);
  }
}

/* ─── Heatmap ─── */
void ds_heatmap_init(ds_heatmap* hm, uint32_t rows, uint32_t cols){ memset(hm,0,sizeof(*hm)); hm->rows=rows>DS_HEATMAP_MAX?DS_HEATMAP_MAX:rows; hm->cols=cols>DS_HEATMAP_MAX?DS_HEATMAP_MAX:cols; hm->height=160; }
void ds_heatmap_set(ds_heatmap* hm, uint32_t r, uint32_t c, float v){ if(r<hm->rows&&c<hm->cols)hm->data[r][c]=v; }
void ds_heatmap_render(ds_heatmap* hm, ds_canvas* c){
  float x=hm->bounds.x,y=hm->bounds.y,w=hm->bounds.w?hm->bounds.w:300,h=hm->height;
  float pad=16,cell_w=(w-pad*2)/hm->cols,cell_h=(h-pad*2)/hm->rows;
  float max_val=1; for(uint32_t r=0;r<hm->rows;r++)for(uint32_t ci=0;ci<hm->cols;ci++)if(hm->data[r][ci]>max_val)max_val=hm->data[r][ci];
  for(uint32_t r=0;r<hm->rows;r++)for(uint32_t ci=0;ci<hm->cols;ci++){
    float intensity=hm->data[r][ci]/max_val;
    uint8_t rv=(uint8_t)(69+intensity*(204-69)), gv=(uint8_t)(133-intensity*(133-36)), bv=(uint8_t)(134-intensity*105);
    ds_canvas_fill_rect(c, x+pad+ci*cell_w, y+pad+r*cell_h, cell_w-1, cell_h-1, ds_colorf_rgba(rv/255.0f,gv/255.0f,bv/255.0f,1));
  }
}

/* ─── Stream Chart ─── */
void ds_stream_chart_init(ds_stream_chart* sc, uint32_t max_pts){ memset(sc,0,sizeof(*sc)); sc->max_points=max_pts>DS_STREAM_MAX?DS_STREAM_MAX:max_pts; sc->vmin=0; sc->vmax=100; sc->color=ds_colorf_hex(0xb16286); sc->fill_color=ds_colorf_rgba(0.69f,0.38f,0.52f,0.08f); }
void ds_stream_chart_push(ds_stream_chart* sc, float val){
  if(sc->count<sc->max_points)sc->data[sc->count++]=val;
  else{ for(uint32_t i=1;i<sc->max_points;i++)sc->data[i-1]=sc->data[i]; sc->data[sc->max_points-1]=val; }
}
void ds_stream_chart_render(ds_stream_chart* sc, ds_canvas* c){
  float x=sc->bounds.x,y=sc->bounds.y,w=sc->bounds.w?sc->bounds.w:300,h=sc->bounds.h?sc->bounds.h:80;
  float range=sc->vmax-sc->vmin; if(range<0.001f)range=1;
  // Grid
  for(uint32_t i=0;i<=3;i++){float gy=(h/3)*i; ds_canvas_draw_line(c,(int)x,(int)(y+gy),(int)(x+w),(int)(y+gy),ds_colorf_hex(ds_current_theme->border_muted));}
  if(sc->count<2)return;
  ds_canvas_fill_rect(c, x, y, w, h, sc->fill_color);
  // Line
  for(uint32_t i=1;i<sc->count;i++){
    float x1=x+(i-1)*w/(sc->max_points-1), y1=y+h-((sc->data[i-1]-sc->vmin)/range)*h;
    float x2=x+i*w/(sc->max_points-1), y2=y+h-((sc->data[i]-sc->vmin)/range)*h;
    ds_canvas_draw_line(c, (int)x1, (int)y1, (int)x2, (int)y2, sc->color);
  }
}

/* ─── Log Viewer ─── */
void ds_log_viewer_init(ds_log_viewer* lv){ memset(lv,0,sizeof(*lv)); }
void ds_log_viewer_add(ds_log_viewer* lv, ds_log_level level, const char* msg, const char* src){
  if(lv->count>=DS_LOG_MAX){ for(uint32_t i=1;i<DS_LOG_MAX;i++)lv->entries[i-1]=lv->entries[i]; lv->count--; }
  ds_log_entry* e=&lv->entries[lv->count++]; e->level=level; e->message=msg; e->source=src;
}
void ds_log_viewer_render(ds_log_viewer* lv, ds_canvas* c){
  const ds_theme* t=ds_current_theme;
  float x=lv->bounds.x,y=lv->bounds.y,w=lv->bounds.w?lv->bounds.w:300,h=lv->bounds.h?lv->bounds.h:120;
  ds_canvas_fill_rect(c, x, y, w, h, ds_colorf_hex(t->surface));
  ds_canvas_draw_rect(c, x, y, w, h, ds_colorf_hex(t->border_muted));
  float ry=y+4;
  for(uint32_t i=0;i<lv->count&&i<20;i++){
    ds_log_entry* e=&lv->entries[i];
    const char* lvl_str=e->level==DS_LOG_ERROR?"ERR":e->level==DS_LOG_WARN?"WRN":e->level==DS_LOG_INFO?"INF":"DBG";
    uint32_t lvl_col=e->level==DS_LOG_ERROR?0xfb4934:e->level==DS_LOG_WARN?0xfabd2f:e->level==DS_LOG_INFO?0x83a598:0xa89984;
    ds_font_text(c, lvl_str, x+6, ry, ds_colorf_hex(lvl_col));
    ds_font_text(c, e->message, x+34, ry, ds_colorf_hex(t->fg));
    ry+=14; if(ry>y+h-8)break;
  }
}

/* ─── Account Card ─── */
void ds_account_card_init(ds_account_card* ac, const char* name, const char* email, const char* role){ memset(ac,0,sizeof(*ac)); ac->name=name; ac->email=email; ac->role=role; }
void ds_account_card_render(ds_account_card* ac, ds_canvas* c){
  float x=ac->bounds.x,y=ac->bounds.y,w=ac->bounds.w?ac->bounds.w:260;
  const ds_theme* t=ds_current_theme;
  ds_canvas_fill_rect(c, x, y, w, 60, ds_colorf_hex(t->surface));
  ds_canvas_draw_rect(c, x, y, w, 60, ds_colorf_hex(t->border_muted));
  // Avatar circle
  ds_canvas_fill_circle(c, (int)(x+28), (int)(y+30), 18, ds_colorf_hex(t->primary));
  char init[2]={ac->name[0],0}; ds_font_text(c, init, x+24, y+24, ds_colorf_hex(t->raised));
  ds_font_text(c, ac->name, x+54, y+16, ds_colorf_hex(t->fg));
  if(ac->email)ds_font_text(c, ac->email, x+54, y+32, ds_colorf_hex(t->fg_muted));
  if(ac->role){ ds_canvas_fill_rect(c, x+54, y+46, (int)strlen(ac->role)*5+8, 14, ds_colorf_hex(t->surface_alt)); ds_font_text(c, ac->role, x+58, y+48, ds_colorf_hex(t->fg_muted)); }
}

/* ─── Tool Window ─── */
void ds_tool_window_init(ds_tool_window* tw, const char* label){ memset(tw,0,sizeof(*tw)); tw->label=label; }
void ds_tool_window_render(ds_tool_window* tw, ds_canvas* c){
  float x=tw->bounds.x,y=tw->bounds.y,w=tw->bounds.w?tw->bounds.w:200,h=tw->bounds.h?tw->bounds.h:120;
  const ds_theme* t=ds_current_theme;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 8, 1.5f, ds_colorf_hex(t->border));
  // Title bar
  ds_canvas_fill_rect(c, x+1, y+1, w-2, 24, ds_colorf_hex(t->surface_alt));
  ds_font_text(c, tw->label, x+8, y+6, ds_colorf_hex(t->fg));
  // Body
  ds_canvas_fill_rect(c, x+1, y+25, w-2, h-26, ds_colorf_hex(t->page));
  if(tw->collapsed)ds_canvas_fill_rect(c, x+1, y+25, w-2, 0, ds_colorf_hex(t->page));
}

/* ─── Marquee ─── */
void ds_marquee_init(ds_marquee* m, const char* text){ memset(m,0,sizeof(*m)); m->text=text; m->speed=20; }
void ds_marquee_render(ds_marquee* m, ds_canvas* c){
  float x=m->bounds.x,y=m->bounds.y,w=m->bounds.w;
  ds_colorf col=ds_colorf_hex(ds_current_theme->fg_muted);
  int tw=(int)strlen(m->text)*5;
  float offset=fmodf(m->offset,w+tw);
  ds_font_text(c, m->text, x+w-offset, y, col);
  if(offset>tw)ds_font_text(c, m->text, x+w-offset+tw+48, y, col);
}
