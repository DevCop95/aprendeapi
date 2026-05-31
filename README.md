# Pokedex API Lab

![HTML](https://img.shields.io/badge/HTML-5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=222)
![API](https://img.shields.io/badge/API-PokeAPI-ef5350)
![Status](https://img.shields.io/badge/status-live-2ea44f)
![License](https://img.shields.io/badge/uso-educativo-blue)

Una Pokedex interactiva para aprender consumo de APIs con datos reales de Pokemon. La experiencia combina busqueda, autocompletado, consola de llamadas HTTP, exploracion por tipo y una batalla visual donde cada decision sale de respuestas JSON de [PokeAPI](https://pokeapi.co/).

## Links

- Demo: [https://devcop95.github.io/aprendeapi/](https://devcop95.github.io/aprendeapi/)
- Repositorio: [DevCop95/aprendeapi](https://github.com/DevCop95/aprendeapi)
- API oficial: [PokeAPI v2 Docs](https://pokeapi.co/docs/v2)

## De donde sale la API

La informacion viene de **PokeAPI**, una API publica de solo lectura para datos de Pokemon. Segun su documentacion oficial, PokeAPI no requiere autenticacion para consultar recursos y expone datos mediante peticiones HTTP `GET`. Tambien recomienda cachear localmente los recursos consultados, por eso esta app marca las lecturas repetidas como `cache` en la consola.

Base URL usada por la app:

```txt
https://pokeapi.co/api/v2
```

## Features

| Area | Que hace |
| --- | --- |
| Busqueda | Busca Pokemon por nombre o ID y muestra sugerencias mientras escribes. |
| Pokedex | Renderiza tipos, altura, peso, experiencia, stats, habilidades y movimientos. |
| Contexto | Consulta especie, habitat, generacion, localizaciones y linea evolutiva. |
| Arena | Enfrenta tu Pokemon contra un rival con sprites y escala visual por altura real. |
| Batalla | Simula turnos usando HP, ataque, defensa, velocidad y ventaja de tipos. |
| Resultado | El perdedor pierde color, el boton cambia a `Reiniciar` y el combate se puede limpiar. |
| Explorador | Filtra muestras de Pokemon por tipo usando `/type/{type}`. |
| Consola API | Muestra ruta, estado, latencia y respuestas servidas desde cache local. |
| Ayuda | Incluye botones `?` para explicar de que endpoint sale cada seccion. |

## Interaccion principal

1. Escribe un nombre o ID, por ejemplo `pikachu` o `25`.
2. La app consulta `/pokemon/{id or name}` y pinta la ficha principal.
3. En paralelo consulta especie, localizaciones y evolucion para completar el contexto.
4. Elige un rival desde la grilla o escribe otro Pokemon.
5. Pulsa `Batallar`.
6. La batalla consulta relaciones de tipos desde `/type/{type}` para calcular efectividad.
7. Al terminar, el perdedor queda en gris y el boton pasa a `Reiniciar`.

## Endpoints usados

| Endpoint | Uso en la interfaz |
| --- | --- |
| `/pokemon/{id or name}` | Ficha principal, sprites, tipos, stats, altura, peso, habilidades y movimientos. |
| `/pokemon?limit=1025` | Indice para autocompletado del buscador. |
| `/pokemon-species/{id}` | Habitat, generacion, color, forma, captura y descripcion. |
| `/pokemon/{id}/encounters` | Localizaciones donde aparece el Pokemon. |
| `/evolution-chain/{id}` | Linea evolutiva. |
| `/type/{type}` | Exploracion por tipo y relaciones de efectividad en batalla. |

## Arquitectura

```text
aprendeapi/
|-- index.html   # estructura de la experiencia
|-- styles.css   # interfaz, arena, grillas, consola y responsive
|-- script.js    # estado, PokeAPI, cache, render y batalla
`-- README.md
```

Piezas clave del JavaScript:

- `pokeApi`: concentra endpoint base, `fetch`, cache local y registro de llamadas.
- `BATTLE_STATE`: evita estados ambiguos en combate: `idle`, `ready`, `running`, `finished`.
- `renderBattleState()`: sincroniza boton, HP, bloqueo, resumen y estado visual del perdedor.
- `UI_TEXT`: centraliza textos reutilizados como `Batallar`, `Reiniciar` y mensajes de error.

## Como abrirlo localmente

Este proyecto es estatico. No necesita build ni dependencias.

```bash
python -m http.server 4173
```

Luego abre:

[http://localhost:4173](http://localhost:4173)

Tambien puedes abrir `index.html` directamente, aunque usar servidor local evita restricciones de navegador con algunas pruebas.

## Objetivo educativo

El objetivo es que una persona vea el ciclo completo de una API real:

- que endpoint se llama,
- cuanto tarda,
- que respuesta se cachea,
- que dato alimenta cada componente,
- como una respuesta JSON se transforma en una interfaz interactiva.

## Creditos

- Datos: [PokeAPI](https://pokeapi.co/) y [PokeAPI v2 Docs](https://pokeapi.co/docs/v2).
- Sprites publicos: recursos enlazados desde PokeAPI y el repositorio publico de sprites de Pokemon.
