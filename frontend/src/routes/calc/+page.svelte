<script lang="ts">
	import { processRecommendation } from '$lib/controller';
	import type { ResultPayload, Warning } from '$lib/types';
	import { onMount } from 'svelte';

	// Form state
	let drugQuery = '';
	let sig = '';
	let daysSupply = 30;
	let loading = false;
	let error: string | null = null;
	let result: ResultPayload | null = null;
	let showJsonViewer = false;

	// Common presets
	const presets = [
		{
			name: 'Amoxicillin 500mg',
			drug: 'amoxicillin 500mg',
			sig: 'Take 1 capsule three times daily',
			daysSupply: 10
		},
		{
			name: 'Lisinopril 10mg',
			drug: 'lisinopril 10mg',
			sig: 'Take 1 tablet once daily',
			daysSupply: 30
		},
		{
			name: 'Albuterol MDI',
			drug: 'albuterol',
			sig: 'Inhale 2 puffs every 4 to 6 hours as needed',
			daysSupply: 30
		},
		{
			name: 'Metformin 500mg',
			drug: 'metformin 500mg',
			sig: 'Take 1 tablet twice daily with meals',
			daysSupply: 30
		}
	];

	// Severity colors
	const severityColors: Record<string, string> = {
		error: 'bg-red-50 border-red-200 text-red-900',
		warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
		info: 'bg-blue-50 border-blue-200 text-blue-900'
	};

	const severityIcons: Record<string, string> = {
		error: '❌',
		warning: '⚠️',
		info: 'ℹ️'
	};

	async function handleSubmit() {
		if (!drugQuery.trim() || !sig.trim() || daysSupply <= 0) {
			error = 'Please fill in all fields with valid values';
			return;
		}

		loading = true;
		error = null;
		result = null;

		try {
			const recommendation = await processRecommendation({
				drugQuery: drugQuery.trim(),
				sig: sig.trim(),
				daysSupply: parseInt(daysSupply.toString())
			});

			result = recommendation;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while processing your request';
			console.error('Recommendation error:', err);
		} finally {
			loading = false;
		}
	}

	function loadPreset(preset: (typeof presets)[0]) {
		drugQuery = preset.drug;
		sig = preset.sig;
		daysSupply = preset.daysSupply;
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		// Could add a toast notification here
	}

	onMount(() => {
		// Set focus to first input
		const firstInput = document.querySelector('input[type="text"]') as HTMLInputElement;
		if (firstInput) {
			firstInput.focus();
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200 py-8">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold text-gray-900">NDC Calculator</h1>
			<p class="text-gray-600 mt-2">Enter prescription details to get optimal NDC recommendations</p>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Input Form -->
			<div class="lg:col-span-2">
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
					<form on:submit|preventDefault={handleSubmit} class="space-y-6">
						<!-- Drug Name Input -->
						<div>
							<label for="drug" class="block text-sm font-semibold text-gray-900 mb-2">
								Drug Name or NDC
							</label>
							<input
								type="text"
								id="drug"
								bind:value={drugQuery}
								placeholder="e.g., 'lisinopril 10mg' or '00093-7701-01'"
								disabled={loading}
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Can be drug name (e.g., "Amoxicillin 500mg") or NDC11 code
							</p>
						</div>

						<!-- SIG Input -->
						<div>
							<label for="sig" class="block text-sm font-semibold text-gray-900 mb-2">
								Dosage Instructions (SIG)
							</label>
							<textarea
								id="sig"
								bind:value={sig}
								placeholder="e.g., 'Take 1 tablet once daily' or 'Inhale 2 puffs every 4 hours as needed'"
								disabled={loading}
								rows="3"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
							></textarea>
							<p class="text-xs text-gray-500 mt-1">
								Can include common abbreviations (QD, BID, TID, Q6H, etc.)
							</p>
						</div>

						<!-- Days Supply Input -->
						<div>
							<label for="daysSupply" class="block text-sm font-semibold text-gray-900 mb-2">
								Days Supply
							</label>
							<input
								type="number"
								id="daysSupply"
								bind:value={daysSupply}
								min="1"
								max="365"
								disabled={loading}
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>

						<!-- Submit Button -->
						<button
							type="submit"
							disabled={loading}
							class="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{#if loading}
								<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Processing...
							{:else}
								Calculate Recommendation
							{/if}
						</button>
					</form>

					<!-- Error Message -->
					{#if error}
						<div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
							<span class="text-xl">❌</span>
							<div>
								<h3 class="font-semibold text-red-900">Error</h3>
								<p class="text-sm text-red-800 mt-1">{error}</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Presets -->
				<div class="mt-6">
					<h3 class="text-sm font-semibold text-gray-900 mb-3">Quick Presets</h3>
					<div class="grid grid-cols-2 gap-3">
						{#each presets as preset}
							<button
								on:click={() => loadPreset(preset)}
								disabled={loading}
								class="px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Results Panel -->
			<div class="lg:col-span-1">
				{#if result}
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 sticky top-20">
					<!-- Success Indicator -->
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
						<span class="text-2xl">✓</span>
						<div>
							<h3 class="font-semibold text-green-900">Recommendation Ready</h3>
							<p class="text-xs text-green-800 mt-1">
								{result.performanceMetrics?.totalMs || 0}ms response time
							</p>
						</div>
					</div>

					<!-- Parsed SIG -->
					<div class="border-t border-gray-200 pt-4">
						<h4 class="font-semibold text-gray-900 mb-3 text-sm">Parsed SIG</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Dose:</span>
								<span class="font-medium text-gray-900">
									{result.normalizedSig.amountPerDose} {result.normalizedSig.unit}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Frequency:</span>
								<span class="font-medium text-gray-900">
									{result.normalizedSig.frequencyPerDay}× daily
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Total Needed:</span>
								<span class="font-medium text-gray-900">
									{result.targetQuantity.totalUnits} {result.targetQuantity.unit}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Confidence:</span>
								<span class="font-medium text-indigo-600">
									{Math.round(result.normalizedSig.confidence * 100)}%
								</span>
							</div>
						</div>
					</div>

					<!-- Primary Recommendation -->
					{#if result.recommendation?.recommended}
						<div class="border-t border-gray-200 pt-4">
							<h4 class="font-semibold text-gray-900 mb-3 text-sm">Recommended NDC</h4>
							<div class="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
								<div class="flex items-center gap-2">
									<code class="font-mono text-sm font-bold text-indigo-900">
										{result.recommendation.recommended.ndc}
									</code>
									<button
										on:click={() => copyToClipboard(result.recommendation.recommended.ndc)}
										class="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
									>
										Copy
									</button>
								</div>
								<div class="text-xs text-indigo-800 space-y-1">
									<div>📦 {result.recommendation.recommended.packageSize} {result.recommendation.recommended.unit}</div>
									<div>
										{#if result.recommendation.recommended.status === 'ACTIVE'}
											✅ Active
										{:else}
											❌ Inactive
										{/if}
									</div>
									{#if result.recommendation.recommended.matchType}
										<div>🎯 {result.recommendation.recommended.matchType}</div>
									{/if}
								</div>
							</div>
						</div>
					{/if}

						<!-- Warnings -->
						{#if result.warnings && result.warnings.length > 0}
							<div class="border-t border-gray-200 pt-4">
								<h4 class="font-semibold text-gray-900 mb-3 text-sm">Warnings</h4>
								<div class="space-y-2">
									{#each result.warnings as warning}
										<div
											class="border rounded-lg p-3 text-xs {severityColors[warning.severity]}"
										>
											<div class="flex items-start gap-2">
												<span>{severityIcons[warning.severity]}</span>
												<span>{warning.message}</span>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- JSON Viewer Toggle -->
						<div class="border-t border-gray-200 pt-4">
							<button
								on:click={() => (showJsonViewer = !showJsonViewer)}
								class="text-sm font-medium text-indigo-600 hover:text-indigo-900"
							>
								{showJsonViewer ? 'Hide' : 'Show'} Full JSON
							</button>
							{#if showJsonViewer}
								<pre
									class="mt-3 bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">{JSON.stringify(result, null, 2)}</pre>
							{/if}
						</div>
					</div>
				{:else if !error}
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
						<p class="text-sm">Enter prescription details and click "Calculate Recommendation" to see results.</p>
					</div>
				{/if}
			</div>
		</div>

	<!-- Multiple Recommendations (if available) -->
	{#if result && result.recommendation?.alternatives && result.recommendation.alternatives.length > 0}
		<div class="mt-8">
			<h2 class="text-xl font-bold text-gray-900 mb-4">Alternative Recommendations</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each result.recommendation.alternatives as alt}
					<div class="bg-white border border-gray-200 rounded-lg p-4">
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<code class="font-mono text-sm font-bold text-gray-900">{alt.ndc}</code>
								<button
									on:click={() => copyToClipboard(alt.ndc)}
									class="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
								>
									Copy
								</button>
							</div>
							<div class="text-sm text-gray-600">
								{alt.packageSize} {alt.unit}
							</div>
							{#if alt.score}
								<div class="text-xs text-gray-500">
									Score: {alt.score}
								</div>
							{/if}
							{#if alt.matchType}
								<div class="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
									{alt.matchType}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	</div>
</div>

