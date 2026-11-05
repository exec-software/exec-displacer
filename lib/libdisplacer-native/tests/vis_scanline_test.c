#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static size_t blend_pixel_calls;
static size_t rounded_coverage_calls;

#define DS_BLEND_PIXEL_PROBE() (blend_pixel_calls++)
#define DS_ROUNDED_COVERAGE_PROBE() (rounded_coverage_calls++)
#include "../src/core/vis.c"

/* These deliberately preserve the area-scanning renderer that preceded the
 * scanline fast paths. Keep them simple: they are the pixel-exact oracle. */
static void reference_fill_rect(ds_canvas* c, float x, float y, float w, float h,
                                ds_colorf color) {
  int left, top, right, bottom;
  if (!_canvas_rect_bounds(c, x, y, w, h, &left, &top, &right, &bottom) ||
      !_valid_color(color)) return;

  int pixel_aligned = x == floorf(x) && y == floorf(y) &&
                      w == floorf(w) && h == floorf(h);
  if (pixel_aligned) {
    if (color.a >= 1.0f) {
      uint32_t pixel = _pack(color);
      for (int row = top; row < bottom; row++) {
        for (int col = left; col < right; col++) {
          c->pixels[(size_t)row * c->w + col] = pixel;
        }
      }
    } else {
      for (int row = top; row < bottom; row++) {
        for (int col = left; col < right; col++) {
          _blend_pixel(c, col, row, color);
        }
      }
    }
    return;
  }

  float x2 = x + w, y2 = y + h;
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

static void reference_fill_rounded_rect(
    ds_canvas* c, float x, float y, float w, float h, float r, ds_colorf color) {
  int left, top, right, bottom;
  if (!isfinite(r) || !_valid_color(color) ||
      !_canvas_rect_bounds(c, x, y, w, h, &left, &top, &right, &bottom)) return;
  for (int row = top; row < bottom; row++) {
    for (int col = left; col < right; col++) {
      float coverage = _rounded_rect_coverage(
        col + 0.5f, row + 0.5f, x, y, w, h, r
      );
      if (coverage > 0.0f) {
        ds_colorf covered = color;
        covered.a *= coverage;
        _blend_pixel(c, col, row, covered);
      }
    }
  }
}

static void reference_draw_rounded_rect(
    ds_canvas* c, float x, float y, float w, float h, float r,
    float border_w, ds_colorf color) {
  int left, top, right, bottom;
  if (!isfinite(r) || !isfinite(border_w) || border_w <= 0.0f ||
      !_valid_color(color) ||
      !_canvas_rect_bounds(c, x, y, w, h, &left, &top, &right, &bottom)) return;

  float thickness = fminf(border_w, fminf(w, h) * 0.5f);
  float inner_w = w - thickness * 2.0f, inner_h = h - thickness * 2.0f;
  float inner_r = fmaxf(0.0f, r - thickness);
  for (int row = top; row < bottom; row++) {
    for (int col = left; col < right; col++) {
      float sample_x = col + 0.5f, sample_y = row + 0.5f;
      float outer = _rounded_rect_coverage(sample_x, sample_y, x, y, w, h, r);
      float inner = 0.0f;
      if (inner_w > 0.0f && inner_h > 0.0f) {
        inner = _rounded_rect_coverage(
          sample_x, sample_y, x + thickness, y + thickness,
          inner_w, inner_h, inner_r
        );
      }
      float coverage = fmaxf(0.0f, outer - inner);
      if (coverage > 0.0f) {
        ds_colorf covered = color;
        covered.a *= coverage;
        _blend_pixel(c, col, row, covered);
      }
    }
  }
}

static int canvases_equal(const ds_canvas* left, const ds_canvas* right) {
  size_t byte_count = (size_t)left->w * left->h * sizeof(uint32_t);
  return left->w == right->w && left->h == right->h &&
         memcmp(left->pixels, right->pixels, byte_count) == 0;
}

static size_t first_difference(const ds_canvas* left, const ds_canvas* right) {
  size_t pixel_count = (size_t)left->w * left->h;
  for (size_t index = 0; index < pixel_count; index++) {
    if (left->pixels[index] != right->pixels[index]) return index;
  }
  return pixel_count;
}

static void reset_canvases(ds_canvas* reference, ds_canvas* optimized,
                           ds_colorf background) {
  ds_canvas_clear(reference, background);
  ds_canvas_clear(optimized, background);
}

static int compare_renderers(void) {
  static const float offsets[] = {-2.25f, 0.0f, 1.0f, 1.25f, 21.5f};
  static const float sizes[] = {0.5f, 1.0f, 2.0f, 8.0f, 17.25f, 30.0f};
  static const float radii[] = {0.0f, 0.25f, 0.5f, 1.0f, 2.3f, 10.0f, 40.0f};
  static const float borders[] = {0.25f, 1.0f, 2.5f, 10.0f, 40.0f};
  static const float alphas[] = {0.2f, 1.0f};
  static const ds_colorf backgrounds[] = {
    {0.1f, 0.2f, 0.3f, 1.0f},
    {0.1f, 0.2f, 0.3f, 0.0f},
  };
  ds_colorf ink = {0.8f, 0.3f, 0.7f, 1.0f};
  ds_canvas* reference = ds_canvas_create(24, 23);
  ds_canvas* optimized = ds_canvas_create(24, 23);
  if (!reference || !optimized) return 1;

  for (size_t background = 0; background < sizeof(backgrounds) / sizeof(backgrounds[0]);
       background++) {
    for (size_t x = 0; x < sizeof(offsets) / sizeof(offsets[0]); x++) {
      for (size_t y = 0; y < sizeof(offsets) / sizeof(offsets[0]); y++) {
        for (size_t width = 0; width < sizeof(sizes) / sizeof(sizes[0]); width++) {
          for (size_t height = 0; height < sizeof(sizes) / sizeof(sizes[0]); height++) {
            for (size_t alpha = 0; alpha < sizeof(alphas) / sizeof(alphas[0]); alpha++) {
              ink.a = alphas[alpha];
              reset_canvases(reference, optimized, backgrounds[background]);
              reference_fill_rect(
                reference, offsets[x], offsets[y], sizes[width], sizes[height], ink
              );
              ds_canvas_fill_rect(
                optimized, offsets[x], offsets[y], sizes[width], sizes[height], ink
              );
              if (!canvases_equal(reference, optimized)) {
                fprintf(stderr, "fill rect differs at pixel %zu\n",
                        first_difference(reference, optimized));
                return 2;
              }

              for (size_t radius = 0; radius < sizeof(radii) / sizeof(radii[0]); radius++) {
                reset_canvases(reference, optimized, backgrounds[background]);
                reference_fill_rounded_rect(
                  reference, offsets[x], offsets[y], sizes[width], sizes[height],
                  radii[radius], ink
                );
                ds_canvas_fill_rounded_rect(
                  optimized, offsets[x], offsets[y], sizes[width], sizes[height],
                  radii[radius], ink
                );
                if (!canvases_equal(reference, optimized)) {
                  fprintf(stderr, "rounded fill differs at pixel %zu\n",
                          first_difference(reference, optimized));
                  return 3;
                }

                for (size_t border = 0;
                     border < sizeof(borders) / sizeof(borders[0]); border++) {
                  reset_canvases(reference, optimized, backgrounds[background]);
                  reference_draw_rounded_rect(
                    reference, offsets[x], offsets[y], sizes[width], sizes[height],
                    radii[radius], borders[border], ink
                  );
                  ds_canvas_draw_rounded_rect(
                    optimized, offsets[x], offsets[y], sizes[width], sizes[height],
                    radii[radius], borders[border], ink
                  );
                  if (!canvases_equal(reference, optimized)) {
                    fprintf(stderr, "rounded border differs at pixel %zu\n",
                            first_difference(reference, optimized));
                    return 4;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  ds_canvas_destroy(reference);
  ds_canvas_destroy(optimized);
  return 0;
}

static int verify_large_canvas_float_fallback(void) {
#if FLT_RADIX == 2 && FLT_MANT_DIG == 24
  const uint32_t boundary = UINT32_C(1) << FLT_MANT_DIG;
  const uint32_t extent = boundary + 4;
  const uint32_t background = UINT32_C(0x7f123456);
  const ds_colorf ink = {1.0f, 0.0f, 0.0f, 1.0f};
  ds_canvas* canvas = ds_canvas_create(extent, 1);
  if (!canvas) return 9;

  canvas->pixels[boundary] = background;
  canvas->pixels[boundary + 1] = background;
  reference_fill_rect(
    canvas, (float)boundary, 0.25f, 2.0f, 0.5f, ink
  );
  uint32_t expected_first = canvas->pixels[boundary];
  uint32_t expected_second = canvas->pixels[boundary + 1];
  canvas->pixels[boundary] = background;
  canvas->pixels[boundary + 1] = background;
  ds_canvas_fill_rect(
    canvas, (float)boundary, 0.25f, 2.0f, 0.5f, ink
  );
  if (canvas->pixels[boundary] != expected_first ||
      canvas->pixels[boundary + 1] != expected_second) {
    fputs("wide canvas fractional fill differs beyond float unit precision\n", stderr);
    ds_canvas_destroy(canvas);
    return 10;
  }
  ds_canvas_destroy(canvas);

  canvas = ds_canvas_create(1, extent);
  if (!canvas) return 11;
  canvas->pixels[boundary] = background;
  canvas->pixels[boundary + 1] = background;
  reference_fill_rect(
    canvas, 0.25f, (float)boundary, 0.5f, 2.0f, ink
  );
  expected_first = canvas->pixels[boundary];
  expected_second = canvas->pixels[boundary + 1];
  canvas->pixels[boundary] = background;
  canvas->pixels[boundary + 1] = background;
  ds_canvas_fill_rect(
    canvas, 0.25f, (float)boundary, 0.5f, 2.0f, ink
  );
  if (canvas->pixels[boundary] != expected_first ||
      canvas->pixels[boundary + 1] != expected_second) {
    fputs("tall canvas fractional fill differs beyond float unit precision\n", stderr);
    ds_canvas_destroy(canvas);
    return 12;
  }
  ds_canvas_destroy(canvas);
#endif
  return 0;
}

static int verify_work_scales_with_edges(void) {
  ds_canvas* canvas = ds_canvas_create(1920, 1080);
  ds_colorf opaque = {0.08f, 0.08f, 0.10f, 1.0f};
  size_t fractional_blends;
  size_t fill_blends, fill_samples;
  size_t border_blends, border_samples;
  if (!canvas) return 5;

  blend_pixel_calls = 0;
  rounded_coverage_calls = 0;
  ds_canvas_fill_rect(canvas, 160.25f, 80.25f, 1600.5f, 920.5f, opaque);
  if (blend_pixel_calls >= 10000 || rounded_coverage_calls != 0) {
    fprintf(stderr, "fractional fill performed %zu blends and %zu rounded samples\n",
            blend_pixel_calls, rounded_coverage_calls);
    return 6;
  }
  fractional_blends = blend_pixel_calls;

  blend_pixel_calls = 0;
  rounded_coverage_calls = 0;
  ds_canvas_fill_rounded_rect(canvas, 160.0f, 80.0f, 1600.0f, 920.0f, 2.0f, opaque);
  if (blend_pixel_calls >= 10000 || rounded_coverage_calls >= 10000) {
    fprintf(stderr, "rounded fill performed %zu blends and %zu rounded samples\n",
            blend_pixel_calls, rounded_coverage_calls);
    return 7;
  }
  fill_blends = blend_pixel_calls;
  fill_samples = rounded_coverage_calls;

  blend_pixel_calls = 0;
  rounded_coverage_calls = 0;
  ds_canvas_draw_rounded_rect(
    canvas, 160.0f, 80.0f, 1600.0f, 920.0f, 2.0f, 1.0f, opaque
  );
  if (blend_pixel_calls >= 10000 || rounded_coverage_calls >= 100000) {
    fprintf(stderr, "rounded border performed %zu blends and %zu rounded samples\n",
            blend_pixel_calls, rounded_coverage_calls);
    return 8;
  }
  border_blends = blend_pixel_calls;
  border_samples = rounded_coverage_calls;

  printf(
    "edge work: fractional blends=%zu; rounded fill blends=%zu samples=%zu; "
    "border blends=%zu samples=%zu\n",
    fractional_blends, fill_blends, fill_samples, border_blends, border_samples
  );

  ds_canvas_destroy(canvas);
  return 0;
}

int main(void) {
  int result = compare_renderers();
  if (result != 0) return result;
  result = verify_large_canvas_float_fallback();
  if (result != 0) return result;
  result = verify_work_scales_with_edges();
  if (result != 0) return result;
  puts("scanline renderer matches the reference and keeps work at the edges");
  return 0;
}
