<script lang="ts">
	import { processRecommendation } from '$lib/controller';
	import type { NormalizedSig, RecommendationOption, ResultPayload, Warning } from '$lib/types';
	import { onMount } from 'svelte';

	let drugQuery = '';
	let sigText = '';
	let daysSupply = 30;
	let loading = false;
	let error: string | null = null;
	let result: ResultPayload | null = null;
	let parsedSig: NormalizedSig | null = null;
	let showJson = false;

	const presets = [
		{
			name: 'Amoxicillin Tabs',
			drugQuery: 'amoxicillin 500mg',
			sigText: 'Take 1 capsule by mouth three times daily',
			daysSupply: 10
		},
		{
			name: 'Lisinopril',
			drugQuery: 'lisinopril 10mg',
			sigText: 'Take 1 tablet by mouth once daily',
			daysSupply: 30
		},
		{
			name: 'Albuterol Inhaler',
			drugQuery: 'albuterol 90mcg',
			sigText: 'Inhale 2 puffs four times daily',
			daysSupply: 30
		},
		{
			name: 'Insulin Glargine',
			drugQuery: 'insulin glargine',
			sigText: 'Inject 20 units subcutaneously once daily at bedtime',
			daysSupply: 30
		}
	];

	const severityMap: Record<Warning['severity'], { icon: string; classes: string; chip: string }> = {
		error: {
			icon: '❌',
			classes: 'bg-red-50 border-red-200 text-red-900',
			chip: 'bg-red-100 text-red-900 border-red-200'
		},
		warning: {
			icon: '⚠️',
			classes: 'bg-yellow-50 border-yellow-200 text-yellow-900',
			chip: 'bg-yellow-100 text-yellow-900 border-yellow-200'
		},
		info: {
			icon: 'ℹ️',
			classes: 'bg-blue-50 border-blue-200 text-blue-900',
			chip: 'bg-blue-100 text-blue-900 border-blue-200'
		}
	};

	function loadPreset(preset: (typeof presets)[number]) {
		drugQuery = preset.drugQuery;
		sigText = preset.sigText;
		daysSupply = preset.daysSupply;
		result = null;
		parsedSig = null;
		error = null;
		showJson = false;
	}

	async function handleSubmit() {
		if (!drugQuery.trim() || !sigText.trim() || daysSupply <= 0) {
			error = 'Please provide a drug name (or NDC), SIG instructions, and a valid days supply.';
			return;
		}

		loading = true;
		error = null;
		result = null;
		parsedSig = null;

		try {
			const recommendation = await processRecommendation({
				drugQuery: drugQuery.trim(),
				sigText: sigText.trim(),
				daysSupply
			});

			result = recommendation;
			parsedSig = recommendation.normalizedSig;
		} catch (err) {
			if (err && typeof err === 'object' && 'message' in err) {
				error = (err as { message?: string }).message ?? 'Unable to process the recommendation. Please try again.';
			} else {
				error = 'Unable to process the recommendation. Please try again.';
			}
			console.error('Recommendation error:', err);
		} finally {
			loading = false;
		}
	}

	function copyToClipboard(value: string) {
		navigator.clipboard.writeText(value);
	}

	onMount(() => {
		document.querySelector<HTMLInputElement>('#drugQuery')?.focus();
	});

	const statusChip = (status: string) =>
		status === 'ACTIVE'
			? 'bg-green-100 text-green-900 border border-green-200'
			: 'bg-red-100 text-red-900 border border-red-200';

	let recommendedOption: ResultPayload['recommendation']['recommended'] | null = null;
	let alternativeOptions: RecommendationOption[] = [];

	$: recommendedOption = result ? result.recommendation.recommended : null;
	$: alternativeOptions = result ? result.recommendation.alternatives : [];
</script>

