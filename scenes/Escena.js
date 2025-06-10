export default class Escena extends Phaser.Scene {
  constructor() {
    super("EscenaUno");
  }

  init() {

  }

  preload() {
    this.load.image("");
  }

  create() {
    this.add.image(0, 0, "");

  }

  update() {
  }
}
