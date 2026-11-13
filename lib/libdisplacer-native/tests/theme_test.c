#include "displacer/core.h"

#include <stdio.h>

#define CHECK(condition) do { \
  if (!(condition)) { \
    fprintf(stderr, "Theme check failed: %s\n", #condition); \
    return 1; \
  } \
} while (0)

int main(void) {
  CHECK(DS_THEME_COUNT == 7);
  CHECK(ds_current_theme == &DS_THEME_CLAY);
  CHECK(DS_THEME_EXECUTE.page == 0x07090b);
  CHECK(DS_THEME_EXECUTE.primary == 0xb8ff3d);
  CHECK(DS_THEME_EXECUTE.jewels[5] == 0x6e9a29);

  ds_theme custom = DS_THEME_EXECUTE;
  ds_theme_apply(&custom);
  custom.page = 0xffffff;
  CHECK(ds_clr_page() == DS_THEME_EXECUTE.page);
  CHECK(ds_clr_primary() == DS_THEME_EXECUTE.primary);
  CHECK(ds_current_theme != &custom);

  ds_theme_apply(&DS_THEME_CLAY);
  CHECK(ds_clr_page() == DS_THEME_CLAY.page);
  return 0;
}
