export default class Escena extends Phaser.Scene {
    constructor() {
        super("EscenaUno");
    }

    // --- CONFIGURACIÓN DE VARIABLES GLOBALES Y DE GENERACIÓN ---
    init() {
        // Variables de juego
        this.physics.world.drawDebug = false;
        this.Velocidad = 600;
        this.VpuntosActuales = 0;
        this.Vpuntoscuota = 0;
        this.Vcantidadoro = 0;
        this.puntaje = 0;
        this.VDiasRestantes = 2;
        this.longitudMecha = 100; // Inicializamos la mecha al 100%
        this.mechaAccelerated = false; // Nueva variable para controlar la aceleración de la mecha
        this.TemporizadorAcelerarConsumo = null; // Para guardar el timer de aceleración

        // Variables de generación de objetos
        this.configGeneracion = {
            cantidadGruposRocas: 9, // Grupos de rocas 3x3
            cantidadTotalRocas: 20, // Total de rocas a distribuir
            probabilidadOroca: 0.2, // Chance de que una roca sea oroca
            probabilidadOrocaOculta: 0.8, // Chance de que la oroca esté oculta
            cantidadAgujeros: 6, // Agujeros a generar
            cantidadFuegos: 5 // Fuegos a generar
        };

        // Teclas de control
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            "W": Phaser.Input.Keyboard.KeyCodes.W,
            "A": Phaser.Input.Keyboard.KeyCodes.A,
            "S": Phaser.Input.Keyboard.KeyCodes.S,
            "D": Phaser.Input.Keyboard.KeyCodes.D,
            "ESPACIO": Phaser.Input.Keyboard.KeyCodes.SPACE,
            "E": Phaser.Input.Keyboard.KeyCodes.E,
            "Z": Phaser.Input.Keyboard.KeyCodes.Z,
            "P": Phaser.Input.Keyboard.KeyCodes.P,
            "R": Phaser.Input.Keyboard.KeyCodes.R,
        });
    }

    // --- CARGA DE RECURSOS ---
    preload() {
        // Mapas y tilesets
        this.load.tilemapTiledJSON("map", "public/assets/tilemap/map.json");
        this.load.image("tileset", "public/assets/texture.png");

        // Imágenes y sprites
        this.load.image("Gameplay", "./public/assets/Gameplay.svg");
        this.load.image("oro", "./public/assets/oro.svg");
        this.load.image("Mecha", "./public/assets/Mecha.svg");
        this.load.image("Doble_Bomba", "./public/assets/Doble_Bomba.svg");
        this.load.image("Mega_Bomba", "./public/assets/Mega_Bomba.svg");
        this.load.image("TNT", "./public/assets/TNT.svg");
        this.load.image("XRAY", "./public/assets/XRAY.svg");
        this.load.image("Extender_Cuerda", "./public/assets/Extender_Cuerda.svg");
        this.load.image("Reparar_Cuerda", "./public/assets/Reparar_Cuerda.svg");

        // Spritesheets
        this.load.spritesheet("fuego", "public/assets/texture.png", {
            frameWidth: 60,
            frameHeight: 60,
            startFrame: 3,
            endFrame: 4,
        });
        this.load.spritesheet("tileset_sprites", "public/assets/texture.png", {
            frameWidth: 60,
            frameHeight: 60,
        });
    }

    // --- CREACIÓN DE LA ESCENA ---
    create() {
        // --- UI e imágenes de fondo ---
        const Centrox = this.cameras.main.width / 2;
        const CentroY = this.cameras.main.height / 2;
        this.add.image(Centrox, CentroY, "Gameplay").setOrigin(0.5);

        // Crear la imagen de la mecha y guardarla en una propiedad para poder manipularla
        this.ImagenMecha = this.add.image(1350, 153, "Mecha");

        // Llamar a la función para actualizar el recorte de la mecha inicialmente
        this.UpdateQuemarMecha();

        // Crear un evento de tiempo que se repita cada 200 ms (0.2 segundos) para el consumo normal
        this.time.addEvent({
            delay: 200, // 200 milisegundos
            callback: this.QuemarMecha,
            callbackScope: this,
            loop: true // Repetir indefinidamente
        });

        this.add.image(250, 570, "oro").setOrigin(0.5).setScale(1.5);

        // --- UI DE TEXTO ---
        this.cuota = this.add.text(258, 200, "CUOTA", {
            fontSize: "35px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(10);

        this.PuntosActuales = this.add.text(200, 270, `${this.VpuntosActuales} /`.padStart(12, "0"), {
            fontSize: "35px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(10);

        this.Puntoscuota = this.add.text(200, 340, `${this.Vpuntoscuota}`.padStart(10, "0"), {
            fontSize: "35px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(10);

        this.DiasRestantes = this.add.text(480, 240, `${this.VDiasRestantes}`.padStart(2, "0"), {
            fontSize: "80px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(10);

        this.CantidadOro = this.add.text(368, 550, `${this.Vcantidadoro}`.padStart(10, "0"), {
            fontSize: "35px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(10);

        this.Puntos = this.add.text(202, 455, `PUNTOS:          ` + `${this.puntaje}`.padStart(10, "0"), {
            fontSize: "35px",
            fill: "#42DED9",
            fontFamily: "Impact"
        }).setDepth(10);

        // --- ITEMS EN UI ---
        this.items = [
            {
                name: "item1",
                x: 300,
                y: 780,
                tipo: ""
            },
            {
                name: "item2",
                x: 480,
                y: 780,
                tipo: ""
            },
            {
                name: "item3",
                x: 300,
                y: 960,
                tipo: ""
            },
            {
                name: "item4",
                x: 480,
                y: 960,
                tipo: ""
            },
        ];
        this.items.forEach(item => {
            this.add.image(item.x, item.y, item.name).setOrigin(0.5).setScale(0.5);
        });

        // --- MAPA Y CAPAS ---
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("tileset", "tileset");
        const CBarrera = map.createLayer("Barrera", tileset, 0, 0);
        const CRocas = map.createLayer("Rocas", tileset, 0, 0);
        const CAgujeros = map.createLayer("Agujeros", tileset, 0, 0);
        const CFuegos = map.createLayer("fuegos", tileset, 0, 0);

        // --- OBTENER PROPIEDADES DE TILES ---
        const tilesetData = map.tilesets[0];
        const tileProps = tilesetData.tileProperties || {};

        // --- POSICIONES VÁLIDAS PARA GENERACIÓN ---
        let posicionesValidas = [];
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = CBarrera.getTileAt(x, y);
                let esValida = true;
                if (tile && tile.index === 1) {
                    const props = tileProps[tile.index - tilesetData.firstgid] || {};
                    if (props.nospawn === true) esValida = false;
                }
                if (esValida) posicionesValidas.push({ x, y });
            }
        }

        // --- FUNCIÓN PARA VERIFICAR POSICIÓN VÁLIDA ---
        const esPosicionValida = (x, y) => {
            if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
            const tile = CBarrera.getTileAt(x, y);
            if (tile && tile.index === 1) {
                const props = tileProps[tile.index - tilesetData.firstgid] || {};
                if (props.nospawn === true) return false;
            }
            if (CRocas.getTileAt(x, y)) return false;
            if (CAgujeros.getTileAt(x, y)) return false;
            if (CFuegos.getTileAt(x, y)) return false;
            return true;
        };

        // --- GENERACIÓN DE ROCAS Y OROCAs ---
        this.grupoRocas = this.physics.add.staticGroup();
        this.orocas = [];
        let usados = new Set();
        let rocasRestantes = this.configGeneracion.cantidadTotalRocas;
        let cantidadGrupos = this.configGeneracion.cantidadGruposRocas;

        Phaser.Utils.Array.Shuffle(posicionesValidas);

        for (let g = 0; g < cantidadGrupos && posicionesValidas.length > 0 && rocasRestantes > 0; g++) {
            let centro;
            do {
                centro = Phaser.Utils.Array.RemoveRandomElement(posicionesValidas);
            } while (centro && usados.has(`${centro.x},${centro.y}`));
            if (!centro) break;

            let gruposFaltantes = cantidadGrupos - g;
            let maxRocasEsteGrupo = Math.min(3, rocasRestantes - (gruposFaltantes - 1));
            let minRocasEsteGrupo = Math.max(1, rocasRestantes - (gruposFaltantes - 1) * 3);
            let cantidadRocasGrupo = Phaser.Math.Between(minRocasEsteGrupo, maxRocasEsteGrupo);

            let posibles = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    posibles.push({ x: centro.x + dx, y: centro.y + dy });
                }
            }
            Phaser.Utils.Array.Shuffle(posibles);

            let rocasColocadas = 0;
            for (let i = 0; i < posibles.length && rocasColocadas < cantidadRocasGrupo && rocasRestantes > 0; i++) {
                const { x, y } = posibles[i];
                if (esPosicionValida(x, y)) {
                    let esOroca = Math.random() < this.configGeneracion.probabilidadOroca;
                    let oculta = esOroca ? Math.random() < this.configGeneracion.probabilidadOrocaOculta : false;
                    let frame = (esOroca && !oculta) ? 5 : 7;

                    CRocas.putTileAt(7, x, y);
                    usados.add(`${x},${y}`);

                    const worldXY = map.tileToWorldXY(x, y);
                    let sprite = this.grupoRocas.create(
                        worldXY.x + map.tileWidth / 2,
                        worldXY.y + map.tileHeight / 2,
                        "tileset_sprites",
                        frame
                    ).setOrigin(0.5).refreshBody();

                    if (esOroca) {
                        this.orocas.push({ x, y, sprite, oculta });
                    }

                    rocasColocadas++;
                    rocasRestantes--;
                }
            }
        }

        // --- GENERACIÓN DE AGUJEROS ---
        this.grupoAgujeros = this.physics.add.staticGroup();
        let posicionesAgujero = Phaser.Utils.Array.Shuffle([...posicionesValidas]);
        let usadosAgujero = new Set();
        let cantidadAgujeros = this.configGeneracion.cantidadAgujeros;

        for (let i = 0; i < cantidadAgujeros && posicionesAgujero.length > 0; i++) {
            let pos;
            do {
                pos = Phaser.Utils.Array.RemoveRandomElement(posicionesAgujero);
            } while (pos && usadosAgujero.has(`${pos.x},${pos.y}`));
            if (!pos) break;
            if (esPosicionValida(pos.x, pos.y)) {
                CAgujeros.putTileAt(1, pos.x, pos.y);
                usadosAgujero.add(`${pos.x},${pos.y}`);
                const worldXY = map.tileToWorldXY(pos.x, pos.y);
                this.grupoAgujeros.create(
                    worldXY.x + map.tileWidth / 2,
                    worldXY.y + map.tileHeight / 2,
                    "tileset_sprites", 1
                ).setOrigin(0.5).refreshBody();
            }
        }

        // --- GENERACIÓN DE FUEGOS ---
        this.grupoFuegos = this.physics.add.group();
        let posicionesFuego = Phaser.Utils.Array.Shuffle([...posicionesValidas]);
        let usadosFuego = new Set();
        let cantidadFuegos = this.configGeneracion.cantidadFuegos;

        // Animación global del fuego
        this.anims.create({
            key: "fuegoAnim",
            frames: this.anims.generateFrameNumbers("fuego", { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1
        });

        let fuegosColocados = 0;
        while (fuegosColocados < cantidadFuegos && posicionesFuego.length > 0) {
            let pos = Phaser.Utils.Array.RemoveRandomElement(posicionesFuego);
            if (!pos) break;
            if (esPosicionValida(pos.x, pos.y) && !usadosFuego.has(`${pos.x},${pos.y}`)) {
                CFuegos.putTileAt(1, pos.x, pos.y);
                usadosFuego.add(`${pos.x},${pos.y}`);
                const worldXY = map.tileToWorldXY(pos.x, pos.y);

                let fuego = this.grupoFuegos.create(
                    worldXY.x + map.tileWidth / 2,
                    worldXY.y + map.tileHeight / 2,
                    "fuego"
                ).setOrigin(0.5).setDepth(10);

                fuego.anims.play("fuegoAnim", true);
                fuego.body.immovable = true;

                fuegosColocados++;
            }
        }

        // --- CREAR PERSONAJE ---
        const SpawnPersonaje = map.findObject("Objetos", (obj) => obj.name === "bombaspawn");
        this.personaje = this.physics.add.sprite(
            SpawnPersonaje.x,
            SpawnPersonaje.y,
            "tileset_sprites", 2
        );

        // --- COLISIONES ---
        CBarrera.setCollisionByProperty({ colisionable: true });
        this.physics.add.collider(this.personaje, CBarrera);
        this.physics.add.collider(this.personaje, this.grupoRocas);
        this.physics.add.collider(this.personaje, this.grupoAgujeros);
        this.physics.add.overlap(this.personaje, this.grupoFuegos, this.tocarfuego, null, this);

    }

    // --- UPDATE DEL JUEGO ---
    update() {
        // Movimiento del personaje
        this.personaje.setVelocity(0);
        if (this.cursors.up.isDown || this.teclas.W.isDown) this.personaje.setVelocityY(-this.Velocidad);
        if (this.cursors.down.isDown || this.teclas.S.isDown) this.personaje.setVelocityY(this.Velocidad);
        if (this.cursors.left.isDown || this.teclas.A.isDown) this.personaje.setVelocityX(-this.Velocidad);
        if (this.cursors.right.isDown || this.teclas.D.isDown) this.personaje.setVelocityX(this.Velocidad);

        // Activar/Desactivar Modo Debug
        if (Phaser.Input.Keyboard.JustDown(this.teclas.P)) {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }

        // Reiniciar el juego con la tecla R
        if (Phaser.Input.Keyboard.JustDown(this.teclas.R)) {
            this.scene.restart();
        }

        // Alternar visibilidad de orocas ocultas con E
        if (Phaser.Input.Keyboard.JustDown(this.teclas.E)) {
            const hayOcultas = this.orocas.some(oroca => oroca.oculta);
            if (hayOcultas) {
                this.orocas.forEach(oroca => {
                    if (oroca.oculta) {
                        oroca.oculta = false;
                        oroca.sprite.setFrame(5);
                    }
                });
            } else {
                this.orocas.forEach(oroca => {
                    oroca.oculta = true;
                    oroca.sprite.setFrame(7);
                });
            }
        }
    }

    // --- FUNCIÓN PARA MANEJAR COLISIÓN CON FUEGO ---
    tocarfuego(personaje, fuego) {
        console.log("¡El personaje ha tocado el fuego!");
        fuego.destroy(); // Elimina el fuego al tocarlo

        // Si ya hay un timer de aceleración activo, lo destruimos para evitar múltiples aceleraciones
        if (this.TemporizadorAcelerarConsumo) {
            this.TemporizadorAcelerarConsumo.destroy();
        }

        // Acelerar el consumo de la mecha
        this.mechaAccelerated = true;

        // Crear un timer para desactivar la aceleración después de 5 segundos
        this.TemporizadorAcelerarConsumo = this.time.delayedCall(5000, () => {
            this.mechaAccelerated = false;
            this.TemporizadorAcelerarConsumo = null; // Limpiar la referencia al timer
            console.log("El consumo de la mecha ha vuelto a la normalidad.");
        }, [], this);

        console.log("El consumo de la mecha se ha acelerado durante 5 segundos.");
    }

    // --- FUNCIÓN PARA ACTUALIZAR EL RECORTE DE LA MECHA ---
    UpdateQuemarMecha() {
        if (this.ImagenMecha) {
            // Asegurarse de que la longitud de la mecha no sea negativa
            this.longitudMecha = Phaser.Math.Clamp(this.longitudMecha, 0, 100);

            // Calcular el ancho de recorte basado en el porcentaje
            const AnchoOriginal = this.ImagenMecha.texture.source[0].width;
            const CortarAncho = AnchoOriginal * (this.longitudMecha / 100);

            // Aplicar el recorte. El origen (0, 0.5) asegura que el recorte se haga desde la derecha.
            this.ImagenMecha.setCrop(0, 0, CortarAncho, this.ImagenMecha.texture.source[0].height);
        }
    }

    // --- FUNCIÓN PARA DECREMENTAR LA LONGITUD DE LA MECHA ---
    QuemarMecha() {
        if (this.longitudMecha > 0) {
            // Ajustar el valor de decremento según si la mecha está acelerada o no
            const CortarImagenMecha = this.mechaAccelerated ? 1 : 0.1; // 1 para acelerado, 0.1 para normal
            this.longitudMecha -= CortarImagenMecha;
            this.UpdateQuemarMecha();
        } else {
            console.log("¡La mecha se ha consumido!");
            // Puedes detener el timer principal si la mecha llega a 0
            this.time.removeAllEvents();
            this.scene.restart(); // Reiniciar la escena o manejar el fin del juego
        }
    }
}
