#include "displacer/vis.h"
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
#include <float.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* ─── Rect ─── */
ds_rect ds_rect_xywh(float x, float y, float w, float h) {
  ds_rect r = {{x, y}, {x + w, y + h}}; return r;
}
ds_rect ds_rect_pts(ds_point2 a, ds_point2 b) {
  ds_rect r = {a, b}; return r;
}
bool ds_rect_contains(ds_rect r, ds_point2 p) {
  return p.x >= r.min.x && p.x <= r.max.x && p.y >= r.min.y && p.y <= r.max.y;
}

/* ─── Color ─── */
ds_colorf ds_colorf_rgba(float r, float g, float b, float a) {
  ds_colorf c = {r, g, b, a}; return c;
}
ds_colorf ds_colorf_hex(uint32_t hex) {
  return ds_colorf_rgba(((hex>>16)&0xFF)/255.0f, ((hex>>8)&0xFF)/255.0f, (hex&0xFF)/255.0f, 1.0f);
}

/* ─── Path ─── */
typedef enum { MOVE, LINE, QUAD, CUBIC, CLOSE } ds_cmd;

typedef struct {
  ds_cmd cmd;
  float pts[6];
} ds_path_seg;

struct ds_path {
  ds_path_seg* segs;
  uint32_t count, cap;
};

ds_path* ds_path_create(void) {
  ds_path* p = calloc(1, sizeof(ds_path));
  if (p) { p->cap = 16; p->segs = malloc(p->cap * sizeof(ds_path_seg)); }
  return p;
}
void ds_path_destroy(ds_path* p) { if (p) { free(p->segs); free(p); } }

static void _add(ds_path* p, ds_cmd cmd, float a, float b, float c, float d, float e, float f) {
  if (p->count >= p->cap) { p->cap *= 2; p->segs = realloc(p->segs, p->cap * sizeof(ds_path_seg)); }
  ds_path_seg seg = {cmd, {a, b, c, d, e, f}};
  p->segs[p->count++] = seg;
}
void ds_path_move_to(ds_path* p, float x, float y) { _add(p, MOVE, x, y, 0,0,0,0); }
void ds_path_line_to(ds_path* p, float x, float y) { _add(p, LINE, x, y, 0,0,0,0); }
void ds_path_quad_to(ds_path* p, float cx, float cy, float x, float y) { _add(p, QUAD, cx, cy, x, y, 0,0); }
void ds_path_cubic_to(ds_path* p, float c1x, float c1y, float c2x, float c2y, float x, float y) { _add(p, CUBIC, c1x, c1y, c2x, c2y, x, y); }
void ds_path_close(ds_path* p) { _add(p, CLOSE, 0,0,0,0,0,0); }

/* ─── Gradient ─── */
struct ds_gradient {
  ds_gradient_type type;
  float x1, y1, x2, y2, r;
  ds_gradient_stop stops[8];
  uint32_t nstops;
};

ds_gradient* ds_gradient_create_linear(float x1, float y1, float x2, float y2) {
  ds_gradient* g = calloc(1, sizeof(ds_gradient));
  if (g) { g->type = DS_LINEAR; g->x1 = x1; g->y1 = y1; g->x2 = x2; g->y2 = y2; }
  return g;
}
ds_gradient* ds_gradient_create_radial(float cx, float cy, float r) {
  ds_gradient* g = calloc(1, sizeof(ds_gradient));
  if (g) { g->type = DS_RADIAL; g->x1 = cx; g->y1 = cy; g->r = r; }
  return g;
}
void ds_gradient_add_stop(ds_gradient* g, float offset, ds_colorf color) {
  if (g->nstops < 8) { g->stops[g->nstops].offset = offset; g->stops[g->nstops].color = color; g->nstops++; }
}
void ds_gradient_destroy(ds_gradient* g) { free(g); }

/* ─── Software Canvas ─── */
struct ds_canvas {
  uint32_t w, h;
  uint32_t* pixels;
};

