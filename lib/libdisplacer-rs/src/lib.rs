//! Safe, deliberately small Rust bindings for Displacer's native canvas.
//!
//! Displacer's compatibility font and theme state are process-global in the C
//! implementation. The [`Displacer`] token makes that constraint explicit by allowing
//! one active owner and keeping all native objects on one thread. Independently owned
//! [`FontFace`] values allow applications to retain several text roles without changing
//! that compatibility font.

#![forbid(unsafe_op_in_unsafe_fn)]

use std::error::Error;
use std::ffi::CString;
use std::fmt;
use std::marker::PhantomData;
use std::mem::size_of;
use std::path::{Path, PathBuf};
use std::ptr::NonNull;
use std::rc::Rc;
use std::slice;
use std::sync::atomic::{AtomicBool, Ordering};

mod ffi {
    use std::ffi::{c_char, c_int};

    #[repr(C)]
    pub struct DsCanvas {
        _private: [u8; 0],
    }

    #[repr(C)]
    pub struct DsFontFace {
        _private: [u8; 0],
    }

    #[repr(C)]
    #[derive(Clone, Copy)]
    pub struct DsColorF {
        pub r: f32,
        pub g: f32,
        pub b: f32,
        pub a: f32,
    }

    #[repr(C)]
    #[derive(Clone, Copy)]
    pub struct DsTheme {
        pub page: u32,
        pub surface: u32,
        pub surface_alt: u32,
        pub raised: u32,
        pub fg: u32,
        pub fg_muted: u32,
        pub fg_subtle: u32,
        pub border: u32,
        pub border_muted: u32,
        pub primary: u32,
        pub primary_hover: u32,
        pub accent: u32,
        pub accent_hover: u32,
        pub semantic_info: u32,
        pub semantic_success: u32,
        pub semantic_warning: u32,
        pub semantic_error: u32,
        pub jewels: [u32; 7],
    }

    unsafe extern "C" {
        pub fn ds_canvas_create(width: u32, height: u32) -> *mut DsCanvas;
        pub fn ds_canvas_destroy(canvas: *mut DsCanvas);
        pub fn ds_canvas_clear(canvas: *mut DsCanvas, color: DsColorF);
        pub fn ds_canvas_fill_rect(
            canvas: *mut DsCanvas,
            x: f32,
            y: f32,
            width: f32,
            height: f32,
            color: DsColorF,
        );
        pub fn ds_canvas_stroke_line(
            canvas: *mut DsCanvas,
            x1: f32,
            y1: f32,
            x2: f32,
            y2: f32,
            width: f32,
            color: DsColorF,
        );
        pub fn ds_canvas_fill_rounded_rect(
            canvas: *mut DsCanvas,
            x: f32,
            y: f32,
            width: f32,
            height: f32,
            radius: f32,
            color: DsColorF,
        );
        pub fn ds_canvas_draw_rounded_rect(
            canvas: *mut DsCanvas,
            x: f32,
            y: f32,
            width: f32,
            height: f32,
            radius: f32,
            border_width: f32,
            color: DsColorF,
        );
        pub fn ds_canvas_draw_shadow(
            canvas: *mut DsCanvas,
            x: f32,
            y: f32,
            width: f32,
            height: f32,
            radius: f32,
            blur: f32,
            offset_x: f32,
            offset_y: f32,
            color: DsColorF,
        );
        pub fn ds_canvas_fill_circle(
            canvas: *mut DsCanvas,
            center_x: f32,
            center_y: f32,
            radius: f32,
            color: DsColorF,
        );
        pub fn ds_canvas_pixels(canvas: *mut DsCanvas) -> *mut u32;
        pub fn ds_canvas_width(canvas: *mut DsCanvas) -> u32;
        pub fn ds_canvas_height(canvas: *mut DsCanvas) -> u32;

        pub fn ds_font_load_ttf(path: *const c_char, size: f32) -> c_int;
        pub fn ds_font_load_ttf_bytes(data: *const u8, data_len: usize, size: f32) -> c_int;
        pub fn ds_font_unload_ttf();
        pub fn ds_font_text(
            canvas: *mut DsCanvas,
            text: *const c_char,
            x: f32,
            y: f32,
            color: DsColorF,
        );
        pub fn ds_font_text_clipped(
            canvas: *mut DsCanvas,
            text: *const c_char,
            x: f32,
            y: f32,
            max_width: f32,
            color: DsColorF,
        );
        pub fn ds_font_width(text: *const c_char) -> f32;
        pub fn ds_font_height() -> f32;
        pub fn ds_font_face_create_ttf(path: *const c_char, size: f32) -> *mut DsFontFace;
        pub fn ds_font_face_create_ttf_bytes(
            data: *const u8,
            data_len: usize,
            size: f32,
        ) -> *mut DsFontFace;
        pub fn ds_font_face_destroy(face: *mut DsFontFace);
        pub fn ds_font_face_text(
            face: *const DsFontFace,
            canvas: *mut DsCanvas,
            text: *const c_char,
            x: f32,
            y: f32,
            color: DsColorF,
        );
        pub fn ds_font_face_text_clipped(
            face: *const DsFontFace,
            canvas: *mut DsCanvas,
            text: *const c_char,
            x: f32,
            y: f32,
            max_width: f32,
            color: DsColorF,
        );
        pub fn ds_font_face_width(face: *const DsFontFace, text: *const c_char) -> f32;
        pub fn ds_font_face_height(face: *const DsFontFace) -> f32;

        pub fn ds_theme_apply(theme: *const DsTheme);
        #[cfg(test)]
        pub static mut ds_current_theme: *const DsTheme;
        pub static DS_THEME_LIGHT: DsTheme;
        pub static DS_THEME_DARK: DsTheme;
        pub static DS_THEME_DARK_ARCANA: DsTheme;
        pub static DS_THEME_PARCHMENT: DsTheme;
        pub static DS_THEME_MYSTIC: DsTheme;
        pub static DS_THEME_CLAY: DsTheme;

        #[cfg(test)]
        pub fn ds_lang_init();
        #[cfg(test)]
        pub fn ds_lang_set(id: u32);
        #[cfg(test)]
        pub fn ds_lang_get(key: *const c_char) -> *const c_char;
        #[cfg(test)]
        pub static mut DS_LANG_EN: u32;
        #[cfg(test)]
        pub static mut DS_LANG_DE: u32;
    }
}

static ACTIVE: AtomicBool = AtomicBool::new(false);
const MAX_GEOMETRY: f32 = 1_000_000.0;
const MAX_CIRCLE_RADIUS: f32 = 30_000.0;
const MAX_FONT_SIZE: f32 = 4_096.0;

/// The repository's rolling product version (for example, `v52`).
#[must_use]
pub const fn product_version() -> &'static str {
    env!("DISPLACER_PRODUCT_VERSION")
}

/// A color accepted by Displacer's native renderer.
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Color {
    r: f32,
    g: f32,
    b: f32,
    a: f32,
}

impl Color {
    #[must_use]
    pub const fn rgb(red: u8, green: u8, blue: u8) -> Self {
        Self {
            r: red as f32 / 255.0,
            g: green as f32 / 255.0,
            b: blue as f32 / 255.0,
            a: 1.0,
        }
    }

    #[must_use]
    pub const fn from_hex(rgb: u32) -> Self {
        Self::rgb(
            ((rgb >> 16) & 0xff) as u8,
            ((rgb >> 8) & 0xff) as u8,
            (rgb & 0xff) as u8,
        )
    }

    #[must_use]
    pub fn rgba(red: u8, green: u8, blue: u8, alpha: f32) -> Self {
        Self::rgb(red, green, blue).with_alpha(alpha)
    }

    #[must_use]
    pub fn with_alpha(mut self, alpha: f32) -> Self {
        self.a = if alpha.is_finite() {
            alpha.clamp(0.0, 1.0)
        } else {
            0.0
        };
        self
    }

    #[must_use]
    pub fn to_argb8888(self) -> u32 {
        (((self.a * 255.0) as u32) << 24)
            | (((self.r * 255.0) as u32) << 16)
            | (((self.g * 255.0) as u32) << 8)
            | (self.b * 255.0) as u32
    }
}

