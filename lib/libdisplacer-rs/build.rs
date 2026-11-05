use std::env;
use std::fs;
use std::path::{Path, PathBuf};

fn require(path: &Path) {
    if !path.is_file() {
        panic!("required Displacer source is missing: {}", path.display());
    }
    println!("cargo:rerun-if-changed={}", path.display());
}

fn main() {
    let crate_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").expect("crate directory"));
    let native_dir = crate_dir.join("../libdisplacer-native");
    let include_dir = native_dir.join("include");
    let source_dir = native_dir.join("src/core");

    let sources = [
        source_dir.join("vis.c"),
        source_dir.join("core.c"),
        source_dir.join("font.c"),
    ];
    let headers = [
        include_dir.join("displacer/vis.h"),
        include_dir.join("displacer/core.h"),
        include_dir.join("displacer/font.h"),
        source_dir.join("stb_truetype.h"),
    ];

    for path in sources.iter().chain(headers.iter()) {
        require(path);
    }
    let version_file = crate_dir.join("../../VERSION");
    require(&version_file);
    let product_version = fs::read_to_string(&version_file)
        .expect("read Displacer VERSION")
        .trim()
        .to_owned();
    let release_number = product_version
        .strip_prefix('v')
        .filter(|number| {
            !number.is_empty()
                && !number.starts_with('0')
                && number.bytes().all(|byte| byte.is_ascii_digit())
        })
        .unwrap_or_else(|| panic!("Displacer VERSION is not canonical: {product_version}"));
    let _: u64 = release_number
        .parse()
        .unwrap_or_else(|_| panic!("Displacer VERSION is too large: {product_version}"));
    println!("cargo:rustc-env=DISPLACER_PRODUCT_VERSION={product_version}");

    let mut build = cc::Build::new();
    build
        .include(&include_dir)
        .files(&sources)
        .std("c17")
        .warnings(true)
        .compile("displacer_native");

    if env::var("CARGO_CFG_TARGET_FAMILY").as_deref() == Ok("unix") {
        println!("cargo:rustc-link-lib=m");
    }
}