<div class="space-y-10 animate-fade-in">
	<header class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-8 md:p-12 space-y-4">
		<div class="flex items-center gap-3 mb-2">
			<span class="inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-fhsm bg-gradient-to-r from-fh-blue/20 to-fh-purple/20 text-fh-blue border border-fh-blue/30">
				Foundation Health Demo
			</span>
			<span class="text-xs font-semibold text-fh-success">● Live</span>
		</div>
		<h1 class="text-4xl md:text-5xl font-bold text-fh-text900 leading-tight">NDC Recommendation Calculator</h1>
		<p class="text-fh-text600 max-w-3xl text-lg leading-relaxed">
			Enter a prescription, let DoseMatch parse the SIG, normalize the drug, and surface an optimal package strategy
			with full transparency. Nothing is stored or logged—refresh to clear the slate.
		</p>
	</header>

	<div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start">
		<div class="space-y-6">
			<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-8 space-y-6 animate-fade-up">
				<div class="space-y-2">
					<h2 class="text-2xl font-bold text-fh-text900">Prescription details</h2>
					<p class="text-sm text-fh-text600">
						Provide the same information you would enter into your dispensing system. DoseMatch handles capsules, liquids,
						insulin, and inhalers out of the box.
					</p>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<div class="space-y-4">
						<div class="space-y-2">
							<label for="drugQuery" class="text-sm font-semibold text-fh-text900">Drug name or NDC</label>
							<input
								type="text"
								id="drugQuery"
								bind:value={drugQuery}
								placeholder="e.g., 'lisinopril 10mg' or '00093-7701-01'"
								disabled={loading}
								class="w-full px-4 py-3 border border-fh-border rounded-fhsm focus:ring-2 focus:ring-fh-blue focus:border-transparent outline-none transition disabled:bg-fh-panel1 disabled:cursor-not-allowed"
								required
							/>
							<p class="text-xs text-fh-text600">
								Use a free text drug search or an NDC11. We automatically route through RxNorm for normalization.
							</p>
						</div>

						<div class="space-y-2">
							<label for="sigText" class="text-sm font-semibold text-fh-text900">Dosage instructions (SIG)</label>
							<textarea
								id="sigText"
								bind:value={sigText}
								placeholder="e.g., 'Inhale 2 puffs every 4 hours as needed'
