#include "displacer/widgets.h"
#include "displacer/font.h"
#include "displacer/core.h"
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>

/* Neither constant is in ISO C; math.h omits them under a strict
   standard and MSVC needs _USE_MATH_DEFINES. vis.c guards M_PI the
   same way. */
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif
#ifndef M_PI_2
#define M_PI_2 1.57079632679489661923
#endif

/* ─── Button ─── */
static ds_colorf _btn_bg(ds_button_variant v, uint8_t h, uint8_t p) {
  const ds_theme* t = ds_current_theme;
  if (p) {
    switch (v) { case DS_BTN_PRIMARY: return ds_colorf_hex(t->primary_hover); case DS_BTN_ACCENT: return ds_colorf_hex(t->accent_hover); case DS_BTN_DANGER: return ds_colorf_hex(t->semantic_error); default: break; }
  }
  if (h) {
    switch (v) { case DS_BTN_PRIMARY: return ds_colorf_hex(t->primary_hover); case DS_BTN_ACCENT: return ds_colorf_hex(t->accent_hover); case DS_BTN_GHOST: case DS_BTN_OUTLINE: return ds_colorf_rgba((t->primary>>16&0xff)/255.0f, (t->primary>>8&0xff)/255.0f, (t->primary&0xff)/255.0f, 0.08f); case DS_BTN_DANGER: return ds_colorf_hex(t->semantic_error); case DS_BTN_LINK: return ds_colorf_hex(t->primary); default: break; }
  }
  switch (v) {
    case DS_BTN_PRIMARY: return ds_colorf_hex(t->primary); case DS_BTN_ACCENT: return ds_colorf_hex(t->accent);
    case DS_BTN_DANGER:  return ds_colorf_hex(t->semantic_error);
    default: return ds_colorf_rgba(0,0,0,0);
  }
}
static ds_colorf _btn_tc(ds_button_variant v) {
  const ds_theme* t = ds_current_theme;
  switch (v) { case DS_BTN_GHOST: case DS_BTN_OUTLINE: return ds_colorf_hex(t->fg); case DS_BTN_LINK: return ds_colorf_hex(t->primary); default: return ds_colorf_hex(t->raised); }
}
static float _btn_h(ds_button_size s) { switch(s) { case DS_BTN_SM:return 28; case DS_BTN_MD:return 36; case DS_BTN_LG:return 44; case DS_BTN_XL:return 52; } return 36; }
static float _btn_p(ds_button_size s) { switch(s) { case DS_BTN_SM:return 12; case DS_BTN_MD:return 16; case DS_BTN_LG:return 24; case DS_BTN_XL:return 32; } return 16; }

void ds_button_init(ds_button* b, ds_button_variant v, const char* t) { memset(b,0,sizeof(*b)); b->variant=v; b->size=DS_BTN_MD; b->text=t; b->base.type = DS_WIDGET_BUTTON; b->base.render = (void(*)(ds_widget*,ds_canvas*))ds_button_render; }
ds_button* ds_button_create(ds_button_variant v, const char* t) {
  ds_button* b = (ds_button*)ds_widget_alloc(DS_WIDGET_BUTTON, sizeof(ds_button));
  if (b) ds_button_init(b, v, t);
  return b;
}
void ds_button_set_bounds(ds_button* b, float x, float y, float w, float h) { b->base.bounds.x=x; b->base.bounds.y=y; b->base.bounds.w=w?w:(strlen(b->text?b->text:"")*8+_btn_p(b->size)*2); b->base.bounds.h=h?h:_btn_h(b->size); }

