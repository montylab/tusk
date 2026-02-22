import { ref } from 'vue'

// ---------------------------------------------------------------------------
// Constants — stable for the lifetime of this tab
// ---------------------------------------------------------------------------
const CHANNEL_NAME = 'task-tracker-leader'
const TAB_ID: string = crypto.randomUUID()
const TAB_BIRTH = Date.now()

// ---------------------------------------------------------------------------
// Singleton state — shared across all callers within the same tab
// ---------------------------------------------------------------------------
const isLeader = ref(false)
const knownTabs = new Map<string, number>([[TAB_ID, TAB_BIRTH]])
let channel: BroadcastChannel | null = null
let initialized = false

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Deterministic election: oldest birth-time wins; TAB_ID breaks ties. */
function elect() {
	let leaderId = TAB_ID
	let leaderBirth = TAB_BIRTH

	for (const [id, birth] of knownTabs) {
		if (birth < leaderBirth || (birth === leaderBirth && id < leaderId)) {
			leaderId = id
			leaderBirth = birth
		}
	}

	isLeader.value = leaderId === TAB_ID
}

function broadcast(type: string) {
	channel?.postMessage({ type, tabId: TAB_ID, birth: TAB_BIRTH })
}

function handleUnload() {
	broadcast('BYE')
}

function init() {
	if (initialized) return
	initialized = true

	channel = new BroadcastChannel(CHANNEL_NAME)

	channel.onmessage = ({ data }: MessageEvent) => {
		const { type, tabId, birth } = data as { type: string; tabId: string; birth: number }

		switch (type) {
			case 'HELLO':
				knownTabs.set(tabId, birth)
				broadcast('ACK') // let the new tab know we exist
				elect()
				break
			case 'ACK':
				knownTabs.set(tabId, birth)
				elect()
				break
			case 'BYE':
				knownTabs.delete(tabId)
				elect()
				break
		}
	}

	// Optimistically assume leadership until ACKs arrive from existing tabs
	isLeader.value = true
	broadcast('HELLO')

	// Re-elect after a short window to incorporate ACK replies
	setTimeout(elect, 150)

	window.addEventListener('beforeunload', handleUnload)
}

// ---------------------------------------------------------------------------
// Public composable
// ---------------------------------------------------------------------------

/**
 * Returns a reactive `isLeader` boolean.
 * Only one tab is leader at a time; leadership transfers automatically
 * when the current leader tab is closed.
 *
 * Usage:
 * ```ts
 * const { isLeader } = useTabLeader()
 * if (!isLeader.value) return // skip side-effects in non-leader tabs
 * ```
 */
export function useTabLeader() {
	init()
	return { isLeader }
}
