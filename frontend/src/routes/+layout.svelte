<script lang="ts">
	import '../styles/theme.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DoseMatch - NDC & Quantity Calculator</title>
	<meta
		name="description"
		content="AI-accelerated NDC packaging and quantity calculator for pharmacy systems"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-gradient-to-br from-fh-bg via-fh-panel1 to-fh-panel2">
	<nav class="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-fh-border/30 shadow-fh-md">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<a href="/" class="flex items-center gap-3 group">
					<div class="w-10 h-10 rounded-fhmd bg-gradient-to-br from-fh-magenta via-fh-purple to-fh-blue flex items-center justify-center text-white font-semibold text-lg shadow-fh group-hover:shadow-fh-lg transition-all duration-300">
						DM
					</div>
					<div>
						<h1 class="text-xl font-bold text-fh-text900 group-hover:text-fh-blue transition-colors">DoseMatch</h1>
						<p class="text-xs text-fh-text600">From SIG to shelf—perfect fills, every time.</p>
					</div>
				</a>

				<div class="flex items-center gap-3">
					<a href="/" class="px-4 py-2 text-fh-text600 hover:text-fh-blue font-medium rounded-fhsm hover:bg-fh-blue/5 transition-all duration-200">Home</a>
					<a
						href="/calc"
						class="px-6 py-2 bg-gradient-to-r from-fh-blue to-fh-purple text-white rounded-fhmd shadow-fh hover:shadow-fh-lg font-semibold btn-hover"
					>
						Calculator
					</a>
				</div>
			</div>
		</div>
	</nav>

	<div class="bg-gradient-to-r from-fh-blue/5 via-fh-purple/5 to-fh-magenta/5 border-b border-fh-border/30 backdrop-blur-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-sm text-fh-text600 animate-fade-in">
			<span class="font-semibold text-fh-text900">Demo Mode:</span> Portfolio build for Foundation Health. No patient data is collected or stored.
		</div>
	</div>

	<main class="flex-1 w-full py-8 md:py-12 lg:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-up">
			{@render children()}
		</div>
	</main>

	<footer class="mt-auto bg-white/40 backdrop-blur-md border-t border-fh-border/30 py-8 md:py-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-fh-text600">
			<div class="space-y-3">
				<p class="font-medium text-fh-text900">© {currentYear} DoseMatch • Built for Foundation Health</p>
				<p>
					<a href="https://github.com/yourusername/dosematch" class="text-fh-blue hover:text-fh-purple font-semibold hover:underline transition-colors">View on GitHub</a>
				</p>
			</div>
		</div>
	</footer>
</div>
