<script lang="ts">
	import '../styles/theme.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DoseMatch - NDC & Quantity Calculator</title>
	<meta name="description" content="AI-accelerated NDC packaging and quantity calculator for pharmacy systems" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="flex flex-col min-h-screen bg-white">
	<!-- Demo Banner -->
	<div class="w-full bg-blue-50 border-b border-blue-200 px-4 py-3 text-center">
		<p class="text-sm text-blue-900 font-medium">
			🚀 <span class="font-bold">DoseMatch</span> - Portfolio Demo Project (Firebase + OpenAI)
		</p>
	</div>

	<!-- Navbar -->
	<nav class="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<!-- Logo / Branding -->
				<a href="/" class="flex items-center gap-2">
					<div class="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
						<span class="text-white font-bold text-lg">D</span>
					</div>
					<span class="text-xl font-bold text-gray-900 hidden sm:inline">DoseMatch</span>
				</a>

				<!-- Nav Links -->
				<div class="flex items-center gap-6">
					<a href="/" class="text-gray-700 hover:text-indigo-600 font-medium transition">Home</a>
					<a href="/calc" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
						Calculator
					</a>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1 w-full">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="w-full bg-gray-900 text-gray-100 border-t border-gray-800 mt-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
				<!-- About -->
				<div>
					<h3 class="text-lg font-bold text-white mb-4">DoseMatch</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						AI-accelerated NDC packaging and quantity calculator for pharmacy systems. From SIG to shelf—perfect fills, every time.
					</p>
				</div>

				<!-- Links -->
				<div>
					<h3 class="text-lg font-bold text-white mb-4">Quick Links</h3>
					<ul class="space-y-2">
						<li><a href="/" class="text-gray-400 hover:text-white transition">Home</a></li>
						<li><a href="/calc" class="text-gray-400 hover:text-white transition">Calculator</a></li>
						<li><a href="/test-adapters" class="text-gray-400 hover:text-white transition text-xs">Test Adapters</a></li>
					</ul>
				</div>

				<!-- APIs -->
				<div>
					<h3 class="text-lg font-bold text-white mb-4">Data Sources</h3>
					<ul class="space-y-2">
						<li><a href="https://rxnav.nlm.nih.gov" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition text-sm">RxNorm (NIH)</a></li>
						<li><a href="https://open.fda.gov" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition text-sm">FDA NDC Directory</a></li>
						<li><a href="https://openai.com" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition text-sm">OpenAI GPT-4o-mini</a></li>
					</ul>
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t border-gray-800 pt-8">
				<div class="flex flex-col sm:flex-row justify-between items-center gap-4">
					<p class="text-gray-400 text-sm">© 2025 DoseMatch. Portfolio project for Foundation Health.</p>
					<p class="text-gray-500 text-xs">Built with SvelteKit, Firebase, and Tailwind CSS</p>
				</div>
			</div>
		</div>
	</footer>
</div>
