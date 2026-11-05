# AI Chat — Displacer Component Spec

> *Version v1 · Agent interfaces, message streams, model selection*

---

## Chat Bubble

| Variant | Background | Alignment | Corner |
|---------|-----------|-----------|--------|
| **user** | `primary` with 12% opacity | Right | 12px top-right |
| **assistant** | `bg.surface` | Left | 12px top-left |
| **system** | `bg.surface-alt` | Center | 8px all |
| **streaming** | `bg.surface` with pulse border | Left | 12px top-left |

### Anatomy

```
 ┌─────────────────────┐
 │ User message text   │  user variant — right aligned
 │ 10:32 AM            │  timestamp, optional
 └─────────────────────┘

┌──────────────────────────┐
│ ● ● ●                   │  typing indicator (streaming)
└──────────────────────────┘

┌──────────────────────────┐
│ ◆ Assistant response     │  assistant variant — left aligned
│ Contains markdown/code   │  with syntax highlighting
│                         │
│ [Copy] [Edit] [Retry]   │  action buttons on hover
└──────────────────────────┘
```

## Chat Input

| Part | Description |
|------|-------------|
| **Textarea** | Auto-resizing, 1–6 lines |
| **Send button** | Primary theme color, disabled when empty |
| **Model selector** | Dropdown in the trailing area |
| **Attachment** | Paperclip / upload button |
| **Token counter** | Current / max tokens (optional) |

### States

| State | Description |
|-------|-------------|
| **empty** | Placeholder text, send disabled |
| **typing** | Send enabled, growing textarea |
| **recording** | Voice input indicator (future) |
| **disabled** | No connection, reduced opacity |

## Model Badge

| Part | Description |
|------|-------------|
| **Model name** | Application-provided display name |
| **Quant badge** | `Q8_0`, `Q4_K_M`, etc. |
| **Status dot** | Online/idle/error |
| **Context window** | `32K` display |

## Inference Stats

| Metric | Display |
|--------|---------|
| **Tokens/second** | Large number + sparkline |
| **Context used** | Progress bar |
| **Active model** | Model badge |
| **GPU memory** | Bar with percentage |

## Agent Presence

> Public-facing presence badge (`ds-agent-presence`) — a calm, honest status
> sentence for a hosted agent: *"agent is awake"*. Use sleeping for a healthy
> resting state, rendered with the theme's information color and a breathing
> moon. Offline uses muted text. The host application supplies the state,
> note, and progress; the badge does not infer activity or connect to a service.

| State | Glyph | Colour | Feel |
|-------|-------|--------|------|
| **awake** | filled dot | `semantic.success` | steady, alive |
| **sleeping** | `☾` moon, breathing (3.2 s) | `semantic.info` | calm, healthy rest |
| **offline** | hollow ring | `fg.muted` | away, not broken |

### Anatomy

```
╭──────────────────────────────────────────────╮
│ ☾  agent is sleeping · resting · 51%         │  md — with note
│    ▔▔▔▔▔▔▔▔▔▔▔░░░░░░░░░░                     │  optional progress meter
╰──────────────────────────────────────────────╯
╭──────────────────────╮
│ ●  agent is awake    │  sm — note omitted (tight headers / mobile)
╰──────────────────────╯
```

| Part | Description |
|------|-------------|
| **Label** | Agent name (`label`), composed as "{label} is {state}" |
| **Note** | Application-provided detail; `md` size only |
| **Progress** | Optional application-provided 0–1 meter; hidden at 0 |
| **Sizes** | `sm` (headers/mobile), `md` (default) |

```html
<ds-agent-presence label="agent" state="awake"></ds-agent-presence>
```

Set numeric progress through the element's `progress` property or attribute.
The breathing animation is enabled only when the user has not requested
reduced motion.