void ds_button_render(ds_button* b, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float h = b->base.bounds.h ? b->base.bounds.h : _btn_h(b->size);
  float w = b->base.bounds.w ? b->base.bounds.w : (strlen(b->text?b->text:"")*8+_btn_p(b->size)*2);
  float x = b->base.bounds.x, y = b->base.bounds.y;
  if ((b->base.state & DS_STATE_DISABLED)) { ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, ds_colorf_rgba(0.5f,0.5f,0.5f,0.15f)); return; }
  ds_colorf bg = _btn_bg(b->variant, (b->base.state & DS_STATE_HOVERED), (b->base.state & DS_STATE_PRESSED));
  float radius = b->size == DS_BTN_SM ? 6.0f : 8.0f;
  if (b->variant != DS_BTN_GHOST && b->variant != DS_BTN_LINK)
    ds_canvas_fill_rounded_rect(c, x, y, w, h, radius, bg);
  if (b->variant == DS_BTN_OUTLINE)
    ds_canvas_draw_rounded_rect(c, x, y, w, h, radius, 1.5f, ds_colorf_hex(t->border));
  if (b->text) {
    ds_colorf tc = _btn_tc(b->variant);
    float tx = x + w/2 - strlen(b->text)*3.5f, ty = y + h/2 - 4;
    if (b->text) ds_font_text(c, b->text, tx, ty, tc);
  }
}
uint8_t ds_button_handle(ds_button* b, float mx, float my) {
  if ((b->base.state & DS_STATE_DISABLED)) return 0;
  if (mx >= b->base.bounds.x && mx <= b->base.bounds.x + b->base.bounds.w && my >= b->base.bounds.y && my <= b->base.bounds.y + b->base.bounds.h) {
    if (b->base.on_click) b->base.on_click(b->base.userdata);
    return 1;
  }
  return 0;
}

/* ─── Label ─── */
void ds_label_init(ds_label* l, const char* t) { memset(l,0,sizeof(*l)); l->text=t; l->size=14; l->color=ds_colorf_hex(ds_current_theme->fg); }
void ds_label_render(ds_label* l, ds_canvas* c) {
  if (!l->text) return;
  float x = l->base.bounds.x, y = l->base.bounds.y;
  if (l->text) ds_font_text(c, l->text, x, y, l->color);
}

/* ─── Card ─── */
void ds_card_init(ds_card* card, ds_card_variant var, const char* t, const char* b) { memset(card,0,sizeof(*card)); card->variant=var; card->title=t; card->body=b; card->base.type = DS_WIDGET_CARD; card->base.render = (void(*)(ds_widget*,ds_canvas*))ds_card_render; }
ds_card* ds_card_create(ds_card_variant var, const char* t, const char* b) {
  ds_card* c = (ds_card*)ds_widget_alloc(DS_WIDGET_CARD, sizeof(ds_card));
  if (c) ds_card_init(c, var, t, b);
  return c;
}
void ds_card_render(ds_card* card, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = card->base.bounds.x, y = card->base.bounds.y, w = card->base.bounds.w, h = card->base.bounds.h;
  ds_colorf bg;
  switch (card->variant) {
    case DS_CARD_SURFACE: bg = ds_colorf_hex(t->surface); break;
    case DS_CARD_RAISED:  bg = ds_colorf_hex(t->raised); break;
    case DS_CARD_GLASS:   bg = ds_colorf_rgba((t->surface>>16&0xff)/255.0f, (t->surface>>8&0xff)/255.0f, (t->surface&0xff)/255.0f, 0.7f); break;
    default: bg = ds_colorf_rgba(0,0,0,0);
  }
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, bg);
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 8, 1.5f, ds_colorf_hex(t->border));
  if (card->title) ds_font_text(c, card->title, x + 10, y + 8, ds_colorf_hex(t->fg));
  if (card->body) ds_font_text(c, card->body, x + 10, y + 22, ds_colorf_hex(t->fg_muted));
}

