#include "displacer/displacer.h"
#include <stdlib.h>
#include <string.h>
#include <math.h>

/* ───────── Version ───────── */
const char* displacer_version(void) {
  return "1.0.0";
}

/* ───────── Color ───────── */
ds_color ds_color_hex(uint32_t hex) {
  return (ds_color){(hex>>16)&0xFF, (hex>>8)&0xFF, hex&0xFF, 1.0f};
}
ds_color ds_color_rgba(uint8_t r, uint8_t g, uint8_t b, float a) {
  return (ds_color){r, g, b, a};
}
uint32_t ds_color_to_hex(ds_color c) {
  return ((uint32_t)(c.a*255)<<24)|((uint32_t)c.r<<16)|((uint32_t)c.g<<8)|c.b;
}
ds_color ds_color_primary(void) { return ds_color_hex(0xb16286); }
ds_color ds_color_accent(void) { return ds_color_hex(0xd65d0e); }
ds_color ds_color_surface(void) { return ds_color_hex(0x282828); }

/* ───────── Widget tree ───────── */

ds_widget* ds_widget_alloc(ds_widget_type type, size_t struct_size) {
  ds_widget* w = (ds_widget*)calloc(1, struct_size);
  if (!w) return NULL;
  w->type = type;
  w->hints = (ds_size_hints){0, 0, 0, 0, 0, 0, 0, DS_SIZE_CONTENT, DS_SIZE_CONTENT};
  return w;
}

void ds_widget_free(ds_widget* w) {
  if (!w) return;
  /* Free children first */
  ds_widget* child = w->first_child;
  while (child) {
    ds_widget* next = child->next_sibling;
    ds_widget_free(child);
    child = next;
  }
  free(w);
}

void ds_widget_add_child(ds_widget* parent, ds_widget* child) {
  if (!parent || !child) return;
  child->parent = parent;
  if (parent->last_child) {
    parent->last_child->next_sibling = child;
    child->prev_sibling = parent->last_child;
  } else {
    parent->first_child = child;
  }
  parent->last_child = child;
  parent->child_count++;
  child->needs_layout = true;
  parent->needs_layout = true;
}

void ds_widget_remove_child(ds_widget* parent, ds_widget* child) {
  if (!parent || !child) return;
  if (child->prev_sibling) child->prev_sibling->next_sibling = child->next_sibling;
  if (child->next_sibling) child->next_sibling->prev_sibling = child->prev_sibling;
  if (parent->first_child == child) parent->first_child = child->next_sibling;
  if (parent->last_child == child) parent->last_child = child->prev_sibling;
  child->parent = NULL;
  child->prev_sibling = child->next_sibling = NULL;
  parent->child_count--;
  parent->needs_layout = true;
}

ds_widget* ds_widget_find(ds_widget* root, const char* id) {
  if (!root || !id) return NULL;
  if (root->id && strcmp(root->id, id) == 0) return root;
  for (ds_widget* c = root->first_child; c; c = c->next_sibling) {
    ds_widget* found = ds_widget_find(c, id);
    if (found) return found;
  }
  return NULL;
}

void ds_widget_destroy_tree(ds_widget* root) {
  ds_widget_free(root);
}

/* ───────── Layout ───────── */

void ds_widget_set_hints(ds_widget* w, ds_size_hints hints) {
  if (!w) return;
  w->hints = hints;
  w->needs_layout = true;
}

void ds_widget_set_margin(ds_widget* w, float top, float right, float bottom, float left) {
  if (!w) return;
  w->margin[0] = top; w->margin[1] = right; w->margin[2] = bottom; w->margin[3] = left;
  w->needs_layout = true;
}

void ds_widget_set_padding(ds_widget* w, float top, float right, float bottom, float left) {
  if (!w) return;
  w->padding[0] = top; w->padding[1] = right; w->padding[2] = bottom; w->padding[3] = left;
  w->needs_layout = true;
}

static void _layout_flex(ds_container_widget* cont, ds_bounds content) {
  if (!cont || cont->base.child_count == 0) return;

  bool is_row = cont->direction == DS_DIR_ROW;
  float total_flex = 0;
  float fixed_size = 0;
  uint32_t visible = 0;

  /* Pass 1: measure */
  for (ds_widget* c = cont->base.first_child; c; c = c->next_sibling) {
    if (c->hints.width_mode == DS_SIZE_FIXED) {
      fixed_size += c->hints.pref_w + c->margin[1] + c->margin[3];
    } else if (c->hints.flex_grow > 0) {
      total_flex += c->hints.flex_grow;
    } else {
      fixed_size += (is_row ? c->hints.pref_w : c->hints.pref_h) + (is_row ? c->margin[1]+c->margin[3] : c->margin[0]+c->margin[2]);
    }
    visible++;
  }
  if (visible == 0) return;

  float avail = (is_row ? content.w : content.h) - fixed_size - cont->gap * (visible - 1);
  float cross = is_row ? content.h : content.w;
  float pos = is_row ? content.x : content.y;

  /* Pass 2: place */
  for (ds_widget* c = cont->base.first_child; c; c = c->next_sibling) {
    float size;
    if (c->hints.flex_grow > 0 && total_flex > 0) {
      size = avail * (c->hints.flex_grow / total_flex);
    } else if (c->hints.width_mode == DS_SIZE_FIXED) {
      size = is_row ? c->hints.pref_w : c->hints.pref_h;
    } else {
      size = is_row ? c->hints.pref_w : c->hints.pref_h;
    }

    float m0 = c->margin[0], m1 = c->margin[1], m2 = c->margin[2], m3 = c->margin[3];
    if (is_row) {
      c->bounds.x = pos + m3;
      c->bounds.y = content.y + m0;
      c->bounds.w = size;
      c->bounds.h = c->hints.pref_h > 0 ? c->hints.pref_h : cross - m0 - m2;
      pos += size + m1 + m3 + cont->gap;
    } else {
      c->bounds.x = content.x + m3;
      c->bounds.y = pos + m0;
      c->bounds.w = c->hints.pref_w > 0 ? c->hints.pref_w : cross - m1 - m3;
      c->bounds.h = size;
      pos += size + m0 + m2 + cont->gap;
    }
    c->needs_layout = false;
    /* Recurse into containers */
    if (c->type == DS_WIDGET_CONTAINER) {
      ds_container_widget* cc = (ds_container_widget*)c;
      ds_bounds inner = {c->bounds.x + c->padding[3], c->bounds.y + c->padding[0],
                         c->bounds.w - c->padding[1] - c->padding[3],
                         c->bounds.h - c->padding[0] - c->padding[2]};
      _layout_flex(cc, inner);
    }
  }
}