ds_canvas* ds_canvas_create(uint32_t width, uint32_t height) {
  if (width == 0 || height == 0 || width > INT_MAX || height > INT_MAX ||
      height > UINT32_MAX / width) return NULL;
  size_t pixel_count = (size_t)width * (size_t)height;
  if (pixel_count > SIZE_MAX / sizeof(uint32_t)) return NULL;
  ds_canvas* c = calloc(1, sizeof(ds_canvas));
  if (c) {
    c->w = width;
    c->h = height;
    c->pixels = calloc(pixel_count, sizeof(uint32_t));
    if (!c->pixels) { free(c); return NULL; }
  }
  return c;
}
void ds_canvas_destroy(ds_canvas* c) { if (c) { free(c->pixels); free(c); } }

static uint8_t _channel(float value) {
  if (!isfinite(value) || value <= 0.0f) return 0;
  if (value >= 1.0f) return 255;
  return (uint8_t)lroundf(value * 255.0f);
}

static uint32_t _pack(ds_colorf col) {
  uint32_t r = _channel(col.r), g = _channel(col.g);
  uint32_t b = _channel(col.b), a = _channel(col.a);
  return (a << 24) | (r << 16) | (g << 8) | b;
}

#ifndef DS_BLEND_PIXEL_PROBE
#define DS_BLEND_PIXEL_PROBE() ((void)0)
#endif

#ifndef DS_ROUNDED_COVERAGE_PROBE
#define DS_ROUNDED_COVERAGE_PROBE() ((void)0)
#endif

static int _valid_color(ds_colorf color) {
  return isfinite(color.r) && isfinite(color.g) &&
         isfinite(color.b) && isfinite(color.a) && color.a > 0.0f;
}

/* Alpha-blended pixel write: src OVER dst */
static void _blend_pixel(ds_canvas* c, int x, int y, ds_colorf color) {
  DS_BLEND_PIXEL_PROBE();
  if (!c || !c->pixels || x < 0 || x >= (int)c->w || y < 0 || y >= (int)c->h ||
      !isfinite(color.r) || !isfinite(color.g) || !isfinite(color.b) || !isfinite(color.a)) return;
  color.r = fminf(1.0f, fmaxf(0.0f, color.r));
  color.g = fminf(1.0f, fmaxf(0.0f, color.g));
  color.b = fminf(1.0f, fmaxf(0.0f, color.b));
  color.a = fminf(1.0f, fmaxf(0.0f, color.a));
  uint32_t* dst = &c->pixels[y * c->w + x];
  float sa = color.a;
  if (sa >= 1.0f) { *dst = _pack(color); return; }
  if (sa <= 0.0f) return;
  float da = ((*dst >> 24) & 0xFF) / 255.0f;
  float dr = ((*dst >> 16) & 0xFF) / 255.0f;
  float dg = ((*dst >> 8) & 0xFF) / 255.0f;
  float db = (*dst & 0xFF) / 255.0f;
  float out_a = sa + da * (1.0f - sa);
  if (out_a <= 0.0f) { *dst = 0; return; }
  float out_r = (color.r * sa + dr * da * (1.0f - sa)) / out_a;
  float out_g = (color.g * sa + dg * da * (1.0f - sa)) / out_a;
  float out_b = (color.b * sa + db * da * (1.0f - sa)) / out_a;
  *dst = ((uint32_t)_channel(out_a) << 24) | ((uint32_t)_channel(out_r) << 16) |
         ((uint32_t)_channel(out_g) << 8) | (uint32_t)_channel(out_b);
}

/* Callers provide a clipped, non-empty pixel span. Full-coverage opaque fills
 * avoid the validation, color conversion, and blending cost for every pixel. */
static void _blend_span(ds_canvas* c, int row, int left, int right, ds_colorf color) {
  if (left >= right) return;
  if (color.a >= 1.0f) {
    uint32_t pixel = _pack(color);
    uint32_t* destination = c->pixels + (size_t)row * c->w + left;
    for (int column = left; column < right; column++) *destination++ = pixel;
    return;
  }
  for (int column = left; column < right; column++) {
    _blend_pixel(c, column, row, color);
  }
}

