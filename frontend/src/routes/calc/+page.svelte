<script lang="ts">
	import { processRecommendation } from '$lib/controller';
	import type { NormalizedSig, RecommendationOption, ResultPayload, Warning } from '$lib/types';
	import { onMount } from 'svelte';
	import { httpsCallable } from 'firebase/functions';
	import { getFirebaseFunctions } from '$lib/firebase';
	import { cache } from '$lib/cache';

	let drugQuery = '';
	let sigText = '';
	let daysSupply = 30;
	let loading = false;
	let error: string | null = null;
	let result: ResultPayload | null = null;
	let parsedSig: NormalizedSig | null = null;
	let showExplainer = false;
	let explanation: string | null = null;
	let explainerLoading = false;
	let explainerError: string | null = null;
	let cacheCleared = false;

	/**
	 * Format NDC with proper hyphens: 11-digit → XXXXX-XXXX-XX, 10-digit → XXXXX-XXX-XX
	 */
	function formatNdc(ndc: string): string {
		const clean = ndc.replace(/-/g, '');
		if (clean.length === 11) {
			return `${clean.substring(0, 5)}-${clean.substring(5, 9)}-${clean.substring(9, 11)}`;
		} else if (clean.length === 10) {
			return `${clean.substring(0, 5)}-${clean.substring(5, 8)}-${clean.substring(8, 10)}`;
		}
		return ndc; // Return as-is if unexpected format
	}

	const presets = [
		{
			name: 'Atorvastatin',
			drugQuery: 'atorvastatin 40mg',
			sigText: 'Take 1 tablet by mouth once daily',
			daysSupply: 30
		},
		{
			name: 'Metformin',
			drugQuery: 'metformin 500mg',
			sigText: 'Take 1 tablet by mouth twice daily',
			daysSupply: 30
		},
		{
			name: 'Ibuprofen',
			drugQuery: 'ibuprofen 200mg',
			sigText: 'Take 1 tablet by mouth every 6 hours as needed',
			daysSupply: 30
		},
		{
			name: 'Omeprazole',
			drugQuery: 'omeprazole 20mg',
			sigText: 'Take 1 capsule by mouth once daily',
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
		showExplainer = false;
		explanation = null;
		explainerError = null;
	}

	async function handleExplainRecommendation() {
		if (!result?.recommendation.recommended) {
			explainerError = 'No recommendation to explain';
			return;
		}

		explainerLoading = true;
		explainerError = null;
		explanation = null;

		try {
			const functions = getFirebaseFunctions();
			const explainFn = httpsCallable(functions, 'explainRecommendation');

			const response = await explainFn({
				drugQuery,
				sigText,
				daysSupply,
				recommendation: {
					ndc: result.recommendation.recommended.ndc,
					packageSize: result.recommendation.recommended.packageSize,
					unit: result.recommendation.recommended.unit,
					matchType: result.recommendation.recommended.matchType,
					status: result.recommendation.recommended.status,
					overfillPercent: result.recommendation.recommended.overfillPercent,
					packsUsed: result.recommendation.recommended.packsUsed
				}
			});

			explanation = (response.data as string) || 'Unable to generate explanation';
			showExplainer = true;
		} catch (err) {
			console.error('Explainer error:', err);
			explainerError =
				err && typeof err === 'object' && 'message' in err
					? (err as { message?: string }).message ?? 'Failed to generate explanation'
					: 'Failed to generate explanation. The AI explainer may not be available.';
		} finally {
			explainerLoading = false;
		}
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
		showExplainer = false;
		explanation = null;
		explainerError = null;

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

	function clearAllCache() {
		cache.clear();
		cacheCleared = true;
		setTimeout(() => {
			cacheCleared = false;
		}, 3000);
		console.log('[Cache] All cache cleared');
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
	let showJsonModal = false;

	$: recommendedOption = result ? result.recommendation.recommended : null;
	$: alternativeOptions = result ? result.recommendation.alternatives : [];
	
	// Consolidate packs by NDC (combine duplicate NDCs into single line with total count)
	$: consolidatedPacks = recommendedOption ? 
		Object.entries(
			recommendedOption.packsUsed.reduce((acc, pack) => {
				acc[pack.ndc] = (acc[pack.ndc] || 0) + pack.count;
				return acc;
			}, {} as Record<string, number>)
		).map(([ndc, count]) => ({ ndc, count }))
		: [];

	// Generate simplified JSON for pharmacy API consumption
	function getSimplifiedJson() {
		if (!result || !recommendedOption) return {};
		return {
			prescription: {
				drug: {
					name: result.rxnorm.synonyms?.[0] || 'Unknown',
					strength: result.rxnorm.strength,
					doseForm: result.rxnorm.doseForm
				},
				instructions: {
					dose: result.normalizedSig.amountPerDose,
					doseUnit: result.normalizedSig.unit,
					frequencyPerDay: result.normalizedSig.frequencyPerDay,
					daysSupply: result.normalizedSig.daysSupply,
					confidence: Math.round(result.normalizedSig.confidence * 100) + '%'
				},
				targetQuantity: result.targetQuantity.totalUnits,
				targetUnit: result.targetQuantity.unit
			},
			recommendation: {
				ndc: recommendedOption.ndc,
				packageSize: recommendedOption.packageSize,
				packageUnit: recommendedOption.unit,
				ndcStatus: recommendedOption.status,
				totalDispensed: recommendedOption.totalDispensed,
				dispensingPlan: recommendedOption.packsUsed.map((pack: any) => ({
					ndc: pack.ndc,
					quantity: pack.count
				})),
				matchType: recommendedOption.matchType,
				overfillPercent: recommendedOption.overfillPercent,
				underfillPercent: recommendedOption.underfillPercent
			},
			warnings: result.warnings.length > 0 ? result.warnings.map((w: any) => ({
				severity: w.severity,
				message: w.message
			})) : null,
			timestamp: new Date().toISOString()
		};
	}
</script>

<div class="flex flex-col space-y-4 animate-fade-in p-2 sm:p-4">
	<!-- Form and Presets side by side -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-[2fr_1fr] items-start">
		<!-- Left: Prescription Form -->
		<div class="space-y-4">
			<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-6 sm:p-8 space-y-6 animate-fade-up">
				<div class="space-y-2">
					<h2 class="text-xl sm:text-2xl font-bold text-fh-text900">Prescription details</h2>
					<p class="text-xs sm:text-sm text-fh-text600">
						Provide the same information you would enter into your dispensing system. DoseMatch handles capsules, liquids,
						insulin, and inhalers out of the box.
					</p>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<div class="space-y-4">
						<div class="space-y-2">
							<label for="drugQuery" class="text-xs sm:text-sm font-semibold text-fh-text900">Drug name or NDC</label>
							<input
								type="text"
								id="drugQuery"
								bind:value={drugQuery}
								placeholder="e.g., 'lisinopril 10mg' or '00093-7701-01'"
								disabled={loading}
								class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fh-border rounded-fhsm focus:ring-2 focus:ring-fh-blue focus:border-transparent outline-none transition disabled:bg-fh-panel1 disabled:cursor-not-allowed text-sm"
								required
							/>
							<p class="text-xs text-fh-text600">
								Use a free text drug search or an NDC11. We automatically route through RxNorm for normalization.
							</p>
						</div>

						<div class="space-y-2">
							<label for="sigText" class="text-xs sm:text-sm font-semibold text-fh-text900">Dosage instructions (SIG)</label>
							<textarea
								id="sigText"
								bind:value={sigText}
								placeholder="e.g., 'Inhale 2 puffs every 4 hours as needed'
Take 1 tablet twice daily with meals"
								rows="4"
								disabled={loading}
								class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fh-border rounded-fhsm focus:ring-2 focus:ring-fh-blue focus:border-transparent outline-none transition disabled:bg-fh-panel1 disabled:cursor-not-allowed text-sm resize-none"
								required
							></textarea>
							<p class="text-xs text-fh-text600">
								Supports common abbreviations (QD, BID, TID, Q4H) plus free-text phrases such as "as needed for
								wheezing".
							</p>
						</div>

						<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_150px] lg:grid-cols-[minmax(0,1fr)_200px]">
							<div class="space-y-2">
								<label for="daysSupply" class="text-xs sm:text-sm font-semibold text-fh-text900">Days supply</label>
								<input
									type="number"
									id="daysSupply"
									min="1"
									max="365"
									bind:value={daysSupply}
									disabled={loading}
									class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-fh-border rounded-fhsm focus:ring-2 focus:ring-fh-blue focus:border-transparent outline-none transition disabled:bg-fh-panel1 disabled:cursor-not-allowed text-sm"
									required
								/>
						</div>
					</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-fh-blue to-fh-purple text-white rounded-fhmd font-semibold shadow-fh hover:shadow-fh-lg btn-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
					>
						{#if loading}
							<svg class="animate-spin h-4 sm:h-5 w-4 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span class="hidden sm:inline">Processing…</span>
							<span class="sm:hidden">Loading…</span>
						{:else}
							Calculate recommendation
						{/if}
					</button>
					
					<button
						type="button"
						on:click={clearAllCache}
						class="w-full px-3 py-2 text-xs text-fh-text600 hover:text-fh-blue border border-fh-border rounded-fhsm hover:bg-fh-panel1 transition"
					>
						{#if cacheCleared}
							✓ Cache Cleared
						{:else}
							Clear Cache (if seeing inactive NDCs)
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

		<!-- Right: Quick Presets -->
		<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-4 sm:p-6 space-y-3 sm:space-y-4 animate-fade-up h-fit">
			<div class="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
				<h3 class="text-base sm:text-lg font-bold text-fh-text900">Quick presets</h3>
				<button
					type="button"
					on:click={() => {
						drugQuery = '';
						sigText = '';
						daysSupply = 30;
						result = null;
						parsedSig = null;
						error = null;
					}}
					class="text-xs sm:text-sm font-semibold text-fh-blue hover:text-fh-purple hover:bg-fh-blue/10 px-2 sm:px-3 py-1 rounded-fhsm transition-all"
				>
					Clear
				</button>
			</div>
			<div class="grid gap-2 sm:gap-3 grid-cols-1">
				{#each presets as preset}
					<button
						type="button"
						on:click={() => loadPreset(preset)}
						disabled={loading}
						class="text-left rounded-fhsm border border-fh-border/30 bg-gradient-to-br from-fh-blue-light/30 to-transparent px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-fh-text600 hover:bg-white/50 hover:shadow-fh-md transition disabled:opacity-50 disabled:cursor-not-allowed card-hover"
					>
						<span class="block font-semibold text-fh-text900 break-words">{preset.name}</span>
						<span class="block mt-1 text-xs line-clamp-2">{preset.sigText}</span>
						<span class="block mt-1 text-xs uppercase tracking-wide text-fh-text600">{preset.daysSupply}-day supply</span>
					</button>
				{/each}
			</div>
		</section>
	</div>

	<!-- Results and Alternatives below (full width) -->
	<div class="space-y-4">
			{#if result}
				<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-up">
					{#if recommendedOption}
						<div class="flex flex-col gap-2 min-w-0">
							<div class="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
								<span class="text-lg flex-shrink-0">✓</span>
								<span>Recommendation Ready</span>
							</div>
							<div>
								<h2 class="text-2xl sm:text-3xl font-bold text-fh-text900 break-words">{formatNdc(recommendedOption.ndc)}</h2>
								<p class="text-sm text-fh-text600 mt-1">
									{result.rxnorm.synonyms?.[0] || 'Unnamed product'}
									{#if result.rxnorm.doseForm}
										<span class="text-fh-text900"> • {result.rxnorm.doseForm}</span>
									{/if}
									{#if result.rxnorm.strength}
										<span class="text-fh-text900"> • {result.rxnorm.strength}</span>
									{/if}
								</p>
							</div>
						</div>

					{#if parsedSig}
						<div class="space-y-3">
							<h3 class="text-sm font-semibold text-fh-text900">Dosing Summary</h3>
							<div class="grid grid-cols-3 gap-3 text-sm">
								<div class="rounded-fhmd bg-fh-panel2 border border-fh-border p-3">
									<div class="text-xs text-fh-text600">Dose</div>
									<div class="font-semibold text-fh-text900 mt-1">{parsedSig.amountPerDose} {parsedSig.unit}</div>
								</div>
								<div class="rounded-fhmd bg-fh-panel2 border border-fh-border p-3">
									<div class="text-xs text-fh-text600">Frequency</div>
									<div class="font-semibold text-fh-text900 mt-1">{parsedSig.frequencyPerDay}× daily</div>
								</div>
								<div class="rounded-fhmd bg-fh-panel2 border border-fh-border p-3">
									<div class="text-xs text-fh-text600">Days Supply</div>
									<div class="font-semibold text-fh-text900 mt-1">{parsedSig.daysSupply} days</div>
								</div>
							</div>
						</div>
					{/if}

					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-fh-text900">Recommended Package</h3>
						<div class="rounded-fhlg border-2 border-green-500 bg-green-50 p-4 space-y-3">
							<div class="flex flex-wrap items-center gap-2">
								<span class="px-3 py-1.5 rounded-fhmd bg-white text-fh-text900 font-semibold text-sm border border-green-300">
									{recommendedOption.packageSize} {recommendedOption.unit}
								</span>
								<span class={`px-3 py-1.5 rounded-fhmd font-semibold text-sm ${statusChip(recommendedOption.status)}`}>
									{recommendedOption.status}
								</span>
								{#if recommendedOption.badges?.length}
									{#each recommendedOption.badges as badge}
										<span class="px-3 py-1.5 rounded-fhmd bg-white border border-green-300 text-fh-text900 text-sm font-medium">{badge}</span>
									{/each}
								{/if}
							</div>

							<div class="space-y-2 text-sm">
							<div class="font-semibold text-fh-text900 text-base">Dispense:</div>
							{#each consolidatedPacks as pack}
								<div class="text-fh-text900">{pack.count}× pack of {formatNdc(pack.ndc)}</div>
							{/each}
								<div class="text-lg font-bold text-green-800 mt-2">
									Total: {recommendedOption.totalDispensed} {recommendedOption.unit}
								</div>
							</div>

							<div class="rounded-fhmd bg-white p-3 text-sm text-fh-text600 border border-green-300">
								{recommendedOption.why}
							</div>
						</div>
					</div>

					{#if result.warnings.length}
						<div class="space-y-2 sm:space-y-3">
							<h3 class="text-xs sm:text-sm font-semibold text-fh-text900 uppercase tracking-wide">Warnings</h3>
							<div class="space-y-1 sm:space-y-2">
								{#each result.warnings as warning}
									<div class={`rounded-fhmd border p-2 sm:p-3 text-xs sm:text-sm flex items-start gap-2 sm:gap-3 ${severityMap[warning.severity].classes}`}>
										<span class="text-lg leading-none flex-shrink-0">{severityMap[warning.severity].icon}</span>
										<p class="min-w-0">{warning.message}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					on:click={() => recommendedOption && copyToClipboard(formatNdc(recommendedOption.ndc))}
					class="px-3 sm:px-4 py-1 sm:py-2 bg-fh-blue text-white rounded-fhsm text-xs sm:text-sm font-semibold hover:bg-fh-purple transition"
				>
					Copy NDC
				</button>
					<button
						type="button"
						on:click={() => (showJsonModal = !showJsonModal)}
						class="px-3 sm:px-4 py-1 sm:py-2 rounded-fhsm border border-fh-border text-xs sm:text-sm font-semibold text-fh-text600 hover:bg-fh-panel2 transition"
					>
						View JSON
					</button>
					<button
						type="button"
						on:click={handleExplainRecommendation}
						disabled={explainerLoading}
						class="px-3 sm:px-4 py-1 sm:py-2 rounded-fhsm border border-fh-border text-xs sm:text-sm font-semibold text-fh-text600 hover:bg-fh-panel2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if explainerLoading}
							<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						{/if}
						<span>{showExplainer ? 'Hide AI Explanation' : 'Show AI Explanation'}</span>
					</button>
				</div>

				{#if showExplainer}
					<div class="space-y-3 rounded-fhmd border border-fh-border bg-gradient-to-br from-fh-purple-light/20 to-fh-blue-light/20 backdrop-blur-sm p-4 sm:p-6">
						<div class="flex items-start gap-3">
							<div class="text-2xl flex-shrink-0">🤖</div>
							<div class="min-w-0 flex-1">
								<h3 class="font-semibold text-fh-text900 text-sm sm:text-base mb-2">AI Explanation</h3>
								{#if explainerLoading}
									<div class="flex items-center gap-2 text-fh-text600 text-xs sm:text-sm">
										<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>Generating explanation…</span>
									</div>
								{:else if explainerError}
									<div class="rounded-fhsm border border-yellow-200 bg-yellow-50 p-2 sm:p-3 text-xs sm:text-sm text-yellow-900">
										<p class="font-semibold">⚠️ {explainerError}</p>
										<p class="mt-1">Showing deterministic explanation instead (see "Why" above).</p>
									</div>
								{:else if explanation}
									<p class="text-fh-text600 text-xs sm:text-sm leading-relaxed italic">{explanation}</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}
				{/if}
				</section>
			{:else}
				<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-4 sm:p-8 space-y-3 sm:space-y-4 text-center text-fh-text600 animate-fade-up">
					<h2 class="text-base sm:text-lg font-bold text-fh-text900">No recommendation yet</h2>
					<p class="text-xs sm:text-sm">
						Start by entering a real-world prescription. We'll parse the SIG, normalize the drug, and tee up an optimal
						package strategy.
					</p>
					<div class="text-xs bg-gradient-to-r from-fh-blue-light/30 to-fh-purple-light/30 border border-fh-border/30 rounded-fhsm px-2 sm:px-3 py-2 text-fh-text600 break-words">
						Example: "Amoxicillin 500mg – Take 1 capsule by mouth three times daily for 10 days."
					</div>
				</section>
			{/if}
		</div>
	</div>

	{#if result && alternativeOptions.length}
		<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-4 sm:p-8 space-y-4 sm:space-y-6 animate-fade-up">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
				<div>
					<h3 class="text-lg sm:text-xl font-semibold text-fh-text900">Alternative options</h3>
					<p class="text-xs sm:text-sm text-fh-text600">
						Explore additional NDCs ranked by score, overfill, and availability.
					</p>
				</div>
				<button
					type="button"
					on:click={() => copyToClipboard(JSON.stringify(alternativeOptions, null, 2))}
					class="px-3 sm:px-4 py-1 sm:py-2 border border-fh-border rounded-fhsm text-xs sm:text-sm font-semibold text-fh-text600 hover:bg-fh-panel2 transition"
				>
					Copy JSON
				</button>
			</div>

			<div class="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
				{#each alternativeOptions as alt}
					<div class="rounded-fhlg border border-fh-border/30 bg-gradient-to-br from-fh-blue-light/20 to-fh-purple-light/20 backdrop-blur-sm p-3 sm:p-5 space-y-2 sm:space-y-3 card-hover">
					<div class="flex items-start justify-between gap-2 min-w-0">
					<div class="min-w-0">
						<p class="font-semibold text-fh-text900 text-sm break-words">{formatNdc(alt.ndc)}</p>
						<p class="text-xs text-fh-text600">{alt.packageSize} {alt.unit}</p>
					</div>
						<button
							type="button"
							on:click={() => copyToClipboard(formatNdc(alt.ndc))}
							class="text-xs font-semibold text-fh-blue hover:text-fh-purple flex-shrink-0"
						>
							Copy
						</button>
					</div>
						{#if alt.badges?.length}
							<div class="flex flex-wrap gap-1 text-xs text-fh-text600">
								{#each alt.badges as badge}
									<span class="px-1 sm:px-2 py-1 rounded-fhsm bg-white border border-fh-border text-xs">{badge}</span>
								{/each}
							</div>
						{/if}
						<p class="text-xs text-fh-text600 leading-relaxed line-clamp-3">{alt.why}</p>
						<div class="flex flex-wrap gap-1 text-xs text-fh-text600">
							<span class="px-1 sm:px-2 py-1 rounded-fhsm bg-white border border-fh-border">Score: {alt.score}</span>
							<span class="px-1 sm:px-2 py-1 rounded-fhsm bg-white border border-fh-border">{alt.matchType}</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

	{#if showJsonModal && result}
	<!-- Modal Backdrop -->
	<div 
		class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
		on:click={() => (showJsonModal = false)}
		role="presentation"
	>
		<!-- Modal Content -->
		<div 
			class="bg-white rounded-fhlg border border-fh-border shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-fade-up"
			role="dialog"
			aria-modal="true"
			aria-labelledby="json-modal-title"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Escape' && (showJsonModal = false)}
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between gap-4 border-b border-fh-border p-4 sm:p-6 flex-shrink-0">
				<div>
					<h2 id="json-modal-title" class="text-lg sm:text-xl font-semibold text-fh-text900">Prescription JSON</h2>
					<p class="text-xs text-fh-text600 mt-1">Ready for pharmacy API consumption</p>
				</div>
				<button
					type="button"
					on:click={() => (showJsonModal = false)}
					class="flex-shrink-0 text-fh-text600 hover:text-fh-text900 transition"
					aria-label="Close modal"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6">
				<pre class="bg-fh-text900 text-gray-100 text-xs rounded-fhsm p-4 font-mono break-words whitespace-pre-wrap word-break">{JSON.stringify(getSimplifiedJson(), null, 2)}</pre>
			</div>

			<!-- Modal Footer -->
			<div class="border-t border-fh-border p-4 sm:p-6 flex items-center gap-3 flex-shrink-0 bg-fh-panel1">
				<button
					type="button"
					on:click={() => copyToClipboard(JSON.stringify(getSimplifiedJson(), null, 2))}
					class="px-4 py-2 bg-fh-blue text-white rounded-fhsm text-sm font-semibold hover:bg-fh-purple transition"
				>
					Copy JSON
				</button>
				<button
					type="button"
					on:click={() => (showJsonModal = false)}
					class="px-4 py-2 border border-fh-border text-fh-text600 rounded-fhsm text-sm font-semibold hover:bg-fh-panel2 transition"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

