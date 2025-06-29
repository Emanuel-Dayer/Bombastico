export default class EscenaMaestra extends Phaser.Scene {
    constructor() {
        super("EscenaMaestra");
    }

    init() {

    }

    preload() {

    }

    create() {
        console.log("Escena Maestra: Creando...");

        // Lanza la EscenaGameplay.
        // ambas escenas corrieran al mismo tiempo usamos 'launch'.
        this.scene.launch("EscenaGameplay");
        console.log("Escena Maestra: Lanzando EscenaGameplay...");
    }

    update() {

    }
}