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
        // Configuración para la generación de elementos en el mapa.
        this.configuracionGeneracion = {
            cantidadAgujeros: 6, // Cantidad de agujeros a generar.
            cantidadFuegos: 5, // Cantidad de fuegos a generar.
            cantidadGruposRocas: 9, // Número de grupos 3x3 para distribuir rocas.
            cantidadTotalRocas: 20, // Cantidad total de rocas a generar.

            // Probabilidades para la generación de orocas.
            probabilidadOroca: 0.2, // Probabilidad de que una roca sea una oroca (50/50).
            probabilidadOrocaOculta: 0.8 // Probabilidad de que una oroca sea inicialmente oculta (50/50).
        };
    }

    preload() {

    }

    create() {
        console.log("Escena Maestra: Creando...");

        // Lanza la EscenaGameplay y le pasa los datos iniciales.
        this.scene.launch("EscenaGameplay", {
            cantidadOro: this.cantidadOro,
            puntajeTotal: this.puntajeTotal,
            longitudMecha: this.longitudMecha,
            configuracionGeneracion: this.configuracionGeneracion
        });
        console.log("Escena Maestra: Lanzando EscenaGameplay...");
    }

    update() {

    }

    reiniciarGameplay() {
        console.log("¡Se esta reiniciando el juego!");
        // Detiene la escena de gameplay y la vuelve a lanzar con los valores actualizados.
        this.scene.stop("EscenaGameplay");
        this.scene.launch("EscenaGameplay", {
            cantidadOro: this.cantidadOro,
            puntajeTotal: this.puntajeTotal,
            longitudMecha: this.longitudMecha,
            configuracionGeneracion: this.configuracionGeneracion,
            mechaAcelerada: this.mechaAcelerada,
            tiempoRestanteAceleracion: this.tiempoRestanteAceleracion
        });
    }

    reiniciarGameplayDeFabrica() {
        console.log("¡Se esta reiniciando el juego desde la fabrica!");
        // reiniciar esta escena
        this.scene.stop("EscenaGameplay");
        this.scene.restart();
    }
}