type ChatRole = 'user' | 'assistant' | 'system'

type SourceStatus = 'online' | 'sleeping' | 'offline'

interface Project {
  id: string
  name: string
  description: string
}

interface SourceModel {
  id: string
  quant?: string
  context?: number
}

interface InferenceSource {
  id: string
  name: string
  baseUrl: string
  status: SourceStatus
  note?: string
  models: SourceModel[]
}

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: string
  sourceId: string
  modelId: string
  isPinned?: boolean
}

interface PinnedConversation {
  id: string
  threadId: string
  messageId: string
  threadTitle: string
  snippet: string
  sourceName: string
  createdAt: number
}

interface ChatThread {
  id: string
  title: string
  createdAt: number
  projectId: string
  sourceId: string
  modelId: string
  isPinned: boolean
  messages: ChatMessage[]
}

interface StreamingState {
  threadId: string
  messageId: string
  timer: number
  cursor: number
  fullText: string
}

const BASE_SOURCES: InferenceSource[] = [
  {
    id: 'openai-compatible',
    name: 'OpenAI-compatible',
    baseUrl: 'https://api.openai.com/v1',
    status: 'online',
    note: 'General chat and tool routing ready.',
    models: [
      { id: 'gpt-4.1', quant: 'FP16', context: 128000 },
      { id: 'gpt-4.1-mini', quant: 'FP16', context: 128000 },
      { id: 'o4-mini', quant: 'Q4_K_M', context: 200000 },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    status: 'online',
    note: 'Constitutional-safe model routing.',
    models: [
      { id: 'claude-opus-4', quant: 'Q8_0', context: 200000 },
      { id: 'claude-sonnet-4', quant: 'Q4_K_M', context: 200000 },
    ],
  },
  {
    id: 'local',
    name: 'Local Runner',
    baseUrl: 'http://localhost:11434',
    status: 'sleeping',
    note: 'Load-on-demand. Wake takes longer.',
    models: [
      { id: 'qwen3-coder', quant: 'Q8_0', context: 32768 },
      { id: 'llama-3.3-70b', quant: 'Q4_K_M', context: 32768 },
      { id: 'mistral-large', quant: 'Q5_K_M', context: 8192 },
    ],
  },
]

const BASE_PROJECTS: Project[] = [
  { id: 'inbox', name: 'Inbox', description: 'General workspaces and drafts' },
  { id: 'projects', name: 'Projects', description: 'Work grouped by active scope' },
  { id: 'research', name: 'Research', description: 'Experiments and notes' },
]

const BASE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
}

const appState = {
  sources: [...BASE_SOURCES] as InferenceSource[],
  threads: [] as ChatThread[],
  projects: [...BASE_PROJECTS] as Project[],
  activeProjectId: BASE_PROJECTS[0].id,
  activeThreadId: '',
  activeSourceId: BASE_SOURCES[0].id,
  activeModelId: BASE_SOURCES[0].models[0].id,
  threadSearch: '',
  pinnedConversations: [] as PinnedConversation[],
  isStreaming: false,
  streamState: null as StreamingState | null,
}

const getId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const formatTime = () => new Date().toLocaleTimeString([], BASE_TIME_OPTIONS)

const appendTextElement = <K extends keyof HTMLElementTagNameMap>(
  parent: Node,
  tagName: K,
  className: string,
  text: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName)
  element.className = className
  element.textContent = text
  parent.appendChild(element)
  return element
}

const createThread = (sourceId = appState.activeSourceId, modelId = appState.activeModelId): ChatThread => ({
  id: getId(),
  title: 'New Conversation',
  createdAt: Date.now(),
  projectId: appState.activeProjectId,
  isPinned: false,
  sourceId,
  modelId,
  messages: [],
})

const getActiveThread = (): ChatThread | undefined => appState.threads.find((t) => t.id === appState.activeThreadId)

const getActiveSource = (): InferenceSource | undefined =>
  appState.sources.find((s) => s.id === appState.activeSourceId)

const getActiveProject = (): Project | undefined =>
  appState.projects.find((project) => project.id === appState.activeProjectId)

const getSourceById = (id: string): InferenceSource | undefined =>
  appState.sources.find((s) => s.id === id)

const getModelByIds = (sourceId: string, modelId: string): SourceModel | undefined =>
  appState.sources.find((source) => source.id === sourceId)?.models.find((model) => model.id === modelId)

