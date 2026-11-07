<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import PlayerHeader from '$lib/components/PlayerHeader.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';

	let moduleId = $derived(page.params.moduleId ?? '');
	let module = $derived(content.getModule(moduleId));
	let progress = $derived(
		session.player ? content.moduleProgress(moduleId, session.player.id) : 0
	);

	const moduleFacts: Record<string, string[]> = {
		'm-milch': [
			'Archaeen bilden im Pansen Methan.',
			'Futter beeinflusst die Menge.',
			'Pro kg Milch sinkt der Ausstoß.'
		],
		'm-schwein': [
			'20–24 °C sind für Mastschweine angenehm.',
			'Feuchte Luft belastet die Atemwege.',
			'Trockene Liegeflächen sprechen für gutes Klima.'
		],
		'm-gefluegel': [
			'Verhalten zeigt, wie es den Tieren geht.',
			'Sitzstangen und Einstreu strukturieren den Stall.',
			'Licht und Luftqualität steuern die Aktivität.'
		],
		'm-praezision': [
			'Sensoren erfassen Aktivität und Liegezeiten.',
			'Daten unterstützen Entscheidungen, ersetzen aber nicht den Blick aufs Tier.',
			'Früh erkannte Signale helfen, Krankheiten zu vermeiden.'
		]
	};
	let facts = $derived(moduleFacts[moduleId] ?? []);

	type Station = {
		id: string;
		kind: 'quiz' | 'game';
		title: string;
		meta: string;
		icon: string;
		href: string;
		done: boolean;
	};

	let stations = $derived.by<Station[]>(() => {
		if (!module) return [];
		const playerId = session.player?.id;
		const quizzes = content.quizzesForModule(module.id).map((quiz) => ({
			id: quiz.id,
			kind: 'quiz' as const,
			title: `Quiz · ${quiz.title}`,
			meta: `${quiz.questions.length} Fragen · ${quiz.questions.reduce((s, q) => s + q.points, 0)} P.`,
			icon: 'quiz',
			href: `/quiz/${quiz.id}`,
			done: Boolean(playerId && content.scores.some((s) => s.playerId === playerId && s.refId === quiz.id))
		}));
		const games = content.gamesForModule(module.id).map((game) => ({
			id: game.id,
			kind: 'game' as const,
			title: `Spiel · ${game.title}`,
			meta: `${game.maxPoints} P. · ca. 5 Min.`,
			icon: 'sports_esports',
			href: `/spielen/${game.id}`,
			done: Boolean(playerId && content.scores.some((s) => s.playerId === playerId && s.refId === game.id))
		}));
		return [...quizzes, ...games];
	});

	function isLocked(index: number): boolean {
		return index > 0 && !stations[index - 1].done;
	}

	let totalPoints = $derived(
		module
			? content
					.quizzesForModule(module.id)
					.reduce((sum, quiz) => sum + quiz.questions.reduce((s, q) => s + q.points, 0), 0) +
				content.gamesForModule(module.id).reduce((sum, game) => sum + game.maxPoints, 0)
			: 0
	);
</script>

<svelte:head><title>{module?.title ?? 'Modul'} · Nutztierkosmos</title></svelte:head>

<PlayerHeader />

{#if !module}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Modul gibt es nicht (mehr).</p>
			<a class="b1" href="/lernen">Zurück zu den Modulen</a>
		</div>
	</main>
{:else}
	<main class="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
		<nav class="text-[13px] text-ink-500">
			<a href="/lernen" class="text-brand-500">Lernen</a> / {module.title}
		</nav>

		<div class="grid gap-6 lg:grid-cols-[1fr_260px]">
			<div class="space-y-6">
				<div class="flex items-center gap-4">
					<div class="grid h-20 w-20 place-items-center rounded-2xl bg-brand-100 text-5xl">
						{module.emoji}
					</div>
					<div>
						<h1 class="h1">{module.title}</h1>
						<p class="text-ink-500">{module.description}</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					{#if stations.length}
						<span class="bdg"
							>{stations.length} {stations.length === 1 ? 'Station' : 'Stationen'}</span
						>
						<span class="bdg">{totalPoints} Punkte</span>
						<span class="bdg">ca. {stations.length * 5} Min.</span>
					{:else}
						<span class="bdg !bg-sand-100 !text-ink-500">Bald verfügbar</span>
					{/if}
				</div>

				<div class="card divide-y divide-sand-200 !p-0">
					{#each stations as station, index (station.id)}
						{@const locked = isLocked(index)}
						<div class="flex items-center gap-4 p-5 {station.done ? 'opacity-70' : ''}">
							<Icon
								name={station.done ? 'check_circle' : locked ? 'lock' : station.icon}
								class={station.done
									? 'text-brand-600'
									: locked
										? 'text-ink-500'
										: 'text-amber-500'}
							/>
							<div class="flex-1">
								<p class="font-semibold">{station.title}</p>
								<p class="text-[13px] text-ink-500">
									{station.meta} · {station.done
										? 'Abgeschlossen'
										: locked
											? 'Gesperrt – schließe zuerst die vorherige Station ab'
											: 'Offen'}
								</p>
							</div>
							{#if !locked}
								<button
									class={station.done ? 'b2' : 'b1'}
									onclick={() => goto(station.href)}
								>
									{station.done ? 'Nochmal' : 'Starten'}
								</button>
							{/if}
						</div>
					{/each}

					{#if stations.length === 0}
						<div class="p-8 text-center text-ink-500">
							Für dieses Modul sind noch keine Inhalte veröffentlicht.
						</div>
					{/if}
				</div>
			</div>

			<aside class="space-y-4">
				<div class="card text-center">
					<div class="flex justify-center">
						<ProgressRing
							value={progress}
							size={80}
							track="#E7E0CE"
							innerClass="bg-white text-ink-900"
						/>
					</div>
					<p class="mt-2 text-[13px]">
						{stations.filter((s) => s.done).length} von {stations.length} Stationen
					</p>
				</div>

				<div class="card">
					<h3 class="mb-2 font-semibold">Das steckt dahinter</h3>
					{#if facts.length}
						<ul class="list-disc space-y-1 pl-5 text-ink-700">
							{#each facts as fact (fact)}
								<li>{fact}</li>
							{/each}
						</ul>
					{:else}
						<p class="text-[13px] text-ink-500">Inhalte folgen in Kürze.</p>
					{/if}
					<p class="mt-3 text-[13px] text-ink-500">FBN, Institut für Nutztierbiologie</p>
				</div>
			</aside>
		</div>
	</main>
{/if}
