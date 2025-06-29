import EscenaMaestra from "./scenes/EscenaMaestra.js";
import EscenaGameplay from "./scenes/EscenaGameplay.js";
import Menus from "./scenes/Menus.js";

const config = {
  type: Phaser.AUTO,
  width: 1980,
  height: 1260,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
    //scene: [EscenaMaestra, EscenaGameplay],
    scene: [Menus],
};

window.game = new Phaser.Game(config);