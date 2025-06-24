export default class Escena extends Phaser.Scene {
  constructor() {
    super("EscenaUno");
  }

  init() {

  }

  preload() {
    this.load.tilemapTiledJSON("map", "public/assets/tilemap/map.json");

    this.load.image("tileset", "public/assets/texture.png");



    this.load.image("Gameplay", "./public/assets/Gameplay.svg");
  }

  create() {
    const Centrox = this.cameras.main.width / 2;
    const CentroY = this.cameras.main.height / 2;
    this.add.image(Centrox, CentroY, "Gameplay").setOrigin(0.5);

    const map = this.make.tilemap({ key: "map" });
     const tileset = map.addTilesetImage("tileset", "tileset");
      const capaHola = map.createLayer("Hola", tileset, 0, 0);
  }

  update() {
  }
}