static int _canvas_rect_bounds(ds_canvas* c, float x, float y, float w, float h,
                               int* left, int* top, int* right, int* bottom) {
  if (!c || !c->pixels || !left || !top || !right || !bottom ||
      !isfinite(x) || !isfinite(y) || !isfinite(w) || !isfinite(h) ||
      w <= 0.0f || h <= 0.0f) return 0;

  float x2 = x + w, y2 = y + h;
  if (!isfinite(x2) || !isfinite(y2) || x2 <= 0.0f || y2 <= 0.0f ||
      x >= (float)c->w || y >= (float)c->h) return 0;

  *left = x <= 0.0f ? 0 : (int)floorf(x);
  *top = y <= 0.0f ? 0 : (int)floorf(y);
  *right = x2 >= (float)c->w ? (int)c->w : (int)ceilf(x2);
  *bottom = y2 >= (float)c->h ? (int)c->h : (int)ceilf(y2);
  return *left < *right && *top < *bottom;
}

static float _rounded_rect_coverage(float px, float py, float x, float y,
                                    float w, float h, float r) {
  DS_ROUNDED_COVERAGE_PROBE();
  float radius = fminf(fmaxf(r, 0.0f), fminf(w, h) * 0.5f);
  float half_w = w * 0.5f, half_h = h * 0.5f;
  float qx = fabsf(px - (x + half_w)) - (half_w - radius);
  float qy = fabsf(py - (y + half_h)) - (half_h - radius);
  float outside_x = fmaxf(qx, 0.0f), outside_y = fmaxf(qy, 0.0f);
  float distance = sqrtf(outside_x * outside_x + outside_y * outside_y) +
                   fminf(fmaxf(qx, qy), 0.0f) - radius;
  return fminf(1.0f, fmaxf(0.0f, 0.5f - distance));
}

/* Fill a rounded rectangle with anti-aliased corners */
void ds_canvas_fill_rounded_rect(ds_canvas* c, float x, float y, float w, float h, float r, ds_colorf color) {
  if (!isfinite(r) || !_valid_color(color)) return;
  int left, top, right, bottom;
  if (!_canvas_rect_bounds(c, x, y, w, h, &left, &top, &right, &bottom)) return;
  for (int row = top; row < bottom; row++) {
    int full_left = left;
    while (full_left < right) {
      float coverage = _rounded_rect_coverage(
        full_left + 0.5f, row + 0.5f, x, y, w, h, r
      );
      if (coverage >= 1.0f) break;
      if (coverage > 0.0f) {
        ds_colorf c2 = color; c2.a *= coverage;
        _blend_pixel(c, full_left, row, c2);
      }
      full_left++;
    }

    int full_right = right;
    while (full_right > full_left) {
      int column = full_right - 1;
      float coverage = _rounded_rect_coverage(
        column + 0.5f, row + 0.5f, x, y, w, h, r
      );
      if (coverage >= 1.0f) break;
      if (coverage > 0.0f) {
        ds_colorf c2 = color; c2.a *= coverage;
        _blend_pixel(c, column, row, c2);
      }
      full_right--;
    }
    _blend_span(c, row, full_left, full_right, color);
  }
}

static void _draw_rounded_border_range(
    ds_canvas* c, int row, int begin, int end,
    float x, float y, float w, float h, float r,
    float inner_x, float inner_y, float inner_w, float inner_h, float inner_r,
    ds_colorf color) {
  for (int column = begin; column < end; column++) {
    float sample_x = column + 0.5f, sample_y = row + 0.5f;
    float outer = _rounded_rect_coverage(sample_x, sample_y, x, y, w, h, r);
    float inner = 0.0f;
    if (inner_w > 0.0f && inner_h > 0.0f) {
      inner = _rounded_rect_coverage(
        sample_x, sample_y, inner_x, inner_y, inner_w, inner_h, inner_r
      );
    }
    float coverage = fmaxf(0.0f, outer - inner);
    if (coverage > 0.0f) {
      ds_colorf border_color = color;
      border_color.a *= coverage;
      _blend_pixel(c, column, row, border_color);
    }
  }
}

