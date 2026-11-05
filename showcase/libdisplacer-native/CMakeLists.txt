cmake_minimum_required(VERSION 3.20)
project(displacer-sandbox-cpp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)

# Paths to the displacer library
set(DISPLACER_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../lib/libdisplacer-native)
set(DISPLACER_BUILD_DIR ${DISPLACER_DIR}/build)
set(DISPLACER_INCLUDE_DIR ${DISPLACER_DIR}/include)

# Find SDL2
find_package(SDL2 REQUIRED)

add_executable(displacer-sandbox src/main.cpp)
target_include_directories(displacer-sandbox PRIVATE ${DISPLACER_INCLUDE_DIR} ${SDL2_INCLUDE_DIRS})
target_link_directories(displacer-sandbox PRIVATE ${DISPLACER_BUILD_DIR} ${SDL2_LIBRARY_DIRS})
target_link_libraries(displacer-sandbox displacer ${SDL2_LIBRARIES})

# Output PPM images to an images directory
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/images)
