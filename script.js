const API_BASE = "https://pokeapi.co/api/v2";
const MAX_POKEMON_ID = 1025;
const BATTLE_STATE = {
  IDLE: "idle",
  READY: "ready",
  RUNNING: "running",
  FINISHED: "finished",
};
const UI_TEXT = {
  battle: "Batallar",
  restart: "Reiniciar",
  newBattleReady: "Listo para una nueva batalla.",
  firstPokemon: "Primero busca tu Pokemon.",
  preparingRival: "Preparando rival desde PokeAPI...",
  extendedDataError: "No se pudo cargar la informacion extendida de este Pokemon.",
};
const FIGHTER_ROSTER = [
  "pikachu",
  "charizard",
  "bulbasaur",
  "squirtle",
  "mewtwo",
  "lucario",
  "greninja",
  "gengar",
  "dragonite",
  "snorlax",
  "machamp",
  "gardevoir",
];

const state = {
  calls: [],
  activeType: "",
  selectedPokemon: null,
  rivalPokemon: null,
  battle: null,
  battleStatus: BATTLE_STATE.IDLE,
  battleLoser: null,
  pokemonIndex: [],
  resourceCache: new Map(),
  fighterRoster: [],
};

const elements = {
  form: document.querySelector("#searchForm"),
  input: document.querySelector("#pokemonInput"),
  pokemonSuggestions: document.querySelector("#pokemonSuggestions"),
  randomBtn: document.querySelector("#randomBtn"),
  quickActions: document.querySelector(".quick-actions"),
  selectedName: document.querySelector("#selectedName"),
  selectedId: document.querySelector("#selectedId"),
  rivalName: document.querySelector("#rivalName"),
  rivalId: document.querySelector("#rivalId"),
  artwork: document.querySelector("#pokemonArtwork"),
  rivalArtwork: document.querySelector("#rivalArtwork"),
  playerSpotlight: document.querySelector(".player-spotlight"),
  rivalSpotlight: document.querySelector(".rival-spotlight"),
  spotlightBySide: {
    player: document.querySelector(".player-spotlight"),
    rival: document.querySelector(".rival-spotlight"),
  },
  playerHeightTag: document.querySelector("#playerHeightTag"),
  rivalHeightTag: document.querySelector("#rivalHeightTag"),
  emptyState: document.querySelector("#emptyState"),
  statusPill: document.querySelector("#statusPill"),
  typeRow: document.querySelector("#typeRow"),
  heightMetric: document.querySelector("#heightMetric"),
  weightMetric: document.querySelector("#weightMetric"),
  xpMetric: document.querySelector("#xpMetric"),
  statsList: document.querySelector("#statsList"),
  abilityStrip: document.querySelector("#abilityStrip"),
  profileGrid: document.querySelector("#profileGrid"),
  speciesSummary: document.querySelector("#speciesSummary"),
  locationList: document.querySelector("#locationList"),
  evolutionLine: document.querySelector("#evolutionLine"),
  moveList: document.querySelector("#moveList"),
  rivalForm: document.querySelector("#rivalForm"),
  rivalInput: document.querySelector("#rivalInput"),
  rivalSuggestions: document.querySelector("#rivalSuggestions"),
  battleBtn: document.querySelector("#battleBtn"),
  playerHudName: document.querySelector("#playerHudName"),
  rivalHudName: document.querySelector("#rivalHudName"),
  playerHpBar: document.querySelector("#playerHpBar"),
  rivalHpBar: document.querySelector("#rivalHpBar"),
  playerHpText: document.querySelector("#playerHpText"),
  rivalHpText: document.querySelector("#rivalHpText"),
  vsBurst: document.querySelector("#vsBurst"),
  stageBattleBtn: document.querySelector("#stageBattleBtn"),
  versusPlayerName: document.querySelector("#versusPlayerName"),
  versusRivalName: document.querySelector("#versusRivalName"),
  fighterRoster: document.querySelector("#fighterRoster"),
  matchupGrid: document.querySelector("#matchupGrid"),
  battleSummary: document.querySelector("#battleSummary"),
  turnLog: document.querySelector("#turnLog"),
  typeFilter: document.querySelector("#typeFilter"),
  pokemonGrid: document.querySelector("#pokemonGrid"),
  callLog: document.querySelector("#callLog"),
  callCount: document.querySelector("#callCount"),
  avgLatency: document.querySelector("#avgLatency"),
  helpDialog: document.querySelector("#helpDialog"),
  helpTitle: document.querySelector("#helpTitle"),
  helpBody: document.querySelector("#helpBody"),
  helpClose: document.querySelector("#helpClose"),
  introDialog: document.querySelector("#introDialog"),
  introClose: document.querySelector("#introClose"),
};