/* Draw rounded rect border */
void ds_canvas_draw_rounded_rect(ds_canvas* c, float x, float y, float w, float h, float r, float border_w, ds_colorf color) {
  if (!isfinite(r) || !isfinite(border_w) || border_w <= 0.0f ||
      !_valid_color(color)) return;
  int left, top, right, bottom;
  if (!_canvas_rect_bounds(c, x, y, w, h, &left, &top, &right, &bottom)) return;

  float thickness = fminf(border_w, fminf(w, h) * 0.5f);
  float inner_w = w - thickness * 2.0f, inner_h = h - thickness * 2.0f;
  float inner_r = fmaxf(0.0f, r - thickness);
  float inner_x = x + thickness, inner_y = y + thickness;
  for (int row = top; row < bottom; row++) {
    int skip_left = right, skip_right = right;
    if (inner_w > 0.0f && inner_h > 0.0f) {
      for (int column = left; column < right; column++) {
        float inner = _rounded_rect_coverage(
          column + 0.5f, row + 0.5f,
          inner_x, inner_y, inner_w, inner_h, inner_r
        );
        if (inner >= 1.0f) {
          skip_left = column;
          break;
        }
      }
      if (skip_left < right) {
        for (int column = right - 1; column >= skip_left; column--) {
          float inner = _rounded_rect_coverage(
            column + 0.5f, row + 0.5f,
            inner_x, inner_y, inner_w, inner_h, inner_r
          );
          if (inner >= 1.0f) {
            skip_right = column + 1;
            break;
          }
        }
      }
    }

    _draw_rounded_border_range(
      c, row, left, skip_left, x, y, w, h, r,
      inner_x, inner_y, inner_w, inner_h, inner_r, color
    );
    if (skip_left < right) {
      _draw_rounded_border_range(
        c, row, skip_right, right, x, y, w, h, r,
        inner_x, inner_y, inner_w, inner_h, inner_r, color
      );
    }
  }
}

void ds_canvas_clear(ds_canvas* c, ds_colorf color) {
  if (!c || !c->pixels) return;
  uint32_t p = _pack(color);
  size_t pixel_count = (size_t)c->w * c->h;
  for (size_t i = 0; i < pixel_count; i++) c->pixels[i] = p;
}

static void _fill_rect_per_pixel_coverage(
    ds_canvas* c, float x, float y, float x2, float y2,
    int left, int top, int right, int bottom, ds_colorf color) {
  for (int row = top; row < bottom; row++) {
    float coverage_y = fminf((float)row + 1.0f, y2) - fmaxf((float)row, y);
    coverage_y = fminf(1.0f, fmaxf(0.0f, coverage_y));
    for (int col = left; col < right; col++) {
      float coverage_x = fminf((float)col + 1.0f, x2) - fmaxf((float)col, x);
      coverage_x = fminf(1.0f, fmaxf(0.0f, coverage_x));
      float coverage = coverage_x * coverage_y;
      if (coverage <= 0.0f) continue;
      ds_colorf covered = color;
      covered.a *= coverage;
      _blend_pixel(c, col, row, covered);
    }
  }
}

static int _rect_bounds_exceed_exact_float_units(int right, int bottom) {
#if FLT_RADIX == 2 && FLT_MANT_DIG < 31
  /* At 2^FLT_MANT_DIG, adding one to a float coordinate can stop advancing.
   * The right and bottom bounds are exclusive, so equality is still safe. */
  const int exact_unit_limit = 1 << FLT_MANT_DIG;
  return right > exact_unit_limit || bottom > exact_unit_limit;
#elif FLT_RADIX == 2
  /* Canvas bounds are limited to INT_MAX, so wider binary floats are exact. */
  (void)right;
  (void)bottom;
  return 0;
#else
  /* Preserve the reference coverage calculation on uncommon float formats. */
  (void)right;
  (void)bottom;
  return 1;
#endif
}