impl From<Color> for ffi::DsColorF {
    fn from(color: Color) -> Self {
        Self {
            r: color.r,
            g: color.g,
            b: color.b,
            a: color.a,
        }
    }
}

/// A built-in native Displacer theme. `BuiltinTheme::default()` is Clay.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum BuiltinTheme {
    Light,
    Dark,
    DarkArcana,
    Parchment,
    /// Neutral graphite surfaces with violet reserved for focus and primary actions.
    Mystic,
    /// Flat charcoal surfaces with a ZBrush-orange primary and teal accent; the default.
    #[default]
    Clay,
}

impl BuiltinTheme {
    fn as_ptr(self) -> *const ffi::DsTheme {
        match self {
            Self::Light => &raw const ffi::DS_THEME_LIGHT,
            Self::Dark => &raw const ffi::DS_THEME_DARK,
            Self::DarkArcana => &raw const ffi::DS_THEME_DARK_ARCANA,
            Self::Parchment => &raw const ffi::DS_THEME_PARCHMENT,
            Self::Mystic => &raw const ffi::DS_THEME_MYSTIC,
            Self::Clay => &raw const ffi::DS_THEME_CLAY,
        }
    }

    #[must_use]
    pub fn palette(self) -> Palette {
        // SAFETY: each pointer names an immutable, process-lifetime C static.
        let theme = unsafe { self.as_ptr().read() };
        Palette {
            page: theme.page,
            surface: theme.surface,
            surface_alt: theme.surface_alt,
            raised: theme.raised,
            foreground: theme.fg,
            foreground_muted: theme.fg_muted,
            foreground_subtle: theme.fg_subtle,
            border: theme.border,
            border_muted: theme.border_muted,
            primary: theme.primary,
            primary_hover: theme.primary_hover,
            accent: theme.accent,
            accent_hover: theme.accent_hover,
            info: theme.semantic_info,
            success: theme.semantic_success,
            warning: theme.semantic_warning,
            error: theme.semantic_error,
            jewels: theme.jewels,
        }
    }
}

/// A copied theme palette with no reference to C global state.
///
/// Color values use `0xRRGGBB`. The primary and accent colors are suitable for
/// foreground details; components that fill with either color should choose a
/// contrasting text color for that theme.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Palette {
    pub page: u32,
    pub surface: u32,
    pub surface_alt: u32,
    pub raised: u32,
    pub foreground: u32,
    pub foreground_muted: u32,
    pub foreground_subtle: u32,
    pub border: u32,
    pub border_muted: u32,
    pub primary: u32,
    pub primary_hover: u32,
    pub accent: u32,
    pub accent_hover: u32,
    pub info: u32,
    pub success: u32,
    pub warning: u32,
    pub error: u32,
    pub jewels: [u32; 7],
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AlreadyActive;

impl fmt::Display for AlreadyActive {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("a Displacer context is already active in this process")
    }
}

impl Error for AlreadyActive {}

/// The single owner of Displacer's process-global native state.
#[derive(Debug)]
pub struct Displacer {
    font_loaded: bool,
    theme: BuiltinTheme,
    _main_thread_only: PhantomData<Rc<()>>,
}

impl Displacer {
    pub fn acquire() -> Result<Self, AlreadyActive> {
        ACTIVE
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .map_err(|_| AlreadyActive)?;

        // SAFETY: acquiring the singleton establishes exclusive access to font state.
        unsafe { ffi::ds_font_unload_ttf() };
        let mut context = Self {
            font_loaded: false,
            theme: BuiltinTheme::default(),
            _main_thread_only: PhantomData,
        };
        context.set_theme(BuiltinTheme::default());
        Ok(context)
    }

    pub fn create_canvas(&self, width: u32, height: u32) -> Result<Canvas, CanvasError> {
        Canvas::new(width, height)
    }

    /// Creates an owned font face from a file without replacing the default font.
    ///
    /// Multiple faces can coexist and render into the same canvas. The returned face
    /// owns the native copy of the font until it is dropped.
    ///
    /// # Safety
    ///
    /// The file must be a trusted, valid TrueType font. The bundled stb_truetype parser
    /// does not bounds-check every table offset and must not receive untrusted font data.
    pub unsafe fn create_trusted_font_face(
        &self,
        path: impl AsRef<Path>,
        size: f32,
    ) -> Result<FontFace, FontError> {
        validate_font_size(size)?;
        let path = path.as_ref();
        let path_text = path
            .to_str()
            .ok_or_else(|| FontError::NonUtf8Path(path.into()))?;
        let path_c = CString::new(path_text).map_err(|_| FontError::InteriorNul)?;

        // SAFETY: the caller guarantees a trusted font, and path_c is NUL-terminated.
        let raw = unsafe { ffi::ds_font_face_create_ttf(path_c.as_ptr(), size) };
        FontFace::from_raw(raw).ok_or_else(|| FontError::LoadFailed(path.into()))
    }

    /// Creates an owned font face from copied bytes without replacing the default font.
    ///
    /// Multiple faces can coexist and render into the same canvas. The source slice
    /// does not need to outlive this call.
    ///
    /// # Safety
    ///
    /// `data` must contain a trusted, valid TrueType font. The bundled stb_truetype
    /// parser does not bounds-check every table offset and must not receive untrusted
    /// font data.
    pub unsafe fn create_trusted_font_face_bytes(
        &self,
        data: &[u8],
        size: f32,
    ) -> Result<FontFace, FontError> {
        validate_font_size(size)?;
        if data.is_empty() {
            return Err(FontError::EmptyData);
        }

        // SAFETY: the caller guarantees trusted bytes, which the native face copies.
        let raw = unsafe { ffi::ds_font_face_create_ttf_bytes(data.as_ptr(), data.len(), size) };
        FontFace::from_raw(raw).ok_or(FontError::LoadBytesFailed)
    }

    pub fn set_theme(&mut self, theme: BuiltinTheme) {
        // SAFETY: the built-in pointer is valid for the call and the C API copies it.
        unsafe { ffi::ds_theme_apply(theme.as_ptr()) };
        self.theme = theme;
    }

    #[must_use]
    pub fn current_theme(&self) -> BuiltinTheme {
        self.theme
    }

    #[must_use]
    pub fn current_palette(&self) -> Palette {
        self.theme.palette()
    }

    /// Loads a font file into Displacer's process-global native font state.
    ///
    /// # Safety
    ///
    /// The file must be a trusted, valid TrueType font. The bundled stb_truetype parser
    /// does not bounds-check every table offset and must not receive untrusted font data.
    pub unsafe fn load_trusted_font(
        &mut self,
        path: impl AsRef<Path>,
        size: f32,
    ) -> Result<(), FontError> {
        validate_font_size(size)?;
        let path = path.as_ref();
        let path_text = path
            .to_str()
            .ok_or_else(|| FontError::NonUtf8Path(path.into()))?;
        let path_c = CString::new(path_text).map_err(|_| FontError::InteriorNul)?;

        // SAFETY: path_c is NUL-terminated for this call and the singleton owns font state.
        let loaded = unsafe { ffi::ds_font_load_ttf(path_c.as_ptr(), size) };
        if loaded == 0 {
            // A failed stb_truetype initialization can otherwise leave stale C font state.
            // SAFETY: the singleton has exclusive access to font state.
            unsafe { ffi::ds_font_unload_ttf() };
            self.font_loaded = false;
            return Err(FontError::LoadFailed(path.into()));
        }
        self.font_loaded = true;
        Ok(())
    }

