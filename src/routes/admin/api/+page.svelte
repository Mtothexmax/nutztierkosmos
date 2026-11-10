<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { apiMessages, bridgeSnippet, skillPrompt } from '$lib/games/api-docs';
	import { toasts } from '$lib/stores/toast.svelte';

	let copied = $state('');

	async function copy(label: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			copied = label;
			toasts.push(`${label} kopiert`);
			setTimeout(() => (copied = ''), 2000);
		} catch {
			toasts.push('Kopieren nicht möglich – Text bitte manuell markieren', 'error');
		}
	}

	let hostMessages = $derived(apiMessages.filter((message) => message.direction === 'host'));
	let gameMessages = $derived(apiMessages.filter((message) => message.direction === 'game'));
</script>

<svelte:head><title>Spiel-API v1 · CMS</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Spiel-API v1</h1>
		<p class="text-ink-500">
			So kommunizieren HTML-Spiele mit der Plattform – und der Copy-Paste-Skill für KI-Assistenten.
		</p>
	</div>
	<a class="b2" href="/admin/spiele"><Icon name="arrow_back" />Zu den Spielen</a>
</div>

<div class="grid gap-4 lg:grid-cols-2">
	<div class="card space-y-3">
		<h2 class="font-serif text-xl font-semibold text-brand-700">Plattform → Spiel</h2>
		{#each hostMessages as message (message.type)}
			<div class="rounded-xl border border-sand-200 p-3">
				<div class="flex flex-wrap items-center gap-2">
					<span class="bdg">{message.type}</span>
					<code class="text-[12px] text-ink-700">{message.payload}</code>
				</div>
				<p class="mt-1 text-[13px] text-ink-500">{message.description}</p>
			</div>
		{/each}
	</div>

	<div class="card space-y-3">
		<h2 class="font-serif text-xl font-semibold text-brand-700">Spiel → Plattform</h2>
		{#each gameMessages as message (message.type)}
			<div class="rounded-xl border border-sand-200 p-3">
				<div class="flex flex-wrap items-center gap-2">
					<span class="bdg">{message.type}</span>
					<code class="text-[12px] text-ink-700">{message.payload}</code>
				</div>
				<p class="mt-1 text-[13px] text-ink-500">{message.description}</p>
			</div>
		{/each}
	</div>
</div>

<div class="card space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="font-serif text-xl font-semibold text-brand-700">Bridge-Skript für dein Spiel</h2>
		<button class="b2" onclick={() => copy('Bridge-Skript', bridgeSnippet)}>
			<Icon name="content_copy" size={18} />
			{copied === 'Bridge-Skript' ? 'Kopiert' : 'Kopieren'}
		</button>
	</div>
	<pre class="overflow-x-auto rounded-xl bg-[#0E1A15] p-4 font-mono text-[12px] leading-5 text-gray-300">
{bridgeSnippet}</pre>
</div>

<div class="card space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h2 class="font-serif text-xl font-semibold text-brand-700">KI-Skill zum Kopieren</h2>
			<p class="text-[13px] text-ink-500">
				Diesen Prompt zusammen mit einer Spielidee an einen KI-Assistenten geben.
			</p>
		</div>
		<button class="b1" onclick={() => copy('KI-Skill', skillPrompt)}>
			<Icon name="content_copy" size={18} />
			{copied === 'KI-Skill' ? 'Kopiert' : 'KI-Skill kopieren'}
		</button>
	</div>
	<textarea class="inp h-64 font-mono text-[12px]" readonly value={skillPrompt}></textarea>
</div>

<div class="grid gap-4 lg:grid-cols-2">
	<div class="card space-y-2">
		<h2 class="font-serif text-xl font-semibold text-brand-700">ZIP-Paket</h2>
		<ul class="list-disc space-y-1 pl-5 text-[14px] text-ink-700">
			<li>Startseite muss <code>index.html</code> heißen (auch in Unterordnern möglich).</li>
			<li>
				Pflicht: <code>game.json</code> im Stammordner mit den Grundeinstellungen (<code>id</code>,
				<code>title</code>, <code>topic</code> wie <code>rind/hitzestress</code>, <code>maxPoints</code> …). Wird beim Upload übernommen.
			</li>
			<li>Erlaubt: <code>.html</code>, <code>.css</code>, <code>.js</code>, <code>.mjs</code>, Bilder, Audio und Video.</li>
			<li>Maximal 5 MB entpackt und 150 Dateien.</li>
			<li>
				Andere Dateien (z. B. <code>.exe</code>, <code>.swf</code>, <code>.php</code>) werden aus
				Sicherheitsgründen nicht übernommen.
			</li>
			<li>Relative Pfade verwenden. CSS, JS und Medien werden beim Start automatisch eingebettet.</li>
		</ul>
	</div>

	<div class="card space-y-2">
		<h2 class="font-serif text-xl font-semibold text-brand-700">Sicherheit</h2>
		<ul class="list-disc space-y-1 pl-5 text-[14px] text-ink-700">
			<li>iframe-Sandbox mit <code>allow-scripts allow-forms allow-popups</code>.</li>
			<li>Kein <code>allow-same-origin</code>: kein localStorage, keine Cookies, kein DOM-Zugriff auf die Plattform.</li>
			<li>Kommunikation ausschließlich über <code>postMessage</code> mit <code>source</code>-Feld.</li>
			<li>Externe Netzwerk-Aufrufe und externe Skripte sind nicht vorgesehen.</li>
			<li>Die vollständige Doku liegt im Repository unter <code>docs/GAME-API.md</code>.</li>
		</ul>
	</div>
</div>
