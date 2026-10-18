# Cómo añadir juegos al catálogo

El catálogo es `catalog/catalog.json`: una lista de **ports**, uno por línea. Cada port dice **de dónde sale** con `origin`:

- `"origin": "github"` (lo normal): el port tiene repositorio en GitHub. El launcher descarga de ahí la build de Windows
  más reciente, así que no hace falta poner enlaces de descarga.
- `"origin": "external"`: el port **no está en GitHub** (ModDB, Discord, una web…). El catálogo solo lo da a conocer;
  para instalarlo, el usuario necesita una **fuente** que traiga el port (torrent o mirror). Ver [Ports externos](#ports-externos).

## Pasos rápidos

1. **Abre** `catalog/catalog.json` con un editor (VS Code, Notepad++…).
2. **Copia una línea** de un juego parecido y pégala debajo de `"games": [`. Cambia sus datos o usa la plantilla de abajo.
   Cada línea termina en coma `,`, **excepto la última** de la lista.
3. **Ejecuta** desde la carpeta del proyecto:
   ```powershell
   node tools\catalog\actualizar.mjs
   ```
   Comprueba que todo está bien, rellena lo que falta, agrupa los ports por juego y ordena el archivo.
   Si hay un error te dice cuál y en qué línea, y **no guarda nada** hasta que lo corrijas.
4. **Portada** (opcional, pero queda mejor):
   ```powershell
   cd tools\covers
   node build-covers.mjs
   node publish-covers.mjs "Portada de <juego>"
   ```
5. **Prueba** el launcher con `.\dev.ps1`. Para repartirlo, genera el instalador con `.\dev.ps1 build`.
   El catálogo va dentro del launcher: quien quiera ver los juegos nuevos necesita la versión nueva.

## Plantilla

Lo mínimo son tres campos. Lo demás se rellena solo al ejecutar `actualizar.mjs`:

```json
{"title":"Nombre del juego","repo":"usuario/repositorio","console":"Nintendo 64"},
```

Port externo (no está en GitHub):

```json
{"title":"Nombre del juego","port":"Nombre del proyecto","author":"Autor","origin":"external","homepage":"https://www.moddb.com/mods/...","console":"Xbox 360"},
```

Completa (lo recomendable):

```json
{"title":"Star Fox 64","repo":"HarbourMasters/Starship","console":"Nintendo 64","franchise":"Star Fox","aliases":["Starfox 64","SF64"],"asset":"^Starship-.*-Windows\\.zip$","exe":"Starship.exe","experimental":false,"platforms":["Windows","Linux","macOS"]},
```

## Campos

| Campo | ¿Obligatorio? | Qué poner |
|---|---|---|
| `title` | Sí | Nombre **del juego**, no del proyecto: `"Crash Bandicoot 2: Cortex Strikes Back"`, no `"Crash2Recomp"`. Es lo que sale en la tienda. |
| `origin` | No | `"github"` (por defecto) o `"external"` si el port no está en GitHub. |
| `repo` | Sí, si es de GitHub | Repositorio de GitHub como `usuario/repositorio` (lo que va después de `github.com/`). Los externos no lo llevan. |
| `port` | Sí, si es externo | Nombre del proyecto del port. En los de GitHub se saca del repo. |
| `author` | No | Autor del port. En los de GitHub se saca del repo; en los externos, si falta, sale "autor desconocido". |
| `homepage` | No | Página oficial del proyecto (`https://…`). En los externos es el enlace que ve el usuario en lugar de "Ver en GitHub". |
| `console` | Sí | Consola original. Una de: `Nintendo 64`, `Super Nintendo`, `NES`, `Game Boy`, `Game Boy Advance`, `Nintendo DS`, `Nintendo 3DS`, `GameCube`, `Wii`, `Wii U`, `Switch`, `Virtual Boy`, `PlayStation`, `PlayStation 2`, `PlayStation 3`, `PlayStation 4`, `PSP`, `Xbox`, `Xbox 360`, `Sega`, `Arcade`, `PC`, `Otros`. |
| `franchise` | No | Saga, por ejemplo `"The Legend of Zelda"`. |
| `aliases` | No | Otros nombres para la búsqueda y para emparejar enlaces de fuentes: `["CTR","Crash Team Racing"]`. |
| `asset` | No | Qué archivo de la release es la build de Windows (ver abajo). Si no lo pones, el launcher elige el que más pinta tenga. |
| `exe` | No | Nombre del ejecutable, por ejemplo `"CoD3.exe"`. Si no lo pones, se detecta al instalar. |
| `experimental` | No | `true` si el port es una beta o pre-release. Sale marcado como experimental. |
| `needs` | No | Qué datos acepta el port: `["iso","carpeta"]`, `["z64"]`… Si falta, se usan los de su consola (N64 → z64/n64/v64, GameCube → iso/rvz/gcm/ciso, Xbox 360 → iso/carpeta…). Ponlo solo si el port difiere. |
| `needsNote` | No | Aclaración que verá el usuario: región o versión exigida, archivo concreto… |
| `platforms` | No | Dónde funciona el port: `["Windows"]`, `["Windows","Linux","macOS"]`… Por defecto, `["Windows"]`. |
| `id`, `game` | No | **No los toques**: se calculan solos a partir de `repo` (o `author` + `port`) y `title`. |

### El campo `asset`

Muchas releases traen varios archivos (Windows, Linux, Android, mods, texturas…). `asset` es una expresión regular
que dice cuál es el de Windows. Abre la página de *Releases* del repo, mira el nombre del archivo y cambia la versión por `.*`:

| Archivo en la release | `asset` |
|---|---|
| `CoD3-PC-Port-0.4.0.zip` | `"^CoD3-PC-Port-.*\\.zip$"` |
| `TwoTowers-Recompiled-v1.9.2-win64.zip` | `"^TwoTowers-Recompiled-.*-win64\\.zip$"` |
| `VCSNative-Windows.zip` | `"^VCSNative-Windows\\.zip$"` |

- El punto se escribe `\\.` (con dos barras, porque estamos dentro de JSON).
- `^` significa "empieza por" y `$` "termina en".
- Solo hace falta cuando la release tiene varios `.zip` o `.exe` que podrían confundirse.

## Sinopsis, tráilers y destacados

Cada ficha muestra de qué trata el juego y su tráiler. Eso sale de `catalog/info.json`, que **se genera** (no se edita a mano):

```powershell
node tools\catalog\informacion.mjs
```

Busca la sinopsis en Wikipedia (en español si existe) y solo acepta coincidencias seguras. Los juegos que no encuentra quedan
en `catalog/info-pendientes.txt`. Lo que quieras poner o corregir a mano va en **`catalog/info-overrides.json`**, que siempre gana
y nunca se sobrescribe:

```json
{
  "featured": ["gears-of-war-2", "bloodborne"],
  "games": {
    "id-del-juego": {
      "synopsis": { "text": "De qué trata…", "source": { "name": "Redacción de Dársena" } },
      "trailers": [ { "kind": "youtube", "id": "EQx0flOIRXY", "title": "Tráiler de lanzamiento" } ]
    }
  }
}
```

- **`featured`**: los juegos que salen siempre primero en el carrusel de *Destacados y novedades*, en ese orden.
- **`id-del-juego`** es el campo `game` de `catalog.json` (el que agrupa los ports), no el `id` de un port.
- **`trailers`**: `id` es lo que va después de `watch?v=` en la dirección de YouTube (11 caracteres). Comprueba que el vídeo permita
  incrustarse: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` debe responder con su título.
- El texto de Wikipedia se muestra con su fuente y licencia (CC BY-SA 4.0).
- `publicar.mjs` sube `info.json` junto al catálogo: los launchers lo descargan al abrirse, sin actualizar la app.

## Ports externos

Para ports que su autor publica fuera de GitHub:

1. Añádelo al catálogo con `"origin":"external"`, `"port"` y, si la hay, `"homepage"`.
2. Ejecuta `actualizar.mjs` y mira el `id` que le ha puesto (por ejemplo `autor-nombre-del-proyecto`).
3. Las descargas van en una **fuente**, en su lista `downloads`, usando ese `id` como `gameId`
   (ver *Formato de una fuente* en el README principal). Ahí se ponen el torrent y los mirrors del port; los datos
   del juego van en la lista `data` de la misma fuente.

Sin una fuente que lo traiga, el launcher muestra el juego pero el botón dice **NECESITA UNA FUENTE**.
Las reglas de [qué ports se pueden añadir](#qué-ports-se-pueden-añadir) son las mismas: el port no puede incluir el juego.

## Varios ports del mismo juego

Si dos ports tienen el mismo `title` y la misma `console`, el launcher los junta en una sola ficha, con un selector de ports.
Ojo con escribir el título igual: "Super Mario 64" y "Super Mario 64" se juntan; "Mario 64" no.

Si dos juegos distintos se juntan por error, o al revés, corrígelo en `catalog/games-overrides.json`:

```json
{
  "voicedrew11-verdite1": "kings-field-japan"
}
```

La clave es el `id` del port (lo ves en `catalog.json` tras ejecutar `actualizar.mjs`) y el valor es el id del juego al que debe pertenecer.

## Qué ports se pueden añadir

Solo ports que **piden tu propia copia** del juego (ROM, ISO, `default.xex`, archivos del disco…) y cuya release **no incluye
los datos del juego**. Pistas para comprobarlo:

- El README dice algo como *"bring your own copy"*, *"no game data included"* o *"you need your own disc"*.
- El tamaño de la release encaja con un ejecutable (decenas o cientos de MB), no con un juego completo (varios GB).
- Desconfía de los que dicen *"no ROM needed"* en juegos de consola: suelen llevar el juego dentro.

## Errores comunes

| Mensaje | Solución |
|---|---|
| `no es JSON válido … Línea N` | Revisa esa línea y el final de la anterior: falta o sobra una coma, o hay comillas sin cerrar. |
| `falta "title"` / `"repo"` / `"console"` | Añade ese campo. Si el port no está en GitHub, pon `"origin":"external"` y `"port"` en lugar de `repo`. |
| `consola "…" no válida` | Usa exactamente uno de los nombres de la tabla (con mayúsculas y espacios). |
| `"asset" no es una regex válida` | Revisa los `\\.` y que los paréntesis estén cerrados. |
| `id "…" repetido` | Ese repo ya está en el catálogo. Búscalo con Ctrl+F y edita esa línea en lugar de añadir otra. |
