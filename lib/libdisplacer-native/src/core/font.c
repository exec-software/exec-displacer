#include "displacer/font.h"
#include "displacer/vis.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>

#define STB_TRUETYPE_IMPLEMENTATION
#include "stb_truetype.h"

/* 5x7 bitmap font for ASCII 32-126 (fallback)
 * Each character: 5 columns x 7 rows, stored as 5 bytes per glyph.
 * Bit 0 (LSB) = top row, bit 6 = bottom row.
 * Generated from the classic X11 5x7 bitmap font. */
const uint8_t ds_font_5x7[95][5] = {
  {0x00,0x00,0x00,0x00,0x00}, /*   */
  {0x00,0x00,0x5F,0x00,0x00}, /* ! */
  {0x00,0x07,0x00,0x07,0x00}, /* " */
  {0x14,0x7F,0x14,0x7F,0x14}, /* # */
  {0x24,0x2A,0x7F,0x2A,0x12}, /* $ */
  {0x23,0x13,0x08,0x64,0x62}, /* % */
  {0x36,0x49,0x55,0x22,0x50}, /* & */
  {0x00,0x00,0x07,0x00,0x00}, /* ' */
  {0x00,0x1C,0x22,0x41,0x00}, /* ( */
  {0x00,0x41,0x22,0x1C,0x00}, /* ) */
  {0x08,0x2A,0x1C,0x2A,0x08}, /* * */
  {0x08,0x08,0x3E,0x08,0x08}, /* + */
  {0x00,0x50,0x30,0x00,0x00}, /* , */
  {0x08,0x08,0x08,0x08,0x08}, /* - */
  {0x00,0x60,0x60,0x00,0x00}, /* . */
  {0x20,0x10,0x08,0x04,0x02}, /* / */
  {0x3E,0x51,0x49,0x45,0x3E}, /* 0 */
  {0x00,0x42,0x7F,0x40,0x00}, /* 1 */
  {0x42,0x61,0x51,0x49,0x46}, /* 2 */
  {0x21,0x41,0x45,0x4B,0x31}, /* 3 */
  {0x18,0x14,0x12,0x7F,0x10}, /* 4 */
  {0x27,0x45,0x45,0x45,0x39}, /* 5 */
  {0x3C,0x4A,0x49,0x49,0x30}, /* 6 */
  {0x01,0x71,0x09,0x05,0x03}, /* 7 */
  {0x36,0x49,0x49,0x49,0x36}, /* 8 */
  {0x06,0x49,0x49,0x29,0x1E}, /* 9 */
  {0x00,0x36,0x36,0x00,0x00}, /* : */
  {0x00,0x56,0x36,0x00,0x00}, /* ; */
  {0x00,0x08,0x14,0x22,0x41}, /* < */
  {0x14,0x14,0x14,0x14,0x14}, /* = */
  {0x41,0x22,0x14,0x08,0x00}, /* > */
  {0x02,0x01,0x51,0x09,0x06}, /* ? */
  {0x32,0x49,0x79,0x41,0x3E}, /* @ */
  {0x7E,0x11,0x11,0x11,0x7E}, /* A */
  {0x7F,0x49,0x49,0x49,0x36}, /* B */
  {0x3E,0x41,0x41,0x41,0x22}, /* C */
  {0x7F,0x41,0x41,0x22,0x1C}, /* D */
  {0x7F,0x49,0x49,0x49,0x41}, /* E */
  {0x7F,0x09,0x09,0x01,0x01}, /* F */
  {0x3E,0x41,0x41,0x51,0x32}, /* G */
  {0x7F,0x08,0x08,0x08,0x7F}, /* H */
  {0x00,0x41,0x7F,0x41,0x00}, /* I */
  {0x20,0x40,0x41,0x3F,0x01}, /* J */
  {0x7F,0x08,0x14,0x22,0x41}, /* K */
  {0x7F,0x40,0x40,0x40,0x40}, /* L */
  {0x7F,0x02,0x04,0x02,0x7F}, /* M */
  {0x7F,0x04,0x08,0x10,0x7F}, /* N */
  {0x3E,0x41,0x41,0x41,0x3E}, /* O */
  {0x7F,0x09,0x09,0x09,0x06}, /* P */
  {0x3E,0x41,0x51,0x21,0x5E}, /* Q */
  {0x7F,0x09,0x19,0x29,0x46}, /* R */
  {0x46,0x49,0x49,0x49,0x31}, /* S */
  {0x01,0x01,0x7F,0x01,0x01}, /* T */
  {0x3F,0x40,0x40,0x40,0x3F}, /* U */
  {0x1F,0x20,0x40,0x20,0x1F}, /* V */
  {0x7F,0x20,0x18,0x20,0x7F}, /* W */
  {0x63,0x14,0x08,0x14,0x63}, /* X */
  {0x03,0x04,0x78,0x04,0x03}, /* Y */
  {0x61,0x51,0x49,0x45,0x43}, /* Z */
  {0x00,0x00,0x7F,0x41,0x41}, /* [ */
  {0x02,0x04,0x08,0x10,0x20}, /* \ */
  {0x41,0x41,0x7F,0x00,0x00}, /* ] */
  {0x04,0x02,0x01,0x02,0x04}, /* ^ */
  {0x40,0x40,0x40,0x40,0x40}, /* _ */
  {0x00,0x00,0x03,0x04,0x00}, /* ` */
  {0x20,0x54,0x54,0x54,0x78}, /* a */
  {0x7F,0x48,0x44,0x44,0x38}, /* b */
  {0x38,0x44,0x44,0x44,0x20}, /* c */
  {0x38,0x44,0x44,0x48,0x7F}, /* d */
  {0x38,0x54,0x54,0x54,0x18}, /* e */
  {0x08,0x7E,0x09,0x01,0x02}, /* f */
  {0x08,0x14,0x54,0x54,0x3C}, /* g */
  {0x7F,0x08,0x04,0x04,0x78}, /* h */
  {0x00,0x44,0x7D,0x40,0x00}, /* i */
  {0x20,0x40,0x44,0x3D,0x00}, /* j */
  {0x00,0x7F,0x10,0x28,0x44}, /* k */
  {0x00,0x41,0x7F,0x40,0x00}, /* l */
  {0x7C,0x04,0x18,0x04,0x78}, /* m */
  {0x7C,0x08,0x04,0x04,0x78}, /* n */
  {0x38,0x44,0x44,0x44,0x38}, /* o */
  {0x7C,0x14,0x14,0x14,0x08}, /* p */
  {0x08,0x14,0x14,0x18,0x7C}, /* q */
  {0x7C,0x08,0x04,0x04,0x08}, /* r */
  {0x48,0x54,0x54,0x54,0x20}, /* s */
  {0x04,0x3F,0x44,0x40,0x20}, /* t */
  {0x3C,0x40,0x40,0x20,0x7C}, /* u */
  {0x1C,0x20,0x40,0x20,0x1C}, /* v */
  {0x3C,0x40,0x30,0x40,0x3C}, /* w */
  {0x44,0x28,0x10,0x28,0x44}, /* x */
  {0x0C,0x50,0x50,0x50,0x3C}, /* y */
  {0x44,0x64,0x54,0x4C,0x44}, /* z */
  {0x00,0x08,0x36,0x41,0x41}, /* { */
  {0x00,0x00,0x7F,0x00,0x00}, /* | */
  {0x41,0x41,0x36,0x08,0x00}, /* } */
  {0x02,0x01,0x02,0x04,0x02}, /* ~ */
};