void ds_canvas_fill_rect(ds_canvas* c, float x, float y, float w, float h, ds_colorf color) {
  int left, top, right, bottom;
  if (!_canvas_rect_bounds(c, x, y, w, h, &left, &top, &right, &bottom)) return;

  if (!_valid_color(color)) return;

  /* Keep opaque, pixel-aligned fills fast. Fractional edges still need area
   * coverage: rounding their bounds outward and filling every touched pixel
   * makes thin rules and scaled UI geometry look uneven. */
  int pixel_aligned = x == floorf(x) && y == floorf(y) &&
                      w == floorf(w) && h == floorf(h);
  if (pixel_aligned) {
    for (int row = top; row < bottom; row++) _blend_span(c, row, left, right, color);
    return;
  }

  float x2 = x + w, y2 = y + h;
  if (_rect_bounds_exceed_exact_float_units(right, bottom)) {
    _fill_rect_per_pixel_coverage(
      c, x, y, x2, y2, left, top, right, bottom, color
    );
    return;
  }

  int full_left = x <= (float)left ? left : (int)ceilf(x);
  int full_right = x2 >= (float)right ? right : (int)floorf(x2);
  if (full_left < left) full_left = left;
  if (full_left > right) full_left = right;
  if (full_right < full_left) full_right = full_left;
  if (full_right > right) full_right = right;
  for (int row = top; row < bottom; row++) {
    float coverage_y = fminf((float)row + 1.0f, y2) - fmaxf((float)row, y);
    coverage_y = fminf(1.0f, fmaxf(0.0f, coverage_y));
    if (coverage_y <= 0.0f) continue;

    for (int col = left; col < full_left; col++) {
      float coverage_x = fminf((float)col + 1.0f, x2) - fmaxf((float)col, x);
      coverage_x = fminf(1.0f, fmaxf(0.0f, coverage_x));
      float coverage = coverage_x * coverage_y;
      if (coverage <= 0.0f) continue;
      ds_colorf covered = color;
      covered.a *= coverage;
      _blend_pixel(c, col, row, covered);
    }

    ds_colorf covered_row = color;
    covered_row.a *= coverage_y;
    _blend_span(c, row, full_left, full_right, covered_row);

    for (int col = full_right; col < right; col++) {
      float coverage_x = fminf((float)col + 1.0f, x2) - fmaxf((float)col, x);
      coverage_x = fminf(1.0f, fmaxf(0.0f, coverage_x));
      float coverage = coverage_x * coverage_y;
      if (coverage <= 0.0f) continue;
      ds_colorf covered = color;
      covered.a *= coverage;
      _blend_pixel(c, col, row, covered);
    }
  }
}

void ds_canvas_draw_rect(ds_canvas* c, float x, float y, float w, float h, ds_colorf color) {
  ds_canvas_fill_rect(c, x, y, w + 1, 1, color);
  ds_canvas_fill_rect(c, x, y + h, w + 1, 1, color);
  ds_canvas_fill_rect(c, x, y, 1, h + 1, color);
  ds_canvas_fill_rect(c, x + w, y, 1, h + 1, color);
}

/* Anti-aliased filled circle */
void ds_canvas_fill_circle(ds_canvas* c, float cx, float cy, float r, ds_colorf color) {
  if (!c || !c->pixels || !isfinite(cx) || !isfinite(cy) ||
      !isfinite(r) || r <= 0.0f) return;
  int left, top, right, bottom;
  float extent = r + 0.5f;
  if (!_canvas_rect_bounds(
        c, cx - extent, cy - extent, extent * 2.0f, extent * 2.0f,
        &left, &top, &right, &bottom
      )) return;
  for (int py = top; py < bottom; py++) {
    for (int px = left; px < right; px++) {
      float dx = ((float)px + 0.5f) - cx;
      float dy = ((float)py + 0.5f) - cy;
      float coverage = fminf(1.0f, fmaxf(0.0f, r + 0.5f - sqrtf(dx * dx + dy * dy)));
      if (coverage > 0.0f) {
        ds_colorf covered = color;
        covered.a *= coverage;
        _blend_pixel(c, px, py, covered);
      }
    }
  }
}

