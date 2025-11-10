<script lang="ts">
	import { normalizeDrug } from '$lib/adapters/rxnorm';
	import { ndcsByRxCui } from '$lib/adapters/fda';
	import { cache } from '$lib/cache';

	let drugQuery = 'lisinopril 10mg';
	let loading = false;
	let rxnormResult: any = null;
	let fdaResult: any = null;
	let error = '';
	let cacheStats: any = null;

	async function testAdapters() {
		loading = true;
		error = '';
		rxnormResult = null;
		fdaResult = null;

		try {
			console.log('=== Testing RxNorm Adapter ===');
			const startRxnorm = Date.now();
			rxnormResult = await normalizeDrug(drugQuery);
			const rxnormTime = Date.now() - startRxnorm;
			console.log(`RxNorm completed in ${rxnormTime}ms`, rxnormResult);

			console.log('=== Testing FDA Adapter ===');
			const startFda = Date.now();
			fdaResult = await ndcsByRxCui(rxnormResult.rxcui);
			const fdaTime = Date.now() - startFda;
			console.log(`FDA completed in ${fdaTime}ms, found ${fdaResult.length} NDCs`);

			// Get cache stats
			cacheStats = cache.stats();
			console.log('Cache stats:', cacheStats);
		} catch (err: any) {
			error = err.message || 'Unknown error occurred';
			console.error('Error testing adapters:', err);
		} finally {
			loading = false;
		}
	}

	function clearCache() {
		cache.clear();
		cacheStats = cache.stats();
		console.log('Cache cleared');
	}
</script>

<div class="max-w-4xl mx-auto p-8">
	<h1 class="text-3xl font-bold text-fh-text900 mb-6">API Adapter Test Page</h1>

	<div class="bg-white rounded-lg p-6 shadow-lg border border-fh-border mb-6">
		<h2 class="text-xl font-semibold mb-4">Test Configuration</h2>

	<div class="mb-4">
		<label for="drugInput" class="block text-sm font-medium text-fh-text900 mb-2">
			Drug Name or NDC
		</label>
		<input
			id="drugInput"
			type="text"
			bind:value={drugQuery}
			placeholder="e.g., lisinopril 10mg"
			class="w-full px-4 py-2 border border-fh-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fh-blue"
			/>
		</div>

		<div class="flex gap-3">
			<button
				on:click={testAdapters}
				disabled={loading}
				class="px-6 py-2 bg-fh-blue text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Testing...' : 'Test Adapters'}
			</button>

			<button
				on:click={clearCache}
				class="px-6 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:opacity-90"
			>
				Clear Cache
			</button>
		</div>

		{#if error}
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
				<strong>Error:</strong>
				{error}
			</div>
		{/if}
	</div>

	<!-- Cache Stats -->
	{#if cacheStats}
		<div class="bg-white rounded-lg p-6 shadow-lg border border-fh-border mb-6">
			<h2 class="text-xl font-semibold mb-4">Cache Statistics</h2>
			<div class="space-y-2">
				<p class="text-sm">
					<strong>Cached Items:</strong>
					{cacheStats.size}
				</p>
				<p class="text-sm">
					<strong>Keys:</strong>
					{cacheStats.keys.join(', ') || 'None'}
				</p>
			</div>
		</div>
	{/if}

	<!-- RxNorm Results -->
	{#if rxnormResult}
		<div class="bg-white rounded-lg p-6 shadow-lg border border-fh-border mb-6">
			<h2 class="text-xl font-semibold mb-4">RxNorm Results</h2>
			<div class="space-y-2">
				<p class="text-sm">
					<strong>RxCUI:</strong>
					{rxnormResult.rxcui}
				</p>
				{#if rxnormResult.doseForm}
					<p class="text-sm">
						<strong>Dose Form:</strong>
						{rxnormResult.doseForm}
					</p>
				{/if}
				{#if rxnormResult.strength}
					<p class="text-sm">
						<strong>Strength:</strong>
						{rxnormResult.strength}
					</p>
				{/if}
				{#if rxnormResult.synonyms?.length}
					<p class="text-sm">
						<strong>Synonyms:</strong>
						{rxnormResult.synonyms.join(', ')}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- FDA Results -->
	{#if fdaResult && fdaResult.length > 0}
		<div class="bg-white rounded-lg p-6 shadow-lg border border-fh-border">
			<h2 class="text-xl font-semibold mb-4">
				FDA NDC Results ({fdaResult.length} packages found)
			</h2>

			<div class="space-y-3">
				{#each fdaResult.slice(0, 10) as ndc}
					<div
						class="p-4 border border-fh-border rounded-lg {ndc.status === 'ACTIVE'
							? 'bg-green-50'
							: 'bg-gray-50'}"
					>
						<div class="flex justify-between items-start">
							<div>
								<p class="font-mono font-semibold">{ndc.ndc11}</p>
								<p class="text-sm text-gray-600">
									{ndc.packageSize}
									{ndc.unit}
								</p>
								{#if ndc.productName}
									<p class="text-xs text-gray-500 mt-1">{ndc.productName}</p>
								{/if}
								{#if ndc.labeler}
									<p class="text-xs text-gray-400">{ndc.labeler}</p>
								{/if}
							</div>
							<span
								class="px-2 py-1 rounded text-xs font-medium {ndc.status === 'ACTIVE'
									? 'bg-green-200 text-green-800'
									: 'bg-gray-200 text-gray-800'}"
							>
								{ndc.status}
							</span>
						</div>
					</div>
				{/each}

				{#if fdaResult.length > 10}
					<p class="text-sm text-gray-600 text-center">
						Showing first 10 of {fdaResult.length} results
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
		<p class="text-sm text-blue-900">
			<strong>Instructions:</strong>
		</p>
		<ol class="text-sm text-blue-800 mt-2 ml-4 list-decimal space-y-1">
			<li>Enter a drug name or NDC in the input field</li>
			<li>Click "Test Adapters" to run both RxNorm and FDA API calls</li>
			<li>Check browser console for detailed logs</li>
			<li>Click again to test cache hits (should be much faster)</li>
			<li>Use "Clear Cache" to reset and test fresh API calls</li>
		</ol>
	</div>
</div>