/* ─── TTF state (stb_truetype) ─── */
struct ds_font_face {
  stbtt_fontinfo info;
  unsigned char* data;
  float scale;
  float size;
  float baseline_offset;
};

/* Compatibility face used by the original process-global API. */
static ds_font_face* _ttf_face = NULL;

static int _valid_font_size(float size) {
  return isfinite(size) && size > 0.0f && size <= DS_FONT_MAX_SIZE;
}

static int _utf8_continuation(unsigned char byte) {
  return (byte & 0xC0u) == 0x80u;
}

/* Decode one scalar value and always advance. Invalid input becomes U+FFFD. */
static uint32_t _utf8_next(const char** cursor) {
  const unsigned char* p = (const unsigned char*)*cursor;
  uint32_t codepoint;

  if (p[0] < 0x80u) {
    *cursor += 1;
    return p[0];
  }

  if (p[0] >= 0xC2u && p[0] <= 0xDFu && _utf8_continuation(p[1])) {
    codepoint = ((uint32_t)(p[0] & 0x1Fu) << 6) | (uint32_t)(p[1] & 0x3Fu);
    *cursor += 2;
    return codepoint;
  }

  if (p[0] >= 0xE0u && p[0] <= 0xEFu && _utf8_continuation(p[1]) &&
      p[1] != 0 && _utf8_continuation(p[2]) &&
      !(p[0] == 0xE0u && p[1] < 0xA0u) &&
      !(p[0] == 0xEDu && p[1] >= 0xA0u)) {
    codepoint = ((uint32_t)(p[0] & 0x0Fu) << 12) |
                ((uint32_t)(p[1] & 0x3Fu) << 6) |
                (uint32_t)(p[2] & 0x3Fu);
    *cursor += 3;
    return codepoint;
  }

  if (p[0] >= 0xF0u && p[0] <= 0xF4u && _utf8_continuation(p[1]) &&
      p[1] != 0 && _utf8_continuation(p[2]) && p[2] != 0 &&
      _utf8_continuation(p[3]) &&
      !(p[0] == 0xF0u && p[1] < 0x90u) &&
      !(p[0] == 0xF4u && p[1] > 0x8Fu)) {
    codepoint = ((uint32_t)(p[0] & 0x07u) << 18) |
                ((uint32_t)(p[1] & 0x3Fu) << 12) |
                ((uint32_t)(p[2] & 0x3Fu) << 6) |
                (uint32_t)(p[3] & 0x3Fu);
    *cursor += 4;
    return codepoint;
  }

  *cursor += 1;
  return 0xFFFDu;
}