void ds_canvas_draw_circle(ds_canvas* c, float cx, float cy, float r, ds_colorf color, float width) {
  if (!c || !c->pixels || !isfinite(cx) || !isfinite(cy) ||
      !isfinite(r) || !isfinite(width) || r <= 0.0f || width <= 0.0f) return;
  float outer_radius = r + width * 0.5f;
  float inner_radius = fmaxf(0.0f, r - width * 0.5f);
  int left, top, right, bottom;
  float extent = outer_radius + 0.5f;
  if (!_canvas_rect_bounds(
        c, cx - extent, cy - extent, extent * 2.0f, extent * 2.0f,
        &left, &top, &right, &bottom
      )) return;
  for (int py = top; py < bottom; py++) {
    for (int px = left; px < right; px++) {
      float dx = ((float)px + 0.5f) - cx;
      float dy = ((float)py + 0.5f) - cy;
      float distance = sqrtf(dx * dx + dy * dy);
      float outer = fminf(1.0f, fmaxf(0.0f, outer_radius + 0.5f - distance));
      float inner = inner_radius > 0.0f
        ? fminf(1.0f, fmaxf(0.0f, inner_radius + 0.5f - distance))
        : 0.0f;
      float coverage = fmaxf(0.0f, outer - inner);
      if (coverage > 0.0f) {
        ds_colorf covered = color;
        covered.a *= coverage;
        _blend_pixel(c, px, py, covered);
      }
    }
  }
}

void ds_canvas_fill_path(ds_canvas* c, ds_path* path, ds_colorf color) {
  (void)c; (void)path; (void)color;
}

void ds_canvas_stroke_path(ds_canvas* c, ds_path* path, ds_colorf color, float width) {
  (void)c; (void)path; (void)color; (void)width;
}

void ds_canvas_draw_text(ds_canvas* c, const char* text, float x, float y, ds_colorf color, float size) {
  (void)c; (void)text; (void)x; (void)y; (void)color; (void)size;
}

/* Linear gradient fill over a rectangle */
void ds_canvas_fill_gradient_rect(ds_canvas* c, float x, float y, float w, float h, ds_gradient* grad) {
  if (!grad || grad->nstops < 2) return;
  int ix = (int)x, iy = (int)y, iw = (int)w, ih = (int)h;
  for (int row = iy; row < iy + ih && row < (int)c->h; row++) {
    if (row < 0) continue;
    for (int col = ix; col < ix + iw && col < (int)c->w; col++) {
      if (col < 0) continue;
      float t;
      if (grad->type == DS_LINEAR) {
        float dx = grad->x2 - grad->x1, dy = grad->y2 - grad->y1;
        float len2 = dx * dx + dy * dy;
        t = len2 > 0 ? ((col - grad->x1) * dx + (row - grad->y1) * dy) / len2 : 0;
      } else {
        float dx = col - grad->x1, dy = row - grad->y1;
        t = sqrtf(dx * dx + dy * dy) / grad->r;
      }
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      /* Interpolate between stops */
      ds_colorf color = grad->stops[0].color;
      for (uint32_t s = 1; s < grad->nstops; s++) {
        if (t <= grad->stops[s].offset) {
          float lt = (t - grad->stops[s-1].offset) / (grad->stops[s].offset - grad->stops[s-1].offset);
          color.r = grad->stops[s-1].color.r + (grad->stops[s].color.r - grad->stops[s-1].color.r) * lt;
          color.g = grad->stops[s-1].color.g + (grad->stops[s].color.g - grad->stops[s-1].color.g) * lt;
          color.b = grad->stops[s-1].color.b + (grad->stops[s].color.b - grad->stops[s-1].color.b) * lt;
          color.a = grad->stops[s-1].color.a + (grad->stops[s].color.a - grad->stops[s-1].color.a) * lt;
          break;
        }
        color = grad->stops[s].color;
      }
      _blend_pixel(c, col, row, color);
    }
  }
}

