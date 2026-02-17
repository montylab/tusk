<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatsStore } from '../stores/stats'
import { useCategoriesStore } from '../stores/categories'
import type { Category } from '../types'

const statsStore = useStatsStore()
const categoriesStore = useCategoriesStore()
const {
	currentPeriodType,
	currentPeriodKey,
	loading,
	totalHours,
	deepWorkHours,
	taskCount,
	categoryBreakdown,
	deepWorkRatio,
	completionRatio
} = storeToRefs(statsStore)

const periodLabels = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' }

function getCategoryColor(name: string): string {
	const cat = categoriesStore.categoriesArray.find((c: Category) => c.name === name)
	return cat?.color || 'var(--accent)'
}

function formatPeriodLabel(key: string, type: string): string {
	if (type === 'day') {
		const d = new Date(key + 'T00:00:00')
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
	}
	if (type === 'week') return key // e.g. 2025-W08
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
				<h1>Statistics</h1>
				<p>Track your time and productivity</p>
			</header>

			<!-- Period Type Selector -->
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
			<div v-else class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">{{ totalHours }}h</div>
					<div class="stat-label">Total Time</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ taskCount }}</div>
					<div class="stat-label">Tasks</div>
				</div>
				<div class="stat-card accent">
					<div class="stat-value">{{ deepWorkHours }}h</div>
					<div class="stat-label">Deep Work</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ deepWorkRatio }}%</div>
					<div class="stat-label">Deep Work Ratio</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{{ completionRatio }}%</div>
					<div class="stat-label">Completed</div>
				</div>
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
						<div class="bar-container">
							<div class="bar-fill" :style="{ width: barWidth(cat.minutes), background: getCategoryColor(cat.name) }">
								<span class="bar-text" v-if="cat.hours >= 0.5">{{ cat.hours }}h</span>
							</div>
						</div>
						<div class="cat-meta">
							<span class="cat-hours">{{ cat.hours }}h</span>
							<span class="cat-count">{{ cat.count }} tasks</span>
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

/* Summary Cards */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 1rem;
	margin-bottom: 3rem;
}

.stat-card {
	background: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	padding: 1.5rem 1rem;
	text-align: center;
	transition:
		border-color 0.2s,
		transform 0.2s;
	animation: slideUp 0.4s ease-out;
}

.stat-card:hover {
	border-color: var(--accent);
	transform: translateY(-2px);
}

.stat-card.accent {
	border-color: var(--accent);
	background: color-mix(in srgb, var(--accent), var(--bg-card) 90%);
}

.stat-value {
	font-size: 2rem;
	font-weight: 800;
	line-height: 1.2;
	color: var(--text-primary);
}

.stat-card.accent .stat-value {
	color: var(--accent);
}

.stat-label {
	font-size: 0.85rem;
	color: var(--text-muted);
	margin-top: 0.25rem;
	font-weight: 500;
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
	grid-template-columns: 120px 1fr 100px;
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
	background: var(--bg-card);
	border-radius: var(--radius-sm);
	border: 1px solid var(--border-color);
	overflow: hidden;
}

.bar-fill {
	height: 100%;
	border-radius: var(--radius-sm);
	display: flex;
	align-items: center;
	padding: 0 0.5rem;
	transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	opacity: 0.85;
}

.bar-text {
	font-size: 0.75rem;
	font-weight: 600;
	color: white;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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
	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
	}
	.category-row {
		grid-template-columns: 90px 1fr 80px;
	}
	.stats-content-wrapper {
		padding: 2rem 1rem;
	}
}
</style>