static float _codepoint_advance(const ds_font_face* face, uint32_t codepoint) {
  if (face) {
    int advance;
    stbtt_GetCodepointHMetrics(&face->info, (int)codepoint, &advance, NULL);
    return advance * face->scale;
  }
  return 6.0f;
}

static float _codepoint_kern(const ds_font_face* face, uint32_t left, uint32_t right) {
  if (!face || !left || !right) return 0.0f;
  return stbtt_GetCodepointKernAdvance(
    &face->info, (int)left, (int)right
  ) * face->scale;
}

static float _font_width(const ds_font_face* face, const char* text) {
  if (!text) return 0;
  const char* cursor = text;
  float line_width = 0;
  float max_width = 0;
  uint32_t previous = 0;

  while (*cursor) {
    uint32_t codepoint = _utf8_next(&cursor);
    if (codepoint == '\n') {
      if (line_width > max_width) max_width = line_width;
      line_width = 0;
      previous = 0;
    } else {
      line_width += _codepoint_kern(face, previous, codepoint);
      line_width += _codepoint_advance(face, codepoint);
      previous = codepoint;
    }
  }
  return line_width > max_width ? line_width : max_width;
}

float ds_font_width(const char* text) { return _font_width(_ttf_face, text); }

float ds_font_height(void) { return _ttf_face ? _ttf_face->size : 9; }

float ds_font_face_width(const ds_font_face* face, const char* text) {
  return face ? _font_width(face, text) : 0.0f;
}

float ds_font_face_height(const ds_font_face* face) {
  return face ? face->size : 0.0f;
}

/* Takes ownership of data on every path. */
static ds_font_face* _create_ttf(unsigned char* data, size_t data_len, float size) {
  if (!data || data_len < 12 || !_valid_font_size(size)) {
    free(data);
    return NULL;
  }
  stbtt_fontinfo info;
  memset(&info, 0, sizeof(info));
  if (!stbtt_InitFont(&info, data, 0)) {
    free(data);
    return NULL;
  }
  float scale = stbtt_ScaleForPixelHeight(&info, size);
  if (!isfinite(scale) || scale <= 0.0f) {
    free(data);
    return NULL;
  }
  int ascent = 0;
  stbtt_GetFontVMetrics(&info, &ascent, NULL, NULL);
  float baseline_offset = ascent * scale;
  if (!isfinite(baseline_offset) || baseline_offset <= 0.0f) {
    free(data);
    return NULL;
  }

  ds_font_face* face = (ds_font_face*)malloc(sizeof(ds_font_face));
  if (!face) {
    free(data);
    return NULL;
  }
  face->info = info;
  face->data = data;
  face->size = size;
  face->scale = scale;
  face->baseline_offset = baseline_offset;
  return face;
}