Take 1 tablet twice daily with meals"
								rows="4"
								disabled={loading}
								class="w-full px-4 py-3 border border-fh-border rounded-fhsm focus:ring-2 focus:ring-fh-blue focus:border-transparent outline-none transition disabled:bg-fh-panel1 disabled:cursor-not-allowed"
								required
							></textarea>
							<p class="text-xs text-fh-text600">
								Supports common abbreviations (QD, BID, TID, Q4H) plus free-text phrases such as “as needed for
								wheezing”.
							</p>
						</div>

						<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
							<div class="space-y-2">
								<label for="daysSupply" class="text-sm font-semibold text-fh-text900">Days supply</label>
								<input
									type="number"
									id="daysSupply"
									min="1"
									max="365"
									bind:value={daysSupply}
									disabled={loading}
									class="w-full px-4 py-3 border border-fh-border rounded-fhsm focus:ring-2 focus:ring-fh-blue focus:border-transparent outline-none transition disabled:bg-fh-panel1 disabled:cursor-not-allowed"
									required
								/>
						</div>

						<div class="space-y-2">
							<p class="text-sm font-semibold text-fh-text900">Need help?</p>
							<div class="rounded-fhsm border border-fh-border bg-fh-panel1 p-3 text-xs text-fh-text600 space-y-2">
								<p><strong class="text-fh-text900">SIG tips:</strong> Include PRN instructions, numeric ranges, and formulations.</p>
								<p>Days supply drives quantity calculations—enter full therapy duration.</p>
							</div>
						</div>
					</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full px-6 py-3 bg-gradient-to-r from-fh-blue to-fh-purple text-white rounded-fhmd font-semibold shadow-fh hover:shadow-fh-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if loading}
							<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Processing…
						{:else}
							Calculate recommendation
						{/if}
					</button>
				</form>

				{#if error}
					<div class="rounded-fhmd border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex gap-3">
						<span class="text-lg">❌</span>
						<div>
							<h3 class="font-semibold">We couldn’t process that</h3>
							<p class="mt-1">{error}</p>
						</div>
					</div>
				{/if}
			</section>

			<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-6 space-y-4 animate-fade-up">
				<div class="flex items-center justify-between gap-4 flex-wrap">
					<h3 class="text-lg font-bold text-fh-text900">Quick presets</h3>
					<button
						type="button"
						on:click={() => {
							drugQuery = '';
							sigText = '';
							daysSupply = 30;
							result = null;
							parsedSig = null;
							error = null;
							showJson = false;
						}}
						class="text-sm font-semibold text-fh-blue hover:text-fh-purple hover:bg-fh-blue/10 px-3 py-1 rounded-fhsm transition-all"
					>
						Clear
					</button>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each presets as preset}
						<button
							type="button"
							on:click={() => loadPreset(preset)}
							disabled={loading}
							class="text-left rounded-fhsm border border-fh-border/30 bg-gradient-to-br from-fh-blue-light/30 to-transparent px-4 py-3 text-sm text-fh-text600 hover:bg-white/50 hover:shadow-fh-md transition disabled:opacity-50 disabled:cursor-not-allowed card-hover"
						>
							<span class="block font-semibold text-fh-text900">{preset.name}</span>
							<span class="block mt-1 text-xs">{preset.sigText}</span>
							<span class="block mt-1 text-xs uppercase tracking-wide text-fh-text600">{preset.daysSupply}-day supply</span>
						</button>
					{/each}
				</div>
			</section>
		</div>

		<div class="space-y-6">
			{#if result}
				<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-6 space-y-6 sticky top-8 animate-fade-up">
					{#if recommendedOption}
						<div class="flex flex-col gap-2">
							<div class="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
								<span class="text-lg">✓</span>
								Recommendation ready in {result.performanceMetrics?.totalMs ?? 0}ms
							</div>
							<h2 class="text-2xl font-semibold text-fh-text900">{recommendedOption.ndc}</h2>
							<p class="text-sm text-fh-text600">
								{result.rxnorm.synonyms?.[0] || 'Unnamed product'} • {result.rxnorm.doseForm ?? 'Unknown dose form'}
							</p>
						</div>

					{#if parsedSig}
						<div class="space-y-2">
							<h3 class="text-sm font-semibold text-fh-text900 uppercase tracking-wide">Parsed SIG</h3>
							<div class="flex flex-wrap gap-2 text-xs">
								<span class="px-3 py-1 rounded-fhsm bg-fh-panel2 text-fh-text900 border border-fh-border">
									<strong>Dose:</strong> {parsedSig.amountPerDose} {parsedSig.unit}
								</span>
								<span class="px-3 py-1 rounded-fhsm bg-fh-panel2 text-fh-text900 border border-fh-border">
									<strong>Frequency:</strong> {parsedSig.frequencyPerDay}× day
								</span>
								<span class="px-3 py-1 rounded-fhsm bg-fh-panel2 text-fh-text900 border border-fh-border">
									<strong>Days:</strong> {parsedSig.daysSupply}
								</span>
								<span class="px-3 py-1 rounded-fhsm bg-fh-panel2 text-fh-blue border border-fh-border">
									<strong>Confidence:</strong> {Math.round(parsedSig.confidence * 100)}%
								</span>
								<span class={`px-3 py-1 rounded-fhsm border ${parsedSig.parsedBy === 'rules' ? 'bg-green-100 text-green-900 border-green-200' : 'bg-blue-100 text-blue-900 border-blue-200'}`}>
									Parsed by {parsedSig.parsedBy === 'rules' ? 'Rules Engine' : 'AI Assistant'}
								</span>
							</div>
							{#if parsedSig.rationale}
								<p class="text-xs text-fh-text600 italic">{parsedSig.rationale}</p>
							{/if}
						</div>
					{/if}

					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-fh-text900 uppercase tracking-wide">Recommended package</h3>
						<div class="rounded-fhmd border border-fh-border bg-fh-panel1 p-4 space-y-3">
							<div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
								<span class="px-3 py-1 rounded-fhsm bg-white border border-fh-border text-fh-text900">
									{recommendedOption.packageSize} {recommendedOption.unit} per pack
								</span>
								<span class={`px-3 py-1 rounded-fhsm ${statusChip(recommendedOption.status)}`}>
									{recommendedOption.status}
								</span>
								<span class="px-3 py-1 rounded-fhsm bg-white border border-fh-border text-fh-text900">
									Match: {recommendedOption.matchType}
								</span>
								{#if recommendedOption.badges?.length}
									{#each recommendedOption.badges as badge}
										<span class="px-3 py-1 rounded-fhsm bg-white border border-fh-border text-fh-text600">{badge}</span>
									{/each}
								{/if}
							</div>

							<div class="space-y-2 text-sm text-fh-text600">
								<p class="font-semibold text-fh-text900">Dispensing plan</p>
								{#each recommendedOption.packsUsed as pack}
									<p>{pack.count}× pack of NDC {pack.ndc}</p>
								{/each}
								<p class="font-semibold text-fh-blue">
									Total dispensed: {recommendedOption.totalDispensed} {recommendedOption.unit}
								</p>
							</div>

							<div class="rounded-fhsm border border-fh-border bg-white p-3 text-sm text-fh-text600">
								<strong class="text-fh-text900">Why:</strong> {recommendedOption.why}
							</div>
						</div>
					</div>

					{#if result.warnings.length}
						<div class="space-y-3">
							<h3 class="text-sm font-semibold text-fh-text900 uppercase tracking-wide">Warnings & guardrails</h3>
							<div class="space-y-2">
								{#each result.warnings as warning}
									<div class={`rounded-fhmd border p-3 text-sm flex items-start gap-3 ${severityMap[warning.severity].classes}`}>
										<span class="text-lg leading-none">{severityMap[warning.severity].icon}</span>
										<p>{warning.message}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="flex flex-wrap items-center gap-3">
						<button
							type="button"
							on:click={() => recommendedOption && copyToClipboard(recommendedOption.ndc)}
							class="px-4 py-2 bg-fh-blue text-white rounded-fhsm text-sm font-semibold hover:bg-fh-purple transition"
						>
							Copy NDC
						</button>
						<button
							type="button"
							on:click={() => (showJson = !showJson)}
							class="px-4 py-2 rounded-fhsm border border-fh-border text-sm font-semibold text-fh-text600 hover:bg-fh-panel2 transition"
						>
							{showJson ? 'Hide JSON' : 'Show JSON'}
						</button>
					</div>

					{#if showJson}
						<pre class="max-h-64 overflow-y-auto overflow-x-auto rounded-fhmd border border-fh-border bg-fh-text900 text-gray-100 text-xs p-3">{JSON.stringify(result, null, 2)}</pre>
					{/if}

					{#if result.performanceMetrics}
						<div class="space-y-2 text-xs text-fh-text600">
							<h3 class="text-sm font-semibold text-fh-text900 uppercase tracking-wide">Performance metrics</h3>
							<div class="grid grid-cols-2 gap-2">
								<p>Total: {result.performanceMetrics.totalMs}ms</p>
								<p>RxNorm: {result.performanceMetrics.rxnormMs}ms</p>
								<p>FDA: {result.performanceMetrics.fdaMs}ms</p>
								<p>SIG Parsing: {result.performanceMetrics.sigParsingMs}ms</p>
								<p>Cache Hits: {result.performanceMetrics.cacheHits}</p>
							</div>
						</div>
					{/if}
				{/if}
				</section>
			{:else}
				<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-8 space-y-4 text-center text-fh-text600 animate-fade-up">
					<h2 class="text-lg font-bold text-fh-text900">No recommendation yet</h2>
					<p class="text-sm">
						Start by entering a real-world prescription. We'll parse the SIG, normalize the drug, and tee up an optimal
						package strategy.
					</p>
					<div class="text-xs bg-gradient-to-r from-fh-blue-light/30 to-fh-purple-light/30 border border-fh-border/30 rounded-fhsm px-3 py-2 text-fh-text600">
						Example: "Amoxicillin 500mg – Take 1 capsule by mouth three times daily for 10 days."
					</div>
				</section>
			{/if}
		</div>
	</div>

	{#if result && alternativeOptions.length}
		<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-8 space-y-6 animate-fade-up">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h3 class="text-xl font-semibold text-fh-text900">Alternative options</h3>
					<p class="text-sm text-fh-text600">
						Explore additional NDCs ranked by score, overfill, and availability.
					</p>
				</div>
				<button
					type="button"
					on:click={() => copyToClipboard(JSON.stringify(alternativeOptions, null, 2))}
					class="px-4 py-2 border border-fh-border rounded-fhsm text-sm font-semibold text-fh-text600 hover:bg-fh-panel2 transition"
				>
					Copy alternatives JSON
				</button>
			</div>

			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each alternativeOptions as alt}
					<div class="rounded-fhlg border border-fh-border/30 bg-gradient-to-br from-fh-blue-light/20 to-fh-purple-light/20 backdrop-blur-sm p-5 space-y-3 card-hover">
						<div class="flex items-start justify-between gap-2">
							<div>
								<p class="font-semibold text-fh-text900">{alt.ndc}</p>
								<p class="text-xs text-fh-text600">{alt.packageSize} {alt.unit} per pack</p>
							</div>
							<button
								type="button"
								on:click={() => copyToClipboard(alt.ndc)}
								class="text-xs font-semibold text-fh-blue hover:text-fh-purple"
							>
								Copy
							</button>
						</div>
						{#if alt.badges?.length}
							<div class="flex flex-wrap gap-2 text-[11px] text-fh-text600">
								{#each alt.badges as badge}
									<span class="px-2 py-1 rounded-fhsm bg-white border border-fh-border">{badge}</span>
								{/each}
							</div>
						{/if}
						<p class="text-xs text-fh-text600 leading-relaxed">{alt.why}</p>
						<div class="flex flex-wrap gap-2 text-[11px] text-fh-text600">
							<span class="px-2 py-1 rounded-fhsm bg-white border border-fh-border">Score: {alt.score}</span>
							<span class="px-2 py-1 rounded-fhsm bg-white border border-fh-border">Match: {alt.matchType}</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