/* ─── Pill ─── */
static uint32_t _pill_border(ds_pill_variant v) {
  const ds_theme* t = ds_current_theme;
  switch(v){case DS_PILL_PRIMARY:return t->primary;case DS_PILL_ACCENT:return t->accent;case DS_PILL_SUCCESS:return t->semantic_success;case DS_PILL_WARN:return t->semantic_warning;case DS_PILL_ERROR:return t->semantic_error;case DS_PILL_INFO:return t->semantic_info;default:return t->border_muted;}
}
void ds_pill_init(ds_pill* p, const char* text, ds_pill_variant var) { memset(p,0,sizeof(*p)); p->text=text; p->variant=var; }
ds_pill* ds_pill_create(const char* text, ds_pill_variant var) {
  ds_pill* p = (ds_pill*)ds_widget_alloc(DS_WIDGET_PILL, sizeof(ds_pill));
  if (p) ds_pill_init(p, text, var);
  return p;
}
void ds_pill_render(ds_pill* p, ds_canvas* c) {
  uint32_t bcol = _pill_border(p->variant);
  float x = p->base.bounds.x, y = p->base.bounds.y;
  uint8_t len = p->text ? strlen(p->text) : 0;
  float pw = len * 6 + 14, ph = 18;
  ds_canvas_fill_rounded_rect(c, x, y, pw, ph, 9, ds_colorf_rgba((bcol>>16&0xff)/255.0f, (bcol>>8&0xff)/255.0f, (bcol&0xff)/255.0f, 0.12f));
  ds_canvas_draw_rounded_rect(c, x, y, pw, ph, 9, 1.5f, ds_colorf_hex(bcol));
  if (p->text) ds_font_text(c, p->text, x + 7, y + 5, ds_colorf_hex(bcol));
}

/* ─── Metric ─── */
void ds_metric_init(ds_metric* m, const char* l, const char* v) { memset(m,0,sizeof(*m)); m->label=l; m->value=v; }
void ds_metric_render(ds_metric* m, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = m->base.bounds.x, y = m->base.bounds.y, w = m->base.bounds.w ? m->base.bounds.w : 140, h = m->base.bounds.h ? m->base.bounds.h : 60;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 8, 1.5f, ds_colorf_hex(t->border));
  ds_font_text(c, m->label, x + 10, y + 8, ds_colorf_hex(t->fg_muted));
  if (m->value) ds_font_text(c, m->value, x + 10, y + 26, ds_colorf_hex(t->fg));
  if (m->trend) ds_font_text(c, m->trend, x + w - strlen(m->trend) * 5 - 10, y + 26, m->trend_up ? ds_colorf_hex(t->semantic_success) : ds_colorf_hex(t->semantic_error));
}

/* ─── Progress ─── */
void ds_progress_init(ds_progress* p, float v, float m) { memset(p,0,sizeof(*p)); p->value=v; p->max=m; p->color=ds_colorf_hex(ds_current_theme->primary); }
void ds_progress_render(ds_progress* p, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = p->base.bounds.x, y = p->base.bounds.y, w = p->base.bounds.w, h = p->base.bounds.h ? p->base.bounds.h : 8;
  float pct = p->max > 0 ? p->value / p->max : 0; if (pct > 1) pct = 1;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 4, ds_colorf_hex(t->border_muted));
  ds_canvas_fill_rounded_rect(c, x, y, w * pct, h, 4, p->color.r > 0 || p->color.g > 0 || p->color.b > 0 ? p->color : ds_colorf_hex(t->primary));
}

/* ─── Toast ─── */
void ds_toast_init(ds_toast* t, const char* msg, ds_toast_variant var) { memset(t,0,sizeof(*t)); t->message=msg; t->variant=var; }
void ds_toast_render(ds_toast* t, ds_canvas* c) {
  const ds_theme* th = ds_current_theme;
  float x = t->base.bounds.x, y = t->base.bounds.y;
  uint8_t len = t->message ? strlen(t->message) : 0;
  float tw = len * 5 + 36, th_p = 28;
  uint32_t col = t->variant == DS_TOAST_SUCCESS ? th->semantic_success : t->variant == DS_TOAST_WARN ? th->semantic_warning : t->variant == DS_TOAST_ERROR ? th->semantic_error : th->semantic_info;
  ds_canvas_fill_rounded_rect(c, x, y, tw, th_p, 6, ds_colorf_hex(th->surface));
  ds_canvas_draw_rounded_rect(c, x, y, tw, th_p, 6, 1.5f, ds_colorf_hex(col));
  if (t->message) ds_font_text(c, t->message, x + 12, y + 8, ds_colorf_hex(col));
}