/* ─── TTF loading ─── */
ds_font_face* ds_font_face_create_ttf_bytes(const uint8_t* data, size_t data_len, float size) {
  if (!data || data_len < 12 || !_valid_font_size(size)) return NULL;
  unsigned char* owned = (unsigned char*)malloc(data_len);
  if (!owned) return NULL;
  memcpy(owned, data, data_len);
  return _create_ttf(owned, data_len, size);
}

ds_font_face* ds_font_face_create_ttf(const char* path, float size) {
  if (!path || !_valid_font_size(size)) return NULL;
  FILE* f = fopen(path, "rb");
  if (!f) return NULL;
  if (fseek(f, 0, SEEK_END) != 0) { fclose(f); return NULL; }
  long len = ftell(f);
  if (len < 12 || fseek(f, 0, SEEK_SET) != 0) { fclose(f); return NULL; }
  unsigned char* data = (unsigned char*)malloc((size_t)len);
  if (!data) { fclose(f); return NULL; }
  if (fread(data, 1, (size_t)len, f) != (size_t)len) {
    free(data);
    fclose(f);
    return NULL;
  }
  fclose(f);
  return _create_ttf(data, (size_t)len, size);
}

void ds_font_face_destroy(ds_font_face* face) {
  if (!face) return;
  free(face->data);
  face->data = NULL;
  free(face);
}

int ds_font_load_ttf_bytes(const uint8_t* data, size_t data_len, float size) {
  ds_font_face* face = ds_font_face_create_ttf_bytes(data, data_len, size);
  if (!face) return 0;
  ds_font_face_destroy(_ttf_face);
  _ttf_face = face;
  return 1;
}

int ds_font_load_ttf(const char* path, float size) {
  ds_font_face* face = ds_font_face_create_ttf(path, size);
  if (!face) return 0;
  ds_font_face_destroy(_ttf_face);
  _ttf_face = face;
  return 1;
}

void ds_font_unload_ttf(void) {
  ds_font_face_destroy(_ttf_face);
  _ttf_face = NULL;
}

/* Rasterize at the pen's horizontal subpixel phase, then composite the
 * resulting coverage exactly once at integer pixel locations. Baselines stay
 * snapped to the physical pixel grid so small UI text keeps crisp horizontal
 * strokes at both 1x and fractional display scales. */
static void _draw_ttf_codepoint(const ds_font_face* face, ds_canvas* c,
                                uint32_t codepoint, float pen_x, float baseline,
                                float clip_right, ds_colorf color) {
  float pixel_x = floorf(pen_x);
  float pixel_baseline = floorf(baseline);
  float shift_x = pen_x - pixel_x;
  int w, h, xoff, yoff;
  unsigned char* bitmap = stbtt_GetCodepointBitmapSubpixel(
    &face->info, face->scale, face->scale, shift_x, 0.0f,
    (int)codepoint, &w, &h, &xoff, &yoff
  );
  if (!bitmap) return;

  for (int row = 0; row < h; row++) {
    for (int col = 0; col < w; col++) {
      unsigned char coverage = bitmap[(size_t)row * (size_t)w + (size_t)col];
      if (coverage == 0) continue;
      float glyph_x = pixel_x + (float)xoff + (float)col;
      float pixel_width = 1.0f;
      if (isfinite(clip_right)) {
        if (glyph_x >= clip_right) continue;
        pixel_width = fminf(pixel_width, clip_right - glyph_x);
        if (pixel_width <= 0.0f) continue;
      }
      ds_colorf covered = color;
      covered.a *= coverage / 255.0f;
      ds_canvas_fill_rect(
        c, glyph_x,
        pixel_baseline + (float)yoff + (float)row,
        pixel_width, 1.0f, covered
      );
    }
  }
  stbtt_FreeBitmap(bitmap, NULL);
}