const resolveModelId = (sourceId: string, modelId?: string) => {
  const source = getSourceById(sourceId)
  if (!source || !source.models.length) return ''
  if (modelId && source.models.some((m) => m.id === modelId)) return modelId
  return source.models[0].id
}

const getThreadsForActiveProject = (): ChatThread[] =>
  appState.threads.filter((thread) => thread.projectId === appState.activeProjectId)

const updateTitleFromMessage = (thread: ChatThread, text: string) => {
  const clean = text.trim()
  if (!clean) return
  if (thread.messages.length > 2) return
  thread.title = clean.length > 42 ? `${clean.slice(0, 42)}…` : clean
}

const makeReply = (prompt: string, source: InferenceSource, model: SourceModel): string => {
  const lowered = prompt.toLowerCase()

  if (lowered.includes('source') || lowered.includes('provider') || lowered.includes('models')) {
    const modelList = source.models.map((m) => m.id).join(', ')
    return `Inference source: ${source.name}.\n\nAvailable for this route: ${modelList}.\n\nI can switch the active model per message if you want, and route can be extended to mix providers in a single conversation.`
  }

  if (lowered.includes('hello') || lowered.includes('hi')) {
    return `Hey — great to connect. I’m running this conversation through ${source.name} (${model.id}).`
  }

  if (lowered.includes('help')) {
    return `I can help draft, refactor, summarize, design components, or plan your next implementation step. Right now we’re live in the ` +
      `Displacer demo shell, so your next action can still wire this to real inference endpoints.`
  }

  return `Got it — processed with ${source.name} using ${model.id}.` +
    `\n\nI can route this back through a different model if you want, and I can also surface model health, latency, and toolchain state on the right rail.`
}

const renderThreads = () => {
  const pinnedList = document.querySelector<HTMLElement>('#pinned-conversations')
  const allList = document.querySelector<HTMLElement>('#thread-list')
  const activeThread = getActiveThread()
  if (!allList || !pinnedList) return

  const normalized = appState.threadSearch.trim().toLowerCase()

  const activeProjectThreads = getThreadsForActiveProject()
  const visibleThreads = activeProjectThreads.filter((thread) => {
    if (!normalized) return true
    const last = thread.messages.at(-1)
    const haystack = `${thread.title} ${last?.content ?? ''}`.toLowerCase()
    return haystack.includes(normalized)
  })
  const pinnedConversations = appState.pinnedConversations
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((entry) => {
      const thread = appState.threads.find((candidate) => candidate.id === entry.threadId)
      if (!thread) return false
      if (thread.projectId !== appState.activeProjectId) return false
      if (!normalized) return true
      const haystack = `${thread.title} ${entry.snippet}`.toLowerCase()
      return haystack.includes(normalized)
  })

  const renderThreadList = (listEl: HTMLElement, sourceThreads: ChatThread[]) => {
    listEl.replaceChildren()
    if (!sourceThreads.length) {
      const row = document.createElement('div')
      row.className = 'thread-empty'
      row.textContent = listEl.id === 'thread-list' ? 'No recent conversations yet.' : 'No pinned conversations yet.'
      listEl.appendChild(row)
      return
    }

    for (const thread of sourceThreads) {
      const item = document.createElement('button')
      const last = thread.messages.at(-1)
      item.type = 'button'
      item.className = `thread-item ${thread.id === appState.activeThreadId ? 'active' : ''}`
      item.dataset.threadId = thread.id
      const itemTop = document.createElement('div')
      itemTop.className = 'thread-item-top'
      appendTextElement(itemTop, 'div', 'thread-title', thread.title)
      item.appendChild(itemTop)
      appendTextElement(item, 'div', 'thread-sub', last ? `${last.role}: ${last.content.slice(0, 62)}` : 'Empty thread')
      appendTextElement(
        item,
        'div',
        'thread-sub muted',
        new Date(thread.createdAt).toLocaleTimeString([], BASE_TIME_OPTIONS),
      )
      item.addEventListener('click', () => {
        appState.activeThreadId = thread.id
        appState.activeSourceId = thread.sourceId
        appState.activeModelId = resolveModelId(thread.sourceId, thread.modelId)
        renderAll()
      })

      if (thread.id === activeThread?.id && appState.isStreaming) {
        item.classList.add('streaming')
      }

      listEl.appendChild(item)
    }
  }

  const allVisibleThreads = visibleThreads.slice().sort((a, b) => b.createdAt - a.createdAt)
  renderThreadList(allList, allVisibleThreads)

  pinnedList.replaceChildren()
  if (!pinnedConversations.length) {
    const row = document.createElement('div')
    row.className = 'thread-empty'
    row.textContent = 'No pinned conversations yet.'
    pinnedList.appendChild(row)
  } else {
    for (const entry of pinnedConversations) {
      const thread = appState.threads.find((candidate) => candidate.id === entry.threadId)
      if (!thread) continue
      const pinRow = document.createElement('div')
      pinRow.className = 'thread-item-shell'

      const openPin = document.createElement('button')
      openPin.type = 'button'
      openPin.className = `thread-item ${entry.threadId === appState.activeThreadId ? 'active' : ''}`
      openPin.dataset.threadId = entry.threadId
      const itemTop = document.createElement('div')
      itemTop.className = 'thread-item-top'
      appendTextElement(itemTop, 'div', 'thread-title', thread.title)
      openPin.appendChild(itemTop)
      appendTextElement(openPin, 'div', 'thread-sub', `${entry.sourceName} · ${entry.snippet}`)
      appendTextElement(
        openPin,
        'div',
        'thread-sub muted',
        new Date(entry.createdAt).toLocaleTimeString([], BASE_TIME_OPTIONS),
      )
      openPin.addEventListener('click', () => {
        appState.activeThreadId = entry.threadId
        const pinnedThread = appState.threads.find((thread) => thread.id === entry.threadId)
        if (pinnedThread) {
          appState.activeProjectId = pinnedThread.projectId
          appState.activeSourceId = pinnedThread.sourceId
          appState.activeModelId = resolveModelId(pinnedThread.sourceId, pinnedThread.modelId)
        }
        renderAll()
      })

      const removePin = document.createElement('button')
      removePin.type = 'button'
      removePin.className = 'thread-pin thread-pin-badge'
      removePin.textContent = 'Unpin'
      removePin.setAttribute('aria-label', `Unpin conversation ${thread.title}`)
      removePin.addEventListener('click', () => {
        appState.pinnedConversations = appState.pinnedConversations.filter((candidate) => candidate.messageId !== entry.messageId)
        renderAll()
      })

      pinRow.append(openPin, removePin)
      pinnedList.appendChild(pinRow)
    }
  }
}

