add_executable(displacer_vis_scanline_test vis_scanline_test.c)
target_include_directories(
  displacer_vis_scanline_test
  PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include
)
set_target_properties(
  displacer_vis_scanline_test
  PROPERTIES C_STANDARD 17 C_STANDARD_REQUIRED YES C_EXTENSIONS NO
)
if(MSVC)
  target_compile_options(displacer_vis_scanline_test PRIVATE /W4 /WX)
else()
  target_compile_options(
    displacer_vis_scanline_test
    PRIVATE -Wall -Wextra -Wpedantic -Werror
  )
endif()
if(UNIX)
  target_link_libraries(displacer_vis_scanline_test PRIVATE m)
endif()
add_test(NAME displacer_vis_scanline_test COMMAND displacer_vis_scanline_test)