const typeColors = {
  normal: "#8d98a7",
  fire: "#e85d3f",
  water: "#3187d6",
  electric: "#d9a816",
  grass: "#36a85d",
  ice: "#48a9bc",
  fighting: "#b84b4b",
  poison: "#9458b5",
  ground: "#b78345",
  flying: "#668ad8",
  psychic: "#d94b80",
  bug: "#7a9f34",
  rock: "#9b8449",
  ghost: "#5f5a9d",
  dragon: "#4e6fd2",
  dark: "#4f5562",
  steel: "#637c91",
  fairy: "#ce67a5",
};

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

const pokeApi = {
  endpoint(path) {
    return path.startsWith("http") ? path : `${API_BASE}${path}`;
  },

  async get(path, label = "GET") {
    const url = this.endpoint(path);
    if (state.resourceCache.has(url)) {
      this.recordCacheHit(url, label);
      return state.resourceCache.get(url);
    }

    const data = await this.fetchTracked(path, label);
    state.resourceCache.set(url, data);
    return data;
  },

  async fetchTracked(path, label = "GET") {
    const url = this.endpoint(path);
    const startedAt = performance.now();
    const entry = {
      id: crypto.randomUUID(),
      label,
      method: "GET",
      url,
      status: "pendiente",
      latency: 0,
      time: new Date(),
    };

    state.calls.unshift(entry);
    renderCalls();

    try {
      const response = await fetch(url);
      entry.status = String(response.status);
      entry.ok = response.ok;
      entry.latency = Math.round(performance.now() - startedAt);
      renderCalls();

      if (!response.ok) {
        throw new Error(`PokeAPI respondio ${response.status}`);
      }

      return response.json();
    } catch (error) {
      entry.status = "error";
      entry.ok = false;
      entry.latency = Math.round(performance.now() - startedAt);
      entry.error = error.message;
      renderCalls();
      throw error;
    }
  },

  recordCacheHit(url, label) {
    state.calls.unshift({
      id: crypto.randomUUID(),
      label,
      method: "GET",
      url,
      status: "cache",
      ok: true,
      latency: 0,
      time: new Date(),
      fromCache: true,
    });
    renderCalls();
  },
};

function renderCalls() {
  const completed = state.calls.filter((call) => call.latency > 0);
  const average = completed.length
    ? Math.round(completed.reduce((sum, call) => sum + call.latency, 0) / completed.length)
    : 0;

  elements.callCount.textContent = state.calls.length;
  elements.avgLatency.textContent = `${average}ms`;

  elements.callLog.innerHTML = state.calls
    .slice(0, 8)
    .map((call) => {
      const statusClass = call.fromCache ? "cache" : call.status === "pendiente" ? "" : call.ok ? "ok" : "fail";
      const statusText = call.status === "pendiente" ? "en curso" : call.status;
      const path = call.url.replace(API_BASE, "");
      return `
        <div class="call-row">
          <span class="call-dot ${statusClass}" aria-hidden="true"></span>
          <span class="method">${call.method}</span>
          <code title="${call.url}">${path}</code>
          <span class="result ${statusClass}">${statusText}</span>
          <span class="latency">${call.fromCache ? "cache" : call.latency ? `${call.latency}ms` : call.time.toLocaleTimeString()}</span>
        </div>
      `;
    })
    .join("");
}

function setLoading(isLoading) {
  elements.statusPill.textContent = isLoading ? "cargando" : "online";
  elements.statusPill.classList.toggle("is-online", !isLoading && Boolean(state.selectedPokemon));
}

function formatStatName(name) {
  return name.replace("special-", "sp. ");
}

function officialArtwork(pokemon) {
  return (
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.other?.home?.front_default ||
    pokemon.sprites.front_default ||
    ""
  );
}

function heightInMeters(pokemon) {
  return pokemon.height / 10;
}

function artworkHeight(pokemon) {
  const meters = heightInMeters(pokemon);
  return Math.round(Math.min(335, Math.max(96, 75 + meters * 120)));
}

