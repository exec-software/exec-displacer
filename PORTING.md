# Component coverage

This matrix identifies corresponding source implementations in TypeScript and
native C. A counterpart means that code exists; it does not establish matching
features, interaction, accessibility, or rendering. The component specifications
describe design targets, and support varies by implementation.

TypeScript paths below are relative to
[`lib/libdisplacer-ts/src/components/`](lib/libdisplacer-ts/src/components/),
except where a full source path is shown. Native declarations are in
[`widgets.h`](lib/libdisplacer-native/include/displacer/widgets.h),
[`ext.h`](lib/libdisplacer-native/include/displacer/ext.h), and
[`core.h`](lib/libdisplacer-native/include/displacer/core.h). Rendering and
behavior are implemented in
[`widgets.c`](lib/libdisplacer-native/src/core/widgets.c),
[`ext.c`](lib/libdisplacer-native/src/core/ext.c), and
[`core.c`](lib/libdisplacer-native/src/core/core.c).

The Rust wrapper currently covers canvas rendering, themes, and fonts; it does
not expose the C widget APIs listed here. Native applications provide their own
window, input routing, and presentation layer.

## Components with native counterparts

| Component | TypeScript source | Native declaration | Scope and limitations |
| --- | --- | --- | --- |
| Button | `button/button.ts` | `widgets.h`: `ds_button` | Native variant and size enums; event and loading behavior differ |
| Label | — | `widgets.h`: `ds_label` | Native text widget; web applications can use ordinary text elements |
| Card | `card/card.ts` | `widgets.h`: `ds_card` | Native title/body renderer; web slots and interaction differ |
| Pill | `data/misc.ts` | `widgets.h`: `ds_pill` | Native `closable` field exists, but close-button behavior is not implemented |
| Metric | `data/data.ts` | `widgets.h`: `ds_metric` | Native label/value/trend renderer |
| Progress | `data/data.ts` | `widgets.h`: `ds_progress` | Native value/max bar renderer |
| Stat card | `data/data.ts` | `widgets.h`: `ds_stat_card` | Native label/value renderer; icon field is not rendered |
| Sparkline | `data/visualization.ts` | `widgets.h`: `ds_sparkline` | Native line renderer |
| Gauge | `data/visualization.ts` | `widgets.h`: `ds_gauge` | Native value/max renderer |
| Toast | `data/toast.ts` | `widgets.h`: `ds_toast` | Native rendering; host manages timing and dismissal |
| Menu | `navigation/menu.ts` | `widgets.h`: `ds_menu` | Native list limited to 8 items; web dropdown interaction differs |
| Menu item | `navigation/menu.ts` | `widgets.h`: `ds_menu_item` | Native label, shortcut, and danger rendering |
| View | `navigation/menu.ts` | `widgets.h`: `ds_view` | Native title/icon renderer; no web-style child slots |
| Scroll view | `data/misc.ts` | `widgets.h`: `ds_scroll_view` | Native begin/end clipping API; host supplies scrolling behavior |
| Container | `layout/layout.ts` | `widgets.h`: `ds_container_legacy` | Legacy background container; layout also has separate container sizing helpers |
| Typing indicator | `ai/chat.ts` | `widgets.h`: `ds_typing` | Native renderer uses elapsed state supplied by host |
| Model badge | `ai/chat.ts` | `widgets.h`: `ds_model_badge` | Native model, quantization, and status display; context is stored but not rendered |
| Status bar | `data/misc.ts` | `widgets.h`: `ds_status_bar` | Native background region |
| Dialog | `dialog/dialog.ts` | `ext.h`: `ds_dialog` | Native size variants render; web focus and modal behavior differ |
| Input | `input/input.ts` | `ext.h`: `ds_input` | Native label/hint and error/warning styling; text editing is limited to ASCII append/backspace |
| Navigation bar | `navigation/navigation.ts` | `ext.h`: `ds_navbar` | Native flat list limited to 8 items |
| Navigation item | `navigation/navigation.ts` | `ext.h`: `ds_nav_item` | Native active/disabled/badge rendering; no link navigation |
| Tabs | `layout/panels.ts` | `ext.h`: `ds_tabs` | Native labels and selection, limited to 8 tabs |
| Chat bubble | `ai/chat.ts` | `ext.h`: `ds_chat_bubble` | Native user/assistant/system text; no web streaming or action controls |
| Table | `data/table.ts` | `ext.h`: `ds_table` | Native string sorting; fixed 16-column and 100-row limits |
| User avatar | `data/enterprise.ts` | `ext.h`: `ds_user_avatar` | Native initial/name/detail display |
| Filter bar | `data/enterprise.ts` | `ext.h`: `ds_filter_bar` | Native query buffer and ASCII editing; host performs filtering |
| File dialog | `lib/libdisplacer-ts/src/ext/open-file-dialog.ts` | `ext.h`: `ds_file_dialog` | Native simulated file list; selection handler is a stub, with no filesystem integration |
| Bar chart | `data/viz-advanced.ts` | `ext.h`: `ds_bar_chart` | Native grouped bars; fixed series/data limits and no stacked rendering |
| Scatter plot | `data/viz-advanced.ts` | `ext.h`: `ds_scatter_plot` | Native point rendering, limited to 100 points |
| Heatmap | `data/viz-advanced.ts` | `ext.h`: `ds_heatmap` | Native cell rendering, limited to 12×12 values |
| Stream chart | `data/viz-advanced.ts` | `ext.h`: `ds_stream_chart` | Native rolling line renderer, limited to 80 points |
| Log viewer | `data/enterprise.ts` | `ext.h`: `ds_log_viewer` | Native fixed buffer; host manages scroll/input behavior |
| Account card | `data/enterprise.ts` | `ext.h`: `ds_account_card` | Native name/email/role renderer |
| Tool window | `layout/windows.ts` | `ext.h`: `ds_tool_window` | Native window decoration; host handles movement and interaction |
| Marquee | `data/misc.ts` | `ext.h`: `ds_marquee` | Native renderer uses offset supplied by host |
| Knob | `audio/audio.ts` | `widgets.h`: `ds_knob` | Native rotary renderer and drag-delta helper; web step quantization and disabled state are separate features |
| Fader | `audio/audio.ts` | `widgets.h`: `ds_fader` | Native horizontal/vertical renderer and pointer-to-value helper; host handles input routing |
| Level meter | `audio/audio.ts` | `widgets.h`: `ds_meter` | Host supplies normalized level and optional peak; gradient/segment rendering differs |
| XY pad | `audio/audio.ts` | `widgets.h`: `ds_xy_pad` | Native renderer and pointer-to-position helper; host routes input and reacts to changes |

