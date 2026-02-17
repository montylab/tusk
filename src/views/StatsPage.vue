<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatsStore } from '../stores/stats'
import { useCategoriesStore } from '../stores/categories'
import { triggerRecalcStats } from '../services/statsService'
import { getWeekRange, formatDuration } from '../utils/dateUtils'
import type { Category } from '../types'

const statsStore = useStatsStore()
const categoriesStore = useCategoriesStore()
const {
	currentPeriodType,
	currentPeriodKey,
	loading,
	totalMinutes,
	deepWorkMinutes,
	taskCount,
	categoryBreakdown,
	completedCount,
	completedMinutes,
	completedDeepWorkMinutes,
	plannedCount,
	plannedMinutes,
	plannedDeepWorkMinutes
} = storeToRefs(statsStore)

const periodLabels = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' }

const syncing = ref(false)
const syncStatus = ref('')

async function handleSync() {
	syncing.value = true
	syncStatus.value = ''
	try {
		const result = await triggerRecalcStats()
		syncStatus.value = `✓ ${result.daysProcessed} days, ${result.tasksCompleted} completed, ${result.tasksUncompleted} uncompleted, ${result.diffs.length} diffs`
		setTimeout(() => (syncStatus.value = ''), 8000)
	} catch (e: any) {
		syncStatus.value = `✗ ${e.message || 'Sync failed'}`
		setTimeout(() => (syncStatus.value = ''), 8000)
	} finally {
		syncing.value = false
	}
}

function getCategoryColor(name: string): string {
	const cat = categoriesStore.categoriesArray.find((c: Category) => c.name === name)
	return cat?.color || 'var(--accent)'
}

function formatPeriodLabel(key: string, type: string): string {
	if (type === 'day') {
		const d = new Date(key + 'T00:00:00')
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
	}
	if (type === 'week') {
		const range = getWeekRange(key)
		if (range) {
			const start = range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
			const end = range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
			return `${key} (${start} - ${end})`
		}
		return key
	}
	if (type === 'month') {
		const [y, m] = key.split('-')
		const d = new Date(parseInt(y), parseInt(m) - 1, 1)
		return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	}
	return key // year
}

function barWidth(minutes: number): string {
	const max = categoryBreakdown.value[0]?.minutes || 1
	return `${Math.max((minutes / max) * 100, 2)}%`
}

onMounted(() => {
	statsStore.setPeriod('week')
})

onUnmounted(() => {
	statsStore.cleanup()
})
</script>

