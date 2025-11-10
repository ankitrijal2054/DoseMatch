<script lang="ts">
	const features = [
		{
			title: 'Smart SIG Parsing',
			description:
				'Rules-first parsing with AI fallback delivers confident interpretations of complex dosage instructions.',
			icon: '🎯'
		},
		{
			title: 'Multi-Pack Optimization',
			description:
				'Optimizes up to three packs at once to minimize waste while guaranteeing complete fills.',
			icon: '📦'
		},
		{
			title: 'Active NDC Verification',
			description:
				'Real-time checks against FDA data keep discontinued products out of your workflow.',
			icon: '✅'
		}
	];

	const workflow = [
		{
			title: 'Normalize the prescription',
			description:
				'RxNorm + SIG parsing extract the structured intent: dose, frequency, and total therapy duration.'
		},
		{
			title: 'Fetch and score NDCs',
			description:
				'FDA NDC Directory results are filtered, cached, and scored by match type, status, and pack efficiency.'
		},
		{
			title: 'Recommend with guardrails',
			description:
				'Warnings highlight inactive products, overfill, or partial fills so pharmacists can act instantly.'
		}
	];

	const problems = [
		{
			title: 'Dosage Form Mismatches',
			description: "RxNorm normalization ensures prescriptions for 'tablets' never return 'capsules'.",
			accent: 'bg-red-50 border-red-200 text-red-900',
			icon: '❌'
		},
		{
			title: 'Package Size Confusion',
			description:
				'Multi-pack optimizer surfaces precise combinations when single packs fall short.',
			accent: 'bg-orange-50 border-orange-200 text-orange-900',
			icon: '📉'
		},
		{
			title: 'Inactive NDC Selection',
			description: 'Live FDA status checks prevent costly claim rejections from discontinued products.',
			accent: 'bg-yellow-50 border-yellow-200 text-yellow-900',
			icon: '⚠️'
		},
		{
			title: 'Complex SIG Interpretation',
			description:
				'Confidence scores expose ambiguity and trigger AI assistance for edge-case instructions.',
			accent: 'bg-blue-50 border-blue-200 text-blue-900',
			icon: '🧠'
		},
		{
			title: 'Unit Conversion Errors',
			description: 'Canonical units (EA, mL, g, U, actuations) eliminate conversion mistakes.',
			accent: 'bg-green-50 border-green-200 text-green-900',
			icon: '🔤'
		}
	];

	const stats = [
		{ value: '95%+', label: 'Normalization Accuracy' },
		{ value: '50%', label: 'Fewer Claim Rejections' },
		{ value: '< 2s', label: 'Typical Response Time' }
	];
</script>