## Web features without a direct native widget API

| Component | TypeScript source | Purpose |
| --- | --- | --- |
| Agent presence | `ai/presence.ts` | Awake/sleeping/offline badge with optional note and progress |
| Textarea | `input/textarea.ts` | Multiline text entry, status, label, hint, input/change events |
| Select | `input/select.ts` | Option dropdown with label, hint, status, and change events |
| Model selector | `data/model-selector.ts` | Loaded/available grouping, loading/error states, model-change events |
| Phase portrait | `data/phase-portrait.ts` | Canvas-based phase visualization |
| Canvas | `data/canvas.ts` | WebGL shader canvas; native drawing uses the separate CPU canvas API |
| Floating window | `layout/float-window.ts` | Draggable web window shell |
| Developer console | `lib/libdisplacer-ts/src/prefabs/dev-console.ts` | Optional application-backed console and agent UI |

## Shared services

| Area | Web source | Native API | Differences |
| --- | --- | --- | --- |
| Layout | `lib/libdisplacer-ts/src/components/layout/layout.ts` | `core.h`: `ds_layout`, `ds_layout_container` | CSS layout and native bounds calculations have different sizing and input contracts |
| Themes | `lib/libdisplacer-ts/src/theme/engine.ts` | `core.h`: `ds_theme`, `ds_current_theme` | Web registry and optional font/audio/shader metadata; native palettes are process-global |
| Localization | `lib/libdisplacer-ts/src/i18n/index.ts` | `core.h`: `ds_lang_get`, `_` | Separate dictionaries and registration APIs; native localization is process-global |

## Known gaps to consider when porting

- Native input declares search/password variants but currently renders its text
  buffer directly. Do not use it to conceal passwords. Native sizes are `sm`,
  `md`, and `lg`; status values also differ from the web input.
- Native tables support lexicographic string sorting, but have fixed capacity
  and do not offer every web variant or empty-state presentation.
- Several native structs are immediate rendering helpers rather than retained
  widgets. A field or function declaration alone does not imply automatic event
  dispatch, keyboard handling, child layout, or lifecycle management.
- The libraries do not have a shared conformance suite. Review and test each
  feature you depend on, including theme contrast, focus, and input behavior.
- Clay Light is currently a web palette and theme manifest; the native C and
  Rust built-ins do not include it. Audio controls exist in both web and C, but
  neither implementation supplies audio processing or signal measurement.