/* ─── Menu ─── */
void ds_menu_init(ds_menu* m, const char** items, uint8_t count) { memset(m,0,sizeof(*m)); for(uint8_t i=0;i<count&&i<8;i++)m->items[i]=items[i]; m->count=count; }
void ds_menu_render(ds_menu* m, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = m->base.bounds.x, y = m->base.bounds.y, w = m->base.bounds.w ? m->base.bounds.w : 160;
  ds_canvas_fill_rounded_rect(c, x, y, w, m->count * 28 + 8, 6, ds_colorf_hex(t->raised));
  ds_canvas_draw_rounded_rect(c, x, y, w, m->count * 28 + 8, 6, 1.5f, ds_colorf_hex(t->border));
  for (uint8_t i = 0; i < m->count; i++) {
    float iy = y + 4 + i * 28;
    if (i == m->selected) ds_canvas_fill_rect(c, x + 2, iy, w - 4, 24, ds_colorf_hex(t->primary));
    ds_font_text(c, m->items[i], x + 12, iy + 7, i == m->selected ? ds_colorf_hex(t->raised) : ds_colorf_hex(t->fg));
  }
}
uint8_t ds_menu_handle(ds_menu* m, float mx, float my) {
  if (mx < m->base.bounds.x || mx > m->base.bounds.x + m->base.bounds.w || my < m->base.bounds.y || my > m->base.bounds.y + m->base.bounds.h) return 0;
  uint8_t idx = (uint8_t)((my - m->base.bounds.y - 4) / 28);
  if (idx < m->count) { m->selected = idx; return 1; }
  return 0;
}

/* ─── Container ─── */
void ds_container_legacy_init(ds_container_legacy* con, float x, float y, float w, float h) { memset(con,0,sizeof(*con)); con->base.bounds.x=x; con->base.bounds.y=y; con->base.bounds.w=w; con->base.bounds.h=h; con->bg=ds_colorf_hex(ds_current_theme->surface); con->padding=8; }
void ds_container_legacy_render(ds_container_legacy* con, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  ds_canvas_fill_rounded_rect(c, con->base.bounds.x, con->base.bounds.y, con->base.bounds.w, con->base.bounds.h, 8, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, con->base.bounds.x, con->base.bounds.y, con->base.bounds.w, con->base.bounds.h, 8, 1.5f, ds_colorf_hex(t->border));
}

/* ─── Stat Card ─── */
void ds_stat_card_init(ds_stat_card* s, const char* l, const char* v, const char* ic) { memset(s,0,sizeof(*s)); s->label=l; s->value=v; s->icon=ic; s->accent=ds_colorf_hex(ds_current_theme->primary); }
void ds_stat_card_render(ds_stat_card* s, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float x = s->base.bounds.x, y = s->base.bounds.y, w = s->base.bounds.w ? s->base.bounds.w : 160, h = s->base.bounds.h ? s->base.bounds.h : 60;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 8, 1.5f, ds_colorf_hex(t->border));
  ds_canvas_fill_rect(c, x + 10, y + 10, 30, 30, ds_colorf_rgba(s->accent.r*0.12f, s->accent.g*0.12f, s->accent.b*0.12f, 1));
  if (s->value) ds_font_text(c, s->value, x + 48, y + 14, ds_colorf_hex(t->fg));
  if (s->label) ds_font_text(c, s->label, x + 48, y + 30, ds_colorf_hex(t->fg_muted));
}

/* ─── Sparkline ─── */
void ds_sparkline_init(ds_sparkline* s, const float* data, uint32_t count) { memset(s,0,sizeof(*s)); s->data=(float*)data; s->count=count; s->color=ds_colorf_hex(ds_current_theme->primary); }
void ds_sparkline_render(ds_sparkline* s, ds_canvas* c) {
  if (!s->data || s->count < 2) return;
  float x=s->base.bounds.x, y=s->base.bounds.y, w=s->base.bounds.w, h=s->base.bounds.h;
  float mn=s->data[0], mx=s->data[0];
  for (uint32_t i=1;i<s->count;i++){ if(s->data[i]<mn)mn=s->data[i]; if(s->data[i]>mx)mx=s->data[i]; }
  float rng=mx-mn; if(rng<0.001f)rng=1;
  for (uint32_t i=1;i<s->count;i++){
    float x1=x+(i-1)*w/(s->count-1), y1=y+h-((s->data[i-1]-mn)/rng)*h;
    float x2=x+i*w/(s->count-1), y2=y+h-((s->data[i]-mn)/rng)*h;
    ds_canvas_draw_line(c, (int)x1, (int)y1, (int)x2, (int)y2, s->color);
  }
}