<template>
	<div class="stats-page">
		<div class="stats-content-wrapper">
			<header class="page-header">
				<div class="header-top">
					<div>
						<h1>Statistics</h1>
						<p>Track your time and productivity</p>
					</div>
					<button class="sync-btn" :disabled="syncing" @click="handleSync">
						<span :class="{ spinning: syncing }">⟳</span>
						{{ syncing ? 'Syncing…' : 'Sync' }}
					</button>
				</div>
				<div v-if="syncStatus" class="sync-status" :class="{ error: syncStatus.startsWith('✗') }">
					{{ syncStatus }}
				</div>
			</header>

			<!-- Period Selector -->
			<div class="period-selector">
				<button
					v-for="(label, type) in periodLabels"
					:key="type"
					class="period-btn"
					:class="{ active: currentPeriodType === type }"
					@click="statsStore.setPeriod(type as any)"
				>
					{{ label }}
				</button>
			</div>

			<!-- Period Navigation -->
			<div class="period-nav">
				<button class="nav-arrow" @click="statsStore.navigatePeriod(-1)">←</button>
				<span class="period-label">{{ formatPeriodLabel(currentPeriodKey, currentPeriodType) }}</span>
				<button class="nav-arrow" @click="statsStore.navigatePeriod(1)">→</button>
			</div>

			<!-- Loading State -->
			<div v-if="loading" class="loading-state">Loading...</div>

			<!-- Summary Cards -->
			<div v-else class="stats-table-container">
				<table class="stats-table">
					<thead>
						<tr>
							<th></th>
							<th>Completed</th>
							<th>Planned</th>
							<th>Total</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="row-label">Tasks</td>
							<td class="val-completed">{{ completedCount }}</td>
							<td class="val-planned">{{ plannedCount }}</td>
							<td class="val-total">{{ taskCount }}</td>
						</tr>
						<tr>
							<td class="row-label">Hours</td>
							<td class="val-completed">{{ formatDuration(completedMinutes) }}</td>
							<td class="val-planned">{{ formatDuration(plannedMinutes) }}</td>
							<td class="val-total">{{ formatDuration(totalMinutes) }}</td>
						</tr>
						<tr>
							<td class="row-label">Deep Work</td>
							<td class="val-completed">{{ formatDuration(completedDeepWorkMinutes) }}</td>
							<td class="val-planned">{{ formatDuration(plannedDeepWorkMinutes) }}</td>
							<td class="val-total">{{ formatDuration(deepWorkMinutes) }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Category Breakdown -->
			<section class="breakdown-section" v-if="categoryBreakdown.length > 0">
				<h2>By Category</h2>
				<div class="category-bars">
					<div v-for="cat in categoryBreakdown" :key="cat.name" class="category-row">
						<div class="cat-label">
							<span class="cat-dot" :style="{ background: getCategoryColor(cat.name) }"></span>
							<span class="cat-name">{{ cat.name }}</span>
						</div>

						<!-- Split Bar Container -->
						<div class="bar-container">
							<div class="split-bar-wrapper" :style="{ width: barWidth(cat.minutes) }">
								<!-- Completed Segment -->
								<div
									v-if="cat.completedMinutes > 0"
									class="bar-segment"
									:style="{ flex: cat.completedMinutes, background: getCategoryColor(cat.name) }"
								>
									<span class="bar-text">{{ formatDuration(cat.completedMinutes) }}</span>
								</div>

								<!-- Planned Segment -->
								<div
									v-if="cat.plannedMinutes > 0"
									class="bar-segment planned"
									:style="{ flex: cat.plannedMinutes, background: getCategoryColor(cat.name) }"
								>
									<span class="bar-text">{{ formatDuration(cat.plannedMinutes) }}</span>
								</div>
							</div>
						</div>

						<!-- Total Column -->
						<div class="cat-meta">
							<span class="cat-hours">{{ formatDuration(cat.minutes) }}</span>
							<!-- <span class="cat-label-sm">Total</span> -->
						</div>
					</div>
				</div>
			</section>

			<!-- Empty State -->
			<div v-if="!loading && taskCount === 0" class="empty-state">
				<p>No data for this period yet.</p>
				<p class="empty-hint">Statistics are recorded when you create scheduled tasks.</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
.stats-page {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	color: var(--text-primary);
}

.stats-content-wrapper {
	max-width: 800px;
	margin: 0 auto;
	padding: 3rem 2rem;
}

.page-header {
	margin-bottom: 2rem;
	border-bottom: 1px solid var(--border-color);
	padding-bottom: 2rem;
}

.header-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.page-header h1 {
	font-size: 2.5rem;
	font-weight: 800;
	margin-bottom: var(--spacing-sm);
	background: var(--accent-gradient);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
}

.page-header p {
	color: var(--text-muted);
	font-size: 1.1rem;
}

.sync-btn {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 1rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-sm);
	background: var(--bg-card);
	color: var(--text-secondary);
	font-weight: 600;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s;
	white-space: nowrap;
}

.sync-btn:hover:not(:disabled) {
	border-color: var(--accent);
	color: var(--accent);
}