const renderProjects = () => {
  const projectList = document.querySelector<HTMLElement>('#project-list')
  if (!projectList) return

  projectList.replaceChildren()

  for (const project of appState.projects) {
    const item = document.createElement('button')
    item.type = 'button'
    const projectCount = appState.threads.filter((thread) => thread.projectId === project.id).length
    item.className = `project-item ${project.id === appState.activeProjectId ? 'active' : ''}`
    const label = document.createElement('div')
    label.className = 'project-label'
    appendTextElement(label, 'span', '', project.name)
    appendTextElement(label, 'span', 'project-count', String(projectCount))
    item.appendChild(label)
    appendTextElement(item, 'div', 'project-description', project.description)
    item.addEventListener('click', () => {
      appState.activeProjectId = project.id
      const projectThreads = getThreadsForActiveProject()
      if (projectThreads.length && !projectThreads.includes(getActiveThread() as ChatThread)) {
        appState.activeThreadId = projectThreads[0].id
        appState.activeSourceId = projectThreads[0].sourceId
        appState.activeModelId = resolveModelId(projectThreads[0].sourceId, projectThreads[0].modelId)
      } else if (!projectThreads.length) {
        const first = appState.threads.find((thread) => thread.projectId === project.id) ??
          createThread()
        if (!appState.threads.find((thread) => thread.id === first.id)) {
          appState.threads.unshift(first)
        }
        appState.activeThreadId = first.id
      }
      renderAll()
    })
    projectList.appendChild(item)
  }
}

const getPinnedConversationEntry = (threadId: string, messageId: string) =>
  appState.pinnedConversations.findIndex((entry) => entry.threadId === threadId && entry.messageId === messageId)

const togglePinnedConversation = (thread: ChatThread, message: ChatMessage) => {
  const index = getPinnedConversationEntry(thread.id, message.id)
  if (index >= 0) {
    appState.pinnedConversations.splice(index, 1)
    return
  }

  const source = getSourceById(message.sourceId)
  const sourceName = source?.name ?? 'Unknown source'
  appState.pinnedConversations.push({
    id: getId(),
    threadId: thread.id,
    messageId: message.id,
    threadTitle: thread.title,
    snippet: message.content.slice(0, 120),
    sourceName,
    createdAt: Date.now(),
  })
}