/* ─── Gauge ─── */
void ds_gauge_init(ds_gauge* g, float val, float max, const char* label){ memset(g,0,sizeof(*g)); g->value=val; g->max=max; g->label=label; g->color=ds_colorf_hex(ds_current_theme->primary); g->size=80; }
void ds_gauge_render(ds_gauge* g, ds_canvas* c) {
  const ds_theme* t = ds_current_theme;
  float sz=g->size, x=g->base.bounds.x, y=g->base.bounds.y;
  float cx=x+sz/2, cy=y+sz/2, r=sz*0.4f;
  float pct=g->max>0?(g->value/g->max):0; if(pct>1)pct=1;
  ds_canvas_draw_circle(c, cx, cy, r, ds_colorf_hex(t->border_muted), 4);
  int segs=20; float a_start=-M_PI_2, a_end=a_start+pct*2*M_PI;
  for(int i=0;i<segs;i++){
    float a1=a_start+(a_end-a_start)*i/segs;
    float a2=a_start+(a_end-a_start)*(i+1)/segs;
    float x1=cx+cosf(a1)*(r-2), y1=cy+sinf(a1)*(r-2);
    float x2=cx+cosf(a2)*(r-2), y2=cy+sinf(a2)*(r-2);
    ds_canvas_draw_line(c, (int)x1, (int)y1, (int)x2, (int)y2, g->color);
  }
  char buf[16]; snprintf(buf, sizeof(buf), "%.0f%%", pct*100);
  ds_font_text(c, buf, x+sz/2-strlen(buf)*3.5f, y+sz/2-4, ds_colorf_hex(t->fg));
}

/* ─── Status Bar ─── */
void ds_status_bar_init(ds_status_bar* s, float x, float y, float w){ memset(s,0,sizeof(*s)); s->base.bounds=(ds_bounds){x,y,w,24}; s->bg=ds_colorf_hex(ds_current_theme->surface); }
void ds_status_bar_render(ds_status_bar* s, ds_canvas* c){
  ds_canvas_fill_rect(c, s->base.bounds.x, s->base.bounds.y, s->base.bounds.w, s->base.bounds.h, ds_colorf_hex(ds_current_theme->surface));
  ds_canvas_draw_rect(c, s->base.bounds.x, s->base.bounds.y, s->base.bounds.w, s->base.bounds.h, ds_colorf_hex(ds_current_theme->border_muted));
}

/* ─── Typing Indicator ─── */
void ds_typing_init(ds_typing* t){ memset(t,0,sizeof(*t)); }
void ds_typing_render(ds_typing* t, ds_canvas* c){
  float x=t->base.bounds.x, y=t->base.bounds.y+6;
  ds_colorf col=ds_colorf_hex(ds_current_theme->primary);
  for(int i=0;i<3;i++){
    float ox=sinf(t->elapsed*3+i*2)*2;
    ds_canvas_fill_circle(c, (int)(x+i*12+ox), (int)y, 3, ds_colorf_rgba(col.r,col.g,col.b,0.5f+ox*0.25f));
  }
}

/* ─── Model Badge ─── */
void ds_model_badge_init(ds_model_badge* b, const char* model, const char* quant, uint32_t ctx, ds_model_status st){ memset(b,0,sizeof(*b)); b->model=model; b->quant=quant; b->context=ctx; b->status=st; }
void ds_model_badge_render(ds_model_badge* b, ds_canvas* c){
  const ds_theme* t = ds_current_theme;
  float x=b->base.bounds.x, y=b->base.bounds.y;
  uint32_t dot_col= b->status==DS_MODEL_BUSY?t->semantic_warning: b->status==DS_MODEL_ERROR?t->semantic_error:t->semantic_success;
  uint32_t len=strlen(b->model)+(b->quant?strlen(b->quant):0)+6;
  float w=len*5+24;
  ds_canvas_fill_rounded_rect(c, x, y, w, 18, 6, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, 18, 6, 1.5f, ds_colorf_hex(t->border_muted));
  ds_canvas_fill_circle(c, x+8, y+9, 3, ds_colorf_hex(dot_col));
  ds_font_text(c, b->model, x+14, y+4, ds_colorf_hex(t->fg));
  if(b->quant){ ds_font_text(c, b->quant, x+14+(int)strlen(b->model)*5+4, y+4, ds_colorf_hex(t->fg_muted)); }
}

