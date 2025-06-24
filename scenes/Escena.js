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
    this.load.image("oro", "./public/assets/oro.svg");
    this.load.image("Mecha", "./public/assets/Mecha.svg");

  }

  create() {
    const Centrox = this.cameras.main.width / 2;
    const CentroY = this.cameras.main.height / 2;
    this.add.image(Centrox, CentroY, "Gameplay").setOrigin(0.5);

    const map = this.make.tilemap({ key: "map" });
     const tileset = map.addTilesetImage("tileset", "tileset");
      const capaHola = map.createLayer("Hola", tileset, 0, 0);

    this.add.image(1350, 153, "Mecha");

    this.cuota = this.add.text(258, 200, "CUOTA", 
    {
      fontSize: "35px",
      fill: "#42DED9",
      fontFamily: "Impact",
    }).setDepth(10);

    this.VpuntosActuales = 0;
    this.PuntosActuales = this.add.text(200, 270, `${this.VpuntosActuales} /`, 
    {
      fontSize: "35px",
      fill: "#42DED9",
      fontFamily: "Impact",
    }).setDepth(10);

    this.Vpuntoscuota = 0;
    this.Puntoscuota = this.add.text(200, 340, `${this.Vpuntoscuota}`, 
    {
      fontSize: "35px",
      fill: "#42DED9",
      fontFamily: "Impact",
    }).setDepth(10);

    this.DiasRestantes = this.add.text(480, 240, "01", 
    {
      fontSize: "80px",
      fill: "#42DED9",
      fontFamily: "Impact",
    }).setDepth(10);

    this.add.image(250, 570, "oro").setOrigin(0.5).setScale(1.5);
    this.Vcantidadoro = 0;
    this.CantidadOro = this.add.text(310, 550, `PUNTOS: ${this.Vcantidadoro}`, 
    {
      fontSize: "35px",
      fill: "#42DED9",
      fontFamily: "Impact",
    }).setDepth(10);
    
    this.puntaje = 0;
    this.Puntos = this.add.text(202, 455, `PUNTOS: ${this.puntaje}`, 
    {
      fontSize: "35px",
      fill: "#42DED9",
      fontFamily: "Impact",
    }).setDepth(10);

    // array de objetos literales para los items
    this.items = [
      { name: "item1", x: 300, y: 780 },
      { name: "item2", x: 480, y: 780 },
      { name: "item3", x: 300, y: 960 },
      { name: "item4", x: 480, y: 960 },
    ];

    // crear los items en el mapa
    this.items.forEach(item => {
      this.add.image(item.x, item.y, item.name).setOrigin(0.5).setScale(0.5);
    });
  }

  update() {
  }
}