    /// Copies font bytes into Displacer's process-global native font state.
    ///
    /// The source slice does not need to outlive this call.
    ///
    /// # Safety
    ///
    /// `data` must contain a trusted, valid TrueType font. The bundled stb_truetype
    /// parser does not bounds-check every table offset and must not receive untrusted
    /// font data.
    pub unsafe fn load_trusted_font_bytes(
        &mut self,
        data: &[u8],
        size: f32,
    ) -> Result<(), FontError> {
        validate_font_size(size)?;
        if data.is_empty() {
            return Err(FontError::EmptyData);
        }

        // SAFETY: the caller guarantees trusted font bytes, and the singleton owns font state.
        let loaded = unsafe { ffi::ds_font_load_ttf_bytes(data.as_ptr(), data.len(), size) };
        if loaded == 0 {
            // SAFETY: the singleton has exclusive access to font state.
            unsafe { ffi::ds_font_unload_ttf() };
            self.font_loaded = false;
            return Err(FontError::LoadBytesFailed);
        }
        self.font_loaded = true;
        Ok(())
    }

    pub fn unload_font(&mut self) {
        // SAFETY: the singleton has exclusive access to font state.
        unsafe { ffi::ds_font_unload_ttf() };
        self.font_loaded = false;
    }

    #[must_use]
    pub fn font_is_loaded(&self) -> bool {
        self.font_loaded
    }

    pub fn draw_text(
        &self,
        canvas: &mut Canvas,
        text: &str,
        x: f32,
        y: f32,
        color: Color,
    ) -> Result<(), TextError> {
        if !valid_coordinate(x) || !valid_coordinate(y) {
            return Ok(());
        }
        let text = CString::new(text).map_err(|_| TextError::InteriorNul)?;
        // SAFETY: the C string and canvas remain valid for the duration of the call.
        unsafe {
            ffi::ds_font_text(canvas.raw.as_ptr(), text.as_ptr(), x, y, color.into());
        }
        Ok(())
    }

    pub fn draw_text_clipped(
        &self,
        canvas: &mut Canvas,
        text: &str,
        x: f32,
        y: f32,
        max_width: f32,
        color: Color,
    ) -> Result<(), TextError> {
        if !valid_coordinate(x)
            || !valid_coordinate(y)
            || !max_width.is_finite()
            || !(0.0..=MAX_GEOMETRY).contains(&max_width)
        {
            return Ok(());
        }
        let text = CString::new(text).map_err(|_| TextError::InteriorNul)?;
        // SAFETY: the C string and canvas remain valid for the duration of the call.
        unsafe {
            ffi::ds_font_text_clipped(
                canvas.raw.as_ptr(),
                text.as_ptr(),
                x,
                y,
                max_width,
                color.into(),
            );
        }
        Ok(())
    }

    pub fn text_width(&self, text: &str) -> Result<f32, TextError> {
        let text = CString::new(text).map_err(|_| TextError::InteriorNul)?;
        // SAFETY: text is a valid C string for the duration of the call.
        Ok(unsafe { ffi::ds_font_width(text.as_ptr()) })
    }

    #[must_use]
    pub fn font_height(&self) -> f32 {
        // SAFETY: the singleton serializes access to the global font state.
        unsafe { ffi::ds_font_height() }
    }
}

impl Drop for Displacer {
    fn drop(&mut self) {
        // SAFETY: this value owns the singleton until ACTIVE is released below.
        unsafe { ffi::ds_font_unload_ttf() };
        ACTIVE.store(false, Ordering::Release);
    }
}

/// An owned TrueType face that can coexist with other loaded faces.
///
/// A `FontFace` is independent of Displacer's compatibility/default font. It can be
/// retained and used for a dedicated text role without parsing the font again on each
/// frame. Like the canvas and context, it stays on the thread where it was created.
#[derive(Debug)]
pub struct FontFace {
    raw: NonNull<ffi::DsFontFace>,
    _main_thread_only: PhantomData<Rc<()>>,
}

impl FontFace {
    fn from_raw(raw: *mut ffi::DsFontFace) -> Option<Self> {
        Some(Self {
            raw: NonNull::new(raw)?,
            _main_thread_only: PhantomData,
        })
    }

    pub fn draw_text(
        &self,
        canvas: &mut Canvas,
        text: &str,
        x: f32,
        y: f32,
        color: Color,
    ) -> Result<(), TextError> {
        if !valid_coordinate(x) || !valid_coordinate(y) {
            return Ok(());
        }
        let text = CString::new(text).map_err(|_| TextError::InteriorNul)?;
        // SAFETY: this face, the C string, and canvas remain valid for the call.
        unsafe {
            ffi::ds_font_face_text(
                self.raw.as_ptr(),
                canvas.raw.as_ptr(),
                text.as_ptr(),
                x,
                y,
                color.into(),
            );
        }
        Ok(())
    }

    pub fn draw_text_clipped(
        &self,
        canvas: &mut Canvas,
        text: &str,
        x: f32,
        y: f32,
        max_width: f32,
        color: Color,
    ) -> Result<(), TextError> {
        if !valid_coordinate(x)
            || !valid_coordinate(y)
            || !max_width.is_finite()
            || !(0.0..=MAX_GEOMETRY).contains(&max_width)
        {
            return Ok(());
        }
        let text = CString::new(text).map_err(|_| TextError::InteriorNul)?;
        // SAFETY: this face, the C string, and canvas remain valid for the call.
        unsafe {
            ffi::ds_font_face_text_clipped(
                self.raw.as_ptr(),
                canvas.raw.as_ptr(),
                text.as_ptr(),
                x,
                y,
                max_width,
                color.into(),
            );
        }
        Ok(())
    }

    pub fn text_width(&self, text: &str) -> Result<f32, TextError> {
        let text = CString::new(text).map_err(|_| TextError::InteriorNul)?;
        // SAFETY: this face and the C string remain valid for the call.
        Ok(unsafe { ffi::ds_font_face_width(self.raw.as_ptr(), text.as_ptr()) })
    }

    #[must_use]
    pub fn height(&self) -> f32 {
        // SAFETY: this face remains valid for the call.
        unsafe { ffi::ds_font_face_height(self.raw.as_ptr()) }
    }
}

impl Drop for FontFace {
    fn drop(&mut self) {
        // SAFETY: this pointer is live, owned by this value, and destroyed exactly once.
        unsafe { ffi::ds_font_face_destroy(self.raw.as_ptr()) };
    }
}

fn validate_font_size(size: f32) -> Result<(), FontError> {
    if !size.is_finite() || size <= 0.0 || size > MAX_FONT_SIZE {
        return Err(FontError::InvalidSize(size));
    }
    Ok(())
}

#[derive(Debug)]
pub enum FontError {
    InvalidSize(f32),
    EmptyData,
    NonUtf8Path(PathBuf),
    InteriorNul,
    LoadFailed(PathBuf),
    LoadBytesFailed,
}

impl fmt::Display for FontError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidSize(size) => write!(
                formatter,
                "font size must be greater than zero and at most {MAX_FONT_SIZE}, got {size}"
            ),
            Self::EmptyData => formatter.write_str("font data is empty"),
            Self::NonUtf8Path(path) => {
                write!(
                    formatter,
                    "font path is not valid UTF-8: {}",
                    path.display()
                )
            }
            Self::InteriorNul => formatter.write_str("font path contains a NUL byte"),
            Self::LoadFailed(path) => write!(formatter, "could not load font: {}", path.display()),
            Self::LoadBytesFailed => formatter.write_str("could not load font bytes"),
        }
    }
}

impl Error for FontError {}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TextError {
    InteriorNul,
}

impl fmt::Display for TextError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("text contains a NUL byte")
    }
}

impl Error for TextError {}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CanvasError {
    ZeroDimension,
    DimensionsOverflow,
    AllocationFailed,
}

impl fmt::Display for CanvasError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ZeroDimension => formatter.write_str("canvas dimensions must be non-zero"),
            Self::DimensionsOverflow => formatter.write_str("canvas dimensions are too large"),
            Self::AllocationFailed => formatter.write_str("native canvas allocation failed"),
        }
    }
}

impl Error for CanvasError {}

/// An owned native ARGB8888 software canvas.
#[derive(Debug)]
pub struct Canvas {
    raw: NonNull<ffi::DsCanvas>,
    pixel_count: usize,
    _main_thread_only: PhantomData<Rc<()>>,
}

