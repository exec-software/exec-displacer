#ifndef DISPLACER_FONT_H
#define DISPLACER_FONT_H

#include "displacer/vis.h"
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 5×7 bitmap font — ASCII 32–126 (95 glyphs) */
extern const uint8_t ds_font_5x7[95][5];

/* An owned TrueType face. Multiple faces may remain loaded at once. */
typedef struct ds_font_face ds_font_face;

#define DS_FONT_MAX_SIZE 4096.0f

/* Create a reusable face from trusted TrueType data. The byte loader copies its
 * input. Size must be finite and in (0, DS_FONT_MAX_SIZE]. Destroy returned
 * faces with ds_font_face_destroy. */
ds_font_face* ds_font_face_create_ttf(const char* path, float size);
ds_font_face* ds_font_face_create_ttf_bytes(const uint8_t* data, size_t data_len, float size);
void ds_font_face_destroy(ds_font_face* face);

/* Render and measure with a specific loaded face. */
void ds_font_face_text(const ds_font_face* face, ds_canvas* c, const char* text,
                       float x, float y, ds_colorf color);
void ds_font_face_text_clipped(const ds_font_face* face, ds_canvas* c, const char* text,
                               float x, float y, float max_w, ds_colorf color);
float ds_font_face_width(const ds_font_face* face, const char* text);
float ds_font_face_height(const ds_font_face* face);

/* Render UTF-8 text using the bitmap font (unsupported glyphs retain their advance). */
void ds_font_text(ds_canvas* c, const char* text, float x, float y, ds_colorf color);
void ds_font_text_clipped(ds_canvas* c, const char* text, float x, float y, float max_w, ds_colorf color);

/* Measure the widest UTF-8 text line in pixels. */
float ds_font_width(const char* text);
float ds_font_height(void);

/* TTF font loading (stb_truetype). Falls back to bitmap if not loaded.
 * Both entry points are restricted to trusted font data: stb_truetype is not
 * a validation boundary for attacker-controlled files. The byte loader copies
 * the supplied data, so the caller may release its buffer after the call. Size
 * must be finite and in (0, DS_FONT_MAX_SIZE]. */
int  ds_font_load_ttf(const char* path, float size);
int  ds_font_load_ttf_bytes(const uint8_t* data, size_t data_len, float size);
void ds_font_unload_ttf(void);
void ds_font_text_ttf(ds_canvas* c, const char* text, float x, float y, ds_colorf color);

#ifdef __cplusplus
}
#endif

#endif /* DISPLACER_FONT_H */
