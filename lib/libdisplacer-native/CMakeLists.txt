cmake_minimum_required(VERSION 3.20)
project(displacer VERSION 1.0.0 LANGUAGES C)

set(CMAKE_C_STANDARD 17)

option(BUILD_SHARED_LIBS "Build shared library" ON)
option(DISPLACER_TESTS "Build tests" OFF)

# Library sources
set(DISPLACER_SOURCES
  src/core/displacer.c
  src/core/core.c
  src/core/vis.c
  src/core/widgets.c
  src/core/ext.c
  src/core/font.c
)

set(DISPLACER_HEADERS
  include/displacer/displacer.h
  include/displacer/core.h
  include/displacer/vis.h
  include/displacer/widgets.h
  include/displacer/ext.h
  include/displacer/font.h
)

# Build library — pure C, no external dependencies
add_library(displacer ${DISPLACER_SOURCES} ${DISPLACER_HEADERS})
target_include_directories(displacer PUBLIC include)
if(MSVC)
  target_compile_options(displacer PRIVATE /W4)
else()
  target_compile_options(displacer PRIVATE -Wall -Wextra -Wpedantic)
endif()
if(UNIX)
  target_link_libraries(displacer PUBLIC m)
endif()

# Install
install(TARGETS displacer DESTINATION lib)
install(FILES ${DISPLACER_HEADERS} DESTINATION include/displacer)
install(FILES ../../LICENSE
  DESTINATION share/licenses/displacer
  RENAME LICENSE.txt
  COMPONENT displacer-licenses)
# Keep the bundled font parser's complete, unmodified upstream notices.
install(FILES THIRD_PARTY_NOTICES.md src/core/stb_truetype.h
  DESTINATION share/licenses/displacer
  COMPONENT displacer-licenses)

# Tests
if(DISPLACER_TESTS)
  enable_testing()
  add_subdirectory(tests)
endif()