impl Canvas {
    fn new(width: u32, height: u32) -> Result<Self, CanvasError> {
        if width == 0 || height == 0 {
            return Err(CanvasError::ZeroDimension);
        }
        let pixel_count_u32 = width
            .checked_mul(height)
            .ok_or(CanvasError::DimensionsOverflow)?;
        let pixel_count =
            usize::try_from(pixel_count_u32).map_err(|_| CanvasError::DimensionsOverflow)?;
        let byte_count = pixel_count
            .checked_mul(size_of::<u32>())
            .filter(|bytes| *bytes <= isize::MAX as usize)
            .ok_or(CanvasError::DimensionsOverflow)?;
        debug_assert!(byte_count > 0);

        // SAFETY: dimensions were checked above; ownership transfers to this Canvas.
        let raw = NonNull::new(unsafe { ffi::ds_canvas_create(width, height) })
            .ok_or(CanvasError::AllocationFailed)?;
        // The C constructor can return a struct whose separate pixel allocation failed.
        // SAFETY: raw came from ds_canvas_create and remains owned here.
        if unsafe { ffi::ds_canvas_pixels(raw.as_ptr()) }.is_null() {
            // SAFETY: raw is a live allocation that has not been exposed.
            unsafe { ffi::ds_canvas_destroy(raw.as_ptr()) };
            return Err(CanvasError::AllocationFailed);
        }

        Ok(Self {
            raw,
            pixel_count,
            _main_thread_only: PhantomData,
        })
    }

    #[must_use]
    pub fn width(&self) -> u32 {
        // SAFETY: raw is live for self's lifetime.
        unsafe { ffi::ds_canvas_width(self.raw.as_ptr()) }
    }

    #[must_use]
    pub fn height(&self) -> u32 {
        // SAFETY: raw is live for self's lifetime.
        unsafe { ffi::ds_canvas_height(self.raw.as_ptr()) }
    }

    #[must_use]
    pub fn pitch_bytes(&self) -> usize {
        self.width() as usize * size_of::<u32>()
    }

    pub fn resize(&mut self, width: u32, height: u32) -> Result<(), CanvasError> {
        let mut replacement = Self::new(width, height)?;
        std::mem::swap(self, &mut replacement);
        Ok(())
    }

    pub fn clear(&mut self, color: Color) {
        // SAFETY: raw is live and exclusively borrowed through &mut self.
        unsafe { ffi::ds_canvas_clear(self.raw.as_ptr(), color.into()) }
    }

    pub fn fill_rect(&mut self, x: f32, y: f32, width: f32, height: f32, color: Color) {
        if !valid_rect(x, y, width, height) {
            return;
        }
        // SAFETY: raw is live and the C renderer clips coordinates to the canvas.
        unsafe { ffi::ds_canvas_fill_rect(self.raw.as_ptr(), x, y, width, height, color.into()) }
    }