void ds_widget_layout(ds_widget* root, float x, float y, float width, float height) {
  if (!root) return;
  ds_bounds content = {x, y, width, height};
  if (root->type == DS_WIDGET_CONTAINER) {
    ds_container_widget* c = (ds_container_widget*)root;
    root->bounds = content;
    content.x += root->padding[3];
    content.y += root->padding[0];
    content.w -= root->padding[1] + root->padding[3];
    content.h -= root->padding[0] + root->padding[2];
    _layout_flex(c, content);
  } else {
    root->bounds = content;
  }
  root->needs_layout = false;
}

void ds_widget_set_needs_layout(ds_widget* w) {
  if (!w) return;
  w->needs_layout = true;
  if (w->parent) ds_widget_set_needs_layout(w->parent);
}

/* ───────── State ───────── */

void ds_widget_set_state(ds_widget* w, ds_widget_state flags, bool on) {
  if (!w) return;
  if (on) w->state |= flags; else w->state &= ~flags;
}

/* ───────── Event dispatch ───────── */

static ds_widget* _hovered = NULL;
static ds_widget* _focused = NULL;

static void _update_hover(ds_widget* root, ds_event* ev) {
  if (ev->type != DS_EV_MOUSE_MOVE && ev->type != DS_EV_MOUSE_DOWN) return;
  float mx = ev->as.mouse.x, my = ev->as.mouse.y;
  ds_widget* hit = ds_widget_hit_test(root, mx, my);
  if (_hovered && _hovered != hit) {
    ds_widget_set_state(_hovered, DS_STATE_HOVERED, false);
  }
  if (hit && hit != _hovered) {
    ds_widget_set_state(hit, DS_STATE_HOVERED, true);
  }
  _hovered = hit;
}

static void _handle_click(ds_widget* target, ds_event* ev) {
  if (!target) return;
  if (ev->type == DS_EV_MOUSE_DOWN) {
    ds_widget_set_state(target, DS_STATE_PRESSED, true);
  } else if (ev->type == DS_EV_MOUSE_UP) {
    if (ds_widget_has_state(target, DS_STATE_PRESSED)) {
      ds_widget_set_state(target, DS_STATE_PRESSED, false);
      if (target->on_click) target->on_click(target);
      if (_focused && _focused != target) {
        ds_widget_set_state(_focused, DS_STATE_FOCUSED, false);
        if (_focused->on_blur) _focused->on_blur(_focused);
      }
      _focused = target;
      ds_widget_set_state(target, DS_STATE_FOCUSED, true);
      if (target->on_focus) target->on_focus(target);
    }
  }
}

ds_widget* ds_widget_dispatch_event(ds_widget* root, ds_event* ev) {
  if (!root || !ev) return NULL;
  _update_hover(root, ev);
  _handle_click(_hovered, ev);
  return _hovered;
}

bool ds_widget_has_state(ds_widget* w, ds_widget_state flags) {
  return w && (w->state & flags);
}

/* ───────── Hit testing ───────── */

ds_widget* ds_widget_hit_test(ds_widget* root, float mx, float my) {
  if (!root) return NULL;
  /* Check children first (front-to-back = reverse order) */
  for (ds_widget* c = root->last_child; c; c = c->prev_sibling) {
    ds_widget* hit = ds_widget_hit_test(c, mx, my);
    if (hit) return hit;
  }
  /* Then check self */
  if (mx >= root->bounds.x && mx <= root->bounds.x + root->bounds.w &&
      my >= root->bounds.y && my <= root->bounds.y + root->bounds.h) {
    /* Don't return pure containers — return their hit child instead */
    if (root->type == DS_WIDGET_CONTAINER && root->first_child) return NULL;
    return root;
  }
  return NULL;
}

/* ───────── Container ───────── */

ds_container_widget* ds_container_create(void) {
  ds_container_widget* c = (ds_container_widget*)ds_widget_alloc(DS_WIDGET_CONTAINER, sizeof(ds_container_widget));
  if (c) { c->direction = DS_DIR_COLUMN; c->align_x = DS_ALIGN_START; c->align_y = DS_ALIGN_START; c->gap = 8; }
  return c;
}

void ds_container_set_direction(ds_container_widget* c, int dir) { if (c) c->direction = dir; }
void ds_container_set_gap(ds_container_widget* c, float gap) { if (c) c->gap = gap; }

ds_container_widget* ds_app_create(float width, float height) {
  ds_container_widget* root = ds_container_create();
  root->base.bounds = (ds_bounds){0, 0, width, height};
  ds_widget_set_padding(&root->base, 12, 12, 12, 12);
  return root;
}