const renderComposerModelSelect = () => {
  const modelSelect = document.querySelector<HTMLSelectElement>('#model-select')
  if (!modelSelect) return

  const sourceId = appState.activeSourceId
  const source = getSourceById(sourceId) ?? appState.sources[0]
  if (!source) return
  appState.activeModelId = resolveModelId(source.id, appState.activeModelId)

  modelSelect.replaceChildren()
  for (const model of source.models) {
    const option = document.createElement('option')
    option.value = model.id
    option.textContent = `${model.id} (${model.quant ?? 'FP16'})`
    option.selected = model.id === appState.activeModelId
    modelSelect.appendChild(option)
  }
  modelSelect.value = appState.activeModelId
  modelSelect.disabled = !source.models.length
}

const renderRightRail = () => {
  const threadTitle = document.querySelector<HTMLElement>('#right-rail-title')
  const threadMeta = document.querySelector<HTMLElement>('#right-rail-meta')
  const threadSource = document.querySelector<HTMLElement>('#right-rail-source')
  const threadEmpty = document.querySelector<HTMLElement>('#right-rail-empty')
  const activeThread = getActiveThread()
  const activeSource = getActiveSource()

  if (!threadTitle || !threadMeta || !threadSource || !threadEmpty) return

  if (!activeThread) {
    threadTitle.textContent = 'No active thread'
    threadMeta.textContent = ''
    threadSource.textContent = ''
    threadEmpty.hidden = false
    return
  }

  if (!activeThread.messages.length) {
    threadTitle.textContent = activeThread.title
    threadMeta.textContent = 'Start a conversation to open the task and slideout workspace.'
    threadSource.textContent = activeSource ? `${activeSource.name}` : 'No source'
    threadEmpty.hidden = false
    return
  }

  threadEmpty.hidden = true
  threadTitle.textContent = 'Thread context'
  threadMeta.textContent = `${activeThread.messages.length} messages`
  threadSource.textContent = activeSource ? `Source: ${activeSource.name}` : 'No source'
}

const renderMessages = () => {
  const messages = document.querySelector<HTMLElement>('#chat-messages')
  const emptyState = document.querySelector<HTMLElement>('#chat-empty')
  const activeThread = getActiveThread()
  const typing = document.querySelector<HTMLElement>('#typing-indicator')
  if (!messages || !emptyState || !typing) return

  messages.replaceChildren()
  if (!activeThread || !activeThread.messages.length) {
    messages.style.display = 'none'
    emptyState.style.display = 'grid'
    typing.style.display = 'none'
    return
  }

  messages.style.display = 'grid'
  emptyState.style.display = 'none'

  for (const message of activeThread.messages) {
    const row = document.createElement('div')
    const bubble = document.createElement('ds-chat-bubble')
    const source = getSourceById(message.sourceId)
    const model = getModelByIds(message.sourceId, message.modelId)
    const time = message.time

    row.className = `message-row ${message.role}`
    bubble.role = message.role
    bubble.time = time
    bubble.showAvatar = message.role !== 'system'
    if (message.role === 'assistant' && source && model) {
      const badge = document.createElement('ds-model-badge')
      badge.model = `${source.name} ${model.id}`
      badge.quant = model.quant ?? ''
      badge.context = model.context ?? 0
      badge.status = source.status === 'online' ? 'online' : source.status === 'sleeping' ? 'busy' : 'error'
      row.className = 'message-row'
      row.appendChild(badge)
    }

    if (message.role === 'system') {
      const content = document.createElement('div')
      content.textContent = message.content
      bubble.appendChild(content)
    } else {
      const content = document.createElement('p')
      content.textContent = message.content
      bubble.appendChild(content)
    }

    row.appendChild(bubble)
    if (message.role !== 'system') {
      const actions = document.createElement('div')
      const isPinned = getPinnedConversationEntry(activeThread.id, message.id) >= 0
      actions.className = 'message-actions'
      const actionButton = document.createElement('button')
      actionButton.type = 'button'
      actionButton.className = isPinned ? 'message-pin pinned' : 'message-pin'
      actionButton.dataset.messagePin = message.id
      actionButton.textContent = isPinned ? 'Unpin conversation' : 'Pin conversation'
      actionButton.addEventListener('click', () => {
        togglePinnedConversation(activeThread, message)
        renderAll()
      })
      actions.appendChild(actionButton)
      row.appendChild(actions)
    }
    messages.appendChild(row)
  }

  const shouldShowTyping = appState.isStreaming
  typing.style.display = shouldShowTyping ? 'flex' : 'none'

  messages.scrollTop = messages.scrollHeight
}