    pub fn fill_rounded_rect(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        radius: f32,
        color: Color,
    ) {
        if !valid_rect(x, y, width, height)
            || !radius.is_finite()
            || !(0.0..=MAX_GEOMETRY).contains(&radius)
        {
            return;
        }
        // SAFETY: raw is live and the C renderer clips coordinates to the canvas.
        unsafe {
            ffi::ds_canvas_fill_rounded_rect(
                self.raw.as_ptr(),
                x,
                y,
                width,
                height,
                radius,
                color.into(),
            )
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn stroke_line(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, width: f32, color: Color) {
        if !valid_coordinate(x1)
            || !valid_coordinate(y1)
            || !valid_coordinate(x2)
            || !valid_coordinate(y2)
            || !width.is_finite()
            || width <= 0.0
            || width > MAX_CIRCLE_RADIUS
        {
            return;
        }
        // SAFETY: raw is live and all geometry is finite and bounded.
        unsafe {
            ffi::ds_canvas_stroke_line(self.raw.as_ptr(), x1, y1, x2, y2, width, color.into())
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn draw_rounded_rect(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        radius: f32,
        border_width: f32,
        color: Color,
    ) {
        if !valid_rect(x, y, width, height)
            || !radius.is_finite()
            || !(0.0..=MAX_GEOMETRY).contains(&radius)
            || !border_width.is_finite()
            || border_width <= 0.0
            || border_width > MAX_GEOMETRY
        {
            return;
        }
        // SAFETY: raw is live and all geometry is finite and bounded.
        unsafe {
            ffi::ds_canvas_draw_rounded_rect(
                self.raw.as_ptr(),
                x,
                y,
                width,
                height,
                radius,
                border_width,
                color.into(),
            )
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn draw_shadow(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        radius: f32,
        blur: f32,
        offset_x: f32,
        offset_y: f32,
        color: Color,
    ) {
        if !valid_rect(x, y, width, height)
            || !radius.is_finite()
            || !(0.0..=MAX_GEOMETRY).contains(&radius)
            || !blur.is_finite()
            || !(0.0..=MAX_CIRCLE_RADIUS).contains(&blur)
            || !valid_coordinate(offset_x)
            || !valid_coordinate(offset_y)
        {
            return;
        }
        // SAFETY: raw is live and the C renderer clips coordinates to the canvas.
        unsafe {
            ffi::ds_canvas_draw_shadow(
                self.raw.as_ptr(),
                x,
                y,
                width,
                height,
                radius,
                blur,
                offset_x,
                offset_y,
                color.into(),
            )
        }
    }

    pub fn fill_circle(&mut self, center_x: f32, center_y: f32, radius: f32, color: Color) {
        if !valid_coordinate(center_x)
            || !valid_coordinate(center_y)
            || !radius.is_finite()
            || !(0.0..=MAX_CIRCLE_RADIUS).contains(&radius)
        {
            return;
        }
        // SAFETY: raw is live and the C renderer clips coordinates to the canvas.
        unsafe {
            ffi::ds_canvas_fill_circle(self.raw.as_ptr(), center_x, center_y, radius, color.into())
        }
    }

    #[must_use]
    pub fn pixels_argb8888(&self) -> &[u32] {
        // SAFETY: allocation validation in new guarantees a non-null pixel buffer of this
        // exact length, and it remains live and immutable for this shared borrow.
        unsafe { slice::from_raw_parts(ffi::ds_canvas_pixels(self.raw.as_ptr()), self.pixel_count) }
    }

    #[must_use]
    pub fn pixels_native_bytes(&self) -> &[u8] {
        let pixels = self.pixels_argb8888();
        // SAFETY: u8 has alignment 1 and this byte view covers exactly the u32 slice.
        unsafe {
            slice::from_raw_parts(pixels.as_ptr().cast::<u8>(), std::mem::size_of_val(pixels))
        }
    }
}

fn valid_coordinate(value: f32) -> bool {
    value.is_finite() && value.abs() <= MAX_GEOMETRY
}

fn valid_rect(x: f32, y: f32, width: f32, height: f32) -> bool {
    valid_coordinate(x)
        && valid_coordinate(y)
        && width.is_finite()
        && height.is_finite()
        && (0.0..=MAX_GEOMETRY).contains(&width)
        && (0.0..=MAX_GEOMETRY).contains(&height)
        && (x + width).abs() <= MAX_GEOMETRY * 2.0
        && (y + height).abs() <= MAX_GEOMETRY * 2.0
}

impl Drop for Canvas {
    fn drop(&mut self) {
        // SAFETY: raw is uniquely owned and destroyed exactly once here.
        unsafe { ffi::ds_canvas_destroy(self.raw.as_ptr()) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CStr;
    use std::sync::{Mutex, MutexGuard};

    static TEST_LOCK: Mutex<()> = Mutex::new(());

    fn context() -> (MutexGuard<'static, ()>, Displacer) {
        let guard = TEST_LOCK
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        let context = Displacer::acquire().expect("test context");
        (guard, context)
    }

    fn decode_font_fixture(encoded: &[u8]) -> Vec<u8> {
        let mut output = Vec::new();
        let mut quartet = [0_u8; 4];
        let mut count = 0_usize;

        for byte in encoded {
            let value = match byte {
                b'A'..=b'Z' => byte - b'A',
                b'a'..=b'z' => byte - b'a' + 26,
                b'0'..=b'9' => byte - b'0' + 52,
                b'+' => 62,
                b'/' => 63,
                b'=' => 64,
                b' ' | b'\t' | b'\r' | b'\n' => continue,
                _ => panic!("invalid base64 byte in font fixture"),
            };
            quartet[count] = value;
            count += 1;
            if count == 4 {
                assert!(quartet[0] < 64 && quartet[1] < 64, "invalid base64 padding");
                output.push((quartet[0] << 2) | (quartet[1] >> 4));
                if quartet[2] < 64 {
                    output.push((quartet[1] << 4) | (quartet[2] >> 2));
                }
                if quartet[3] < 64 {
                    assert!(quartet[2] < 64, "invalid base64 padding");
                    output.push((quartet[2] << 6) | quartet[3]);
                }
                count = 0;
            }
        }
        assert_eq!(count, 0, "font fixture must contain complete quartets");
        output
    }

    fn font_fixture() -> Vec<u8> {
        decode_font_fixture(include_bytes!(
            "../tests/fixtures/DejaVuSans-AVHgj.ttf.base64"
        ))
    }

    fn oblique_font_fixture() -> Vec<u8> {
        decode_font_fixture(include_bytes!(
            "../tests/fixtures/DejaVuSans-Oblique-f.ttf.base64"
        ))
    }

    #[test]
    fn context_is_single_owner_and_can_be_reacquired() {
        let _guard = TEST_LOCK
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        let first = Displacer::acquire().expect("first context");
        assert_eq!(Displacer::acquire().unwrap_err(), AlreadyActive);
        drop(first);
        let second = Displacer::acquire().expect("reacquired context");
        drop(second);
    }

    #[test]
    fn canvas_rejects_invalid_dimensions() {
        let (_guard, context) = context();
        assert_eq!(
            context.create_canvas(0, 10).unwrap_err(),
            CanvasError::ZeroDimension
        );
        assert_eq!(
            context.create_canvas(u32::MAX, 2).unwrap_err(),
            CanvasError::DimensionsOverflow
        );
        assert!(unsafe { ffi::ds_canvas_create(u32::MAX, 1) }.is_null());
    }

    #[test]
    fn canvas_reports_dimensions_pitch_and_pixels() {
        let (_guard, context) = context();
        let canvas = context.create_canvas(7, 5).expect("canvas");
        assert_eq!((canvas.width(), canvas.height()), (7, 5));
        assert_eq!(canvas.pitch_bytes(), 28);
        assert_eq!(canvas.pixels_argb8888().len(), 35);
        assert_eq!(canvas.pixels_native_bytes().len(), 140);
    }

    #[test]
    fn clear_and_clipped_fill_have_exact_argb_pixels() {
        let (_guard, context) = context();
        let mut canvas = context.create_canvas(4, 3).expect("canvas");
        canvas.clear(Color::from_hex(0x112233));
        assert!(
            canvas
                .pixels_argb8888()
                .iter()
                .all(|pixel| *pixel == 0xff11_2233)
        );

        canvas.fill_rect(-2.0, -1.0, 3.0, 2.0, Color::from_hex(0xaa5500));
        assert_eq!(canvas.pixels_argb8888()[0], 0xffaa_5500);
        assert_eq!(canvas.pixels_argb8888()[1], 0xff11_2233);
    }

    #[test]
    fn translucent_and_fractional_fills_are_composited() {
        let (_guard, context) = context();
        let mut canvas = context.create_canvas(3, 1).expect("canvas");
        canvas.clear(Color::from_hex(0x204060));

        canvas.fill_rect(
            0.0,
            0.0,
            1.0,
            1.0,
            Color::from_hex(0xffffff).with_alpha(0.5),
        );
        assert_eq!(canvas.pixels_argb8888()[0], 0xff90_a0b0);

        canvas.clear(Color::from_hex(0x000000));
        canvas.fill_rect(0.5, 0.0, 1.0, 1.0, Color::from_hex(0xff0000));
        assert_eq!(canvas.pixels_argb8888()[0], 0xff80_0000);
        assert_eq!(canvas.pixels_argb8888()[1], 0xff80_0000);
        assert_eq!(canvas.pixels_argb8888()[2], 0xff00_0000);
    }

    #[test]
    fn rounded_rect_circle_and_shadow_render_pixels() {
        let (_guard, context) = context();
        let mut canvas = context.create_canvas(48, 48).expect("canvas");
        canvas.clear(Color::from_hex(0xffffff));
        canvas.draw_shadow(
            10.0,
            10.0,
            20.0,
            16.0,
            5.0,
            4.0,
            2.0,
            2.0,
            Color::from_hex(0x000000).with_alpha(0.4),
        );
        canvas.fill_rounded_rect(10.0, 10.0, 20.0, 16.0, 5.0, Color::from_hex(0xeeeeee));
        canvas.fill_circle(36.0, 36.0, 4.0, Color::from_hex(0x663399));
        assert!(
            canvas
                .pixels_argb8888()
                .iter()
                .any(|pixel| *pixel != 0xffff_ffff)
        );
    }

    #[test]
    fn float_lines_and_circles_are_smooth_and_alpha_composited() {
        let (_guard, context) = context();
        let mut canvas = context.create_canvas(20, 20).expect("canvas");
        canvas.clear(Color::from_hex(0xffffff));
        canvas.stroke_line(2.5, 3.5, 16.5, 14.5, 1.0, Color::from_hex(0x000000));
        canvas.fill_circle(10.25, 7.75, 2.5, Color::from_hex(0x663399));

        let pixels = canvas.pixels_argb8888();
        assert!(pixels.iter().all(|pixel| pixel >> 24 == 0xff));
        assert!(
            pixels.contains(&0xff00_0000),
            "the line should have an opaque core"
        );
        assert!(
            pixels.iter().any(|pixel| *pixel != 0xffff_ffff
                && *pixel != 0xff00_0000
                && *pixel != 0xff66_3399),
            "curves and diagonal edges should contain antialiased coverage"
        );

        let before = pixels.to_vec();
        canvas.stroke_line(f32::NAN, 0.0, 1.0, 1.0, 1.0, Color::from_hex(0xff0000));
        assert_eq!(canvas.pixels_argb8888(), before);
    }

    #[test]
    fn rounded_shadow_honors_radius_and_rejects_invalid_geometry() {
        let (_guard, context) = context();
        let mut rounded = context.create_canvas(16, 16).expect("rounded canvas");
        rounded.clear(Color::from_hex(0xffffff));
        rounded.draw_shadow(
            3.0,
            3.0,
            10.0,
            10.0,
            5.0,
            0.5,
            0.0,
            0.0,
            Color::from_hex(0x000000),
        );
        assert_eq!(rounded.pixels_argb8888()[3 * 16 + 3], 0xffff_ffff);
        assert_ne!(rounded.pixels_argb8888()[8 * 16 + 8], 0xffff_ffff);

        let mut square = context.create_canvas(16, 16).expect("square canvas");
        square.clear(Color::from_hex(0xffffff));
        square.draw_shadow(
            3.0,
            3.0,
            10.0,
            10.0,
            0.0,
            0.5,
            0.0,
            0.0,
            Color::from_hex(0x000000),
        );
        assert_ne!(square.pixels_argb8888()[3 * 16 + 3], 0xffff_ffff);

        let before = square.pixels_argb8888().to_vec();
        unsafe {
            ffi::ds_canvas_draw_shadow(
                square.raw.as_ptr(),
                f32::NAN,
                3.0,
                10.0,
                10.0,
                2.0,
                1.0,
                0.0,
                0.0,
                Color::from_hex(0x000000).into(),
            )
        };
        assert_eq!(square.pixels_argb8888(), before);
    }

    #[test]
    fn rounded_border_leaves_the_center_unfilled() {
        let (_guard, context) = context();
        let mut canvas = context.create_canvas(12, 12).expect("canvas");
        canvas.clear(Color::from_hex(0xffffff));
        canvas.draw_rounded_rect(2.0, 2.0, 8.0, 8.0, 2.0, 1.0, Color::from_hex(0x000000));
        assert_ne!(canvas.pixels_argb8888()[2 * 12 + 6], 0xffff_ffff);
        assert_eq!(canvas.pixels_argb8888()[6 * 12 + 6], 0xffff_ffff);

        let before = canvas.pixels_argb8888().to_vec();
        canvas.draw_rounded_rect(2.0, 2.0, 8.0, 8.0, f32::NAN, 1.0, Color::from_hex(0xff0000));
        assert_eq!(canvas.pixels_argb8888(), before);
    }

    #[test]
    fn themes_are_copied_into_rust_values() {
        let (_guard, mut context) = context();
        context.set_theme(BuiltinTheme::Parchment);
        let palette = context.current_palette();
        assert_eq!(palette.page, 0xf5e6c8);
        assert_eq!(palette.foreground, 0x4a3728);
        assert_eq!(palette.jewels[0], palette.primary);
        assert_eq!(BuiltinTheme::Dark.palette().page, 0x1d2021);
    }

    #[test]
    fn mystic_palette_has_distinct_accessible_roles() {
        let palette = BuiltinTheme::Mystic.palette();
        assert_eq!(palette.page, 0x0e1014);
        assert_eq!(palette.surface, 0x15181d);
        assert_eq!(palette.surface_alt, 0x1c2128);
        assert_eq!(palette.raised, 0x252b34);
        assert_eq!(palette.foreground, 0xe6e9ef);
        assert_eq!(palette.foreground_muted, 0xaab1bd);
        assert_eq!(palette.foreground_subtle, 0x8992a1);
        assert_eq!(palette.border, 0x697485);
        assert_eq!(palette.border_muted, 0x343c48);
        assert_eq!(palette.primary, 0xac74ff);
        assert_eq!(palette.primary_hover, 0xba88ff);
        assert_eq!(palette.accent, 0x7e9fbd);
        assert_eq!(palette.accent_hover, 0x91afca);
        assert_eq!(palette.info, 0x76a0c2);
        assert_eq!(palette.success, 0x7eae91);
        assert_eq!(palette.warning, 0xc9a56a);
        assert_eq!(palette.error, 0xca7b82);
        assert_eq!(palette.jewels[0], palette.primary);
        assert_eq!(palette.jewels[5], palette.accent);

        assert!(contrast_ratio(palette.foreground, palette.page) >= 7.0);
        assert!(contrast_ratio(palette.foreground_muted, palette.page) >= 4.5);
        assert!(contrast_ratio(palette.foreground_subtle, palette.raised) >= 4.5);
        assert!(contrast_ratio(palette.border, palette.raised) >= 3.0);
        assert!(contrast_ratio(palette.primary, palette.raised) >= 4.5);
        assert!(contrast_ratio(palette.accent, palette.raised) >= 4.5);
        assert!(contrast_ratio(palette.info, palette.raised) >= 4.5);
        assert!(contrast_ratio(palette.success, palette.raised) >= 4.5);
        assert!(contrast_ratio(palette.warning, palette.raised) >= 4.5);
        assert!(contrast_ratio(palette.error, palette.raised) >= 4.5);
    }

    fn contrast_ratio(first: u32, second: u32) -> f64 {
        let first = relative_luminance(first);
        let second = relative_luminance(second);
        (first.max(second) + 0.05) / (first.min(second) + 0.05)
    }

    fn relative_luminance(color: u32) -> f64 {
        let channel = |shift: u32| {
            let value = f64::from((color >> shift) & 0xff_u32) / 255.0;
            if value <= 0.04045 {
                value / 12.92
            } else {
                ((value + 0.055) / 1.055).powf(2.4)
            }
        };
        0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
    }

    #[test]
    fn native_theme_application_owns_a_copy() {
        let (_guard, mut context) = context();
        let mut local_theme = unsafe { BuiltinTheme::Dark.as_ptr().read() };
        local_theme.page = 0x123456;
        unsafe { ffi::ds_theme_apply(&raw const local_theme) };
        local_theme.page = 0xabcdef;
        assert_eq!(local_theme.page, 0xabcdef);

        let applied = unsafe { ffi::ds_current_theme };
        assert!(!applied.is_null());
        assert_eq!(unsafe { (*applied).page }, 0x123456);
        context.set_theme(BuiltinTheme::default());
    }

    #[test]
    fn new_contexts_start_in_the_clay_default() {
        let (_guard, context) = context();
        assert_eq!(BuiltinTheme::default(), BuiltinTheme::Clay);
        assert_eq!(context.current_theme(), BuiltinTheme::Clay);

        let applied = unsafe { ffi::ds_current_theme };
        assert!(!applied.is_null());
        assert_eq!(
            unsafe { (*applied).page },
            BuiltinTheme::Clay.palette().page
        );
    }

    #[test]
    fn clay_palette_has_distinct_accessible_roles() {
        const LABEL_ON_FILL: u32 = 0x0f0f0f;
        let palette = BuiltinTheme::Clay.palette();
        assert_eq!(palette.page, 0x141414);
        assert_eq!(palette.surface, 0x1a1a1a);
        assert_eq!(palette.surface_alt, 0x222222);
        assert_eq!(palette.raised, 0x262626);
        assert_eq!(palette.foreground, 0xece9e5);
        assert_eq!(palette.foreground_muted, 0x9c9893);
        assert_eq!(palette.foreground_subtle, 0x6e6a65);
        assert_eq!(palette.border, 0x2a2a2a);
        assert_eq!(palette.border_muted, 0x212121);
        assert_eq!(palette.primary, 0xf2661a);
        assert_eq!(palette.primary_hover, 0xff7f33);
        assert_eq!(palette.accent, 0x33b7a6);
        assert_eq!(palette.accent_hover, 0x4fd1bf);
        assert_eq!(palette.info, 0x5ea8e8);
        assert_eq!(palette.success, 0x6cc07f);
        assert_eq!(palette.warning, 0xe3b341);
        assert_eq!(palette.error, 0xe05252);
        assert_eq!(palette.jewels[0], palette.primary);
        assert_eq!(palette.jewels[5], palette.accent);

        let tiers = [
            palette.page,
            palette.surface,
            palette.surface_alt,
            palette.raised,
        ];
        assert!(
            tiers
                .windows(2)
                .all(|pair| relative_luminance(pair[0]) < relative_luminance(pair[1]))
        );
        for tier in tiers {
            assert!(contrast_ratio(palette.foreground, tier) >= 12.0);
            assert!(contrast_ratio(palette.foreground_muted, tier) >= 5.0);
            assert!(contrast_ratio(palette.primary, tier) >= 4.5);
            assert!(contrast_ratio(palette.accent, tier) >= 4.5);
        }
        for tier in [palette.page, palette.surface] {
            assert!(contrast_ratio(palette.foreground_subtle, tier) >= 3.2);
            for status in [
                palette.info,
                palette.success,
                palette.warning,
                palette.error,
            ] {
                assert!(contrast_ratio(status, tier) >= 4.5);
            }
        }
        for fill in [
            palette.primary,
            palette.accent,
            palette.info,
            palette.success,
            palette.warning,
            palette.error,
        ] {
            assert!(contrast_ratio(LABEL_ON_FILL, fill) >= 5.0);
        }
        for border in [palette.border, palette.border_muted] {
            assert!(contrast_ratio(border, palette.page) < 1.3);
        }
    }

    #[test]
    fn native_languages_initialize_lazily() {
        let _guard = TEST_LOCK
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        let english = unsafe { ffi::DS_LANG_EN };
        let german = unsafe { ffi::DS_LANG_DE };
        assert_eq!((english, german), (0, 1));

        unsafe { ffi::ds_lang_set(german) };
        let key = CString::new("common.save").expect("translation key");
        let translated = unsafe { ffi::ds_lang_get(key.as_ptr()) };
        assert!(!translated.is_null());
        assert_eq!(
            unsafe { CStr::from_ptr(translated) }.to_bytes(),
            b"Speichern"
        );
        unsafe { ffi::ds_lang_init() };
        unsafe { ffi::ds_lang_set(english) };
    }

    #[test]
    fn product_version_is_canonical() {
        let number = product_version().strip_prefix('v').expect("version prefix");
        assert!(!number.starts_with('0'));
        assert!(number.bytes().all(|byte| byte.is_ascii_digit()));
        assert!(number.parse::<u64>().is_ok());
    }

    #[test]
    fn color_and_geometry_inputs_preserve_ffi_invariants() {
        let (_guard, context) = context();
        assert_eq!(Color::rgba(255, 0, 0, f32::NAN).to_argb8888(), 0x00ff_0000);

        let mut canvas = context.create_canvas(4, 4).expect("canvas");
        canvas.clear(Color::from_hex(0xffffff));
        canvas.fill_rect(f32::NAN, 0.0, 2.0, 2.0, Color::from_hex(0x000000));
        canvas.fill_circle(2.0, 2.0, f32::INFINITY, Color::from_hex(0x000000));
        context
            .draw_text(
                &mut canvas,
                "ignored",
                f32::NAN,
                0.0,
                Color::from_hex(0x000000),
            )
            .expect("invalid text geometry is a no-op");
        context
            .draw_text_clipped(
                &mut canvas,
                "ignored",
                0.0,
                0.0,
                f32::INFINITY,
                Color::from_hex(0x000000),
            )
            .expect("invalid clipped-text geometry is a no-op");
        assert!(
            canvas
                .pixels_argb8888()
                .iter()
                .all(|pixel| *pixel == 0xffff_ffff)
        );
    }

    #[test]
    fn text_rejects_nul_and_bitmap_fallback_renders() {
        let (_guard, context) = context();
        let mut canvas = context.create_canvas(32, 16).expect("canvas");
        canvas.clear(Color::from_hex(0xffffff));
        assert!(
            context
                .draw_text(&mut canvas, "bad\0text", 0.0, 0.0, Color::from_hex(0x0))
                .is_err()
        );
        context
            .draw_text(&mut canvas, "A", 1.0, 1.0, Color::from_hex(0x000000))
            .expect("bitmap text");
        assert!(canvas.pixels_argb8888().contains(&0xff00_0000));
    }

    #[test]
    fn fallback_text_counts_utf8_scalars_and_measures_each_line() {
        let (_guard, context) = context();
        assert_eq!(context.text_width("é").expect("UTF-8 width"), 6.0);
        assert_eq!(
            context.text_width("🦀").expect("four-byte UTF-8 width"),
            6.0
        );
        assert_eq!(context.text_width("ab\né").expect("multiline width"), 12.0);

        let mut canvas = context.create_canvas(12, 9).expect("canvas");
        canvas.clear(Color::from_hex(0xffffff));
        context
            .draw_text(&mut canvas, "éA", 0.0, 0.0, Color::from_hex(0x000000))
            .expect("UTF-8 fallback text");
        assert!(
            (0..9).all(
                |row| (0..6).all(|col| canvas.pixels_argb8888()[row * 12 + col] == 0xffff_ffff)
            )
        );
        assert!(
            (0..9)
                .any(|row| (6..11)
                    .any(|col| canvas.pixels_argb8888()[row * 12 + col] == 0xff00_0000))
        );

        let mut clipped = context.create_canvas(6, 18).expect("clipped canvas");
        clipped.clear(Color::from_hex(0xffffff));
        context
            .draw_text_clipped(
                &mut clipped,
                "AB\nC",
                0.0,
                0.0,
                6.0,
                Color::from_hex(0x000000),
            )
            .expect("multiline clipped text");
        assert!(
            (9..18).any(
                |row| (0..6).any(|col| clipped.pixels_argb8888()[row * 6 + col] == 0xff00_0000)
            )
        );
    }

    #[test]
    fn invalid_font_inputs_leave_fallback_available() {
        let (_guard, mut context) = context();
        assert!(matches!(
            unsafe { context.create_trusted_font_face("missing-font.ttf", 16.0) },
            Err(FontError::LoadFailed(_))
        ));
        assert!(matches!(
            unsafe { context.create_trusted_font_face_bytes(&[], 16.0) },
            Err(FontError::EmptyData)
        ));
        assert!(matches!(
            unsafe { context.create_trusted_font_face_bytes(&[0], f32::INFINITY) },
            Err(FontError::InvalidSize(_))
        ));
        assert!(matches!(
            unsafe { context.create_trusted_font_face_bytes(&[0], 16.0) },
            Err(FontError::LoadBytesFailed)
        ));
        assert!(matches!(
            unsafe { context.load_trusted_font("missing-font.ttf", 16.0) },
            Err(FontError::LoadFailed(_))
        ));
        assert!(!context.font_is_loaded());
        assert!(matches!(
            unsafe { context.load_trusted_font("missing-font.ttf", 0.0) },
            Err(FontError::InvalidSize(_))
        ));
        assert!(matches!(
            unsafe { context.load_trusted_font_bytes(&[], 16.0) },
            Err(FontError::EmptyData)
        ));
        assert!(matches!(
            unsafe { context.load_trusted_font_bytes(&[0], f32::NAN) },
            Err(FontError::InvalidSize(_))
        ));
        assert!(matches!(
            unsafe { context.load_trusted_font_bytes(&[0], 16.0) },
            Err(FontError::LoadBytesFailed)
        ));

        let fixture = font_fixture();
        let oversized = MAX_FONT_SIZE + 1.0;
        assert!(matches!(
            unsafe { context.create_trusted_font_face_bytes(&fixture, oversized) },
            Err(FontError::InvalidSize(size)) if size == oversized
        ));

        // Exercise the native boundary directly so callers outside the Rust wrapper
        // receive the same protection before stb_truetype performs float-to-int work.
        let native_face = unsafe {
            ffi::ds_font_face_create_ttf_bytes(fixture.as_ptr(), fixture.len(), oversized)
        };
        assert!(native_face.is_null());
        assert_eq!(
            unsafe { ffi::ds_font_load_ttf_bytes(fixture.as_ptr(), fixture.len(), oversized) },
            0
        );

        let fixture_path = std::env::temp_dir().join(format!(
            "displacer-oversized-font-fixture-{}.ttf",
            std::process::id()
        ));
        std::fs::write(&fixture_path, &fixture).expect("write oversized-font fixture");
        let fixture_path_c =
            CString::new(fixture_path.to_string_lossy().as_bytes()).expect("font fixture path");
        assert!(
            unsafe { ffi::ds_font_face_create_ttf(fixture_path_c.as_ptr(), oversized) }.is_null()
        );
        assert_eq!(
            unsafe { ffi::ds_font_load_ttf(fixture_path_c.as_ptr(), oversized) },
            0
        );
        std::fs::remove_file(fixture_path).expect("remove oversized-font fixture");
    }

    #[test]
    fn trusted_font_bytes_are_owned_and_text_uses_font_metrics() {
        let (_guard, mut context) = context();
        let fixture_path =
            std::env::temp_dir().join(format!("displacer-font-fixture-{}.ttf", std::process::id()));
        let mut data = font_fixture();
        std::fs::write(&fixture_path, &data).expect("write trusted test font");

        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans.
        unsafe { context.load_trusted_font(&fixture_path, 20.0) }.expect("load fixture by path");
        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans.
        let path_face = unsafe { context.create_trusted_font_face(&fixture_path, 20.0) }
            .expect("create owned fixture face by path");
        std::fs::remove_file(&fixture_path).expect("remove temporary font fixture");
        let path_width = context.text_width("AV").expect("path font width");
        assert_eq!(
            path_face.text_width("AV").expect("owned path face width"),
            path_width
        );
        context.unload_font();

        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans.
        unsafe { context.load_trusted_font_bytes(&data, 20.0) }.expect("load fixture bytes");
        data.fill(0);
        drop(data);

        let pair_width = context.text_width("AV").expect("byte font width");
        let separate_width =
            context.text_width("A").expect("A width") + context.text_width("V").expect("V width");
        assert!((pair_width - path_width).abs() < 0.001);
        assert!(
            pair_width < separate_width,
            "AV should use the font's kerning"
        );
        assert_eq!(
            context.text_width("AV\nA").expect("multiline width"),
            pair_width,
            "kerning state should reset on each line"
        );
        assert_eq!(context.font_height(), 20.0);

        let mut canvas = context.create_canvas(72, 32).expect("font canvas");
        canvas.clear(Color::from_hex(0xffffff));
        context
            .draw_text(&mut canvas, "Hgj", 2.0, 4.0, Color::from_hex(0x000000))
            .expect("draw TrueType text");
        assert!(
            canvas
                .pixels_argb8888()
                .iter()
                .all(|pixel| pixel >> 24 == 0xff),
            "glyph coverage should be composited into the opaque canvas"
        );
        assert!(
            canvas
                .pixels_argb8888()
                .iter()
                .any(|pixel| *pixel != 0xffff_ffff && *pixel != 0xff00_0000),
            "TrueType edges should retain grayscale antialiasing"
        );
        let ink_rows: Vec<_> = canvas
            .pixels_argb8888()
            .chunks_exact(canvas.width() as usize)
            .enumerate()
            .filter(|(_, row)| row.contains(&0xff00_0000))
            .map(|(row, _)| row)
            .collect();
        assert!(!ink_rows.is_empty(), "TrueType glyphs should render");
        assert!(ink_rows.iter().all(|row| *row >= 4 && *row < 24));

        let mut integer_origin = context.create_canvas(32, 28).expect("integer text canvas");
        let mut subpixel_origin = context.create_canvas(32, 28).expect("subpixel text canvas");
        integer_origin.clear(Color::from_hex(0xffffff));
        subpixel_origin.clear(Color::from_hex(0xffffff));
        context
            .draw_text(
                &mut integer_origin,
                "H",
                2.0,
                2.0,
                Color::from_hex(0x000000),
            )
            .expect("draw integer-positioned glyph");
        context
            .draw_text(
                &mut subpixel_origin,
                "H",
                2.5,
                2.0,
                Color::from_hex(0x000000),
            )
            .expect("draw subpixel-positioned glyph");
        assert_ne!(
            integer_origin.pixels_argb8888(),
            subpixel_origin.pixels_argb8888(),
            "fractional pen positions should reach the glyph rasterizer"
        );

        let mut normal = context.create_canvas(48, 28).expect("normal text canvas");
        let mut clipped = context.create_canvas(48, 28).expect("clipped text canvas");
        normal.clear(Color::from_hex(0xffffff));
        clipped.clear(Color::from_hex(0xffffff));
        context
            .draw_text(&mut normal, "AV", 2.0, 2.0, Color::from_hex(0x000000))
            .expect("draw normal pair");
        context
            .draw_text_clipped(
                &mut clipped,
                "AV",
                2.0,
                2.0,
                pair_width + context.font_height(),
                Color::from_hex(0x000000),
            )
            .expect("draw clipped pair");
        assert_eq!(normal.pixels_argb8888(), clipped.pixels_argb8888());
    }

    #[test]
    fn clipped_ttf_text_crops_right_ink_overhang_for_owned_and_global_faces() {
        let (_guard, mut context) = context();
        let data = oblique_font_fixture();
        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans Oblique.
        let face = unsafe { context.create_trusted_font_face_bytes(&data, 32.0) }
            .expect("create oblique face");
        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans Oblique.
        unsafe { context.load_trusted_font_bytes(&data, 32.0) }
            .expect("load oblique compatibility face");

        let origin_x = 4.0;
        let clip_width = face.text_width("f").expect("oblique f width").ceil();
        let clip_column = (origin_x + clip_width) as usize;
        let mut ordinary = context.create_canvas(48, 44).expect("ordinary canvas");
        let mut owned_clipped = context.create_canvas(48, 44).expect("owned clipped canvas");
        let mut global_clipped = context
            .create_canvas(48, 44)
            .expect("global clipped canvas");
        for canvas in [&mut ordinary, &mut owned_clipped, &mut global_clipped] {
            canvas.clear(Color::from_hex(0xffffff));
        }

        face.draw_text(&mut ordinary, "f", origin_x, 2.0, Color::from_hex(0x000000))
            .expect("draw ordinary oblique f");
        face.draw_text_clipped(
            &mut owned_clipped,
            "f",
            origin_x,
            2.0,
            clip_width,
            Color::from_hex(0x000000),
        )
        .expect("draw clipped owned oblique f");
        context
            .draw_text_clipped(
                &mut global_clipped,
                "f",
                origin_x,
                2.0,
                clip_width,
                Color::from_hex(0x000000),
            )
            .expect("draw clipped global oblique f");

        let has_ink = |canvas: &Canvas, columns: std::ops::Range<usize>| {
            canvas
                .pixels_argb8888()
                .chunks_exact(canvas.width() as usize)
                .any(|row| {
                    row[columns.clone()]
                        .iter()
                        .any(|pixel| *pixel != 0xffff_ffff)
                })
        };
        assert!(
            has_ink(&ordinary, clip_column..ordinary.width() as usize),
            "fixture must expose ink beyond the glyph advance"
        );
        for canvas in [&owned_clipped, &global_clipped] {
            assert!(has_ink(canvas, 0..clip_column), "clipping removed all ink");
            assert!(
                !has_ink(canvas, clip_column..canvas.width() as usize),
                "clipped TrueType ink crossed the requested right edge"
            );
        }
        assert_eq!(
            owned_clipped.pixels_argb8888(),
            global_clipped.pixels_argb8888(),
            "owned and compatibility faces must apply identical raster clipping"
        );
    }

    #[test]
    fn owned_font_faces_coexist_without_reloading_or_changing_the_default() {
        let (_guard, mut context) = context();
        let mut data = font_fixture();
        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans.
        let small = unsafe { context.create_trusted_font_face_bytes(&data, 12.0) }
            .expect("create small face");
        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans.
        let large = unsafe { context.create_trusted_font_face_bytes(&data, 24.0) }
            .expect("create large face");
        data.fill(0);
        drop(data);

        assert_eq!(small.height(), 12.0);
        assert_eq!(large.height(), 24.0);
        let small_width = small.text_width("AV").expect("small width");
        let large_width = large.text_width("AV").expect("large width");
        assert!(large_width > small_width * 1.9);
        assert!(!context.font_is_loaded());

        // Changing and unloading the compatibility face must not disturb either
        // explicitly owned face.
        let default_data = font_fixture();
        // SAFETY: the repository fixture is a trusted subset of DejaVu Sans.
        unsafe { context.load_trusted_font_bytes(&default_data, 18.0) }
            .expect("load compatibility face");
        assert_eq!(context.font_height(), 18.0);
        assert_eq!(
            small.text_width("AV").expect("small width again"),
            small_width
        );
        assert_eq!(
            large.text_width("AV").expect("large width again"),
            large_width
        );
        context.unload_font();
        assert_eq!(small.height(), 12.0);
        assert_eq!(large.height(), 24.0);

        let mut small_canvas = context.create_canvas(52, 32).expect("small canvas");
        let mut large_canvas = context.create_canvas(52, 32).expect("large canvas");
        small_canvas.clear(Color::from_hex(0xffffff));
        large_canvas.clear(Color::from_hex(0xffffff));
        small
            .draw_text(&mut small_canvas, "H", 2.0, 2.0, Color::from_hex(0x000000))
            .expect("draw small face");
        large
            .draw_text_clipped(
                &mut large_canvas,
                "H",
                2.0,
                2.0,
                large_width,
                Color::from_hex(0x000000),
            )
            .expect("draw large face");
        assert_ne!(
            small_canvas.pixels_argb8888(),
            large_canvas.pixels_argb8888()
        );
        assert!(
            small_canvas
                .pixels_argb8888()
                .iter()
                .any(|pixel| *pixel != 0xffff_ffff)
        );
        assert!(
            large_canvas
                .pixels_argb8888()
                .iter()
                .any(|pixel| *pixel != 0xffff_ffff)
        );
    }
}