/* Box shadow: blurred offset rectangle */
void ds_canvas_draw_shadow(ds_canvas* c, float x, float y, float w, float h, float r, float blur, float ox, float oy, ds_colorf color) {
  if (!c || !c->pixels || c->w == 0 || c->h == 0 ||
      !isfinite(x) || !isfinite(y) || !isfinite(w) || !isfinite(h) ||
      !isfinite(r) || !isfinite(blur) || !isfinite(ox) || !isfinite(oy) ||
      !isfinite(color.r) || !isfinite(color.g) || !isfinite(color.b) || !isfinite(color.a) ||
      w <= 0.0f || h <= 0.0f || blur <= 0.0f || color.a <= 0.0f) return;

  float origin_x = x + ox, origin_y = y + oy;
  float right_edge = origin_x + w, bottom_edge = origin_y + h;
  float left_bound = origin_x - blur, top_bound = origin_y - blur;
  float right_bound = right_edge + blur, bottom_bound = bottom_edge + blur;
  if (!isfinite(origin_x) || !isfinite(origin_y) || !isfinite(right_edge) ||
      !isfinite(bottom_edge) || !isfinite(left_bound) || !isfinite(top_bound) ||
      !isfinite(right_bound) || !isfinite(bottom_bound) ||
      right_bound <= 0.0f || bottom_bound <= 0.0f ||
      left_bound >= (float)c->w || top_bound >= (float)c->h) return;

  int left = left_bound <= 0.0f ? 0 : (int)floorf(left_bound);
  int top = top_bound <= 0.0f ? 0 : (int)floorf(top_bound);
  int right = right_bound >= (float)c->w ? (int)c->w : (int)ceilf(right_bound);
  int bottom = bottom_bound >= (float)c->h ? (int)c->h : (int)ceilf(bottom_bound);

  float radius = fminf(fmaxf(r, 0.0f), fminf(w, h) * 0.5f);
  float half_w = w * 0.5f, half_h = h * 0.5f;
  float inner_half_w = half_w - radius, inner_half_h = half_h - radius;
  color.r = fminf(1.0f, fmaxf(0.0f, color.r));
  color.g = fminf(1.0f, fmaxf(0.0f, color.g));
  color.b = fminf(1.0f, fmaxf(0.0f, color.b));
  color.a = fminf(1.0f, color.a);

  for (int py = top; py < bottom; py++) {
    for (int px = left; px < right; px++) {
      float local_x = (px + 0.5f) - origin_x;
      float local_y = (py + 0.5f) - origin_y;
      float qx = fabsf(local_x - half_w) - inner_half_w;
      float qy = fabsf(local_y - half_h) - inner_half_h;
      float outside_x = fmaxf(qx, 0.0f), outside_y = fmaxf(qy, 0.0f);
      float distance = sqrtf(outside_x * outside_x + outside_y * outside_y) +
                       fminf(fmaxf(qx, qy), 0.0f) - radius;
      if (distance < 0.0f) distance = 0.0f;
      if (distance > blur) continue;

      float alpha = color.a * (1.0f - distance / blur) * 0.4f;
      if (alpha <= 0.01f) continue;
      ds_colorf shadow_color = color;
      shadow_color.a = alpha;
      _blend_pixel(c, px, py, shadow_color);
    }
  }
}

void ds_canvas_fill_gradient(ds_canvas* c, ds_path* path, ds_gradient* grad) {
  (void)c; (void)path; (void)grad;
}

uint32_t* ds_canvas_pixels(ds_canvas* c) { return c ? c->pixels : NULL; }
uint32_t ds_canvas_width(ds_canvas* c) { return c ? c->w : 0; }
uint32_t ds_canvas_height(ds_canvas* c) { return c ? c->h : 0; }

/* ─── Chart Helpers ─── */
void ds_chart_draw_grid(ds_canvas* c, uint32_t cols, uint32_t rows, ds_colorf color) {
  float cw = c->w / (float)cols, ch = c->h / (float)rows;
  for (uint32_t i = 0; i <= cols; i++) ds_canvas_fill_rect(c, i * cw, 0, 1, c->h, color);
  for (uint32_t i = 0; i <= rows; i++) ds_canvas_fill_rect(c, 0, i * ch, c->w, 1, color);
}