function applyArtworkScale(image, tag, pokemon) {
  const meters = heightInMeters(pokemon);
  const height = `${artworkHeight(pokemon)}px`;
  image.style.setProperty("--pokemon-height", height);
  image.parentElement?.style.setProperty("--shadow-scale", Math.min(1.35, Math.max(0.72, meters / 1.4)).toFixed(2));
  tag.textContent = `${meters.toFixed(1)} m`;
}

function getStat(pokemon, statName) {
  return pokemon.stats.find(({ stat }) => stat.name === statName)?.base_stat || 1;
}

function battleName(pokemon) {
  return pokemon.name.replaceAll("-", " ");
}

function titleName(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function maxHp(pokemon) {
  return getStat(pokemon, "hp") * 2 + Math.round((pokemon.base_experience || 80) / 6);
}

function primaryType(pokemon) {
  return pokemon.types[0]?.type.name || "normal";
}

function typeList(pokemon) {
  return pokemon.types.map(({ type }) => type.name);
}

function renderMatchupPanel() {
  const fighters = [
    { label: "Jugador", pokemon: state.selectedPokemon, side: "player" },
    { label: "Rival", pokemon: state.rivalPokemon, side: "rival" },
  ];

  elements.matchupGrid.innerHTML = fighters
    .map(({ label, pokemon, side }) => {
      if (!pokemon) {
        return `
          <article class="matchup-card ${side}">
            <span class="matchup-label">${label}</span>
            <strong>Sin seleccionar</strong>
          </article>
        `;
      }

      const stats = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
      const total = stats.reduce((sum, stat) => sum + getStat(pokemon, stat), 0);
      const types = typeList(pokemon);
      return `
        <article class="matchup-card ${side}">
          <div class="matchup-head">
            <span class="matchup-label">${label}</span>
            <strong>${titleName(pokemon.name)}</strong>
            <small>#${String(pokemon.id).padStart(3, "0")}</small>
          </div>
          <div class="matchup-types">
            ${types.map((type) => `<span style="background:${typeColors[type] || "#2f6db5"}">${type}</span>`).join("")}
          </div>
          <dl class="matchup-metrics">
            <div><dt>Total</dt><dd>${total}</dd></div>
            <div><dt>Altura</dt><dd>${heightInMeters(pokemon).toFixed(1)} m</dd></div>
            <div><dt>Peso</dt><dd>${(pokemon.weight / 10).toFixed(1)} kg</dd></div>
          </dl>
          <div class="matchup-stats">
            ${stats
              .map((stat) => {
                const value = getStat(pokemon, stat);
                return `
                  <div>
                    <span>${formatStatName(stat)}</span>
                    <b>${value}</b>
                    <i><em style="width:${Math.min(100, Math.round((value / 180) * 100))}%"></em></i>
                  </div>
                `;
              })
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPokemon(pokemon) {
  state.selectedPokemon = pokemon;
  const name = pokemon.name.replaceAll("-", " ");

  elements.selectedName.textContent = name;
  elements.selectedId.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
  elements.heightMetric.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
  elements.weightMetric.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;
  elements.xpMetric.textContent = pokemon.base_experience ?? "--";

  elements.typeRow.innerHTML = pokemon.types
    .map(({ type }) => {
      const color = typeColors[type.name] || "#2f6db5";
      return `<span class="type-badge" style="background:${color}">${type.name}</span>`;
    })
    .join("");

  elements.statsList.innerHTML = pokemon.stats
    .map(({ base_stat: value, stat }) => {
      const width = Math.min(100, Math.round((value / 180) * 100));
      return `
        <div class="stat-row">
          <span>${formatStatName(stat.name)}</span>
          <span class="stat-track"><span class="stat-fill" style="width:${width}%"></span></span>
          <span>${value}</span>
        </div>
      `;
    })
    .join("");

  elements.abilityStrip.innerHTML = pokemon.abilities
    .map(({ ability, is_hidden }) => `<span class="ability-badge">${ability.name}${is_hidden ? " oculta" : ""}</span>`)
    .join("");

  elements.emptyState.classList.add("is-hidden");
  elements.artwork.classList.remove("is-visible");
  elements.artwork.src = officialArtwork(pokemon);
  elements.artwork.alt = `Ilustracion de ${name}`;
  elements.artwork.onload = () => elements.artwork.classList.add("is-visible");
  applyArtworkScale(elements.artwork, elements.playerHeightTag, pokemon);

  elements.playerHudName.textContent = name;
  elements.versusPlayerName.textContent = titleName(name);
  resetBattleHealth();
  renderMatchupPanel();
  triggerVsAnimation();
  hydratePokemonContext(pokemon);
}

async function searchPokemon(value) {
  const query = normalizeName(value);
  if (!query) return;

  setLoading(true);
  try {
    const pokemon = await pokeApi.get(`/pokemon/${query}`, "pokemon");
    renderPokemon(pokemon);
    setLoading(false);
  } catch (error) {
    elements.statusPill.textContent = "no encontrado";
    elements.statusPill.classList.remove("is-online");
  }
}

function renderRival(pokemon) {
  state.rivalPokemon = pokemon;
  const name = battleName(pokemon);

  elements.rivalName.textContent = name;
  elements.rivalId.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
  elements.rivalHudName.textContent = name;
  elements.rivalArtwork.classList.remove("is-visible");
  elements.rivalArtwork.src = officialArtwork(pokemon);
  elements.rivalArtwork.alt = `Ilustracion de ${name}`;
  elements.rivalArtwork.onload = () => elements.rivalArtwork.classList.add("is-visible");
  applyArtworkScale(elements.rivalArtwork, elements.rivalHeightTag, pokemon);
  elements.versusRivalName.textContent = titleName(name);
  renderFighterRoster();
  triggerVsAnimation();
  resetBattleHealth();
  renderMatchupPanel();
}

async function prepareRival(value) {
  const query = normalizeName(value);
  if (!query) return;

  elements.battleSummary.textContent = UI_TEXT.preparingRival;
  const pokemon = await pokeApi.get(`/pokemon/${query}`, "rival");
  renderRival(pokemon);
  elements.battleSummary.textContent = `${battleName(pokemon)} esta listo. Pulsa Batallar para simular turnos con stats reales.`;
}

function cleanFlavorText(text) {
  return text.replace(/\f/g, " ").replace(/\s+/g, " ").trim();
}

function localizedEntry(entries, lang = "es") {
  return entries.find((entry) => entry.language.name === lang) || entries.find((entry) => entry.language.name === "en");
}

function flattenEvolution(chain, list = []) {
  list.push(chain.species.name);
  chain.evolves_to.forEach((next) => flattenEvolution(next, list));
  return list;
}

function renderPokemonContext({ species, encounters, evolution }) {
  const flavor = localizedEntry(species.flavor_text_entries);
  const ecologyItems = [
    ["Habitat", species.habitat?.name || "sin dato"],
    ["Generacion", species.generation?.name || "sin dato"],
    ["Color", species.color?.name || "sin dato"],
    ["Forma", species.shape?.name || "sin dato"],
    ["Crecimiento", species.growth_rate?.name || "sin dato"],
    ["Captura", `${species.capture_rate}`],
  ];

  elements.profileGrid.innerHTML = ecologyItems
    .map(([label, value]) => `
      <div>
        <span>${label}</span>
        <strong>${titleName(value)}</strong>
      </div>
    `)
    .join("");

  elements.speciesSummary.textContent = flavor ? cleanFlavorText(flavor.flavor_text) : "Sin descripcion disponible.";

  elements.locationList.innerHTML = encounters.length
    ? encounters.slice(0, 5).map((entry) => `<span>${titleName(entry.location_area.name)}</span>`).join("")
    : "<span>Sin encuentros registrados en PokeAPI</span>";

  elements.evolutionLine.innerHTML = flattenEvolution(evolution.chain)
    .map((name) => `<span>${titleName(name)}</span>`)
    .join("");
}

function renderMoveList(pokemon) {
  const moves = pokemon.moves
    .filter(({ version_group_details: details }) => details.some((item) => item.move_learn_method.name === "level-up"))
    .slice(0, 8);

  elements.moveList.innerHTML = moves.length
    ? moves.map(({ move }) => `<span>${titleName(move.name)}</span>`).join("")
    : "<span>Sin movimientos por nivel en este registro</span>";
}

async function hydratePokemonContext(pokemon) {
  elements.profileGrid.innerHTML = "";
  elements.speciesSummary.textContent = "Consultando especie, habitat, localizaciones y evolucion...";
  elements.locationList.innerHTML = "";
  elements.evolutionLine.innerHTML = "";
  renderMoveList(pokemon);

  try {
    const species = await pokeApi.get(`/pokemon-species/${pokemon.id}`, "species");
    const [encounters, evolution] = await Promise.all([
      pokeApi.get(`/pokemon/${pokemon.id}/encounters`, "locations"),
      pokeApi.get(species.evolution_chain.url, "evolution"),
    ]);
    renderPokemonContext({ species, encounters, evolution });
  } catch (error) {
    elements.speciesSummary.textContent = UI_TEXT.extendedDataError;
  }
}

function resetBattleHealth() {
  if (!state.selectedPokemon || !state.rivalPokemon) return;

  state.battle = {
    playerHp: maxHp(state.selectedPokemon),
    rivalHp: maxHp(state.rivalPokemon),
    playerMax: maxHp(state.selectedPokemon),
    rivalMax: maxHp(state.rivalPokemon),
  };
  state.battleStatus = BATTLE_STATE.READY;
  state.battleLoser = null;
  renderBattleState();
}

function clearBattleResult() {
  elements.playerSpotlight.classList.remove("is-defeated");
  elements.rivalSpotlight.classList.remove("is-defeated");
}

function applyBattleResult(loserSide) {
  clearBattleResult();
  const loser = loserSide === "player" ? elements.playerSpotlight : elements.rivalSpotlight;
  loser.classList.add("is-defeated");
}

function clearHitAnimations() {
  Object.values(elements.spotlightBySide).forEach((spotlight) => {
    spotlight.classList.remove("is-attacking", "is-hit");
  });
}

function playHitAnimation(attackerSide, defenderSide) {
  const attacker = elements.spotlightBySide[attackerSide];
  const defender = elements.spotlightBySide[defenderSide];
  clearHitAnimations();
  void attacker.offsetWidth;
  attacker.classList.add("is-attacking");
  defender.classList.add("is-hit");
  window.setTimeout(() => {
    attacker.classList.remove("is-attacking");
    defender.classList.remove("is-hit");
  }, 380);
}

function renderBattleState(summary = "") {
  const isRunning = state.battleStatus === BATTLE_STATE.RUNNING;
  const isFinished = state.battleStatus === BATTLE_STATE.FINISHED;
  const buttonText = isFinished ? UI_TEXT.restart : UI_TEXT.battle;

  elements.battleBtn.textContent = buttonText;
  elements.stageBattleBtn.textContent = buttonText;
  elements.battleBtn.disabled = isRunning;
  elements.stageBattleBtn.disabled = isRunning;

  if (state.battleLoser) {
    applyBattleResult(state.battleLoser);
  } else {
    clearBattleResult();
  }
  if (!isRunning) {
    clearHitAnimations();
  }

  renderHealth();

  if (summary) {
    elements.battleSummary.textContent = summary;
  }
}

function restartBattleView() {
  resetBattleHealth();
  elements.turnLog.innerHTML = "";
  renderBattleState(UI_TEXT.newBattleReady);
}

function renderHealth() {
  if (!state.battle) return;

  const playerPercent = Math.max(0, Math.round((state.battle.playerHp / state.battle.playerMax) * 100));
  const rivalPercent = Math.max(0, Math.round((state.battle.rivalHp / state.battle.rivalMax) * 100));
  elements.playerHpBar.style.width = `${playerPercent}%`;
  elements.rivalHpBar.style.width = `${rivalPercent}%`;
  elements.playerHpText.textContent = `${Math.max(0, state.battle.playerHp)} / ${state.battle.playerMax}`;
  elements.rivalHpText.textContent = `${Math.max(0, state.battle.rivalHp)} / ${state.battle.rivalMax}`;
}

async function getTypeRelations(typeName) {
  return pokeApi.get(`/type/${typeName}`, "effectiveness");
}

function relationMultiplier(relations, defenderTypes) {
  return defenderTypes.reduce((multiplier, typeName) => {
    const doubleDamage = relations.damage_relations.double_damage_to.some((item) => item.name === typeName);
    const halfDamage = relations.damage_relations.half_damage_to.some((item) => item.name === typeName);
    const noDamage = relations.damage_relations.no_damage_to.some((item) => item.name === typeName);

    if (noDamage) return multiplier * 0;
    if (doubleDamage) return multiplier * 2;
    if (halfDamage) return multiplier * 0.5;
    return multiplier;
  }, 1);
}

function effectivenessText(multiplier) {
  if (multiplier === 0) return "no afecta";
  if (multiplier >= 2) return "es super efectivo";
  if (multiplier < 1) return "es poco efectivo";
  return "impacta normal";
}

async function buildAttack(attacker, defender, round) {
  const attackType = primaryType(attacker);
  const defenderTypes = defender.types.map(({ type }) => type.name);
  const relations = await getTypeRelations(attackType);
  const multiplier = relationMultiplier(relations, defenderTypes);
  const attack = getStat(attacker, "attack") + getStat(attacker, "special-attack");
  const defense = getStat(defender, "defense") + getStat(defender, "special-defense");
  const speedBoost = getStat(attacker, "speed") > getStat(defender, "speed") ? 1.04 : 1;
  const base = Math.max(4, Math.round((attack / Math.max(40, defense)) * 12 + 4));
  const roundVariance = 0.92 + ((round % 3) * 0.06);
  const damage = Math.max(1, Math.round(base * multiplier * speedBoost * roundVariance));

  return {
    attacker: battleName(attacker),
    defender: battleName(defender),
    attackType,
    damage,
    multiplier,
    text: effectivenessText(multiplier),
  };
}

function renderBattleLog(entries) {
  elements.turnLog.innerHTML = entries
    .map(
      (entry) => `
        <div class="turn-row">
          <strong>${entry.title}</strong>
          <span>${entry.detail}</span>
        </div>
      `,
    )
    .join("");
}

async function runBattle() {
  if (state.battleStatus === BATTLE_STATE.RUNNING) return;

  if (state.battleStatus === BATTLE_STATE.FINISHED) {
    restartBattleView();
    return;
  }

  if (!state.selectedPokemon) {
    renderBattleState(UI_TEXT.firstPokemon);
    return;
  }

  if (!state.rivalPokemon) {
    await prepareRival(elements.rivalInput.value || "mewtwo");
  }

  resetBattleHealth();
  const player = state.selectedPokemon;
  const rival = state.rivalPokemon;
  const playerFirst = getStat(player, "speed") >= getStat(rival, "speed");
  const order = playerFirst ? [player, rival] : [rival, player];
  const entries = [];

  state.battleStatus = BATTLE_STATE.RUNNING;
  renderBattleState(`${battleName(order[0])} ataca primero por velocidad. Calculando efectividad con PokeAPI...`);
  elements.turnLog.innerHTML = "";

  try {
    for (let round = 1; round <= 12 && state.battle.playerHp > 0 && state.battle.rivalHp > 0; round += 1) {
      for (const attacker of order) {
        const defender = attacker === player ? rival : player;
        const attackerSide = attacker === player ? "player" : "rival";
        const defenderSide = attackerSide === "player" ? "rival" : "player";
        if (state.battle.playerHp <= 0 || state.battle.rivalHp <= 0) break;

        const attack = await buildAttack(attacker, defender, round);
        playHitAnimation(attackerSide, defenderSide);
        if (attacker === player) {
          state.battle.rivalHp = Math.max(0, state.battle.rivalHp - attack.damage);
        } else {
          state.battle.playerHp = Math.max(0, state.battle.playerHp - attack.damage);
        }

        renderBattleState();
        entries.unshift({
          title: `Turno ${round}: ${attack.attacker}`,
          detail: `Ataque tipo ${attack.attackType}: ${attack.text} contra ${attack.defender}. Danio ${attack.damage}.`,
        });
        renderBattleLog(entries);
        await new Promise((resolve) => setTimeout(resolve, 460));
      }
    }
  } catch (error) {
    state.battleStatus = BATTLE_STATE.READY;
    state.battleLoser = null;
    renderBattleState("No se pudo completar la batalla. Intenta de nuevo.");
    return;
  }

  const playerScore =
    state.battle.playerHp +
    getStat(player, "attack") +
    getStat(player, "special-attack") +
    getStat(player, "speed");
  const rivalScore =
    state.battle.rivalHp +
    getStat(rival, "attack") +
    getStat(rival, "special-attack") +
    getStat(rival, "speed");
  const playerWins = playerScore >= rivalScore;
  const winner = playerWins ? battleName(player) : battleName(rival);
  const reason = state.battle.playerHp === 0 || state.battle.rivalHp === 0
    ? "por dejar al rival sin HP"
    : "por desempate de HP restante, ataque y velocidad";

  state.battleStatus = BATTLE_STATE.FINISHED;
  state.battleLoser = playerWins ? "rival" : "player";
  renderBattleState(`${winner} gana ${reason}.`);
}

async function loadType(typeName) {
  state.activeType = typeName;
  renderTypeButtons();
  elements.pokemonGrid.innerHTML = "";

  const data = await pokeApi.get(`/type/${typeName}`, "type");
  const sample = data.pokemon.slice(0, 12).map((item) => item.pokemon);

  elements.pokemonGrid.innerHTML = sample
    .map((pokemon) => {
      const id = pokemon.url.split("/").filter(Boolean).pop();
      const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
      return `
        <button class="pokemon-card" type="button" data-pokemon="${pokemon.name}">
          <img src="${sprite}" alt="" loading="lazy" />
          <strong>${pokemon.name.replaceAll("-", " ")}</strong>
          <span>#${String(id).padStart(3, "0")}</span>
        </button>
      `;
    })
    .join("");
}

async function loadPokemonIndex() {
  const data = await pokeApi.get(`/pokemon?limit=${MAX_POKEMON_ID}`, "index");
  state.pokemonIndex = data.results.map((pokemon, index) => ({
    id: index + 1,
    name: pokemon.name,
    label: pokemon.name.replaceAll("-", " "),
  }));
}

function suggestionScore(pokemon, query) {
  const label = pokemon.label.toLowerCase();
  const name = pokemon.name.toLowerCase();
  if (String(pokemon.id) === query) return 0;
  if (name === query || label === query) return 1;
  if (name.startsWith(query) || label.startsWith(query)) return 2;
  if (name.includes(query) || label.includes(query)) return 3;
  return 99;
}

function findSuggestions(value) {
  const query = normalizeName(value);
  if (!query || !state.pokemonIndex.length) return [];

  return state.pokemonIndex
    .map((pokemon) => ({ ...pokemon, score: suggestionScore(pokemon, query) }))
    .filter((pokemon) => pokemon.score < 99)
    .sort((a, b) => a.score - b.score || a.id - b.id)
    .slice(0, 6);
}

function renderSuggestions(input, container) {
  const suggestions = findSuggestions(input.value);
  input.setAttribute("aria-expanded", String(Boolean(suggestions.length)));
  container.classList.toggle("is-open", Boolean(suggestions.length));
  container.innerHTML = suggestions
    .map(
      (pokemon) => `
        <button type="button" role="option" data-pokemon="${pokemon.name}">
          <span>${pokemon.label}</span>
          <small>#${String(pokemon.id).padStart(3, "0")}</small>
        </button>
      `,
    )
    .join("");
}

function closeSuggestions(input, container) {
  input.setAttribute("aria-expanded", "false");
  container.classList.remove("is-open");
  container.innerHTML = "";
}

function chooseSuggestion(input, container, value, callback) {
  input.value = value;
  closeSuggestions(input, container);
  callback(value);
}

function bindSuggestions(input, container, callback) {
  input.addEventListener("input", () => renderSuggestions(input, container));
  input.addEventListener("focus", () => renderSuggestions(input, container));

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const first = container.querySelector("[data-pokemon]");
    if (!first || normalizeName(input.value) === first.dataset.pokemon) return;
    event.preventDefault();
    chooseSuggestion(input, container, first.dataset.pokemon, callback);
  });

  container.addEventListener("mousedown", (event) => {
    event.preventDefault();
    const target = event.target.closest("[data-pokemon]");
    if (!target) return;
    chooseSuggestion(input, container, target.dataset.pokemon, callback);
  });

  document.addEventListener("click", (event) => {
    if (input.contains(event.target) || container.contains(event.target)) return;
    closeSuggestions(input, container);
  });
}

function renderTypeButtons() {
  const types = ["fire", "water", "grass", "electric", "psychic", "dragon", "ghost", "steel"];
  elements.typeFilter.innerHTML = types
    .map((type) => {
      const active = state.activeType === type ? "is-active" : "";
      return `<button class="${active}" type="button" data-type="${type}">${type}</button>`;
    })
    .join("");
}

function triggerVsAnimation() {
  elements.vsBurst.classList.remove("is-active");
  requestAnimationFrame(() => {
    elements.vsBurst.classList.add("is-active");
    window.setTimeout(() => elements.vsBurst.classList.remove("is-active"), 760);
  });
}

function renderFighterRoster() {
  elements.fighterRoster.classList.toggle("has-selection", Boolean(state.rivalPokemon));
  elements.fighterRoster.innerHTML = state.fighterRoster
    .map((pokemon) => {
      const isSelected = state.rivalPokemon?.name === pokemon.name;
      const sprite = pokemon.sprites.front_default || officialArtwork(pokemon);
      return `
        <button class="fighter-card ${isSelected ? "is-selected" : ""}" type="button" data-pokemon="${pokemon.name}">
          <span class="fighter-id">#${String(pokemon.id).padStart(3, "0")}</span>
          <img src="${sprite}" alt="" loading="lazy" />
          <strong>${titleName(pokemon.name)}</strong>
        </button>
      `;
    })
    .join("");
}

async function loadFighterRoster() {
  elements.fighterRoster.innerHTML = "<span class=\"roster-loading\">Cargando rivales...</span>";
  state.fighterRoster = await Promise.all(FIGHTER_ROSTER.map((name) => pokeApi.get(`/pokemon/${name}`, "roster")));
  renderFighterRoster();
}

function bindEvents() {
  bindSuggestions(elements.input, elements.pokemonSuggestions, searchPokemon);
  bindSuggestions(elements.rivalInput, elements.rivalSuggestions, prepareRival);

  document.addEventListener("click", (event) => {
    const helpButton = event.target.closest("[data-help]");
    if (!helpButton) return;
    elements.helpTitle.textContent = helpButton.dataset.help;
    elements.helpBody.textContent = helpButton.dataset.helpBody;
    elements.helpDialog.showModal();
  });

  elements.helpClose.addEventListener("click", () => {
    elements.helpDialog.close();
  });

  elements.helpDialog.addEventListener("click", (event) => {
    if (event.target === elements.helpDialog) {
      elements.helpDialog.close();
    }
  });

  elements.introClose.addEventListener("click", () => {
    elements.introDialog.close();
  });

  elements.introDialog.addEventListener("click", (event) => {
    if (event.target === elements.introDialog) {
      elements.introDialog.close();
    }
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    searchPokemon(elements.input.value);
  });

  elements.randomBtn.addEventListener("click", () => {
    const playerId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
    let rivalId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
    if (rivalId === playerId) {
      rivalId = (rivalId % MAX_POKEMON_ID) + 1;
    }

    elements.input.value = playerId;
    elements.rivalInput.value = rivalId;
    Promise.all([searchPokemon(String(playerId)), prepareRival(String(rivalId))]).then(triggerVsAnimation);
  });

  elements.quickActions.addEventListener("click", (event) => {
    const target = event.target.closest("[data-pokemon]");
    if (!target) return;
    elements.input.value = target.dataset.pokemon;
    searchPokemon(target.dataset.pokemon);
  });

  elements.rivalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    prepareRival(elements.rivalInput.value);
  });

  elements.fighterRoster.addEventListener("click", (event) => {
    const target = event.target.closest("[data-pokemon]");
    if (!target) return;
    elements.rivalInput.value = target.dataset.pokemon;
    prepareRival(target.dataset.pokemon);
  });

  elements.battleBtn.addEventListener("click", () => {
    runBattle();
  });

  elements.stageBattleBtn.addEventListener("click", () => {
    runBattle();
  });

  elements.typeFilter.addEventListener("click", (event) => {
    const target = event.target.closest("[data-type]");
    if (!target) return;
    loadType(target.dataset.type);
  });

  elements.pokemonGrid.addEventListener("click", (event) => {
    const target = event.target.closest("[data-pokemon]");
    if (!target) return;
    elements.input.value = target.dataset.pokemon;
    searchPokemon(target.dataset.pokemon);
  });
}

async function init() {
  renderTypeButtons();
  renderMatchupPanel();
  bindEvents();
  elements.introDialog.showModal();
  await loadPokemonIndex();
  await loadFighterRoster();
  await loadType("electric");
  await searchPokemon("pikachu");
  elements.rivalInput.value = "charizard";
  await prepareRival("charizard");
}

init();
