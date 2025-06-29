export default class EscenaGameplay extends Phaser.Scene {
    constructor() {
        super("EscenaGameplay");
    }

    init(data) {
        // Variables de juego.
        this.physics.world.drawDebug = false;
        this.velocidadPersonaje = 600;

        // Si no hay datos, usa valores por defecto.
        this.cantidadOro = data?.cantidadOro ?? 0;
        this.puntajeTotal = data?.puntajeTotal ?? 0;
        this.longitudMecha = data?.longitudMecha ?? 100;

        this.mechaAcelerada = data?.mechaAcelerada ?? false;
        this.tiempoRestanteAceleracion = data?.tiempoRestanteAceleracion ?? 0;

        this.configuracionGeneracion = data?.configuracionGeneracion ?? {
            cantidadAgujeros: 6,
            cantidadFuegos: 5,
            cantidadGruposRocas: 9,
            cantidadTotalRocas: 20,
            probabilidadOroca: 0.2,
            probabilidadOrocaOculta: 0.8
        };

        // Puntuaciones y valores de oro por destruir objetos.
        this.puntosPorRoca = 100; // Puntos obtenidos al destruir una roca normal.
        this.oroPorOroca = 100; // Oro obtenido al destruir una oroca.

        this.AnimacionesdePuntosPendientes = 0; // Contador de animaciones de puntos pendientes.

        // Configuración de las teclas de control del jugador.
        this.cursores = this.input.keyboard.createCursorKeys(); // Teclas de flecha.
        this.teclasPersonalizadas = this.input.keyboard.addKeys({

            // Teclas de movimiento WASD.
            "W": Phaser.Input.Keyboard.KeyCodes.W,
            "A": Phaser.Input.Keyboard.KeyCodes.A,
            "S": Phaser.Input.Keyboard.KeyCodes.S,
            "D": Phaser.Input.Keyboard.KeyCodes.D,

            // Teclas de acción.
            "ESPACIO": Phaser.Input.Keyboard.KeyCodes.SPACE, // Para detonar la bomba
            "E": Phaser.Input.Keyboard.KeyCodes.E, // Para usar la habilidad XRAY
            "Z": Phaser.Input.Keyboard.KeyCodes.Z, // Alternativa para usar XRAY
            "Q": Phaser.Input.Keyboard.KeyCodes.Q, // Para extender la mecha
            "X": Phaser.Input.Keyboard.KeyCodes.X, // Alternativa para extender la mecha

            // Teclas de prueba y debug.
            "F": Phaser.Input.Keyboard.KeyCodes.F, // Tecla de prueba para sumar oro
            "P": Phaser.Input.Keyboard.KeyCodes.P, // Para activar/desactivar el modo de debug
            "R": Phaser.Input.Keyboard.KeyCodes.R, // Para reiniciar la escena
        });

        // Estado del juego para controlar el inicio de la mecha y el movimiento del jugador
        this.juegoIniciado = false;
        this.mechaActiva = true;
        this.SpritedeExplosionDestruido = false; // Asegurar que esta variable esté inicializada
    }

    preload() {
        // Carga del archivo JSON del tilemap y la imagen del tileset.
        this.load.tilemapTiledJSON("mapaPrincipal", "public/assets/tilemap/map.json");
        this.load.image("imagenTileset", "public/assets/texture.svg");

        // Carga de imágenes individuales para la interfaz de usuario y elementos del juego.
        this.load.image("interfazJuego", "./public/assets/Gameplay_3.svg");
        this.load.image("fondoJuego", "./public/assets/fondo.svg");
        this.load.image("iconoOro", "./public/assets/oro.svg");
        this.load.image("imagenMecha", "./public/assets/Mecha.svg");
        this.load.image("bombaDoble", "./public/assets/Doble_Bomba.svg");
        this.load.image("megaBomba", "./public/assets/Mega_Bomba.svg");
        this.load.image("tnt", "./public/assets/TNT.svg");
        this.load.image("habilidadXRAY", "./public/assets/XRAY.svg");
        this.load.image("extenderCuerda", "./public/assets/Extender_Cuerda.svg");
        this.load.image("repararCuerda", "./public/assets/Reparar_Cuerda.svg");
        this.load.image("spriteExplosion", "./public/assets/Explosion.svg");

        // Carga de spritesheets para animaciones o múltiples frames.
        // Spritesheet para la animación del fuego.
        this.load.spritesheet("spritesFuego", "public/assets/texture.svg", {
            frameWidth: 60,
            frameHeight: 60,
            startFrame: 3, // El frame 3 y 4 son para la animación del fuego.
            endFrame: 4,
        });
        // Spritesheet general para tiles del juego (rocas, personaje, agujeros).
        this.load.spritesheet("spritesTileset", "public/assets/texture.svg", {
            frameWidth: 60,
            frameHeight: 60,
        });
    }

    create() {
        console.log(`${this.mechaAcelerada}`);
        console.log(`${this.tiempoRestanteAceleracion}`);

        // Calcula el centro de la cámara para posicionar elementos de fondo.
        const centroX = this.cameras.main.width / 2;
        const centroY = this.cameras.main.height / 2;

        // --- Elementos de UI y Fondo ---
        // Se añaden primero para que estén en la parte inferior de las capas.
        this.add.image(centroX, centroY, "fondoJuego").setOrigin(0.5).setDepth(0);
        this.add.image(centroX, centroY, "interfazJuego").setOrigin(0.5).setDepth(30);

        // Imagen de la mecha/mecanica de vida.
        this.imagenMecha = this.add.image(1350, 153, "imagenMecha").setDepth(30);
        this.actualizarRecorteMecha(); // Llama a la función para establecer el recorte inicial de la mecha.

        // Configura un temporizador para quemar la mecha regularmente.
        // Almacenamos la referencia al evento del temporizador.
        this.mechaTimerEvent = this.time.addEvent({
            delay: 200, // Cada 200 milisegundos (0.2 segundos).
            callback: this.quemarMecha, // Llama a la función que decrementa la mecha.
            callbackScope: this, // Contexto de la función (this se refiere a la escena).
            loop: true, // Se repite indefinidamente.
            paused: true // Inicialmente pausado hasta que la secuencia de intro termine.
        });

        // --- Textos de la Interfaz de Usuario (UI) ---
        // Icono de oro
        this.add.image(250, 570 - 160, "iconoOro").setOrigin(0.5).setScale(1.5).setDepth(30);
        // Se crean los elementos de texto para mostrar información al jugador.
        this.textoCantidadOro = this.add.text(332, 550 - 165, `${this.cantidadOro}`.padStart(10, "0"), {
            fontSize: "45px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(30);

        // icono de imagen de roca
        this.add.image(250, 475 - 200, "spritesTileset", 7 - 1).setOrigin(0.5).setScale(1.2).setDepth(30);
        this.textopuntajeTotal = this.add.text(332, 450 - 200, `${this.puntajeTotal}`.padStart(10, "0"), {
            fontSize: "45px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(30);

        // --- Gráfico para Tachar la Habilidad XRAY ---
        // Este gráfico se usa para indicar visualmente que la habilidad XRAY no está disponible.
        this.graficoTachadoXRAYFondo = this.add.graphics();
        this.graficoTachadoXRAYFondo.fillStyle(0x08170d, 1); // Color#08170d .
        // Posición y tamaño del rectángulo que simula el tachado.
        this.graficoTachadoXRAYFondo.fillRect(185, 550, 410, 200); // x, y, ancho, alto.
        this.graficoTachadoXRAYFondo.setDepth(31); // Asegura que esté por encima de otros elementos de la UI.
        this.graficoTachadoXRAYFondo.setVisible(false); // Inicialmente oculto.


        this.graficoTachadoXRAY = this.add.graphics();
        this.graficoTachadoXRAY.fillStyle(0x42ded9, 1); // Color #42DED9.
        // Posición y tamaño del rectángulo que simula el tachado.
        this.graficoTachadoXRAY.fillRect(235, 655, 300, 10); // x, y, ancho, alto.
        this.graficoTachadoXRAY.setDepth(32); // Asegura que esté por encima de otros elementos de la UI.
        this.graficoTachadoXRAY.setVisible(false); // Inicialmente oculto.

        // --- Configuración del Mapa y Capas ---
        // Se carga el tilemap y se crean las capas de tiles.
        const mapa = this.make.tilemap({ key: "mapaPrincipal" });
        const tileset = mapa.addTilesetImage("tileset", "imagenTileset");

        // Capas del tilemap.
        // 'capaBarrera' es una capa de colisión, que ademas indica donde no pueden spawnear los objetos, 'capaRocas' contendrá las rocas a destruir.
        this.capaBarrera = mapa.createLayer("Barrera", tileset, 0, 0);
        this.capaRocas = mapa.createLayer("Rocas", tileset, 0, 0); // Guardar referencia para manipular rocas.
        this.capaAgujeros = mapa.createLayer("Agujeros", tileset, 0, 0);
        this.capaFuegos = mapa.createLayer("fuegos", tileset, 0, 0);

        // --- Propiedades de los Tiles ---
        /* Se obtienen las propiedades de los tiles del tileset, 
        útiles para determinar si una posición es válida para la generación de objetos.*/
        const datosTileset = mapa.tilesets[0];
        const propiedadesTiles = datosTileset.tileProperties || {};

        // --- Generación de Posiciones Válidas para Objetos ---
        // Se crea un array con todas las coordenadas (x, y) de los tiles donde se pueden generar objetos.
        let posicionesValidas = [];
        for (let y = 0; y < mapa.height; y++) {
            for (let x = 0; x < mapa.width; x++) {
                const tile = this.capaBarrera.getTileAt(x, y);
                let esValida = true;
                // Si el tile es una barrera y tiene la propiedad 'nospawn' a true, no es válida.
                if (tile && tile.index === 1) { // el índice 1 es el tile de barrera.
                    const props = propiedadesTiles[tile.index - datosTileset.firstgid] || {};
                    if (props.nospawn === true) esValida = false;
                }
                if (esValida) posicionesValidas.push({ x, y });
            }
        }

        // --- Función para Verificar si una Posición es Válida para Colocar un Objeto ---
        // Esta función se utiliza para asegurar que los objetos no se generen en lugares no deseados.
        const esPosicionValidaParaGeneracion = (x, y) => {
            // Verifica límites del mapa.
            if (x < 0 || y < 0 || x >= mapa.width || y >= mapa.height) return false;
            // Verifica si hay una barrera que prohíba el spawn.
            const tileBarrera = this.capaBarrera.getTileAt(x, y);
            if (tileBarrera && tileBarrera.index === 1) {
                const props = propiedadesTiles[tileBarrera.index - datosTileset.firstgid] || {};
                if (props.nospawn === true) return false;
            }
            // Verifica si ya hay una roca, agujero o fuego en esa posición.
            if (this.capaRocas.getTileAt(x, y)) return false;
            if (this.capaAgujeros.getTileAt(x, y)) return false;
            if (this.capaFuegos.getTileAt(x, y)) return false;
            return true;
        };

        // --- Generación de Rocas y Orocas ---
        // grupo para las rocas, para añadirles colision despues.
        this.grupoRocas = this.physics.add.staticGroup();
        this.orocas = []; // Array para almacenar las orocas generadas, incluyendo su estado.
        this.generarRocasYOrocas(mapa, esPosicionValidaParaGeneracion, posicionesValidas, propiedadesTiles, datosTileset);

        // --- Generación de Agujeros ---
        this.grupoAgujeros = this.physics.add.staticGroup();
        this.generarAgujeros(mapa, esPosicionValidaParaGeneracion, posicionesValidas);

        // --- Generación de Fuegos ---
        this.grupoFuegos = this.physics.add.group();
        this.generarFuegos(mapa, esPosicionValidaParaGeneracion, posicionesValidas);

        // --- Creación del Personaje ---
        // Se busca el punto de spawn del personaje definido en el tilemap.
        const puntoSpawnPersonaje = mapa.findObject("Objetos", (obj) => obj.name === "bombaspawn");
        this.personaje = this.physics.add.sprite(
            puntoSpawnPersonaje.x,
            puntoSpawnPersonaje.y,
            "spritesTileset",
            2 // Frame del sprite del personaje.
        );

        this.personaje.setSize(40, 40).setOffset(10, 10); // Cambia el tamaño y Centra la hitbox (60-40)/2 = 10
        this.personaje.setCollideWorldBounds(true); // Asegura que el personaje no salga de los límites del mundo.

        if (this.mechaAcelerada && this.tiempoRestanteAceleracion > 0) {
            this.temporizadorAcelerarConsumo = this.time.delayedCall(this.tiempoRestanteAceleracion, () => {
                this.mechaAcelerada = false;
                this.temporizadorAcelerarConsumo = null;
                console.log("El consumo de la mecha ha vuelto a la normalidad.");
            }, [], this);
        }

        // --- Configuración de Colisiones y Solapamientos ---
        // como creamos los grupos, ahora podemos asignarles colisiones entre si :D
        this.capaBarrera.setCollisionByProperty({ colisionable: true }); // Las tiles con la propiedad 'colisionable: true' serán colisionables, duh.
        this.physics.add.collider(this.personaje, this.capaBarrera); // Colisión entre el personaje y las barreras.
        this.physics.add.collider(this.personaje, this.grupoRocas); // Colisión entre el personaje y las rocas.
        this.physics.add.collider(this.personaje, this.grupoAgujeros); // Colisión entre el personaje y los agujeros.
        // overlap entre el personaje y los fuegos. llamará a la función 'manejarContactoFuego'.
        this.physics.add.overlap(this.personaje, this.grupoFuegos, this.manejarContactoFuego, null, this);

        // --- Event Listener para la Detonación de la Bomba ---
        // un event listener, espera a que ocurra algo (en este caso, una tecla presionada) para ejecutar una función.
        this.teclasPersonalizadas.ESPACIO.on('down', this.crearExplosion, this);

        // Deshabilitar controles del jugador y pausar la mecha al inicio
        this.habilitarControlesJugador(false);

        /* dejar que la mecha no consuma al inicio, asi no puede spamear explotar sin consecuencia. 
        esto sumado a que la explosion real inicial destruye rocas al alcance del jugador en la posicion inicial,
        haciendo que el jugador por lo menos tenga un incentivo para moverse un poco y conseguir oro o puntos :D
        */
        if (this.mechaTimerEvent) {
            this.mechaTimerEvent.paused = false;
        }

        // Iniciar la secuencia de introducción
        this.iniciarSecuenciaIntro();
    }

    update() {
        // Solo manejar el movimiento y otras lógicas si el juego ha iniciado
        if (this.juegoIniciado) {
            // Maneja el movimiento del personaje según las teclas presionadas.
            this.manejarMovimientoPersonaje();

            // Maneja la activación/desactivación del modo de depuración y el reinicio del juego.
            this.manejarDebugReiniciar();

            // Maneja la lógica para la habilidad XRAY (revelar orocas ocultas).
            this.manejarHabilidadXRAY();

            // Maneja la lógica para la habilidad de extender la mecha.
            this.manejarHabilidadExtenderMecha();

            // Función de prueba para sumar oro (se activa con la tecla 'F').
            this.sumarOroPrueba();
        }
    }

    // --- Métodos de Generación de Objetos ---

    // Genera rocas normales y orocas (rocas con oro) en el mapa.
    generarRocasYOrocas(mapa, esPosicionValidaParaGeneracion, posicionesValidasOriginales, propiedadesTiles, datosTileset) {
        let posicionesDisponibles = [...posicionesValidasOriginales]; // Copia para no modificar el original.
        let posicionesUsadas = new Set(); // Para evitar generar objetos en la misma casilla.
        let rocasRestantes = this.configuracionGeneracion.cantidadTotalRocas;
        let cantidadGrupos = this.configuracionGeneracion.cantidadGruposRocas;

        Phaser.Utils.Array.Shuffle(posicionesDisponibles); // Aleatoriza las posiciones disponibles.

        // Bucle para generar grupos de rocas.
        for (let g = 0; g < cantidadGrupos && posicionesDisponibles.length > 0 && rocasRestantes > 0; g++) {
            let centroGrupo;
            // Busca una posición central válida para el grupo de rocas.
            do {
                centroGrupo = Phaser.Utils.Array.RemoveRandomElement(posicionesDisponibles);
            } while (centroGrupo && posicionesUsadas.has(`${centroGrupo.x},${centroGrupo.y}`));
            if (!centroGrupo) break; // Si no hay más posiciones, sale del bucle.

            // Calcula la cantidad de rocas para este grupo, asegurando que se cumpla el total.
            let gruposFaltantes = cantidadGrupos - g;
            let maxRocasEsteGrupo = Math.min(3, rocasRestantes - (gruposFaltantes - 1));
            let minRocasEsteGrupo = Math.max(1, rocasRestantes - (gruposFaltantes - 1) * 3);
            let cantidadRocasGrupo = Phaser.Math.Between(minRocasEsteGrupo, maxRocasEsteGrupo);

            // Define las posiciones posibles alrededor del centro del grupo (cuadrícula 3x3).
            let posicionesPosiblesEnGrupo = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    posicionesPosiblesEnGrupo.push({ x: centroGrupo.x + dx, y: centroGrupo.y + dy });
                }
            }
            Phaser.Utils.Array.Shuffle(posicionesPosiblesEnGrupo); // Aleatoriza las posiciones dentro del grupo.

            let rocasColocadasEnGrupo = 0;
            // Itera sobre las posiciones posibles para colocar rocas.
            for (let i = 0; i < posicionesPosiblesEnGrupo.length && rocasColocadasEnGrupo < cantidadRocasGrupo && rocasRestantes > 0; i++) {
                const { x, y } = posicionesPosiblesEnGrupo[i];
                // Si la posición es válida y no ha sido usada.
                if (esPosicionValidaParaGeneracion(x, y) && !posicionesUsadas.has(`${x},${y}`)) {
                    let esOroca = Math.random() < this.configuracionGeneracion.probabilidadOroca;
                    let oculta = esOroca ? Math.random() < this.configuracionGeneracion.probabilidadOrocaOculta : false;
                    // El frame 5 es para oroca visible, el 7 para roca normal/oroca oculta.
                    let frameInicial = (esOroca && !oculta) ? 5 : 7;

                    // Coloca un tile visual de roca en la capa de rocas del tilemap.
                    this.capaRocas.putTileAt(7, x, y);
                    posicionesUsadas.add(`${x},${y}`); // Marca la posición como usada.

                    // Convierte las coordenadas del tile a coordenadas del mundo.
                    const coordenadasMundo = mapa.tileToWorldXY(x, y);
                    // Crea un sprite de física estática para la roca.
                    let spriteRoca = this.grupoRocas.create(
                        coordenadasMundo.x + mapa.tileWidth / 2,
                        coordenadasMundo.y + mapa.tileHeight / 2,
                        "spritesTileset",
                        frameInicial
                    ).setOrigin(0.5).refreshBody(); // Centra el origen y actualiza el cuerpo de física.

                    // Almacena las coordenadas del tile en el sprite para fácil referencia al destruirlo.
                    spriteRoca.tileX = x;
                    spriteRoca.tileY = y;

                    if (esOroca) {
                        // Si es una oroca, la añade al array de orocas con su estado.
                        this.orocas.push({ x, y, sprite: spriteRoca, oculta, revelada: !oculta });
                    }

                    rocasColocadasEnGrupo++;
                    rocasRestantes--;
                }
            }
        }
    }

    // Genera agujeros en el mapa.
    generarAgujeros(mapa, esPosicionValidaParaGeneracion, posicionesValidasOriginales) {
        let posicionesDisponibles = [...posicionesValidasOriginales];
        let posicionesUsadas = new Set();
        let cantidadAgujeros = this.configuracionGeneracion.cantidadAgujeros;

        Phaser.Utils.Array.Shuffle(posicionesDisponibles);

        for (let i = 0; i < cantidadAgujeros && posicionesDisponibles.length > 0; i++) {
            let posicionAgujero;
            do {
                posicionAgujero = Phaser.Utils.Array.RemoveRandomElement(posicionesDisponibles);
            } while (posicionAgujero && posicionesUsadas.has(`${posicionAgujero.x},${posicionAgujero.y}`));
            if (!posicionAgujero) break;

            if (esPosicionValidaParaGeneracion(posicionAgujero.x, posicionAgujero.y)) {
                this.capaAgujeros.putTileAt(1, posicionAgujero.x, posicionAgujero.y); // Coloca el tile visual del agujero.
                posicionesUsadas.add(`${posicionAgujero.x},${posicionAgujero.y}`);

                const coordenadasMundo = mapa.tileToWorldXY(posicionAgujero.x, posicionAgujero.y);
                this.grupoAgujeros.create(
                    coordenadasMundo.x + mapa.tileWidth / 2,
                    coordenadasMundo.y + mapa.tileHeight / 2,
                    "spritesTileset",
                    1 // Frame del sprite del agujero.
                ).setOrigin(0.5).refreshBody();
            }
        }
    }

    generarFuegos(mapa, esPosicionValidaParaGeneracion, posicionesValidasOriginales) {
        let posicionesDisponibles = [...posicionesValidasOriginales];
        let posicionesUsadas = new Set();
        let cantidadFuegos = this.configuracionGeneracion.cantidadFuegos;

        // Crea la animación global del fuego una sola vez.
        if (!this.anims.exists("animacionFuego")) {
            this.anims.create({
                key: "animacionFuego",
                frames: this.anims.generateFrameNumbers("spritesFuego", { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }

        let fuegosColocados = 0;
        while (fuegosColocados < cantidadFuegos && posicionesDisponibles.length > 0) {
            let posicionFuego = Phaser.Utils.Array.RemoveRandomElement(posicionesDisponibles);
            if (!posicionFuego) break;

            if (esPosicionValidaParaGeneracion(posicionFuego.x, posicionFuego.y) && !posicionesUsadas.has(`${posicionFuego.x},${posicionFuego.y}`)) {
                this.capaFuegos.putTileAt(1, posicionFuego.x, posicionFuego.y); // Coloca el tile visual del fuego.
                posicionesUsadas.add(`${posicionFuego.x},${posicionFuego.y}`);

                const coordenadasMundo = mapa.tileToWorldXY(posicionFuego.x, posicionFuego.y);
                let spriteFuego = this.grupoFuegos.create(
                    coordenadasMundo.x + mapa.tileWidth / 2,
                    coordenadasMundo.y + mapa.tileHeight / 2,
                    "spritesFuego"
                ).setOrigin(0.5).setDepth(10); // Ajusta la profundidad para que el fuego esté sobre el mapa.

                spriteFuego.anims.play("animacionFuego", true); // Reproduce la animación del fuego.
                spriteFuego.body.immovable = true; // Hace que el fuego sea inamovible por colisiones.

                fuegosColocados++;
            }
        }
    }

 // --- funciones para la secuencia de inicio ---

    // Habilita o deshabilita los controles del jugador.
    habilitarControlesJugador(habilitar) {
        this.cursores.enabled = habilitar;
        Object.values(this.teclasPersonalizadas).forEach(key => {
            if (key && typeof key.enabled !== "undefined") {
                key.enabled = habilitar;
            }
        });
    }

    // Inicia la secuencia de introducción del juego (personaje grande, encogimiento, explosión inicial).
    iniciarSecuenciaIntro() {
        // Asegurarse de que el personaje esté visible y habilitado para la animación de escala
        this.personaje.setVisible(true);
        this.personaje.body.enable = false; // Deshabilitar física durante la animación

        this.personaje.setAlpha(0); // Empezar invisible para un fade-in

        // Animación de encogimiento y aparición del personaje
        this.tweens.add({
            targets: this.personaje,
            scale: { from: 50, to: 1 }, // De tamaño enorme a tamaño original
            alpha: { from: 0, to: 1 }, // De invisible a visible
            ease: 'quart.easeIn', // Tipo de interpolación para la animación
            duration: 700, // Duración de la animación en milisegundos
            onComplete: () => {
                // Una vez que el personaje está en su tamaño original, crear la explosión visual y la real
                this.CrearExplosionVisual();
                this.CrearExplosionReal(); // Llamar a la explosión real
            }
        });
    }

    // Esto es solo para que la explosion se vea mas epica, pero el verdadero esta abajo en CrearExplosionReal
    CrearExplosionVisual() {
        const centroExplosionX = this.personaje.x;
        const centroExplosionY = this.personaje.y;
        const radioExplosion = 500;

        // Crea un círculo visual para la explosión inicial
        this.introExplosionSprite = this.add.circle(centroExplosionX, centroExplosionY, 0, 0x42DED9, 0.5);
        this.introExplosionSprite.setDepth(29); // Asegura que esté por encima de todo

        // Animación de la explosión inicial
        this.tweens.add({
            targets: this.introExplosionSprite,
            radius: { from: 0, to: radioExplosion }, // El círculo crece
            alpha: { from: 1, to: 0 }, // Se desvanece
            ease: 'cubic.easeOut',
            duration: 500, // Duración de la animación
            onComplete: () => {
                this.introExplosionSprite.destroy(); // Destruye el sprite de la explosión
            }
        });
    }

    // esto crea una radio de explosion invisible, pero con fisicas de 60 x 60 px que comienza pequeño y se expande hasta el tamaño de 60 x 60 px, actualizando mientras crece su hitbox, asi destruye todos los objetos fisicos con lo que haga overlap, excepto el jugador, sin dar puntos ni nada
    CrearExplosionReal() {
        const centroExplosionX = this.personaje.x;
        const centroExplosionY = this.personaje.y;
        const radioExplosion = 60;

        // Crea un sprite invisible para la explosión física
        this.explosionReal = this.physics.add.sprite(centroExplosionX, centroExplosionY, null)
            .setOrigin(0.5)
            .setCircle(0)
            .setAlpha(0)
            .setDepth(29);

        // Solapamientos con grupos
        this.physics.add.overlap(this.explosionReal, this.grupoRocas, this.explosionInicialGolpeaRoca, null, this);
        this.physics.add.overlap(this.explosionReal, this.grupoAgujeros, this.explosionInicialGolpeaAgujero, null, this);
        this.physics.add.overlap(this.explosionReal, this.grupoFuegos, this.explosionInicialGolpeaFuego, null, this);

        // Animación de expansión de la hitbox circular
        this.tweens.add({
            targets: this.explosionReal.body,
            radius: { from: 0, to: radioExplosion},
            duration: 200,
            ease: 'Linear',
            onUpdate: () => {
                this.explosionReal.body.setCircle(this.explosionReal.body.radius);
                // Centrar el círculo en el sprite
                this.explosionReal.body.setOffset(
                    this.explosionReal.width / 2 - this.explosionReal.body.radius,
                    this.explosionReal.height / 2 - this.explosionReal.body.radius
                );
            },
            onComplete: () => {
                this.explosionReal.destroy();
                // Habilitar juego
                this.juegoIniciado = true;
                this.personaje.body.enable = true;
                this.habilitarControlesJugador(true);
                this.mechaActiva = true;
                if (this.mechaTimerEvent) {
                    this.mechaTimerEvent.paused = false;
                }
                console.log("Secuencia de introducción completada. Juego iniciado.");
            }
        });
    }

    // Maneja la lógica cuando la explosión inicial golpea una roca (sin dar puntos ni oro)
    explosionInicialGolpeaRoca(explosion, rocaGolpeada) {
        if (!rocaGolpeada.active) {
            return;
        }

        // Elimina el tile correspondiente del tilemap
        if (rocaGolpeada.tileX !== undefined && rocaGolpeada.tileY !== undefined) {
            this.capaRocas.removeTileAt(rocaGolpeada.tileX, rocaGolpeada.tileY);
        }
        rocaGolpeada.destroy(); // Destruye el sprite de la roca
    }

    // Maneja la lógica cuando la explosión inicial golpea un agujero (sin dar puntos ni oro)
    explosionInicialGolpeaAgujero(explosion, agujeroGolpeado) {
        if (!agujeroGolpeado.active) {
            return;
        }
        // Elimina el tile correspondiente del tilemap (si aplica)
        // Nota: Los agujeros no tienen un tileX/tileY directamente en tu código,
        // si los tuvieras, los eliminarías aquí. Por ahora, solo destruimos el sprite.
        agujeroGolpeado.destroy(); // Destruye el sprite del agujero
    }

    // Maneja la lógica cuando la explosión inicial golpea un fuego (sin dar puntos ni oro)
    explosionInicialGolpeaFuego(explosion, fuegoGolpeado) {
        if (!fuegoGolpeado.active) {
            return;
        }
        // Elimina el tile correspondiente del tilemap (si aplica)
        fuegoGolpeado.destroy(); // Destruye el sprite del fuego
    }

    // --- Métodos de Lógica del Juego ---

    // Controla el movimiento del personaje basado en la entrada del teclado.
    manejarMovimientoPersonaje() {
        let vx = 0;
        let vy = 0;

        if (this.cursores.up.isDown || this.teclasPersonalizadas.W.isDown) {
            vy -= 1;
        }
        if (this.cursores.down.isDown || this.teclasPersonalizadas.S.isDown) {
            vy += 1;
        }
        if (this.cursores.left.isDown || this.teclasPersonalizadas.A.isDown) {
            vx -= 1;
        }
        if (this.cursores.right.isDown || this.teclasPersonalizadas.D.isDown) {
            vx += 1;
        }

        // Normaliza para que la velocidad diagonal no sea mayor
        if (vx !== 0 || vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx = (vx / length) * this.velocidadPersonaje;
            vy = (vy / length) * this.velocidadPersonaje;
        }

        this.personaje.setVelocity(vx, vy);
    }

    // Debuj y movimiento.
    manejarDebugReiniciar() {
        // Activa/desactiva el modo de depuración de físicas con la tecla 'P'.
        if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.P)) {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear(); // Limpia los gráficos de depuración al cambiar el estado.
        }

        // Reinicia la escena con la tecla 'R'.
        if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.R)) {
            const escenaMaestra = this.scene.get('EscenaMaestra');
            escenaMaestra.reiniciarGameplayDeFabrica()
        }
    }

    // Lógica para la habilidad XRAY: revela orocas ocultas.
    manejarHabilidadXRAY() {
        // Se activa con las teclas 'E' o 'Z'.
        if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.E) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.Z)) {
            const costoXRAY = 500;

            // Verifica si hay orocas ocultas que aún no han sido reveladas.
            const hayOcultasNoReveladas = this.orocas.some(oroca => oroca.oculta && !oroca.revelada);

            if (this.cantidadOro >= costoXRAY && hayOcultasNoReveladas) {
                this.cantidadOro -= costoXRAY;
                this.textoCantidadOro.setText(`${this.cantidadOro}`.padStart(10, "0"));
                console.log(`Usado XRAY. Oro restante: ${this.cantidadOro}`);

                // Itera sobre todas las orocas para revelar las que están ocultas.
                this.orocas.forEach(oroca => {
                    if (oroca.oculta) {
                        oroca.oculta = false; // Ya no está oculta.
                        oroca.revelada = true; // Marcar como revelada permanentemente.
                        oroca.sprite.setFrame(5); // Cambia el frame del sprite para mostrar la oroca visible.
                    }
                });

                // Después de revelar, verifica si quedan orocas ocultas por revelar.
                // Si no quedan, muestra el gráfico de tachado para indicar que la habilidad está "agotada".
                const aunHayOcultasNoReveladas = this.orocas.some(oroca => oroca.oculta && !oroca.revelada);
                if (!aunHayOcultasNoReveladas) {
                    this.graficoTachadoXRAYFondo.setVisible(true);
                    this.graficoTachadoXRAY.setVisible(true);
                    console.log("Todas las orocas ocultas han sido reveladas. XRAY no puede usarse más.");
                }

            } else if (this.cantidadOro < costoXRAY) {
                console.log("No tienes suficiente oro para usar XRAY (necesitas 500 de oro).");
            } else if (!hayOcultasNoReveladas) {
                console.log("No hay orocas ocultas que revelar.");
                // Si no hay orocas ocultas, la habilidad XRAY está "agotada" para esta ronda.
                this.graficoTachadoXRAYFondo.setVisible(true);
                this.graficoTachadoXRAY.setVisible(true);
            }
        }
    }

    // Lógica para la habilidad de extender la mecha.
    manejarHabilidadExtenderMecha() {
        // Se activa con las teclas 'Q' o 'X'.
        if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.Q) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.X)) {
            const costoExtenderMecha = 1000;
            const aumentoMecha = 20; // Cantidad en que aumenta la longitud de la mecha.
            const mechaMaxima = 100; // Longitud máxima de la mecha (100%).

            if (this.cantidadOro >= costoExtenderMecha) {
                this.cantidadOro -= costoExtenderMecha;
                this.textoCantidadOro.setText(`${this.cantidadOro}`.padStart(10, "0"));
                console.log(`Mecha extendida. Oro restante: ${this.cantidadOro}`);

                // Aumenta la longitud de la mecha, sin exceder el máximo.
                this.longitudMecha = Math.min(this.longitudMecha + aumentoMecha, mechaMaxima);
                this.actualizarRecorteMecha(); // Actualiza la visualización de la mecha.
                console.log(`Longitud de mecha actual: ${this.longitudMecha}`);
            } else {
                console.log("No tienes suficiente oro para extender la mecha (necesitas 1000 de oro).");
            }
        }
    }

    // Función de prueba para sumar oro (solo para desarrollo/pruebas).
    sumarOroPrueba() {
        if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.F)) {
            this.cantidadOro += 100;
            this.textoCantidadOro.setText(`${this.cantidadOro}`.padStart(10, "0"));
            console.log(`Oro sumado (prueba). Oro actual: ${this.cantidadOro}`);
        }
    }

    // --- Funciones de Eventos y Mecánicas del Juego ---

    // Crea el sprite de la explosión y gestiona su animación y efectos.
    crearExplosion() {
        // parar que la mecha no se queme mientras se crea la explosión.
        this.time.removeAllEvents();

        // eliminar el jugador
        this.personaje.setVisible(false); // Oculta el sprite del personaje.
        this.personaje.body.enable = false; // Desactiva el cuerpo de física del personaje

        // desabilitar todas las teclas de control del jugador.
        this.habilitarControlesJugador(false);

        // Obtiene la posición actual del personaje (donde se detonó la bomba).
        const xPersonaje = this.personaje.x;
        const yPersonaje = this.personaje.y;

        // Crea el sprite de la explosión con físicas.
        let explosionSprite = this.physics.add.sprite(xPersonaje, yPersonaje, "spriteExplosion").setOrigin(0.5);
        explosionSprite.setDepth(11);

        // Añade un solapamiento entre la explosión y el grupo de rocas. llamará a la función 'explosionGolpeaRoca'.
        this.physics.add.overlap(explosionSprite, this.grupoRocas, this.explosionGolpeaRoca, null, this);

        // Animación de la explosión: escala y se desvanece.
        this.tweens.add({
            targets: explosionSprite,
            scale: { from: 0.5, to: 1 }, // La explosión crece de 0.5 a 1 de su tamaño original.
            alpha: { from: 1, to: 0 }, // La explosión se desvanece gradualmente.
            ease: 'Sine.easeInOut', // Tipo de interpolación para la animación.
            duration: 500, // Duración total de la animación en milisegundos.
            onComplete: () => {
                explosionSprite.destroy(); // Destruye el sprite de la explosión una vez que la animación termina.
                this.SpritedeExplosionDestruido = true; // Marca que el sprite de la explosión ha sido destruido.
                this.verificarFinDeJuego(); // Verifica si el juego debe reiniciarse.
            }
        });
    }

    // Maneja la lógica cuando una explosión golpea una roca o una oroca.
    explosionGolpeaRoca(explosion, rocaGolpeada) {
        // Si la roca ya ha sido destruida (inactiva), no hace nada.
        if (!rocaGolpeada.active) {
            return;
        }

        let esOroca = false;
        let indiceOroca = -1;

        // Busca si la roca golpeada es una oroca en el array de orocas.
        for (let i = 0; i < this.orocas.length; i++) {
            if (this.orocas[i].sprite === rocaGolpeada) {
                esOroca = true;
                indiceOroca = i;
                break;
            }
        }

        // Incrementa el contador de animaciones pendientes.
        this.AnimacionesdePuntosPendientes++;

        if (esOroca) {
            // Si es una oroca, suma puntos y oro.
            this.puntajeTotal += this.puntosPorRoca;
            this.cantidadOro += this.oroPorOroca;
            this.textoCantidadOro.setText(`${this.cantidadOro}`.padStart(10, "0"));
            console.log(`¡Oroca destruida! Puntos: ${this.puntajeTotal}, Oro: ${this.cantidadOro}`);

            // Elimina la oroca del array de orocas para que no se pueda interactuar con ella de nuevo.
            if (indiceOroca !== -1) {
                this.orocas.splice(indiceOroca, 1);
            }
            // Muestra la animación de puntos y oro.
            this.MostrarAnimacionesdeTexto(rocaGolpeada.x, rocaGolpeada.y, this.puntosPorRoca, this.oroPorOroca);
        } else {
            // Si es una roca normal, solo suma puntos.
            this.puntajeTotal += this.puntosPorRoca;
            console.log(`¡Roca destruida! Puntos: ${this.puntajeTotal}`);
            // Muestra la animación de puntos.
            this.MostrarAnimacionesdeTexto(rocaGolpeada.x, rocaGolpeada.y, this.puntosPorRoca);
        }

        // Actualiza el texto de los puntos actuales en la UI.
        this.textopuntajeTotal.setText(`${this.puntajeTotal}`.padStart(10, "0"));

        // Elimina el tile correspondiente del tilemap para que no se renderice visualmente.
        if (rocaGolpeada.tileX !== undefined && rocaGolpeada.tileY !== undefined) {
            this.capaRocas.removeTileAt(rocaGolpeada.tileX, rocaGolpeada.tileY);
        }

        // Destruye el sprite de la roca/oroca.
        rocaGolpeada.destroy();
    }

    // Muestra una animación de texto flotante para los puntos y/o oro.
    MostrarAnimacionesdeTexto(x, y, Posiciones, Oro = 0) {
        // Animación de puntos
        let PosicionesdeTexto = this.add.text(x, y, `+${Posiciones}`, {
            fontSize: '35px',
            fill: '#42DED9',
            fontFamily: 'Impact',
        }).setOrigin(0.5).setDepth(32); // Asegura que esté por encima de todo.

        this.tweens.add({
            targets: PosicionesdeTexto,
            y: PosicionesdeTexto.y - 50, // Se mueve hacia arriba.
            alpha: 0, // Se desvanece.
            duration: 1000, // Duración de la animación.
            ease: 'Power1',
            onComplete: () => {
                PosicionesdeTexto.destroy();
                this.AnimacionesdePuntosPendientes--; // Decrementa el contador al finalizar la animación.
                this.verificarFinDeJuego(); // Verifica si el juego debe reiniciarse.
            }
        });

        // Animación de oro (si aplica)
        if (Oro > 0) {
            // Se posiciona el texto de oro un poco más abajo del texto de puntos.
            let OroY = y + 30;

            // Crea el icono de oro.
            let IconodeOro = this.add.image(x - 90, OroY, "iconoOro").setOrigin(0.5).setScale(1.5).setDepth(32);
            IconodeOro.setTintFill(0xFFD700); // Aplica un relleno dorado sólido al icono de oro.

            // Crea el texto de oro.
            let TextodeOro = this.add.text(x + 10, OroY, `+${Oro}`, {
                fontSize: '35px',
                fill: '#FFD700', // Color dorado.
                fontFamily: 'Impact',
            }).setOrigin(0.5).setDepth(32);

            // Agrupa el icono y el texto de oro para animarlos juntos.
            let GrupodeOro = this.add.container(0, 0, [IconodeOro, TextodeOro]);

            this.tweens.add({
                targets: GrupodeOro,
                y: GrupodeOro.y - 50, // Se mueve hacia arriba.
                alpha: 0, // Se desvanece.
                duration: 1000, // Duración de la animación.
                ease: 'Power1',
                onComplete: () => {
                    GrupodeOro.destroy(); // Destruye el grupo (icono y texto).
                }
            });
        }
    }

    // Maneja la colisión del personaje con un sprite de fuego.
    manejarContactoFuego(personaje, fuegoTocado) {
        console.log("¡El personaje ha tocado el fuego!");
        fuegoTocado.destroy(); // Elimina el sprite de fuego al ser tocado.

        if (this.temporizadorAcelerarConsumo) {
            this.temporizadorAcelerarConsumo.destroy();
        }

        this.mechaAcelerada = true; // Activa el modo de consumo acelerado de la mecha.

        // Crea un nuevo temporizador para desactivar la aceleración después de un tiempo.
        this.temporizadorAcelerarConsumo = this.time.delayedCall(5000, () => {
            this.mechaAcelerada = false; // Desactiva el modo acelerado.
            this.temporizadorAcelerarConsumo = null; // Limpia la referencia al temporizador.
            console.log("El consumo de la mecha ha vuelto a la normalidad.");
        }, [], this);

        console.log("El consumo de la mecha se ha acelerado durante 5 segundos.");
    }

    // Actualiza el recorte visual de la imagen de la mecha para reflejar su longitud actual.
    actualizarRecorteMecha() {
        if (this.imagenMecha) {
            // Asegura que la longitud de la mecha esté dentro del rango válido (0 a 100).
            this.longitudMecha = Phaser.Math.Clamp(this.longitudMecha, 0, 100);

            // Calcula el ancho de recorte basado en el porcentaje de longitud de la mecha.
            const anchoOriginal = this.imagenMecha.texture.source[0].width;
            const anchoRecorte = anchoOriginal * (this.longitudMecha / 100);

            // Aplica el recorte a la imagen de la mecha.
            this.imagenMecha.setCrop(0, 0, anchoRecorte, this.imagenMecha.texture.source[0].height);
        }
    }

    // Decrementa la longitud de la mecha y reinicia el juego si se consume por completo.
    quemarMecha() {
        if (this.longitudMecha > 0 && this.mechaActiva) { // Solo quema la mecha si está activa
            // Define la cantidad de decremento. Es mayor si la mecha está acelerada.
            const decrementoMecha = this.mechaAcelerada ? 1 : 0.1; // 1 para acelerado, 0.1 para normal.
            this.longitudMecha -= decrementoMecha;
            this.actualizarRecorteMecha(); // Actualiza la visualización de la mecha.
        } else if (this.longitudMecha <= 0 && this.mechaActiva) {
            console.log("¡La mecha se ha consumido! Fin del juego.");
            // Detiene todos los eventos de tiempo para evitar que sigan ejecutándose.
            this.time.removeAllEvents();
            const escenaMaestra = this.scene.get('EscenaMaestra');
            escenaMaestra.reiniciarGameplayDeFabrica()
        }
    }

    verificarFinDeJuego() {
        if (this.AnimacionesdePuntosPendientes === 0 && this.SpritedeExplosionDestruido) {
            console.log("Todas las animaciones de puntos han terminado y la explosión ha finalizado. Reiniciando escena...");
            const escenaMaestra = this.scene.get('EscenaMaestra');
            // Guarda los valores actuales en la escena maestra
            escenaMaestra.cantidadOro = this.cantidadOro;
            escenaMaestra.puntajeTotal = this.puntajeTotal;
            escenaMaestra.longitudMecha = this.longitudMecha;
            escenaMaestra.mechaAcelerada = this.mechaAcelerada;
            if (this.mechaAcelerada && this.temporizadorAcelerarConsumo) {
                escenaMaestra.tiempoRestanteAceleracion = this.temporizadorAcelerarConsumo.getRemaining();
            } else {
                escenaMaestra.tiempoRestanteAceleracion = 0;
            }
            escenaMaestra.reiniciarGameplay(); // Llama a la maestra para relanzar con los valores actualizados
        }
    }
}