const renderHeader = () => {
  const title = document.querySelector<HTMLElement>('#active-thread-title')
  const summary = document.querySelector<HTMLElement>('#active-thread-summary')
  const statusDot = document.querySelector<HTMLElement>('#status-dot')

  const thread = getActiveThread()
  const source = getActiveSource()
  if (!title || !summary || !statusDot) return

  if (thread) {
    title.textContent = thread.title
  } else {
    title.textContent = 'No active conversation'
  }

  const modelText = resolveModelId(source?.id ?? appState.activeSourceId, appState.activeModelId)
  summary.textContent = source
    ? `Model: ${modelText || 'No model selected'} · Messages: ${thread?.messages.length ?? 0}`
    : 'No inference source configured'

  statusDot.classList.toggle('status-dot-online', source?.status === 'online')
  statusDot.classList.toggle('status-dot-sleeping', source?.status === 'sleeping')
  statusDot.classList.toggle('status-dot-offline', source?.status === 'offline' || !source)
}

const renderComposer = () => {
  const composer = document.querySelector<HTMLTextAreaElement>('#composer-input')
  const send = document.querySelector<HTMLButtonElement>('#composer-send')
  const sendMeta = document.querySelector<HTMLElement>('#composer-send-meta')
  const addButton = document.querySelector<HTMLButtonElement>('#composer-add')
  const accessButton = document.querySelector<HTMLButtonElement>('#composer-access')
  const voiceButton = document.querySelector<HTMLButtonElement>('#composer-voice')
  const modelSelect = document.querySelector<HTMLSelectElement>('#model-select')
  if (!composer || !send || !sendMeta) return

  const canSend = !appState.isStreaming && !!appState.activeSourceId && !!appState.activeModelId && !!composer.value.trim()
  send.disabled = !canSend
  sendMeta.textContent = appState.isStreaming
    ? 'Streaming…'
    : canSend
      ? 'Enter to send · Shift+Enter for newline'
      : 'Select model and type a message'

  if (addButton) {
    addButton.setAttribute('aria-pressed', addButton.classList.contains('active') ? 'true' : 'false')
  }
  accessButton?.setAttribute('aria-pressed', accessButton?.classList.contains('active') ? 'true' : 'false')
  voiceButton?.setAttribute('aria-pressed', voiceButton.classList.contains('is-active') ? 'true' : 'false')
  if (modelSelect) {
    modelSelect.disabled = !appState.activeSourceId
  }
}

const renderAll = () => {
  renderProjects()
  renderThreads()
  renderComposerModelSelect()
  renderRightRail()
  renderHeader()
  renderMessages()
  renderComposer()
}

const appendThread = (sourceId = appState.activeSourceId, modelId = appState.activeModelId) => {
  appState.threads.unshift(createThread(sourceId, modelId))
  appState.activeThreadId = appState.threads[0].id
}

const stopStream = () => {
  if (!appState.streamState) return
  window.clearInterval(appState.streamState.timer)

  const thread = appState.threads.find((candidate) => candidate.id === appState.streamState!.threadId)
  if (thread) {
    const reply = thread.messages.find((message) => message.id === appState.streamState!.messageId)
    if (reply && !reply.content.includes('\n\n[interrupted]')) {
      reply.content += '\n\n[interrupted]'
    }
  }

  appState.streamState = null
  appState.isStreaming = false
  renderAll()
}

