export default class EscenaMaestra extends Phaser.Scene {
    constructor() {
        super("EscenaMaestra");
    }

    init() {
        // Variables relacionadas con la puntuación y el oro.
        this.cantidadOro = 0;
        this.puntajeTotal = 0;
        this.Nivel = 1; // Nivel inicial del juego.

        // Variables de la mecha de la bomba.
        this.longitudMecha = 100; // Longitud inicial de la mecha (en porcentaje, 0-100).
        this.mechaAcelerada = false; // Estado de la mecha acelerada
        this.tiempoRestanteAceleracion = 0; // Tiempo restante de aceleración

        // Configuración para la generación de elementos en el mapa segun el nivel.
        // Se inicializa con una configuración por defecto, que será sobrescrita por el nivel actual.
        this.configuracionGeneracion = {
            cantidadAgujeros: 6, // Cantidad de agujeros a generar.
            cantidadFuegos: 5, // Cantidad de fuegos a generar.
            cantidadGruposRocas: 9, // Número de grupos 3x3 para distribuir rocas.
            cantidadTotalRocas: 20, // Cantidad total de rocas a generar.

            // Probabilidades para la generación de orocas.
            probabilidadOroca: 0.2, // Probabilidad de que una roca sea una oroca (50/50).
            probabilidadOrocaOculta: 0.8 // Probabilidad de que una oroca sea inicialmente oculta (50/50).
        };

        // Definición de configuraciones para cada nivel
        this.levelConfigurations = {
          1: {
                cantidadAgujeros: 0, // Sin agujeros
                cantidadFuegos: 0, // Sin fuegos
                cantidadGruposRocas: 9,
                cantidadTotalRocas: 20,
                probabilidadOroca: 0, // Solo rocas normales
                probabilidadOrocaOculta: 0
            },
            2: {
                cantidadAgujeros: 0, // Sin agujeros
                cantidadFuegos: 0, // Sin fuegos
                cantidadGruposRocas: 9,
                cantidadTotalRocas: 20,
                probabilidadOroca: 0.2, // Alta probabilidad de oroca
                probabilidadOrocaOculta: 0 // No ocultas
            },
            3: {
                cantidadAgujeros: 3, // Se introducen agujeros
                cantidadFuegos: 2, // Se introducen fuegos
                cantidadGruposRocas: 9,
                cantidadTotalRocas: 20,
                probabilidadOroca: 0.2, // Probabilidad de oroca baja
                probabilidadOrocaOculta: 0.5 // Alta probabilidad de oroca oculta
            },
            4: {
                cantidadAgujeros: 6,
                cantidadFuegos: 5,
                cantidadGruposRocas: 9,
                cantidadTotalRocas: 20,
                probabilidadOroca: 0.2,
                probabilidadOrocaOculta: 0.8
            },
            8: {
                cantidadAgujeros: 9,
                cantidadFuegos: 9,
                cantidadGruposRocas: 20,
                cantidadTotalRocas: 30,
                probabilidadOroca: 0.4,
                probabilidadOrocaOculta: 0.6
            },
            10: {
                cantidadAgujeros: 15,
                cantidadFuegos: 10,
                cantidadGruposRocas: 30,
                cantidadTotalRocas: 35,
                probabilidadOroca: 0.5,
                probabilidadOrocaOculta: 0.6
            },
            20: {
                cantidadAgujeros: 20,
                cantidadFuegos: 15,
                cantidadGruposRocas: 55,
                cantidadTotalRocas: 45,
                probabilidadOroca: 0.6,
                probabilidadOrocaOculta: 0.5
            }
        };

        // Variable para controlar si el juego ha terminado (para el menú de fin de juego)
        this.finDelJuego = false;

        // Variables de configuración de brillo y volumen
        // Se inicializan aquí y persisten mientras EscenaMaestra esté activa
        this.volumenConfiguracion = 1; // 0 a 2 (100% por defecto)
        this.brilloConfiguracion = 1;  // 0 a 2 (100% por defecto)
        // Inicializa el estado de pantalla completa basado en el estado actual del juego
        this.pantallaCompletaConfiguracion = this.sys.game.scale.isFullscreen; 

        // Top 10 High Scores
        this.TopExtractor = [
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 },
            { Empresa: "", puntaje: 0 }
        ];
    }

    preload() {
        // Carga del archivo JSON del tilemap y la imagen del tileset.
        this.load.tilemapTiledJSON("mapaPrincipal", "public/assets/tilemap/map.json");
        this.load.image("imagenTileset", "public/assets/texture.svg");

        // Carga de imágenes individuales para la interfaz de usuario y elementos del juego.
        this.load.image("interfazJuego", "./public/assets/Gameplay_3.svg");
        this.load.image("fondoJuego", "./public/assets/Fondo.svg");
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
        //console.log("Escena Maestra: Creando...");

        // Lanza la escena de Menus como una escena superpuesta
        this.scene.launch("Menus", {
            cantidadOro: this.cantidadOro,
            puntajeTotal: this.puntajeTotal,
            longitudMecha: this.longitudMecha,
            configuracionGeneracion: this.configuracionGeneracion,
            finDelJuego: this.finDelJuego // Pasa el estado de fin de juego
            // No es necesario pasar volumenConfiguracion y brilloConfiguracion aquí,
            // ya que Menus los obtiene directamente de this.scene.get('EscenaMaestra')
        });
    }

    update() {
        // No hay lógica de actualización compleja aquí, ya que maneja las escenas.
    }

    /**
     * Obtiene la configuración de generación de elementos para el nivel actual.
     * Si el nivel es 10 o superior, siempre devuelve la configuración del nivel 10.
     * Si no hay una configuración específica para el nivel (y es menor a 10),
     * devuelve la configuración por defecto.
     * @returns {object} La configuración de generación para el nivel actual.
     */
    getCurrentLevelConfig() {

        if (this.Nivel >= 4 && this.Nivel < 8) {
            return this.levelConfigurations[4];
        }
        else if (this.Nivel >= 8 && this.Nivel < 10) {
            return this.levelConfigurations[8];
        }
        else if (this.Nivel >= 10 && this.Nivel < 20) {
            return this.levelConfigurations[10];
        }
        else if (this.Nivel >= 20) {
            return this.levelConfigurations[20];
        }
        return this.levelConfigurations[this.Nivel] || this.configuracionGeneracion;
    }

    // Función para lanzar la EscenaGameplay desde Menus
    lanzarGameplay() {
        //console.log("Escena Maestra: Lanzando EscenaGameplay...");
        //console.log(`Nivel: ${this.Nivel}`);
        //console.log(`Nivel: ${this.levelConfigurations[this.Nivel]}`);
        this.Nivel = 1;
        this.puntajeTotal = 0;

        this.finDelJuego = false; // Resetear el estado de fin de juego al iniciar nuevo gameplay
        this.scene.launch("EscenaGameplay", {
            cantidadOro: 0,
            puntajeTotal: 0,
            longitudMecha: 2,
            Nivel : 1, // Pasa el nivel actual
            configuracionGeneracion: this.getCurrentLevelConfig(), // Pasa la configuración del nivel actual
            mechaAcelerada: false,
            tiempoRestanteAceleracion: 0
            // No es necesario pasar volumenConfiguracion y brilloConfiguracion aquí,
            // ya que EscenaGameplay los obtiene directamente de this.scene.get('EscenaMaestra')
        });
    }

    reiniciarGameplay() {
        this.Nivel ++; // Incrementa el nivel
        //console.log("¡Se esta reiniciando el juego!");
        //console.log(`Nivel: ${this.Nivel}`);
        // Detiene la escena de gameplay y la vuelve a lanzar con los valores actualizados.
        this.scene.stop("EscenaGameplay");
        this.scene.launch("EscenaGameplay", {
            cantidadOro: this.cantidadOro,
            puntajeTotal: this.puntajeTotal,
            longitudMecha: this.longitudMecha,
            configuracionGeneracion: this.getCurrentLevelConfig(), // Pasa la configuración del nivel actual
            mechaAcelerada: this.mechaAcelerada,
            tiempoRestanteAceleracion: this.tiempoRestanteAceleracion,
            Nivel : this.Nivel // Pasa el nivel actual
        });
    }

    reiniciarGameplayDeFabrica() {
        //console.log("¡Se esta reiniciando el juego desde la fabrica!");
        this.finDelJuego = true; // Marcar que el juego ha terminado para ir al menú de fin de juego
        this.scene.stop("EscenaGameplay"); // Detener la escena de gameplay
        // En lugar de this.scene.start, que reiniciaría EscenaMaestra, simplemente lanzamos Menus
        this.scene.launch("Menus", {
            cantidadOro: this.cantidadOro, // Estos valores pueden ser los del final del juego
            puntajeTotal: this.puntajeTotal,
            longitudMecha: this.longitudMecha,
            configuracionGeneracion: this.configuracionGeneracion, // Se mantiene la configuración actual para el menú de fin de juego
            finDelJuego: this.finDelJuego // Pasa el estado de fin de juego
        });
    }
}