/* ─── Menu Item ─── */
void ds_menu_item_init(ds_menu_item* mi, const char* label, const char* shortcut, uint8_t danger){ memset(mi,0,sizeof(*mi)); mi->label=label; mi->shortcut=shortcut; mi->danger=danger; }
void ds_menu_item_render(ds_menu_item* mi, ds_canvas* c){
  float x=mi->base.bounds.x,y=mi->base.bounds.y,w=mi->base.bounds.w?mi->base.bounds.w:200;
  const ds_theme* t=ds_current_theme;
  ds_canvas_fill_rect(c, x, y, w, 24, ds_colorf_hex(t->surface));
  ds_colorf col=mi->danger?ds_colorf_hex(t->semantic_error):ds_colorf_hex(t->fg);
  ds_font_text(c, mi->label, x+8, y+6, col);
  if(mi->shortcut)ds_font_text(c, mi->shortcut, x+w-(int)strlen(mi->shortcut)*5-8, y+6, ds_colorf_hex(t->fg_muted));
}

/* ─── View ─── */
void ds_view_init(ds_view* v, const char* label, const char* icon){ memset(v,0,sizeof(*v)); v->label=label; v->icon=icon; }
void ds_view_render(ds_view* v, ds_canvas* c){
  float x=v->base.bounds.x,y=v->base.bounds.y,w=v->base.bounds.w?v->base.bounds.w:200,h=v->base.bounds.h?v->base.bounds.h:100;
  const ds_theme* t=ds_current_theme;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, ds_colorf_hex(t->surface));
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 8, 1.5f, ds_colorf_hex(t->border));
  ds_canvas_fill_rect(c, x+1, y+1, w-2, 22, ds_colorf_hex(t->surface_alt));
  ds_font_text(c, v->label, x+8, y+6, ds_colorf_hex(t->fg));
}

/* ─── Scroll View ─── */
void ds_scroll_view_init(ds_scroll_view* sv, float x, float y, float w, float h){ memset(sv,0,sizeof(*sv)); sv->base.bounds=(ds_bounds){x,y,w,h}; }
void ds_scroll_view_begin(ds_scroll_view* sv, ds_canvas* c){
  ds_canvas_fill_rounded_rect(c, sv->base.bounds.x, sv->base.bounds.y, sv->base.bounds.w, sv->base.bounds.h, 8, ds_colorf_hex(ds_current_theme->page));
  ds_canvas_draw_rounded_rect(c, sv->base.bounds.x, sv->base.bounds.y, sv->base.bounds.w, sv->base.bounds.h, 8, 1.5f, ds_colorf_hex(ds_current_theme->border_muted));
}
void ds_scroll_view_end(ds_scroll_view* sv, ds_canvas* c){
  (void)sv; (void)c;
}

/* ───────── Audio controls ───────── */
static float _ds_clampf(float v, float lo, float hi){ return v<lo?lo:(v>hi?hi:v); }