const sendMessage = () => {
  const composer = document.querySelector<HTMLTextAreaElement>('#composer-input')
  const thread = getActiveThread()
  const source = getSourceById(appState.activeSourceId)
  const model = getModelByIds(appState.activeSourceId, appState.activeModelId)
  if (!composer || !thread || appState.isStreaming || !source || !model || !composer.value.trim()) return
  const threadId = thread.id

  const userText = composer.value.trim()
  const userMsg: ChatMessage = {
    id: getId(),
    role: 'user',
    content: userText,
    time: formatTime(),
    sourceId: source.id,
    modelId: model.id,
  }
  thread.messages.push(userMsg)
  updateTitleFromMessage(thread, userText)
  thread.sourceId = source.id
  thread.modelId = model.id

  const assistantMsg: ChatMessage = {
    id: getId(),
    role: 'assistant',
    content: '',
    time: formatTime(),
    sourceId: source.id,
    modelId: model.id,
  }
  thread.messages.push(assistantMsg)

  appState.isStreaming = true
  composer.value = ''
  composer.style.height = '44px'
  renderAll()

  const reply = makeReply(userText, source, model)
  const chunk = 16

  if (appState.streamState) {
    window.clearInterval(appState.streamState.timer)
  }

  appState.streamState = {
    threadId,
    messageId: assistantMsg.id,
    timer: window.setInterval(() => {
      const targetThread = appState.threads.find((candidate) => candidate.id === threadId)
      if (!targetThread) {
        stopStream()
        return
      }

      const targetMessage = targetThread.messages.find((message) => message.id === assistantMsg.id)
      if (!targetMessage) {
        stopStream()
        return
      }

      if (!appState.streamState) {
        return
      }

      const next = Math.min(appState.streamState.cursor + chunk, reply.length)
      targetMessage.content = reply.slice(0, next)
      appState.streamState.cursor = next

      if (appState.streamState && next >= reply.length) {
        appState.isStreaming = false
        window.clearInterval(appState.streamState.timer)
        appState.streamState = null
      }
      renderMessages()
    }, 24),
    cursor: chunk,
    fullText: reply,
  } as StreamingState
}

const syncComposerHeight = () => {
  const composer = document.querySelector<HTMLTextAreaElement>('#composer-input')
  if (!composer) return

  composer.style.height = '44px'
  const limit = 160
  composer.style.height = `${Math.min(limit, composer.scrollHeight)}px`
}

const wireEvents = () => {
  const modelSelect = document.querySelector<HTMLSelectElement>('#model-select')
  const newThread = document.querySelector<HTMLButtonElement>('#quick-new-chat')
  const addThreadFromComposer = document.querySelector<HTMLButtonElement>('#composer-add')
  const send = document.querySelector<HTMLButtonElement>('#composer-send')
  const composer = document.querySelector<HTMLTextAreaElement>('#composer-input')
  const threadSearch = document.querySelector<HTMLInputElement>('#thread-search')
  const voiceButton = document.querySelector<HTMLButtonElement>('#composer-voice')
  const quickItems = document.querySelectorAll<HTMLButtonElement>('.quick-menu-item')

  modelSelect?.addEventListener('change', () => {
    appState.activeModelId = modelSelect.value
    const activeThread = getActiveThread()
    if (activeThread && activeThread.messages.length === 0) {
      activeThread.modelId = appState.activeModelId
    }
    renderAll()
  })

  const startNewThread = () => {
    stopStream()
    appendThread()
    renderAll()
    composer?.focus()
  }
  newThread?.addEventListener('click', startNewThread)
  addThreadFromComposer?.addEventListener('click', startNewThread)

  quickItems.forEach((item) => {
    item.addEventListener('click', () => {
      quickItems.forEach((current) => current.classList.remove('active'))
      item.classList.add('active')
    })
  })

  const submit = () => {
    sendMessage()
  }

  send?.addEventListener('click', (event) => {
    event.preventDefault()
    submit()
  })

  composer?.addEventListener('input', () => {
    syncComposerHeight()
    renderComposer()
  })

  composer?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  })

  threadSearch?.addEventListener('input', () => {
    appState.threadSearch = threadSearch.value
    renderThreads()
  })

  voiceButton?.addEventListener('click', () => {
    voiceButton.classList.toggle('is-active')
    if (voiceButton.classList.contains('is-active')) {
      voiceButton.setAttribute('aria-label', 'Disable voice input')
    } else {
      voiceButton.setAttribute('aria-label', 'Enable voice input')
    }
  })

  document.querySelector<HTMLElement>('#chat-messages')?.addEventListener('ds-stop', (event) => {
    stopStream()
  })
}

export const mountOrchestratorChatDemo = () => {
  if (!appState.threads.length) {
    appendThread()
  }

  appState.activeThreadId = appState.threads[0].id
  wireEvents()
  renderAll()
}
