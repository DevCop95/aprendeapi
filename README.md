# Pokedex interactiva con PokeAPI

Una experiencia visual para aprender como se consume una API real usando datos de Pokemon en vivo. La app mezcla una Pokedex, un monitor de llamadas HTTP y un selector de combate estilo juego de pelea para que sea facil ver que se consulta, por que se consulta y como esos datos cambian la interfaz.

## Demo

GitHub Pages:

[https://devcop95.github.io/aprendeapi/](https://devcop95.github.io/aprendeapi/)

Repositorio:

[DevCop95/aprendeapi](https://github.com/DevCop95/aprendeapi)

## Que hace

- Busca Pokemon por nombre o ID.
- Recomienda Pokemon mientras escribes para no depender del nombre exacto.
- Muestra una arena con dos Pokemon enfrentados.
- Escala los Pokemon segun su altura real.
- Permite elegir rival desde una grilla tipo juego de pelea.
- Reproduce una animacion `VS` al cambiar el enfrentamiento.
- Simula batallas usando stats y ventaja de tipos.
- Muestra siempre un ganador, por KO o por desempate de stats.
- Ensena las llamadas a PokeAPI con ruta, estado, latencia y lecturas servidas desde cache local.
- Marca visualmente al Pokemon derrotado y permite reiniciar el combate desde el mismo boton.
- Muestra ficha tecnica, habitat, generacion, localizaciones, evolucion y movimientos.
- Incluye botones de ayuda para explicar de donde sale cada seccion.

## Datos usados de PokeAPI

La app usa varios endpoints de [PokeAPI v2](https://pokeapi.co/docs/v2):

- `/pokemon/{id or name}`: sprites, tipos, altura, peso, experiencia, stats, habilidades y movimientos.
- `/pokemon?limit=1025`: indice para sugerencias del buscador.
- `/pokemon-species/{id}`: habitat, generacion, color, forma, tasa de captura y descripcion.
- `/pokemon/{id}/encounters`: localizaciones donde aparece el Pokemon.
- `/evolution-chain/{id}`: linea evolutiva.
- `/type/{type}`: Pokemon por tipo y relaciones de efectividad.

## Arquitectura de la interfaz

- `pokeApi`: concentra endpoints, llamadas `fetch`, cache local y registro del monitor HTTP.
- `BATTLE_STATE`: modela el combate como `idle`, `ready`, `running` o `finished` para evitar estados ambiguos.
- `renderBattleState()`: sincroniza boton, HP, ganador/perdedor y bloqueo durante la simulacion.
- `UI_TEXT`: agrupa textos reutilizados para mantener consistencia en botones y mensajes.

## Como abrirlo localmente

Este proyecto es una pagina estatica. Puedes abrirlo con un servidor local:

```bash
python -m http.server 4173
```

Luego entra a:

[http://localhost:4173](http://localhost:4173)

## Estructura

```text
aprendeapi/
|-- index.html
|-- styles.css
|-- script.js
`-- README.md
```

## Objetivo educativo

El proyecto no solo muestra datos. Tambien hace visible el flujo de aprendizaje:

- Que endpoint se llama.
- Cuanto tarda.
- Cuando una seleccion se resuelve desde cache.
- Que dato alimenta cada seccion.
- Como se transforma una respuesta JSON en una interfaz interactiva.

La idea es que una persona pueda entender el consumo de APIs mirando la experiencia, no solo leyendo codigo.