.sync-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.sync-btn .spinning {
	display: inline-block;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.sync-status {
	margin-top: 0.75rem;
	padding: 0.5rem 0.75rem;
	border-radius: var(--radius-sm);
	font-size: 0.85rem;
	background: color-mix(in srgb, var(--accent), transparent 90%);
	color: var(--accent);
}

.sync-status.error {
	background: color-mix(in srgb, #e74c3c, transparent 90%);
	color: #e74c3c;
}

/* Period Selector */
.period-selector {
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	background: var(--bg-card);
	border-radius: var(--radius-md);
	padding: 0.25rem;
	border: 1px solid var(--border-color);
}

.period-btn {
	flex: 1;
	padding: 0.6rem 1rem;
	border: none;
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--text-secondary);
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
}

.period-btn:hover {
	color: var(--text-primary);
}

.period-btn.active {
	background: var(--accent);
	color: white;
	box-shadow: 0 2px 8px color-mix(in srgb, var(--accent), transparent 60%);
}

/* Period Navigation */
.period-nav {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.nav-arrow {
	width: 36px;
	height: 36px;
	border: 1px solid var(--border-color);
	border-radius: 50%;
	background: var(--bg-card);
	color: var(--text-primary);
	font-size: 1.1rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.nav-arrow:hover {
	border-color: var(--accent);
	color: var(--accent);
}

.period-label {
	font-size: 1.2rem;
	font-weight: 600;
	min-width: 180px;
	text-align: center;
}

.stat-label {
	font-size: 0.85rem;
	color: var(--text-muted);
	margin-top: 0.25rem;
	font-weight: 500;
}

/* Stats Table */
.stats-table-container {
	margin-bottom: 3rem;
	overflow-x: auto;
	background: var(--bg-card);
	border-radius: var(--radius-md);
	border: 1px solid var(--border-color);
	padding: 1rem;
	animation: slideUp 0.4s ease-out;
}

.stats-table {
	width: 100%;
	border-collapse: collapse;
	min-width: 300px;
}

.stats-table th {
	text-align: right;
	padding: 1rem;
	font-weight: 600;
	color: var(--text-muted);
	border-bottom: 2px solid var(--border-color);
	font-size: 0.9rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.stats-table td {
	padding: 1.25rem 1rem;
	text-align: right;
	border-bottom: 1px solid var(--border-color);
	font-size: 1.1rem;
	font-weight: 600;
	color: var(--text-primary);
}

.stats-table tr:last-child td {
	border-bottom: none;
}

.stats-table .row-label {
	text-align: left;
	color: var(--text-secondary);
	font-weight: 600;
}

.stats-table .val-completed {
	color: var(--success, #2ecc71);
}

.stats-table .val-planned {
	color: var(--text-muted);
	font-family: monospace; /* optional style */
}

.stats-table .val-total {
	font-weight: 800;
}

/* Category Breakdown */
.breakdown-section {
	animation: slideUp 0.5s ease-out;
}

.breakdown-section h2 {
	font-size: var(--font-lg);
	margin-bottom: var(--spacing-md);
	color: var(--text-primary);
	border-left: 4px solid var(--accent);
	padding-left: var(--spacing-md);
}

.category-bars {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.category-row {
	display: grid;
	grid-template-columns: 8rem 1fr 4rem;
	gap: 1rem;
	align-items: center;
	padding: 0.5rem 0;
}

.cat-label {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.cat-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
}

.cat-name {
	font-weight: 500;
	font-size: 0.95rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.bar-container {
	height: 28px;
	background: transparent;
	border-radius: var(--radius-sm);
	/* border: 1px solid var(--border-color); */
	overflow: hidden;
}

.split-bar-wrapper {
	height: 100%;
	min-width: 10%;
	display: flex;
	border-radius: var(--radius-sm);
	overflow: hidden;
	transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar-segment {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	transition: flex 0.6s ease;
	min-width: 1rem;
}

.bar-segment.planned {
	opacity: 0.35;
	/* Optional: pattern for accessibility/differentiation */
	background-image: linear-gradient(
		45deg,
		rgba(255, 255, 255, 0.15) 25%,
		transparent 25%,
		transparent 50%,
		rgba(255, 255, 255, 0.15) 50%,
		rgba(255, 255, 255, 0.15) 75%,
		transparent 75%,
		transparent
	);
	background-size: 8px 8px;
}

.bar-text {
	font-size: 0.75rem;
	font-weight: 600;
	color: white;
	text-shadow: 0 0 10px rgb(0 0 0);
}

.cat-meta {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.1rem;
}

.cat-hours {
	font-weight: 600;
	font-size: 0.95rem;
}

.cat-count {
	font-size: 0.78rem;
	color: var(--text-muted);
}

/* Empty & Loading States */
.loading-state {
	text-align: center;
	padding: 3rem;
	color: var(--text-muted);
	font-size: 1.1rem;
}

.empty-state {
	text-align: center;
	padding: 3rem;
	color: var(--text-muted);
}

.empty-hint {
	font-size: 0.9rem;
	margin-top: 0.5rem;
	opacity: 0.7;
}

/* Animation */
@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* Responsive */
@media (max-width: 600px) {
	.category-row {
		grid-template-columns: 90px 1fr 80px;
	}
	.stats-content-wrapper {
		padding: 2rem 1rem;
	}
	.stats-table th,
	.stats-table td {
		padding: 0.75rem 0.5rem;
		font-size: 0.95rem;
	}
}
</style>
