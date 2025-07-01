export default class Menus extends Phaser.Scene {
    constructor() {
        super("Menus");
        this.db = null;
        // Objeto para almacenar las referencias a los sonidos cargados
        this.sounds = {};
    }

    init(data) {
        this.estadoActualMenu = '';
        this.opcionSeleccionada = 0;

        const escenaMaestra = this.scene.get('EscenaMaestra');
        this.volumenConfiguracion = escenaMaestra.volumenConfiguracion;
        this.brilloConfiguracion = escenaMaestra.brilloConfiguracion;
        this.pantallaCompletaConfiguracion = escenaMaestra.pantallaCompletaConfiguracion; 

        this.cantidadOro = data?.cantidadOro ?? 0;
        this.puntajeTotal = data?.puntajeTotal ?? 0;
        this.longitudMecha = data?.longitudMecha ?? 100;
        this.finDelJuego = data?.finDelJuego ?? false;

        this.configuracionTitulo = null;
        this.creditosTitulo = null;
        this.creadorTexto = null;
        this.logoCreador = null;

        this.indiceConfiguracion = null;
        this.TextoVolumenSonidos = null;
        this.TextoBrillo = null;
        this.GraficoLineaVolumen = null;
        this.GraficoLineaBrillo = null;
        this.SliderVolumen = null;
        this.SliderBrillo = null;
        this.subrayadosConfiguracion = [];
        this.opcionConfiguracionSeleccionada = 0;

        this.blackOverlay = null;
        this.whiteOverlay = null;

        this.indiceLetraSeleccionada = 0;
        this.letrasEmpresa = ["A", "A", "A", "A"];
        this.textoLetrasEmpresa = [];
        this.underlineLetra = null;

        this.sys.game.scale.on('fullscreenunsupported', this.onFullscreenChange, this);
        this.sys.game.scale.on('leavefullscreen', this.onFullscreenChange, this);
        this.sys.game.scale.on('enterfullscreen', this.onFullscreenChange, this);
    }

    preload() {
        this.load.image("Menu", "./public/assets/Menu.svg");
        this.load.image("Mensaje", "./public/assets/Mensaje.svg");
        this.load.image("Mensaje_2", "./public/assets/Mensaje_2.svg");
        this.load.image("MarcoMenus", "./public/assets/MarcoMenus.svg");
        this.load.image("fondoJuego", "./public/assets/Fondo.svg");
        this.load.image("BombasticoLogo", "./public/assets/BombasticoLogo.svg");
        this.load.image("LogoCreador", "./public/assets/LogoCreador.svg");
        this.load.image("Indice", "./public/assets/Indice.svg");
        this.load.image("MenuFin", "./public/assets/PantallaFin.svg");
        this.load.image("ValorSlider", "./public/assets/ValorSlider.svg");

        // Carga de sonidos
        this.load.audio("Comprar_Rayos_x", "./public/assets/Comprar_Rayos_x.wav");
        this.load.audio("Entrar-Salir-Menu", "./public/assets/Entrar-Salir-Menu_2.wav");
        this.load.audio("ExplosionFalsa", "./public/assets/ExplosionFalsa_2.wav");
        this.load.audio("Explotar", "./public/assets/Explotar.wav");
        this.load.audio("Explotar_2", "./public/assets/Explotar_2.wav");
        this.load.audio("Extender_Cuerda", "./public/assets/Extender_Cuerda_2.wav");
        this.load.audio("Moverse_Menu", "./public/assets/Moverse_Menu.wav");
        this.load.audio("Musica_Gameplay", "./public/assets/Musica_Gameplay.wav");
        this.load.audio("Musica-Menu", "./public/assets/Musica-Menu.wav");
        this.load.audio("Tocar_Fuego", "./public/assets/Tocar_Fuego_2.wav");
    }

    create() {
        if (window.firebaseDb) {
            this.db = window.firebaseDb;
        }

        const centroX = this.cameras.main.width / 2;
        const centroY = this.cameras.main.height / 2;

        this.fondoJuego = this.add.image(centroX, centroY, "fondoJuego").setOrigin(0.5).setDepth(0);
        this.menuBase = this.add.image(centroX, centroY, "Menu").setOrigin(0.5).setDepth(30);

        this.marcoMenus = this.add.image(centroX, centroY, "MarcoMenus").setOrigin(0.5).setDepth(30).setVisible(false);
        this.bombasticoLogo = this.add.image(centroX, centroY, "BombasticoLogo").setOrigin(0.5).setDepth(30).setVisible(false);

        const escenaMaestra = this.scene.get('EscenaMaestra');
        
        this.textosHighscore = [];
        // Inicializa TopExtractor con marcadores de posición para mostrar inmediatamente
        escenaMaestra.TopExtractor = [];
        for (let i = 0; i < 10; i++) {
            escenaMaestra.TopExtractor.push({ Empresa: "----", puntaje: 0 }); // Marcador de posición
        }

        escenaMaestra.TopExtractor.forEach((texto, index) => {
            const yPosition = 200 + index * 57.7;
            const empresaBaseX = 295;
            const puntajeBaseX = 490;

            let empresaPaddingText = this.add.text(empresaBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#1a5754'
            }).setOrigin(0.5).setDepth(30);

            let empresaValueText = this.add.text(empresaBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#42DED9'
            }).setOrigin(0.5).setDepth(30);

            let puntajePaddingText = this.add.text(puntajeBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#1a5754'
            }).setOrigin(0.5).setDepth(30);

            let puntajeValueText = this.add.text(puntajeBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#42DED9'
            }).setOrigin(0.5).setDepth(30);

            this.textosHighscore.push({
                empresaPadding: empresaPaddingText,
                empresaValue: empresaValueText,
                puntajePadding: puntajePaddingText,
                puntajeValue: puntajeValueText
            });
        });
        
        this.actualizarDisplayHighscores(); // Actualiza la visualización de las puntuaciones altas con marcadores de posición inmediatamente

        // Carga las puntuaciones altas de Firebase en segundo plano
        this.cargarHighScoresDesdeFirebase().catch(error => {
            console.error("Error al cargar las puntuaciones altas al inicio:", error);
            // Opcionalmente, muestra un mensaje amigable al usuario sobre el error de carga
        });

        this.mensaje1 = this.add.image(centroX, centroY, "Mensaje").setOrigin(0.5).setDepth(30).setVisible(false);
        this.mensaje2 = this.add.image(centroX, centroY, "Mensaje_2").setOrigin(0.5).setDepth(30).setVisible(false);
        this.mensajeActual = 1;

        this.tituloMenuPrincipal = this.add.text(centroX + 30, centroY - 95, "BOMBA-MEN.EXE", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#42DED9'
        }).setDepth(30).setVisible(false);

        this.opcionesMenuPrincipal = [
            { texto: "INICIAR MECHA", funcion: this.iniciarMecha },
            { texto: "CONFIGURAR PROGRAMA", funcion: this.MenuConfiguracion },
            { texto: "CREDITOS DE CREACIÓN", funcion: this.MenuCreditos },
            { texto: "MENSAJES", funcion: this.MenuMensajes }
        ];

        this.textosMenuPrincipal = [];
        this.subrayadosMenuPrincipal = [];

        this.opcionesMenuPrincipal.forEach((opcion, index) => {
            const yPosition = 200 + index * 90;
            let texto = this.add.text(centroX + 365, yPosition + 450, opcion.texto, {
                fontSize: '34px',
                fontFamily: 'Impact',
                fill: '#1a5754'
            }).setOrigin(0.5).setDepth(30).setVisible(false);
            this.textosMenuPrincipal.push(texto);

            let subrayado = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
            subrayado.setDepth(31);
            subrayado.setVisible(false);
            this.subrayadosMenuPrincipal.push(subrayado);
        });
        this.indiceMenuPrincipal = this.add.image(centroX + 120, 0, "Indice").setOrigin(0.5).setDepth(30).setVisible(false);

        this.menuFinJuegoImagen = this.add.image(centroX, centroY, "MenuFin").setOrigin(0.5).setDepth(30).setVisible(false);

        this.ImagenRoca = this.add.image(centroX + 170 + 50, centroY - 198, "spritesTileset", 7 - 1).setOrigin(0.5).setScale(1.2).setDepth(30).setVisible(false);
        this.textoPuntajeFinal = this.add.text(centroX + 365 + 50, centroY - 198, `${this.puntajeTotal}`, {
            fontSize: '44px',
            fontFamily: 'Impact',
            fill: '#42DED9'
        }).setOrigin(0.5).setDepth(30).setVisible(false);

        this.Abecedario = [
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
            "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
        ];

        const startXLetras = centroX + 200;
        for (let i = 0; i < 4; i++) {
            let textoLetra = this.add.text(startXLetras + (i * 120), centroY + 100, this.letrasEmpresa[i], {
                fontSize: '110px',
                fontFamily: 'Impact',
                fill: '#42DED9'
            }).setOrigin(0.5).setDepth(30).setVisible(false);
            this.textoLetrasEmpresa.push(textoLetra);
        }

        this.underlineLetra = this.add.graphics({ lineStyle: { width: 4, color: 0x42DED9 } });
        this.underlineLetra.setDepth(31);
        this.underlineLetra.setVisible(false);


        this.teclas = this.input.keyboard.createCursorKeys();
        this.teclasPersonalizadas = this.input.keyboard.addKeys({
            "W": Phaser.Input.Keyboard.KeyCodes.W,
            "A": Phaser.Input.Keyboard.KeyCodes.A,
            "S": Phaser.Input.Keyboard.KeyCodes.S,
            "D": Phaser.Input.Keyboard.KeyCodes.D,
            "ESPACIO": Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.blackOverlay = this.add.graphics({ fillStyle: { color: 0x000000 } });
        this.blackOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.blackOverlay.setDepth(100);
        this.blackOverlay.setVisible(false);

        this.whiteOverlay = this.add.graphics({ fillStyle: { color: 0xFFFFFF } });
        this.whiteOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.whiteOverlay.setDepth(100);
        this.whiteOverlay.setBlendMode(Phaser.BlendModes.ADD);
        this.whiteOverlay.setVisible(false);

        this.aplicarBrillo();

        this.TextoPantallaCompleta = this.add.text(centroX + 100, centroY + 280  - 52, "PANTALLA COMPLETA: ", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#1a5754'
        }).setDepth(30).setVisible(false);

        // Inicializar los objetos de sonido
        this.sounds.buyXray = this.sound.add("Comprar_Rayos_x");
        this.sounds.menuEnterExit = this.sound.add("Entrar-Salir-Menu");
        this.sounds.falseExplosion = this.sound.add("ExplosionFalsa");
        this.sounds.explode_2 = this.sound.add("Explotar_2");
        this.sounds.explode = this.sound.add("Explotar");
        this.sounds.extendRope = this.sound.add("Extender_Cuerda");
        this.sounds.menuMove = this.sound.add("Moverse_Menu");
        this.sounds.gameplayMusic = this.sound.add("Musica_Gameplay");
        this.sounds.menuLoopMusic = this.sound.add("Musica-Menu");
        this.sounds.touchFire = this.sound.add("Tocar_Fuego");

        // Reproducir la música del menú en bucle
        // Añadir una verificación para asegurar que el objeto de sonido existe antes de intentar reproducirlo
        if (this.sounds.menuLoopMusic && !this.sounds.menuLoopMusic.isPlaying) {
            this.sounds.menuLoopMusic.play({ loop: true, volume: this.volumenConfiguracion });
        }


        if (this.finDelJuego) {
            this.MenuFinDelJuego();
        } else {
            this.MenuMensajes();
        }
    }

    update() {
        // Actualizar el volumen de la música de bucle del menú
        if (this.sounds.menuLoopMusic && this.sounds.menuLoopMusic.isPlaying) {
            this.sounds.menuLoopMusic.setVolume(this.volumenConfiguracion);
        }

        if (this.estadoActualMenu === 'principal') {
            if (Phaser.Input.Keyboard.JustDown(this.teclas.down) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.S)) {
                this.opcionSeleccionada = (this.opcionSeleccionada + 1) % this.opcionesMenuPrincipal.length;
                this.actualizarSeleccionMenuPrincipal();
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.up) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.W)) {
                this.opcionSeleccionada = (this.opcionSeleccionada - 1 + this.opcionesMenuPrincipal.length) % this.opcionesMenuPrincipal.length;
                this.actualizarSeleccionMenuPrincipal();
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.opcionesMenuPrincipal[this.opcionSeleccionada].funcion.call(this);
                this.playMenuSound(this.sounds.menuEnterExit);
            }
        }
        else if (this.estadoActualMenu === 'mensajes') {
            if (Phaser.Input.Keyboard.JustDown(this.teclas.right) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.D)) {
                this.mostrarMensaje(2);
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.left) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.A)) {
                this.mostrarMensaje(1);
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.MenuGeneral();
                this.playMenuSound(this.sounds.menuEnterExit);
            }
        }
        else if (this.estadoActualMenu === 'configuracion') {
            if (Phaser.Input.Keyboard.JustDown(this.teclas.down) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.S)) {
                this.opcionConfiguracionSeleccionada = (this.opcionConfiguracionSeleccionada + 1) % 3;
                this.actualizarSeleccionConfiguracion();
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.up) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.W)) {
                this.opcionConfiguracionSeleccionada = (this.opcionConfiguracionSeleccionada - 1 + 3) % 3;
                this.actualizarSeleccionConfiguracion();
                this.playMenuSound(this.sounds.menuMove);
            } else if (this.opcionConfiguracionSeleccionada === 0 && (this.teclas.right.isDown || this.teclasPersonalizadas.D.isDown)) {
                this.volumenConfiguracion = Phaser.Math.Clamp(this.volumenConfiguracion + 0.01, 0, 2);
                this.actualizarSlidersConfiguracion();
            } else if (this.opcionConfiguracionSeleccionada === 0 && (this.teclas.left.isDown || this.teclasPersonalizadas.A.isDown)) {
                this.volumenConfiguracion = Phaser.Math.Clamp(this.volumenConfiguracion - 0.01, 0, 2);
                this.actualizarSlidersConfiguracion();
            } else if (this.opcionConfiguracionSeleccionada === 1 && (this.teclas.right.isDown || this.teclasPersonalizadas.D.isDown)) {
                this.brilloConfiguracion = Phaser.Math.Clamp(this.brilloConfiguracion + 0.01, 0, 2);
                this.actualizarSlidersConfiguracion();
                this.aplicarBrillo();
            } else if (this.opcionConfiguracionSeleccionada === 1 && (this.teclas.left.isDown || this.teclasPersonalizadas.A.isDown)) {
                this.brilloConfiguracion = Phaser.Math.Clamp(this.brilloConfiguracion - 0.01, 0, 2);
                this.actualizarSlidersConfiguracion();
                this.aplicarBrillo();
            } else if (this.opcionConfiguracionSeleccionada === 2 && (Phaser.Input.Keyboard.JustDown(this.teclas.left) || Phaser.Input.Keyboard.JustDown(this.teclas.right) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.A) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.D))) {
                this.sys.game.scale.toggleFullscreen();
                this.playMenuSound(this.sounds.menuEnterExit);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.MenuGeneral();
                this.playMenuSound(this.sounds.menuEnterExit);
            }
        }
        else if (this.estadoActualMenu === 'creditos') {
            if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.MenuGeneral();
                this.playMenuSound(this.sounds.menuEnterExit);
            }
        }
        else if (this.estadoActualMenu === 'ingresoHighScore') {
            if (Phaser.Input.Keyboard.JustDown(this.teclas.right) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.D)) {
                this.indiceLetraSeleccionada = (this.indiceLetraSeleccionada + 1) % this.letrasEmpresa.length;
                this.actualizarSeleccionLetra();
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.left) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.A)) {
                this.indiceLetraSeleccionada = (this.indiceLetraSeleccionada - 1 + this.letrasEmpresa.length) % this.letrasEmpresa.length;
                this.actualizarSeleccionLetra();
                this.playMenuSound(this.sounds.menuMove);
            }
            else if (Phaser.Input.Keyboard.JustDown(this.teclas.up) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.W)) {
                this.cambiarLetra(1);
                this.playMenuSound(this.sounds.menuMove);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.down) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.S)) {
                this.cambiarLetra(-1);
                this.playMenuSound(this.sounds.menuMove);
            }
            else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.guardarHighScore();
                this.playMenuSound(this.sounds.menuEnterExit);
            }
        }
    }

    // Función auxiliar para reproducir sonidos con el volumen configurado
    playMenuSound(sound) {
        // Asegurarse de que el objeto de sonido existe antes de intentar reproducirlo
        if (sound) {
            sound.play({ volume: this.volumenConfiguracion });
        }
    }

    ocultarTodosLosMenus() {
        this.mensaje1.setVisible(false);
        this.mensaje2.setVisible(false);
        this.marcoMenus.setVisible(false);
        this.bombasticoLogo.setVisible(false);
        this.tituloMenuPrincipal.setVisible(false);
        this.textosMenuPrincipal.forEach(text => text.setVisible(false));
        this.indiceMenuPrincipal.setVisible(false);
        this.menuFinJuegoImagen.setVisible(false);
        this.textoPuntajeFinal.setVisible(false);
        this.ImagenRoca.setVisible(false);
        this.subrayadosMenuPrincipal.forEach(subrayado => subrayado.setVisible(false));

        this.textoLetrasEmpresa.forEach(text => text.setVisible(false));
        if (this.underlineLetra) {
            this.underlineLetra.setVisible(false);
        }

        if (this.configuracionTitulo) {
            this.configuracionTitulo.destroy();
            this.configuracionTitulo = null;
        }
        if (this.creditosTitulo) {
            this.creditosTitulo.destroy();
            this.creditosTitulo = null;
        }
        if (this.creadorTexto) {
            this.creadorTexto.destroy();
            this.creadorTexto = null;
        }
        if (this.logoCreador) {
            this.logoCreador.destroy();
            this.logoCreador = null;
        }

        if (this.indiceConfiguracion) {
            this.indiceConfiguracion.setVisible(false);
        }
        if (this.TextoVolumenSonidos) {
            this.TextoVolumenSonidos.setVisible(false);
        }
        if (this.TextoBrillo) {
            this.TextoBrillo.setVisible(false);
        }
        if (this.TextoPantallaCompleta) {
            this.TextoPantallaCompleta.setVisible(false);
        }
        if (this.GraficoLineaVolumen) {
            this.GraficoLineaVolumen.setVisible(false);
        }
        if (this.GraficoLineaBrillo) {
            this.GraficoLineaBrillo.setVisible(false);
        }
        if (this.SliderVolumen) {
            this.SliderVolumen.setVisible(false);
        }
        if (this.SliderBrillo) {
            this.SliderBrillo.setVisible(false);
        }
        this.subrayadosConfiguracion.forEach(subrayado => subrayado.setVisible(false));
    }

    mostrarMarcoYLogo(visible) {
        this.marcoMenus.setVisible(visible);
        this.bombasticoLogo.setVisible(visible);
    }

    MenuMensajes() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(false);
        this.estadoActualMenu = 'mensajes';
        this.mensajeActual = 1;
        this.mostrarMensaje(this.mensajeActual);

        this.blackOverlay.setVisible(true);
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo();
    }

    mostrarMensaje(numeroMensaje) {
        this.mensaje1.setVisible(false);
        this.mensaje2.setVisible(false);
        if (numeroMensaje === 1) {
            this.mensaje1.setVisible(true);
            this.mensajeActual = 1;
        } else if (numeroMensaje === 2) {
            this.mensaje2.setVisible(true);
            this.mensajeActual = 2;
        }
    }

    MenuGeneral() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(true);
        this.estadoActualMenu = 'principal';
        this.tituloMenuPrincipal.setVisible(true);
        this.textosMenuPrincipal.forEach(text => text.setVisible(true));
        this.indiceMenuPrincipal.setVisible(true);
        this.opcionSeleccionada = 0;
        this.actualizarSeleccionMenuPrincipal();
        // Recarga las puntuaciones altas de Firebase al regresar al menú principal
        this.cargarHighScoresDesdeFirebase().catch(error => {
            console.error("Error al cargar las puntuaciones altas en MenuGeneral:", error);
            // Opcionalmente, muestra un mensaje amigable
        });

        this.blackOverlay.setVisible(true);
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo();
    }

    actualizarSeleccionMenuPrincipal() {
        this.opcionesMenuPrincipal.forEach((opcion, index) => {
            const textoObjeto = this.textosMenuPrincipal[index];
            const subrayadoObjeto = this.subrayadosMenuPrincipal[index];

            if (index === this.opcionSeleccionada) {
                textoObjeto.setFill('#42DED9');
                subrayadoObjeto.clear();
                subrayadoObjeto.lineStyle(2, 0x42DED9);
                subrayadoObjeto.beginPath();
                subrayadoObjeto.moveTo(textoObjeto.x - textoObjeto.width / 2, textoObjeto.y + textoObjeto.height / 2 + 5);
                subrayadoObjeto.lineTo(textoObjeto.x + textoObjeto.width / 2, textoObjeto.y + textoObjeto.height / 2 + 5);
                subrayadoObjeto.strokePath();
                subrayadoObjeto.setVisible(true);

                this.indiceMenuPrincipal.y = textoObjeto.y;
            } else {
                textoObjeto.setFill('#1a5754');
                subrayadoObjeto.setVisible(false);
            }
        });
    }

    iniciarMecha() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(false);
        this.blackOverlay.setVisible(false);
        this.whiteOverlay.setVisible(false);
        this.scene.stop("Menus");
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.lanzarGameplay();
        // Detener la música del menú al iniciar el gameplay
        if (this.sounds.menuLoopMusic && this.sounds.menuLoopMusic.isPlaying) {
            this.sounds.menuLoopMusic.stop();
        }
        // Reproducir la música de gameplay
        // Asegurarse de que el objeto de sonido exista antes de intentar reproducirlo
        this.sound.stopAll();
        if (this.sounds.gameplayMusic) {
            this.sounds.gameplayMusic.play({ loop: true, volume: escenaMaestra.volumenConfiguracion });
        }
    }

    MenuConfiguracion() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(true);
        this.estadoActualMenu = 'configuracion';

        const centroX = this.cameras.main.width / 2;
        const centroY = this.cameras.main.height / 2;

        this.configuracionTitulo = this.add.text(centroX + 30, centroY - 95, "CONFIGURAR PROGRAMA", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#42DED9'
        }).setDepth(30);

        this.indiceConfiguracion = this.add.image(centroX + 55, 0, "Indice").setOrigin(0.5).setDepth(30);

        this.TextoVolumenSonidos = this.add.text(centroX + 100, centroY + 80 - 52, "VOLUMEN", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#1a5754'
        }).setDepth(30).setVisible(true);

        this.TextoBrillo = this.add.text(centroX + 100, centroY + 180 - 52, "BRILLO", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#1a5754'
        }).setDepth(30).setVisible(true);

        if (this.TextoPantallaCompleta) {
            this.TextoPantallaCompleta.setVisible(true);
        }

        this.GraficoLineaVolumen = this.add.graphics();
        this.GraficoLineaVolumen.fillStyle(0x42ded9, 1);
        this.GraficoLineaVolumen.fillRect(centroX + 280, centroY + 90  - 52, 350, 20);
        this.GraficoLineaVolumen.setDepth(30).setVisible(true);

        this.GraficoLineaBrillo = this.add.graphics();
        this.GraficoLineaBrillo.fillStyle(0x42ded9, 1);
        this.GraficoLineaBrillo.fillRect(centroX + 280, centroY + 190 - 52, 350, 20);
        this.GraficoLineaBrillo.setDepth(30).setVisible(true);

        this.SliderVolumen = this.add.image(0, centroY + 90 + 10 - 52, "ValorSlider").setDepth(31).setVisible(true);
        this.SliderBrillo = this.add.image(0, centroY + 190 + 10 - 52, "ValorSlider").setDepth(31).setVisible(true);

        let subrayadoVolumen = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
        subrayadoVolumen.setDepth(31);
        this.subrayadosConfiguracion.push(subrayadoVolumen);

        let subrayadoBrillo = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
        subrayadoBrillo.setDepth(31);
        this.subrayadosConfiguracion.push(subrayadoBrillo);

        let subrayadoPantallaCompleta = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
        subrayadoPantallaCompleta.setDepth(31);
        this.subrayadosConfiguracion.push(subrayadoPantallaCompleta);

        this.opcionConfiguracionSeleccionada = 0;
        this.actualizarSeleccionConfiguracion();
        this.actualizarSlidersConfiguracion();
        this.actualizarDisplayPantallaCompleta();

        this.blackOverlay.setVisible(true);
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo();
    }

    actualizarSeleccionConfiguracion() {
        const opciones = [this.TextoVolumenSonidos, this.TextoBrillo, this.TextoPantallaCompleta];
        const centroX = this.cameras.main.width / 2;

        opciones.forEach((textoObjeto, index) => {
            const subrayadoObjeto = this.subrayadosConfiguracion[index];

            if (index === this.opcionConfiguracionSeleccionada) {
                textoObjeto.setFill('#42DED9');
                subrayadoObjeto.clear();
                subrayadoObjeto.lineStyle(2, 0x42DED9);
                subrayadoObjeto.beginPath();
                subrayadoObjeto.moveTo(textoObjeto.x, textoObjeto.y + textoObjeto.height + 5);
                subrayadoObjeto.lineTo(textoObjeto.x + textoObjeto.width, textoObjeto.y + textoObjeto.height + 5);
                subrayadoObjeto.strokePath();
                subrayadoObjeto.setVisible(true);
                
                this.indiceConfiguracion.y = textoObjeto.y + 20;
                this.indiceConfiguracion.x = centroX + 55;
            } else {
                textoObjeto.setFill('#1a5754');
                subrayadoObjeto.setVisible(false);
            }
        });
    }

    actualizarSlidersConfiguracion() {
        const centroX = this.cameras.main.width / 2;
        const anchoBarra = 350;

        const xVolumen = (centroX + 280) + (this.volumenConfiguracion / 2) * anchoBarra;
        this.SliderVolumen.x = xVolumen;
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.volumenConfiguracion = this.volumenConfiguracion;

        const xBrillo = (centroX + 280) + (this.brilloConfiguracion / 2) * anchoBarra;
        this.SliderBrillo.x = xBrillo;
        escenaMaestra.brilloConfiguracion = this.brilloConfiguracion;
    }

    onFullscreenChange() {
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.pantallaCompletaConfiguracion = this.sys.game.scale.isFullscreen;
        this.actualizarDisplayPantallaCompleta();
    }

    actualizarDisplayPantallaCompleta() {
        const escenaMaestra = this.scene.get('EscenaMaestra');
        const estado = escenaMaestra.pantallaCompletaConfiguracion ? "SI" : "NO";
        this.TextoPantallaCompleta.setText(`PANTALLA COMPLETA: ${estado}`);
    }

    aplicarBrillo() {
        if (this.brilloConfiguracion <= 1) {
            const opacidadBlack = 1 - this.brilloConfiguracion;
            this.blackOverlay.setAlpha(opacidadBlack);
            this.blackOverlay.setVisible(opacidadBlack > 0);
            this.whiteOverlay.setAlpha(0);
            this.whiteOverlay.setVisible(false);
        }
        else {
            const opacidadWhite = this.brilloConfiguracion - 1;
            this.whiteOverlay.setAlpha(opacidadWhite);
            this.whiteOverlay.setVisible(opacidadWhite > 0);
            this.blackOverlay.setAlpha(0);
            this.blackOverlay.setVisible(false);
        }
    }

    MenuCreditos() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(true);
        this.estadoActualMenu = 'creditos';

        const centroX = this.cameras.main.width / 2;
        const centroY = this.cameras.main.height / 2;

        this.creditosTitulo = this.add.text(centroX + 30, centroY - 95, "CREDITOS DE CREACIÓN", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#42DED9'
        }).setDepth(30);

        this.creadorTexto = this.add.text(centroX + 365, centroY + 50, "CREADO POR EMANUEL DAYER", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#42DED9'
        }).setOrigin(0.5).setDepth(30);

        this.logoCreador = this.add.image(centroX + 365, centroY + 200, "LogoCreador").setOrigin(0.5).setDepth(30);

        this.blackOverlay.setVisible(true);
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo();
    }

    MenuFinDelJuego() {
        this.ocultarTodosLosMenus();
        this.estadoActualMenu = 'ingresoHighScore';
        this.menuFinJuegoImagen.setVisible(true);
        this.textoPuntajeFinal.setText(`${this.puntajeTotal}`.padStart(10, "0")).setVisible(true);
        this.ImagenRoca.setVisible(true);

        this.textoLetrasEmpresa.forEach((text, index) => {
            text.setText(this.letrasEmpresa[index]);
            text.setVisible(true);
        });

        this.indiceLetraSeleccionada = 0;
        this.actualizarSeleccionLetra();

        this.blackOverlay.setVisible(true);
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo();
    }

    actualizarSeleccionLetra() {
        this.underlineLetra.clear();
        if (this.textoLetrasEmpresa[this.indiceLetraSeleccionada]) {
            const textoObj = this.textoLetrasEmpresa[this.indiceLetraSeleccionada];
            this.underlineLetra.lineStyle(4, 0x42DED9);
            this.underlineLetra.beginPath();
            this.underlineLetra.moveTo(textoObj.x - textoObj.width / 2, textoObj.y + textoObj.height / 2 + 5);
            this.underlineLetra.lineTo(textoObj.x + textoObj.width / 2, textoObj.y + textoObj.height / 2 + 5);
            this.underlineLetra.strokePath();
            this.underlineLetra.setVisible(true);
        }
    }

    cambiarLetra(direccion) {
        const currentLetter = this.letrasEmpresa[this.indiceLetraSeleccionada];
        const currentLetterIndexInAbecedario = this.Abecedario.indexOf(currentLetter);
        let newIndex = currentLetterIndexInAbecedario + direccion;

        if (newIndex < 0) {
            newIndex = this.Abecedario.length - 1;
        } else if (newIndex >= this.Abecedario.length) {
            newIndex = 0;
        }

        this.letrasEmpresa[this.indiceLetraSeleccionada] = this.Abecedario[newIndex];
        this.textoLetrasEmpresa[this.indiceLetraSeleccionada].setText(this.letrasEmpresa[this.indiceLetraSeleccionada]);
    }

    async guardarHighScore() {
        const nombreEmpresa = this.letrasEmpresa.join('');
        const nuevoPuntaje = this.puntajeTotal;

        const escenaMaestra = this.scene.get('EscenaMaestra');
        let insertedLocally = false;

        // Verifica si la puntuación califica para la lista actual de TopExtractor
        // Esto hace que la interfaz de usuario se actualice inmediatamente.
        for (let i = 0; i < escenaMaestra.TopExtractor.length; i++) {
            if (nuevoPuntaje > escenaMaestra.TopExtractor[i].puntaje || (nuevoPuntaje === 0 && escenaMaestra.TopExtractor[i].puntaje === 0 && escenaMaestra.TopExtractor[i].Empresa === "----")) {
                // Inserta la nueva puntuación y desplaza las existentes hacia abajo
                for (let j = escenaMaestra.TopExtractor.length - 1; j > i; j--) {
                    escenaMaestra.TopExtractor[j] = { ...escenaMaestra.TopExtractor[j - 1] }; // Copia profunda
                }
                escenaMaestra.TopExtractor[i] = { Empresa: nombreEmpresa, puntaje: nuevoPuntaje };
                insertedLocally = true;
                break;
            }
        }
        
        // Actualiza la interfaz de usuario inmediatamente con las nuevas puntuaciones altas locales
        this.actualizarDisplayHighscores();

        // Transiciona al menú principal inmediatamente
        this.MenuGeneral();

        // Si la puntuación fue insertada localmente (lo que significa que califica), envíala a Firebase en segundo plano
        if (insertedLocally) {
            try {
                await this.enviarHighScoreAFirebase(nombreEmpresa, nuevoPuntaje);
                // Después de un envío exitoso, actualiza la lista desde Firebase para asegurar la consistencia
                // Esto maneja casos en los que varios clientes envían puntuaciones.
                await this.cargarHighScoresDesdeFirebase();
            } catch (error) {
                console.error("Error al enviar o actualizar las puntuaciones altas:", error);
                // Potencialmente, notifica al usuario que la puntuación no pudo guardarse en línea
            }
        } else {
            console.log("La puntuación no calificó para la lista de puntuaciones altas, no se envía a Firebase.");
        }
    }

    actualizarDisplayHighscores() {
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.TopExtractor.forEach((data, index) => {
            const entryTextObjs = this.textosHighscore[index];

            const empresaData = data.Empresa;
            const empresaTotalLength = 4;
            const empresaPaddingChar = (empresaData === "----") ? '-' : ' '; 
            const empresaPaddingLength = empresaTotalLength - empresaData.length;
            const empresaPaddingString = empresaPaddingChar.repeat(Math.max(0, empresaPaddingLength));

            entryTextObjs.empresaPadding.setText(empresaPaddingString);
            entryTextObjs.empresaValue.setText(empresaData);

            const empresaPaddingWidth = entryTextObjs.empresaPadding.width;
            const empresaValueWidth = entryTextObjs.empresaValue.width;
            const totalEmpresaWidth = empresaPaddingWidth + empresaValueWidth;

            const empresaBaseX = 295;
            entryTextObjs.empresaPadding.x = empresaBaseX - (totalEmpresaWidth / 2) + (empresaPaddingWidth / 2);
            entryTextObjs.empresaValue.x = empresaBaseX - (totalEmpresaWidth / 2) + empresaPaddingWidth + (empresaValueWidth / 2);

            const puntajeData = `${data.puntaje}`;
            const puntajeTotalLength = 10;
            const puntajePaddingLength = puntajeTotalLength - puntajeData.length;
            const puntajePaddingString = '0'.repeat(Math.max(0, puntajePaddingLength));

            entryTextObjs.puntajePadding.setText(puntajePaddingString);
            entryTextObjs.puntajeValue.setText(puntajeData);

            const puntajeBaseX = 490;
            const puntajePaddingWidth = entryTextObjs.puntajePadding.width;
            const puntajeValueWidth = entryTextObjs.puntajeValue.width;
            const totalPuntajeWidth = puntajePaddingWidth + puntajeValueWidth;

            entryTextObjs.puntajePadding.x = puntajeBaseX - (totalPuntajeWidth / 2) + (puntajePaddingWidth / 2);
            entryTextObjs.puntajeValue.x = puntajeBaseX - (totalPuntajeWidth / 2) + puntajePaddingWidth + (puntajeValueWidth / 2);

            entryTextObjs.empresaPadding.setVisible(true);
            entryTextObjs.empresaValue.setVisible(true);
            entryTextObjs.puntajePadding.setVisible(true);
            entryTextObjs.puntajeValue.setVisible(true);
        });
    }

    async cargarHighScoresDesdeFirebase() {
        if (!this.db) {
            console.warn("Firestore DB no inicializada. No se pueden cargar las puntuaciones altas.");
            return Promise.reject(new Error("Firestore DB no inicializada."));
        }

        const highscoresRef = this.db.collection("highscores");
        const q = highscoresRef.orderBy("score", "desc").limit(10);

        try {
            const querySnapshot = await q.get();
            const loadedScores = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                loadedScores.push({
                    Empresa: data.playerName,
                    puntaje: data.score
                });
            });

            const escenaMaestra = this.scene.get('EscenaMaestra');
            while (loadedScores.length < 10) {
                loadedScores.push({ Empresa: "----", puntaje: 0 });
            }
            escenaMaestra.TopExtractor = loadedScores;
            this.actualizarDisplayHighscores();
            return loadedScores;
        } catch (error) {
            console.error("Error al cargar las puntuaciones altas desde Firebase:", error);
            // Vuelve a lanzar o rechaza para propagar el error para un manejo externo si es necesario
            return Promise.reject(error);
        }
    }

    async enviarHighScoreAFirebase(playerName, score) {
        if (!this.db) {
            console.warn("Firestore DB no inicializada. No se puede enviar la puntuación alta.");
            return Promise.reject(new Error("Firestore DB no inicializada."));
        }

        try {
            await this.db.collection("highscores").add({
                playerName: playerName,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Puntuación alta enviada exitosamente a Firebase.");

            // --- LÓGICA PARA MANTENER EL TOP 10 ---
            const highscoresRef = this.db.collection("highscores");
            // Obtener todas las puntuaciones ordenadas por score de forma ascendente
            const snapshot = await highscoresRef.orderBy("score", "asc").get(); 

            if (snapshot.size > 10) {
                // Calcular cuántos documentos eliminar para que queden exactamente 10
                const numToDelete = snapshot.size - 10;
                console.log(`Eliminando ${numToDelete} puntuaciones más bajas.`);
                const batch = this.db.batch();
                // Iterar sobre los documentos a eliminar (los primeros 'numToDelete' en el snapshot ascendente)
                for (let i = 0; i < numToDelete; i++) {
                    batch.delete(snapshot.docs[i].ref);
                }
                await batch.commit();
                console.log("Puntuaciones más bajas eliminadas exitosamente.");
            }
            // --- FIN LÓGICA ---

            return true;
        } catch (error) {
            console.error("Error al enviar la puntuación alta a Firebase:", error);
            return Promise.reject(error);
        }
    }
}