void ds_knob_init(ds_knob* k, float value, float min, float max, const char* label){
  memset(k,0,sizeof(*k)); k->value=value; k->min=min; k->max=max; k->label=label; k->unit=NULL; k->size=0;
}
void ds_knob_render(ds_knob* k, ds_canvas* c){
  const ds_theme* t = ds_current_theme;
  float sz = k->size>0?k->size:60.0f;
  float x = k->base.bounds.x, y = k->base.bounds.y;
  float cx = x+sz/2, cy = y+sz/2, r = sz*0.40f;
  float norm = k->max>k->min ? (k->value-k->min)/(k->max-k->min) : 0.0f;
  norm = _ds_clampf(norm,0,1);
  float a0 = -225.0f*(float)M_PI/180.0f, a1 = 45.0f*(float)M_PI/180.0f;
  float ang = a0 + (a1-a0)*norm;
  int segs = 24;
  for(int i=0;i<segs;i++){
    float t0=a0+(a1-a0)*i/segs, t1=a0+(a1-a0)*(i+1)/segs;
    ds_canvas_draw_line(c,(int)(cx+cosf(t0)*r),(int)(cy+sinf(t0)*r),
                          (int)(cx+cosf(t1)*r),(int)(cy+sinf(t1)*r), ds_colorf_hex(t->border_muted));
  }
  int fsegs = (int)(segs*norm);
  for(int i=0;i<fsegs;i++){
    float t0=a0+(a1-a0)*i/segs, t1=a0+(a1-a0)*(i+1)/segs;
    ds_canvas_draw_line(c,(int)(cx+cosf(t0)*r),(int)(cy+sinf(t0)*r),
                          (int)(cx+cosf(t1)*r),(int)(cy+sinf(t1)*r), ds_colorf_hex(t->primary));
  }
  ds_canvas_stroke_line(c, cx, cy, cx+cosf(ang)*(r-3), cy+sinf(ang)*(r-3), 2.0f, ds_colorf_hex(t->fg));
  if(k->label) ds_font_text(c, k->label, x+sz/2 - (float)strlen(k->label)*3.0f, y+sz+2, ds_colorf_hex(t->fg_muted));
  char buf[24];
  if(k->unit) snprintf(buf,sizeof(buf),"%.2f %s", k->value, k->unit);
  else snprintf(buf,sizeof(buf),"%.2f", k->value);
  ds_font_text(c, buf, x+sz/2 - (float)strlen(buf)*3.0f, y+sz+14, ds_colorf_hex(t->primary));
}
float ds_knob_drag(ds_knob* k, float dy){
  float span = k->max-k->min;
  k->value = _ds_clampf(k->value + (dy/160.0f)*span, k->min, k->max);
  return k->value;
}

void ds_fader_init(ds_fader* f, float value, float min, float max, int vertical){
  memset(f,0,sizeof(*f)); f->value=value; f->min=min; f->max=max; f->vertical=vertical;
}
void ds_fader_render(ds_fader* f, ds_canvas* c){
  const ds_theme* t = ds_current_theme;
  float x=f->base.bounds.x, y=f->base.bounds.y, w=f->base.bounds.w, h=f->base.bounds.h;
  float norm = f->max>f->min ? _ds_clampf((f->value-f->min)/(f->max-f->min),0,1) : 0.0f;
  if(f->vertical){
    float tx = x+w/2-3;
    ds_canvas_fill_rounded_rect(c, tx, y, 6, h, 3, ds_colorf_hex(t->border));
    float fh = h*norm;
    ds_canvas_fill_rounded_rect(c, tx, y+h-fh, 6, fh, 3, ds_colorf_hex(t->primary));
    ds_canvas_fill_circle(c, x+w/2, y+h-fh, 8, ds_colorf_hex(t->fg));
  } else {
    float ty = y+h/2-3;
    ds_canvas_fill_rounded_rect(c, x, ty, w, 6, 3, ds_colorf_hex(t->border));
    ds_canvas_fill_rounded_rect(c, x, ty, w*norm, 6, 3, ds_colorf_hex(t->primary));
    ds_canvas_fill_circle(c, x+w*norm, y+h/2, 8, ds_colorf_hex(t->fg));
  }
}
float ds_fader_value_at(ds_fader* f, float mx, float my){
  float x=f->base.bounds.x, y=f->base.bounds.y, w=f->base.bounds.w, h=f->base.bounds.h;
  float norm = f->vertical ? 1.0f-(my-y)/h : (mx-x)/w;
  norm = _ds_clampf(norm,0,1);
  f->value = f->min + norm*(f->max-f->min);
  return f->value;
}