<div class="space-y-16 pb-16">
	<section class="fh-hero rounded-fhlg p-12 md:p-20 text-white text-center shadow-fh-xl relative overflow-hidden animate-fade-in">
		<div class="absolute inset-0 bg-black/10 rounded-fhlg"></div>
		<div class="relative z-10 space-y-6">
			<h1 class="text-5xl md:text-7xl font-bold mb-4 leading-tight">
				DoseMatch
			</h1>
			<p class="text-xl md:text-2xl mb-6 opacity-95 font-light">From SIG to shelf—perfect fills, every time.</p>
			<p class="max-w-2xl mx-auto text-base md:text-lg opacity-90 mb-10 font-light leading-relaxed">
				AI-accelerated prescription matching that finds the right NDC package on the first try, preventing claim
				rejections and speeding up fulfillment for busy pharmacy teams.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<a
					href="/calc"
					class="inline-flex items-center justify-center px-8 py-3 bg-white text-fh-blue rounded-fhmd font-semibold shadow-fh-lg hover:shadow-fh-xl hover:scale-105 btn-hover"
				>
					Open the Calculator
				</a>
				<a
					href="#features"
					class="inline-flex items-center justify-center px-8 py-3 bg-white/20 text-white rounded-fhmd font-semibold border-2 border-white/50 hover:bg-white/30 hover:border-white/80 btn-hover"
				>
					See the Platform
				</a>
			</div>
		</div>
	</section>

	<section id="features" class="space-y-12 animate-fade-up">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
			<div>
				<h2 class="text-4xl md:text-5xl font-bold text-fh-text900 leading-tight">Smarter workflows for pharmacy teams</h2>
				<p class="text-fh-text600 mt-4 max-w-2xl text-lg leading-relaxed">
					DoseMatch blends deterministic rules with explainable AI to deliver recommendations you can trust—and
					explain to patients, payers, and auditors alike.
				</p>
			</div>
			<a href="/calc" class="px-6 py-3 bg-gradient-to-r from-fh-blue to-fh-purple text-white rounded-fhmd font-semibold shadow-fh hover:shadow-fh-lg btn-hover whitespace-nowrap">
				Calculate an NDC
			</a>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			{#each features as feature, i}
				<div class="bg-white/60 backdrop-blur-sm rounded-fhlg border border-fh-border/30 shadow-fh p-8 space-y-4 card-hover group" style="animation-delay: {i * 100}ms">
					<div class="w-14 h-14 rounded-fhmd bg-gradient-to-br from-fh-blue/20 to-fh-purple/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
						{feature.icon}
					</div>
					<h3 class="text-xl font-bold text-fh-text900">{feature.title}</h3>
					<p class="text-fh-text600 leading-relaxed">{feature.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-10 md:p-12 space-y-8 animate-fade-up">
		<h2 class="text-4xl md:text-5xl font-bold text-fh-text900">How DoseMatch works</h2>
		<div class="grid gap-6 md:grid-cols-3">
			{#each workflow as step, index}
				<div class="rounded-fhlg border border-fh-border/30 bg-gradient-to-br from-fh-blue-light/30 to-fh-purple-light/30 backdrop-blur-sm p-8 space-y-4 relative group hover:shadow-fh-lg transition-all duration-300">
					<div class="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-fh-blue to-fh-purple text-white font-bold flex items-center justify-center shadow-fh group-hover:scale-110 transition-transform duration-300">
						{index + 1}
					</div>
					<h3 class="text-lg font-bold text-fh-text900 mt-2">{step.title}</h3>
					<p class="text-fh-text600 leading-relaxed">{step.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="space-y-8 animate-fade-up">
		<h2 class="text-4xl md:text-5xl font-bold text-fh-text900">Problems solved</h2>
		<div class="grid gap-5 md:grid-cols-2">
			{#each problems as problem}
				<div class={`rounded-fhlg border-2 backdrop-blur-sm p-6 flex gap-4 items-start group hover:shadow-fh-lg transition-all duration-300 ${problem.accent} bg-opacity-50`}>
					<div class="text-3xl leading-none group-hover:scale-110 transition-transform duration-300">{problem.icon}</div>
					<div class="flex-1">
						<h3 class="text-lg font-bold mb-2 text-fh-text900">{problem.title}</h3>
						<p class="text-sm leading-relaxed opacity-90">{problem.description}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="bg-white/50 backdrop-blur-md rounded-fhlg border border-fh-border/30 shadow-fh-lg p-10 md:p-12 animate-fade-up">
		<div class="grid gap-8 md:grid-cols-3 text-center">
			{#each stats as stat, i}
				<div class="group" style="animation-delay: {i * 100}ms">
					<div class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-fh-blue to-fh-purple bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
						{stat.value}
					</div>
					<div class="text-fh-text600 text-sm uppercase tracking-widest font-semibold">{stat.label}</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="fh-hero rounded-fhlg p-12 md:p-20 text-center text-white shadow-fh-xl relative overflow-hidden animate-fade-up">
		<div class="absolute inset-0 bg-black/5 rounded-fhlg"></div>
		<div class="relative z-10 space-y-6">
			<h2 class="text-4xl md:text-6xl font-bold leading-tight">Ready to reduce prescription errors by 50%?</h2>
			<p class="text-lg opacity-95 mb-8 max-w-2xl mx-auto font-light">
				Run a real prescription through the calculator to see the SIG breakdown, pack recommendation, and guardrail
				warnings in seconds.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<a
					href="/calc"
					class="inline-flex items-center justify-center px-8 py-3 bg-white text-fh-blue rounded-fhmd font-semibold shadow-fh-lg hover:shadow-fh-xl hover:scale-105 btn-hover"
				>
					Try the Calculator
				</a>
				<a
					href="https://rxnav.nlm.nih.gov/"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center justify-center px-8 py-3 bg-white/20 text-white rounded-fhmd font-semibold border-2 border-white/50 hover:bg-white/30 hover:border-white/80 btn-hover"
				>
					Explore the Data Sources
				</a>
			</div>
		</div>
	</section>
</div>
