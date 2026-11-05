# Audio controls

The web and native C libraries provide a rotary knob, fader, level meter, and
XY pad for audio and DSP interfaces. These are UI controls: applications supply
audio processing, signal measurements, and any parameter mapping.

Web implementations are in
[`audio/audio.ts`](../../lib/libdisplacer-ts/src/components/audio/audio.ts).
Native declarations are in
[`widgets.h`](../../lib/libdisplacer-native/include/displacer/widgets.h), with
rendering and mapping helpers in
[`widgets.c`](../../lib/libdisplacer-native/src/core/widgets.c).

| Control | Web element | Native type | Values |
| --- | --- | --- | --- |
| Rotary knob | `ds-knob` | `ds_knob` | Value within an application-defined min/max range |
| Fader | `ds-fader` | `ds_fader` | Value within min/max, horizontal or vertical |
| Level meter | `ds-meter` | `ds_meter` | Level from 0 to 1; optional peak, hidden when negative |
| XY pad | `ds-xy-pad` | `ds_xy_pad` | X and Y from 0 to 1, with Y increasing upward |

## Web integration

Importing the library's root or components entry registers these elements.
Knob and fader expose `min`, `max`, `step`, `value`, `label`, `unit`, and
`disabled` properties. Knob also exposes `size` (`sm`, `md`, or `lg`); fader
and meter expose `orientation` (`horizontal` or `vertical`).

```html
<ds-knob label="Gain" min="0" max="1" step="0.01" value="0.5"></ds-knob>
<ds-fader label="Level" orientation="vertical" value="0.5"></ds-fader>
<ds-meter orientation="vertical" value="0.5" peak="0.75"></ds-meter>
<ds-xy-pad x="0.5" y="0.5"></ds-xy-pad>
```

Knob and fader emit bubbling, composed `ds-input` events with
`detail: { value }`; XY pad emits `detail: { x, y }`. The meter is display-only,
and its peak indicator uses the value the host supplies; it does not calculate
peak hold or decay.

The current interactive controls use pointer input. Keyboard handling, focus
semantics, and accessible names need application integration before relying on
these controls for an accessible audio interface.

## Native integration

Initialize and render the corresponding struct, set `base.bounds`, and route
input in the host application. `ds_knob_drag` applies a vertical drag delta;
`ds_fader_value_at` maps a pointer position to its value; `ds_xy_pad_set_from`
maps a pointer position to normalized X and Y. The meter reads the host-provided
`value` and `peak` fields.

Native and web controls differ in styling and API details. In particular, the
native knob/fader do not provide the web `step` or `disabled` properties. See the
[coverage matrix](../../PORTING.md) when porting an interface.
