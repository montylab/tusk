const fs = require('fs')
const path = require('path')

// Paths (relative to CWD)
const sourceListPath = '.agent/temp/source-files.txt'
const planListPath = '.agent/temp/plan-files.txt'
const taskMdPath = 'task.md' // Or absolute path from env if available

try {
	const sourceFiles = fs
		.readFileSync(sourceListPath, 'utf-8')
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l)

	let planFiles = []
	if (fs.existsSync(planListPath)) {
		planFiles = fs
			.readFileSync(planListPath, 'utf-8')
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l)
	}

	const planMap = new Set(planFiles.map((p) => path.basename(p).toLowerCase()))

	let taskContent = '# Test Plan Verification Todo\n\n'
	let missingCount = 0

	sourceFiles.forEach((src) => {
		const fileName = path.basename(src)
		const baseNoExt = path.basename(fileName, path.extname(fileName))

		// Check for exact match or base match
		const planName1 = `${fileName}.md`.toLowerCase()
		const planName2 = `${baseNoExt}.md`.toLowerCase()

		const exists = planMap.has(planName1) || planMap.has(planName2)
		const mark = exists ? '[x]' : '[ ]'
		if (!exists) missingCount++

		// Relative path for display
		const relPath = src.includes('src') ? src.substring(src.indexOf('src')) : fileName
		taskContent += `- ${mark} ${relPath}\n`
	})

	taskContent += `\n**Status**: ${missingCount} missing plans.\n`

	fs.writeFileSync(taskMdPath, taskContent)
	console.log(`Generated task.md with ${sourceFiles.length} items. Missing: ${missingCount}`)
} catch (e) {
	console.error('Error in comparison:', e)
	process.exit(1)
}