void ds_canvas_stroke_line(ds_canvas* c, float x1, float y1, float x2, float y2,
                           float width, ds_colorf color) {
  if (!c || !c->pixels || !isfinite(x1) || !isfinite(y1) ||
      !isfinite(x2) || !isfinite(y2) || !isfinite(width) || width <= 0.0f) return;

  float half_width = width * 0.5f;
  float extent = half_width + 0.5f;
  float min_x = fminf(x1, x2) - extent, min_y = fminf(y1, y2) - extent;
  float max_x = fmaxf(x1, x2) + extent, max_y = fmaxf(y1, y2) + extent;
  int left, top, right, bottom;
  if (!_canvas_rect_bounds(
        c, min_x, min_y, max_x - min_x, max_y - min_y,
        &left, &top, &right, &bottom
      )) return;

  float delta_x = x2 - x1, delta_y = y2 - y1;
  float length_squared = delta_x * delta_x + delta_y * delta_y;
  for (int py = top; py < bottom; py++) {
    for (int px = left; px < right; px++) {
      float sample_x = (float)px + 0.5f, sample_y = (float)py + 0.5f;
      float progress = 0.0f;
      if (length_squared > 0.0f) {
        progress = ((sample_x - x1) * delta_x + (sample_y - y1) * delta_y) /
                   length_squared;
        progress = fminf(1.0f, fmaxf(0.0f, progress));
      }
      float nearest_x = x1 + progress * delta_x;
      float nearest_y = y1 + progress * delta_y;
      float distance_x = sample_x - nearest_x;
      float distance_y = sample_y - nearest_y;
      float distance = sqrtf(distance_x * distance_x + distance_y * distance_y);
      float coverage = fminf(1.0f, fmaxf(0.0f, half_width + 0.5f - distance));
      if (coverage > 0.0f) {
        ds_colorf covered = color;
        covered.a *= coverage;
        _blend_pixel(c, px, py, covered);
      }
    }
  }
}

void ds_canvas_draw_line(ds_canvas* c, int x1, int y1, int x2, int y2, ds_colorf color) {
  ds_canvas_stroke_line(
    c, (float)x1 + 0.5f, (float)y1 + 0.5f,
    (float)x2 + 0.5f, (float)y2 + 0.5f, 1.0f, color
  );
}

void ds_chart_plot_lines(ds_canvas* c, const float* data, uint32_t count, ds_colorf color, float min, float max) {
  if (count < 2 || !data) return;
  float range = max - min;
  if (range == 0) range = 1;
  float pad = 10.0f;
  float cw = (c->w - pad * 2) / (count - 1);
  float ch = c->h - pad * 2;

  for (uint32_t i = 1; i < count; i++) {
    float x1 = pad + (i - 1) * cw, y1 = pad + ch - ((data[i - 1] - min) / range) * ch;
    float x2 = pad + i * cw, y2 = pad + ch - ((data[i] - min) / range) * ch;
    float dx = x2 - x1, dy = y2 - y1;
    float len = sqrtf(dx * dx + dy * dy);
    if (len < 1) continue;
    uint32_t p = _pack(color);
    int steps = (int)len;
    for (int s = 0; s <= steps; s++) {
      float t = s / (float)steps;
      int px = (int)(x1 + t * dx), py = (int)(y1 + t * dy);
      if (px >= 0 && px < (int)c->w && py >= 0 && py < (int)c->h)
        c->pixels[py * c->w + px] = p;
    }
  }
}

void ds_chart_plot_bars(ds_canvas* c, const float* data, uint32_t count, ds_colorf color, float min, float max) {
  if (!data || !count) return;
  float range = max - min;
  if (range == 0) range = 1;
  float pad = 10.0f;
  float barW = (c->w - pad * 2) / count * 0.6f;
  float gap = (c->w - pad * 2) / count * 0.4f;
  float ch = c->h - pad * 2;

  for (uint32_t i = 0; i < count; i++) {
    float h = ((data[i] - min) / range) * ch;
    float x = pad + i * (barW + gap) + gap * 0.5f;
    float y = c->h - pad - h;
    ds_canvas_fill_rect(c, x, y, barW, h, color);
  }
}