void ds_meter_init(ds_meter* m, int vertical){ memset(m,0,sizeof(*m)); m->value=0; m->peak=-1; m->vertical=vertical; }
void ds_meter_render(ds_meter* m, ds_canvas* c){
  const ds_theme* t = ds_current_theme;
  float x=m->base.bounds.x, y=m->base.bounds.y, w=m->base.bounds.w, h=m->base.bounds.h;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 3, ds_colorf_hex(t->surface_alt));
  float v = _ds_clampf(m->value,0,1);
  ds_colorf green=ds_colorf_hex(t->semantic_success), amber=ds_colorf_hex(t->semantic_warning), red=ds_colorf_hex(t->semantic_error);
  if(m->vertical){
    float base=y+h;
    float g=_ds_clampf(v,0,0.60f), a=_ds_clampf(v,0.60f,0.82f), r=_ds_clampf(v,0.82f,1.0f);
    if(g>0)      ds_canvas_fill_rect(c, x+1, base-g*h, w-2, g*h, green);
    if(v>0.60f)  ds_canvas_fill_rect(c, x+1, base-a*h, w-2, (a-0.60f)*h, amber);
    if(v>0.82f)  ds_canvas_fill_rect(c, x+1, base-r*h, w-2, (r-0.82f)*h, red);
    if(m->peak>=0){ float py=base-_ds_clampf(m->peak,0,1)*h; ds_canvas_fill_rect(c, x+1, py-1, w-2, 2, ds_colorf_hex(t->fg)); }
  } else {
    float g=_ds_clampf(v,0,0.60f), a=_ds_clampf(v,0.60f,0.82f), r=_ds_clampf(v,0.82f,1.0f);
    if(g>0)      ds_canvas_fill_rect(c, x, y+1, g*w, h-2, green);
    if(v>0.60f)  ds_canvas_fill_rect(c, x+0.60f*w, y+1, (a-0.60f)*w, h-2, amber);
    if(v>0.82f)  ds_canvas_fill_rect(c, x+0.82f*w, y+1, (r-0.82f)*w, h-2, red);
    if(m->peak>=0){ float px=x+_ds_clampf(m->peak,0,1)*w; ds_canvas_fill_rect(c, px-1, y+1, 2, h-2, ds_colorf_hex(t->fg)); }
  }
}

void ds_xy_pad_init(ds_xy_pad* p, float x, float y){ memset(p,0,sizeof(*p)); p->x=x; p->y=y; p->grid=1; }
void ds_xy_pad_render(ds_xy_pad* p, ds_canvas* c){
  const ds_theme* t = ds_current_theme;
  float x=p->base.bounds.x, y=p->base.bounds.y, w=p->base.bounds.w, h=p->base.bounds.h;
  ds_canvas_fill_rounded_rect(c, x, y, w, h, 8, ds_colorf_hex(t->page));
  ds_canvas_draw_rounded_rect(c, x, y, w, h, 8, 1.5f, ds_colorf_hex(t->border));
  if(p->grid){
    ds_canvas_draw_line(c,(int)(x+w/2),(int)y,(int)(x+w/2),(int)(y+h), ds_colorf_hex(t->border_muted));
    ds_canvas_draw_line(c,(int)x,(int)(y+h/2),(int)(x+w),(int)(y+h/2), ds_colorf_hex(t->border_muted));
  }
  float hx = x + _ds_clampf(p->x,0,1)*w;
  float hy = y + (1.0f-_ds_clampf(p->y,0,1))*h;
  ds_canvas_fill_circle(c, hx, hy, 11, ds_colorf_rgba((t->accent>>16&0xff)/255.0f,(t->accent>>8&0xff)/255.0f,(t->accent&0xff)/255.0f,0.25f));
  ds_canvas_fill_circle(c, hx, hy, 7, ds_colorf_hex(t->accent));
}
void ds_xy_pad_set_from(ds_xy_pad* p, float mx, float my){
  float x=p->base.bounds.x, y=p->base.bounds.y, w=p->base.bounds.w, h=p->base.bounds.h;
  p->x = _ds_clampf((mx-x)/w,0,1);
  p->y = _ds_clampf(1.0f-(my-y)/h,0,1);
}