static void _font_face_text(const ds_font_face* face, ds_canvas* c,
                            const char* text, float x, float y,
                            ds_colorf color) {
  float ox = x, baseline = y + face->baseline_offset;
  const char* cursor = text;
  uint32_t previous = 0;
  while (*cursor) {
    uint32_t codepoint = _utf8_next(&cursor);
    if (codepoint == '\n') {
      x = ox;
      baseline += face->size * 1.4f;
      previous = 0;
      continue;
    }
    x += _codepoint_kern(face, previous, codepoint);
    _draw_ttf_codepoint(face, c, codepoint, x, baseline, INFINITY, color);
    x += _codepoint_advance(face, codepoint);
    previous = codepoint;
  }
}

void ds_font_face_text(const ds_font_face* face, ds_canvas* c,
                       const char* text, float x, float y, ds_colorf color) {
  if (!face || !c || !text || !isfinite(x) || !isfinite(y)) return;
  _font_face_text(face, c, text, x, y, color);
}

/* TTF text rendering through the compatibility face. */
void ds_font_text_ttf(ds_canvas* c, const char* text, float x, float y, ds_colorf color) {
  if (!c || !text || !isfinite(x) || !isfinite(y)) return;
  if (!_ttf_face) { ds_font_text(c, text, x, y, color); return; }
  _font_face_text(_ttf_face, c, text, x, y, color);
}

/* Use TTF if loaded, fall back to bitmap */
void ds_font_text(ds_canvas* c, const char* text, float x, float y, ds_colorf color) {
  if (!c || !text || !isfinite(x) || !isfinite(y)) return;
  if (_ttf_face) { _font_face_text(_ttf_face, c, text, x, y, color); return; }
  float ox = x;
  const char* cursor = text;
  while (*cursor) {
    uint32_t codepoint = _utf8_next(&cursor);
    if (codepoint == '\n') { x = ox; y += 9; continue; }
    if (codepoint < 32 || codepoint > 126) { x += 6; continue; }
    const uint8_t* glyph = ds_font_5x7[codepoint - 32];
    for (int col = 0; col < 5; col++) {
      for (int row = 0; row < 7; row++) {
        if (glyph[col] & (1 << row)) {
          ds_canvas_fill_rect(c, x + col, y + row, 1, 1, color);
        }
      }
    }
    x += 6;
  }
}

static void _font_text_clipped(const ds_font_face* face, ds_canvas* c,
                               const char* text, float x, float y,
                               float max_w, ds_colorf color) {
  float ox = x;
  float clip_right = ox + max_w;
  int line_clipped = 0;
  const char* cursor = text;
  uint32_t previous = 0;
  while (*cursor) {
    uint32_t codepoint = _utf8_next(&cursor);
    if (codepoint == '\n') {
      x = ox;
      y += face ? face->size * 1.4f : 9;
      line_clipped = 0;
      previous = 0;
      continue;
    }
    x += _codepoint_kern(face, previous, codepoint);
    float advance = _codepoint_advance(face, codepoint);
    if (line_clipped || x - ox + advance > max_w) {
      line_clipped = 1;
      continue;
    }
    if (!face && (codepoint < 32 || codepoint > 126)) { x += advance; continue; }
    if (face) {
      _draw_ttf_codepoint(
        face, c, codepoint, x, y + face->baseline_offset, clip_right, color
      );
      x += advance;
      previous = codepoint;
    } else {
      const uint8_t* glyph = ds_font_5x7[codepoint - 32];
      for (int col = 0; col < 5; col++) {
        for (int row = 0; row < 7; row++) {
          if (glyph[col] & (1 << row)) {
            ds_canvas_fill_rect(c, x + col, y + row, 1, 1, color);
          }
        }
      }
      x += advance;
      previous = codepoint;
    }
  }
}

void ds_font_face_text_clipped(const ds_font_face* face, ds_canvas* c,
                               const char* text, float x, float y,
                               float max_w, ds_colorf color) {
  if (!face || !c || !text || !isfinite(x) || !isfinite(y) ||
      !isfinite(max_w) || max_w <= 0.0f) return;
  _font_text_clipped(face, c, text, x, y, max_w, color);
}

void ds_font_text_clipped(ds_canvas* c, const char* text, float x, float y,
                          float max_w, ds_colorf color) {
  if (!c || !text || !isfinite(x) || !isfinite(y) ||
      !isfinite(max_w) || max_w <= 0.0f) return;
  _font_text_clipped(_ttf_face, c, text, x, y, max_w, color);
}
