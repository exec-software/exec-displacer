#ifndef DISPLACER_VIS_H
#define DISPLACER_VIS_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ───────── 2D Geometry ───────── */
typedef struct { float x, y; } ds_point2;

typedef struct {
  ds_point2 min, max;
} ds_rect;

ds_rect ds_rect_xywh(float x, float y, float w, float h);
ds_rect ds_rect_pts(ds_point2 a, ds_point2 b);
bool ds_rect_contains(ds_rect r, ds_point2 p);

/* Bounds — positioned size used by all widgets */
typedef struct { float x, y, w, h; } ds_bounds;

/* ───────── Path ───────── */
typedef struct ds_path ds_path;

ds_path* ds_path_create(void);
void ds_path_destroy(ds_path* p);
void ds_path_move_to(ds_path* p, float x, float y);
void ds_path_line_to(ds_path* p, float x, float y);
void ds_path_quad_to(ds_path* p, float cx, float cy, float x, float y);
void ds_path_cubic_to(ds_path* p, float c1x, float c1y, float c2x, float c2y, float x, float y);
void ds_path_close(ds_path* p);

typedef enum { DS_LINEAR, DS_RADIAL } ds_gradient_type;

/* ───────── Color & Gradient ───────── */
typedef struct {
  float r, g, b, a;
} ds_colorf;

ds_colorf ds_colorf_rgba(float r, float g, float b, float a);
ds_colorf ds_colorf_hex(uint32_t hex);

typedef struct {
  float offset;
  ds_colorf color;
} ds_gradient_stop;

typedef struct ds_gradient ds_gradient;

ds_gradient* ds_gradient_create_linear(float x1, float y1, float x2, float y2);
ds_gradient* ds_gradient_create_radial(float cx, float cy, float r);
void ds_gradient_add_stop(ds_gradient* g, float offset, ds_colorf color);
void ds_gradient_destroy(ds_gradient* g);

/* ───────── Canvas (software renderer) ───────── */
typedef struct ds_canvas ds_canvas;

ds_canvas* ds_canvas_create(uint32_t width, uint32_t height);
void ds_canvas_destroy(ds_canvas* c);
void ds_canvas_clear(ds_canvas* c, ds_colorf color);
void ds_canvas_stroke_path(ds_canvas* c, ds_path* path, ds_colorf color, float width);
void ds_canvas_fill_path(ds_canvas* c, ds_path* path, ds_colorf color);
void ds_canvas_fill_gradient(ds_canvas* c, ds_path* path, ds_gradient* grad);
void ds_canvas_draw_rect(ds_canvas* c, float x, float y, float w, float h, ds_colorf color);
void ds_canvas_fill_rect(ds_canvas* c, float x, float y, float w, float h, ds_colorf color);
/* Anti-aliased line segment with round caps and float-coordinate positioning. */
void ds_canvas_stroke_line(ds_canvas* c, float x1, float y1, float x2, float y2, float width, ds_colorf color);
/* Legacy integer-coordinate one-pixel line. */
void ds_canvas_draw_line(ds_canvas* c, int x1, int y1, int x2, int y2, ds_colorf color);
void ds_canvas_draw_circle(ds_canvas* c, float cx, float cy, float r, ds_colorf color, float width);
void ds_canvas_fill_circle(ds_canvas* c, float cx, float cy, float r, ds_colorf color);
void ds_canvas_draw_text(ds_canvas* c, const char* text, float x, float y, ds_colorf color, float size);

/* Rounded rectangles with anti-aliased corners */
void ds_canvas_fill_rounded_rect(ds_canvas* c, float x, float y, float w, float h, float r, ds_colorf color);
void ds_canvas_draw_rounded_rect(ds_canvas* c, float x, float y, float w, float h, float r, float border_w, ds_colorf color);

/* Gradient fill over a rect */
void ds_canvas_fill_gradient_rect(ds_canvas* c, float x, float y, float w, float h, ds_gradient* grad);

/* Box shadow */
void ds_canvas_draw_shadow(ds_canvas* c, float x, float y, float w, float h, float r, float blur, float ox, float oy, ds_colorf color);

uint32_t* ds_canvas_pixels(ds_canvas* c);
uint32_t ds_canvas_width(ds_canvas* c);
uint32_t ds_canvas_height(ds_canvas* c);

/* ───────── Chart Helpers ───────── */
void ds_chart_plot_lines(ds_canvas* c, const float* data, uint32_t count, ds_colorf color, float min, float max);
void ds_chart_plot_bars(ds_canvas* c, const float* data, uint32_t count, ds_colorf color, float min, float max);
void ds_chart_draw_grid(ds_canvas* c, uint32_t cols, uint32_t rows, ds_colorf color);

#ifdef __cplusplus
}
#endif

#endif /* DISPLACER_VIS_H */
