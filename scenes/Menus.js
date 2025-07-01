export default class Menus extends Phaser.Scene {
    constructor() {
        super("Menus");
    }

    init(data) {
        // Variables de estado del menú
        this.estadoActualMenu = ''; // 'mensajes', 'principal', 'configuracion', 'creditos', 'finDeJuego', 'ingresoHighScore'
        this.opcionSeleccionada = 0; // Índice de la opción seleccionada en el menú principal

        // Obtener los valores de configuración de EscenaMaestra
        const escenaMaestra = this.scene.get('EscenaMaestra');
        this.volumenConfiguracion = escenaMaestra.volumenConfiguracion;
        this.brilloConfiguracion = escenaMaestra.brilloConfiguracion;
        // La variable de pantallaCompletaConfiguracion se obtiene directamente de EscenaMaestra
        this.pantallaCompletaConfiguracion = escenaMaestra.pantallaCompletaConfiguracion; 

        // Datos pasados desde EscenaMaestra
        this.cantidadOro = data?.cantidadOro ?? 0;
        this.puntajeTotal = data?.puntajeTotal ?? 0;
        this.longitudMecha = data?.longitudMecha ?? 100;
        this.finDelJuego = data?.finDelJuego ?? false; // Nuevo: si el juego terminó o no

        // Propiedades para almacenar referencias a elementos de submenús temporales
        this.configuracionTitulo = null;
        this.creditosTitulo = null;
        this.creadorTexto = null;
        this.logoCreador = null;

        // Elementos específicos del menú de configuración
        this.indiceConfiguracion = null;
        this.TextoVolumenSonidos = null;
        this.TextoBrillo = null;
        // this.TextoPantallaCompleta se inicializará en create() para persistir
        this.GraficoLineaVolumen = null;
        this.GraficoLineaBrillo = null;
        this.SliderVolumen = null;
        this.SliderBrillo = null;
        this.subrayadosConfiguracion = [];
        this.opcionConfiguracionSeleccionada = 0;

        this.blackOverlay = null; // Overlay para oscurecer
        this.whiteOverlay = null; // Overlay para aclarar

        // Variables para el ingreso de high score
        this.indiceLetraSeleccionada = 0; // 0 to 3 for the four letters
        this.letrasEmpresa = ["A", "A", "A", "A"]; // Array to store the selected letters
        this.textoLetrasEmpresa = []; // Array to store Phaser text objects for the letters
        this.underlineLetra = null; // Graphic for the letter underline

        // Listener para cambios de pantalla completa desde el navegador
        // Estos listeners se adjuntan una vez y persisten con la escena.
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
        this.load.image("MenuFin", "./public/assets/PantallaFin.svg"); // Imagen para el menú de fin de juego
        this.load.image("ValorSlider", "./public/assets/ValorSlider.svg"); // Imagen para el slider
    }

    create() {
        // Calcula el centro de la cámara para posicionar elementos de fondo.
        const centroX = this.cameras.main.width / 2;
        const centroY = this.cameras.main.height / 2;

        // --- Elementos de UI y Fondo (siempre visibles o base) ---
        this.fondoJuego = this.add.image(centroX, centroY, "fondoJuego").setOrigin(0.5).setDepth(0);
        this.menuBase = this.add.image(centroX, centroY, "Menu").setOrigin(0.5).setDepth(30);

        // --- Marcos y Logo (visibles en la mayoría de los menús excepto mensajes y pantalla final) ---
        this.marcoMenus = this.add.image(centroX, centroY, "MarcoMenus").setOrigin(0.5).setDepth(30).setVisible(false);
        this.bombasticoLogo = this.add.image(centroX, centroY, "BombasticoLogo").setOrigin(0.5).setDepth(30).setVisible(false);

        // --- Texto de high scores (siempre visibles) ---
        // Obtener TopExtractor de EscenaMaestra
        const escenaMaestra = this.scene.get('EscenaMaestra');
        this.TopExtractor = escenaMaestra.TopExtractor;

        this.textosHighscore = [];
        this.TopExtractor.forEach((texto, index) => {
            const yPosition = 200 + index * 57.7;
            const empresaBaseX = 295; // Centro X para el texto combinado de Empresa
            const puntajeBaseX = 490; // Centro X para el texto combinado de Puntaje

            // Objetos de texto para Empresa (relleno y valor)
            let empresaPaddingText = this.add.text(empresaBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#1a5754' // Color para el relleno (no seleccionado)
            }).setOrigin(0.5).setDepth(30);

            let empresaValueText = this.add.text(empresaBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#42DED9' // Color para el valor (normal)
            }).setOrigin(0.5).setDepth(30);

            // Objetos de texto para Puntaje (relleno y valor)
            let puntajePaddingText = this.add.text(puntajeBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#1a5754' // Color para el relleno (no seleccionado)
            }).setOrigin(0.5).setDepth(30);

            let puntajeValueText = this.add.text(puntajeBaseX, yPosition + 335, '', {
                fontSize: '32px',
                fontFamily: 'Impact',
                fill: '#42DED9' // Color para el valor (normal)
            }).setOrigin(0.5).setDepth(30);

            this.textosHighscore.push({
                empresaPadding: empresaPaddingText,
                empresaValue: empresaValueText,
                puntajePadding: puntajePaddingText,
                puntajeValue: puntajeValueText
            });
        });
        
        this.actualizarDisplayHighscores()

        // --- Elementos del Menú de Mensajes ---
        this.mensaje1 = this.add.image(centroX, centroY, "Mensaje").setOrigin(0.5).setDepth(30).setVisible(false);
        this.mensaje2 = this.add.image(centroX, centroY, "Mensaje_2").setOrigin(0.5).setDepth(30).setVisible(false);
        this.mensajeActual = 1; // 1 para Mensaje, 2 para Mensaje_2

        // --- Elementos del Menú Principal ---
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
        this.subrayadosMenuPrincipal = []; // Nuevo array para los objetos Graphics del subrayado

        this.opcionesMenuPrincipal.forEach((opcion, index) => {
            const yPosition = 200 + index * 90;
            let texto = this.add.text(centroX + 365, yPosition + 450, opcion.texto, {
                fontSize: '34px',
                fontFamily: 'Impact',
                fill: '#1a5754' // Color por defecto
            }).setOrigin(0.5).setDepth(30).setVisible(false);
            this.textosMenuPrincipal.push(texto);

            // Crear el objeto Graphics para el subrayado
            let subrayado = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
            subrayado.setDepth(31); // Asegura que esté por encima del texto
            subrayado.setVisible(false); // Inicialmente oculto
            this.subrayadosMenuPrincipal.push(subrayado);
        });
        this.indiceMenuPrincipal = this.add.image(centroX + 120, 0, "Indice").setOrigin(0.5).setDepth(30).setVisible(false);

        // --- Elementos del Menú de Fin de Juego ---
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

        // Crear los 4 campos de letras para el nombre de la empresa
        const startXLetras = centroX + 200; // Ajusta el inicio para centrar las 4 letras
        for (let i = 0; i < 4; i++) {
            let textoLetra = this.add.text(startXLetras + (i * 120), centroY + 100, this.letrasEmpresa[i], {
                fontSize: '110px',
                fontFamily: 'Impact',
                fill: '#42DED9'
            }).setOrigin(0.5).setDepth(30).setVisible(false);
            this.textoLetrasEmpresa.push(textoLetra);
        }

        // Crear el subrayado para la letra seleccionada
        this.underlineLetra = this.add.graphics({ lineStyle: { width: 4, color: 0x42DED9 } });
        this.underlineLetra.setDepth(31);
        this.underlineLetra.setVisible(false);


        // --- Teclas de control ---
        this.teclas = this.input.keyboard.createCursorKeys();
        this.teclasPersonalizadas = this.input.keyboard.addKeys({
            "W": Phaser.Input.Keyboard.KeyCodes.W,
            "A": Phaser.Input.Keyboard.KeyCodes.A,
            "S": Phaser.Input.Keyboard.KeyCodes.S,
            "D": Phaser.Input.Keyboard.KeyCodes.D,
            "ESPACIO": Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Overlays de brillo (siempre presentes en la escena de Menus)
        this.blackOverlay = this.add.graphics({ fillStyle: { color: 0x000000 } });
        this.blackOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.blackOverlay.setDepth(100); // Asegurarse de que esté por encima de todo
        this.blackOverlay.setVisible(false); // Inicialmente oculto

        this.whiteOverlay = this.add.graphics({ fillStyle: { color: 0xFFFFFF } });
        this.whiteOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.whiteOverlay.setDepth(100); // Asegurarse de que esté por encima de todo
        this.whiteOverlay.setBlendMode(Phaser.BlendModes.ADD); // Modo de fusión para añadir luz
        this.whiteOverlay.setVisible(false);

        this.aplicarBrillo(); // Aplicar el brillo inicial

        // Inicializar TextoPantallaCompleta aquí para que persista
        this.TextoPantallaCompleta = this.add.text(centroX + 100, centroY + 280  - 52, "PANTALLA COMPLETA: ", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#1a5754' // Color por defecto
        }).setDepth(30).setVisible(false); // Inicialmente oculto


        // Iniciar el menú según el estado de finDelJuego
        if (this.finDelJuego) {
            this.MenuFinDelJuego();
        } else {
            this.MenuMensajes();
        }
    }

    update() {
        // Lógica de navegación para el menú principal
        if (this.estadoActualMenu === 'principal') {
            if (Phaser.Input.Keyboard.JustDown(this.teclas.down) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.S)) {
                this.opcionSeleccionada = (this.opcionSeleccionada + 1) % this.opcionesMenuPrincipal.length;
                this.actualizarSeleccionMenuPrincipal();
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.up) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.W)) {
                this.opcionSeleccionada = (this.opcionSeleccionada - 1 + this.opcionesMenuPrincipal.length) % this.opcionesMenuPrincipal.length;
                this.actualizarSeleccionMenuPrincipal();
            } else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.opcionesMenuPrincipal[this.opcionSeleccionada].funcion.call(this);
            }
        }
        // Lógica de navegación para el menú de mensajes
        else if (this.estadoActualMenu === 'mensajes') {
            if (Phaser.Input.Keyboard.JustDown(this.teclas.right) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.D)) {
                this.mostrarMensaje(2);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.left) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.A)) {
                this.mostrarMensaje(1);
            } else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) { // Volver al menú principal
                this.MenuGeneral();
            }
        }
        // Lógica de navegación para el menú de configuración
        else if (this.estadoActualMenu === 'configuracion') {
            // Cambio de JustDown a isDown para permitir mantener presionado
            if (Phaser.Input.Keyboard.JustDown(this.teclas.down) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.S)) {
                this.opcionConfiguracionSeleccionada = (this.opcionConfiguracionSeleccionada + 1) % 3; // 3 opciones: Volumen, Brillo, Pantalla Completa
                this.actualizarSeleccionConfiguracion();
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.up) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.W)) {
                this.opcionConfiguracionSeleccionada = (this.opcionConfiguracionSeleccionada - 1 + 3) % 3;
                this.actualizarSeleccionConfiguracion();
            } else if (this.opcionConfiguracionSeleccionada === 0 && (this.teclas.right.isDown || this.teclasPersonalizadas.D.isDown)) { // Volumen
                this.volumenConfiguracion = Phaser.Math.Clamp(this.volumenConfiguracion + 0.01, 0, 2); // Incremento
                this.actualizarSlidersConfiguracion();
            } else if (this.opcionConfiguracionSeleccionada === 0 && (this.teclas.left.isDown || this.teclasPersonalizadas.A.isDown)) { // Volumen
                this.volumenConfiguracion = Phaser.Math.Clamp(this.volumenConfiguracion - 0.01, 0, 2); // Decremento
                this.actualizarSlidersConfiguracion();
            } else if (this.opcionConfiguracionSeleccionada === 1 && (this.teclas.right.isDown || this.teclasPersonalizadas.D.isDown)) { // Brillo
                this.brilloConfiguracion = Phaser.Math.Clamp(this.brilloConfiguracion + 0.01, 0, 2); // Incremento
                this.actualizarSlidersConfiguracion();
                this.aplicarBrillo();
            } else if (this.opcionConfiguracionSeleccionada === 1 && (this.teclas.left.isDown || this.teclasPersonalizadas.A.isDown)) { // Brillo
                this.brilloConfiguracion = Phaser.Math.Clamp(this.brilloConfiguracion - 0.01, 0, 2); // Decremento
                this.actualizarSlidersConfiguracion();
                this.aplicarBrillo();
            } else if (this.opcionConfiguracionSeleccionada === 2 && (Phaser.Input.Keyboard.JustDown(this.teclas.left) || Phaser.Input.Keyboard.JustDown(this.teclas.right) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.A) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.D))) { // Pantalla Completa
                this.sys.game.scale.toggleFullscreen();
                // El evento 'enterfullscreen' o 'leavefullscreen' actualizará el estado en EscenaMaestra
                // y llamará a actualizarDisplayPantallaCompleta()
            } else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) { // Volver al menú principal
                this.MenuGeneral();
            }
        }
        // Lógica de navegación para el menú de créditos
        else if (this.estadoActualMenu === 'creditos') {
            if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) { // Volver al menú principal
                this.MenuGeneral();
            }
        }
        // Lógica de navegación para el menú de fin de juego (ingreso de high score)
        else if (this.estadoActualMenu === 'ingresoHighScore') {
            // Navegar entre letras (izquierda/derecha o A/D)
            if (Phaser.Input.Keyboard.JustDown(this.teclas.right) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.D)) {
                this.indiceLetraSeleccionada = (this.indiceLetraSeleccionada + 1) % this.letrasEmpresa.length;
                this.actualizarSeleccionLetra();
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.left) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.A)) {
                this.indiceLetraSeleccionada = (this.indiceLetraSeleccionada - 1 + this.letrasEmpresa.length) % this.letrasEmpresa.length;
                this.actualizarSeleccionLetra();
            }
            // Cambiar letra (arriba/abajo o W/S)
            else if (Phaser.Input.Keyboard.JustDown(this.teclas.up) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.W)) {
                this.cambiarLetra(1); // Incrementa la letra
            } else if (Phaser.Input.Keyboard.JustDown(this.teclas.down) || Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.S)) {
                this.cambiarLetra(-1); // Decrementa la letra
            }
            // Confirmar entrada (ESPACIO)
            else if (Phaser.Input.Keyboard.JustDown(this.teclasPersonalizadas.ESPACIO)) {
                this.guardarHighScore();
            }
        }
    }

    // --- Funciones de visibilidad ---
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
        this.subrayadosMenuPrincipal.forEach(subrayado => subrayado.setVisible(false)); // Ocultar todos los subrayados

        // Ocultar elementos de ingreso de high score
        this.textoLetrasEmpresa.forEach(text => text.setVisible(false));
        if (this.underlineLetra) {
            this.underlineLetra.setVisible(false);
        }

        // Ocultar y destruir elementos específicos de submenús
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

        // Ocultar elementos del menú de configuración (no destruir)
        if (this.indiceConfiguracion) {
            this.indiceConfiguracion.setVisible(false);
        }
        if (this.TextoVolumenSonidos) {
            this.TextoVolumenSonidos.setVisible(false);
        }
        if (this.TextoBrillo) {
            this.TextoBrillo.setVisible(false);
        }
        if (this.TextoPantallaCompleta) { // Ocultar texto de pantalla completa
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
        // No ocultar brilloOverlay aquí, se gestiona en cada función de menú y en EscenaGameplay
    }

    mostrarMarcoYLogo(visible) {
        this.marcoMenus.setVisible(visible);
        this.bombasticoLogo.setVisible(visible);
    }

    // --- Menú de Mensajes ---
    MenuMensajes() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(false); // Los mensajes no usan el marco y logo
        this.estadoActualMenu = 'mensajes';
        this.mensajeActual = 1; // Siempre iniciar en el mensaje 1
        this.mostrarMensaje(this.mensajeActual); // Muestra el mensaje actual al entrar

        this.blackOverlay.setVisible(true); // Asegurar que el overlay de brillo esté visible
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo(); // Aplicar el brillo
        //console.log("Entrando al Menú de Mensajes");
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

    // --- Menú Principal ---
    MenuGeneral() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(true);
        this.estadoActualMenu = 'principal';
        this.tituloMenuPrincipal.setVisible(true);
        this.textosMenuPrincipal.forEach(text => text.setVisible(true));
        this.indiceMenuPrincipal.setVisible(true);
        this.opcionSeleccionada = 0; // Reinicia la selección al entrar
        this.actualizarSeleccionMenuPrincipal();
        this.actualizarDisplayHighscores(); // Actualizar highscores al volver al menú principal

        this.blackOverlay.setVisible(true); // Asegurar que el overlay de brillo esté visible
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo(); // Aplicar el brillo
        //console.log("Entrando al Menú Principal");
    }

    actualizarSeleccionMenuPrincipal() {
        this.opcionesMenuPrincipal.forEach((opcion, index) => {
            const textoObjeto = this.textosMenuPrincipal[index];
            const subrayadoObjeto = this.subrayadosMenuPrincipal[index];

            if (index === this.opcionSeleccionada) {
                textoObjeto.setFill('#42DED9'); // Color de selección
                subrayadoObjeto.clear(); // Limpiar cualquier dibujo anterior
                // Dibujar la línea debajo del texto
                subrayadoObjeto.lineStyle(2, 0x42DED9); // Grosor 2, color del texto
                subrayadoObjeto.beginPath();
                // Coordenadas corregidas para el subrayado (considerando origin 0.5, 0.5 del texto)
                subrayadoObjeto.moveTo(textoObjeto.x - textoObjeto.width / 2, textoObjeto.y + textoObjeto.height / 2 + 5);
                subrayadoObjeto.lineTo(textoObjeto.x + textoObjeto.width / 2, textoObjeto.y + textoObjeto.height / 2 + 5);
                subrayadoObjeto.strokePath();
                subrayadoObjeto.setVisible(true); // Mostrar el subrayado

                // Posicionar el índice al lado del texto seleccionado
                this.indiceMenuPrincipal.y = textoObjeto.y;
            } else {
                textoObjeto.setFill('#1a5754'); // Color por defecto
                subrayadoObjeto.setVisible(false); // Ocultar el subrayado
            }
        });
    }

    // --- Funciones de las opciones del menú principal ---
    iniciarMecha() {
        //console.log("Iniciando Mecha (Lanzando EscenaGameplay)...");
        this.ocultarTodosLosMenus(); // Oculta los elementos de Menus
        this.mostrarMarcoYLogo(false); // Ocultar marco y logo al iniciar juego
        this.blackOverlay.setVisible(false); // Ocultar los overlays de brillo al ir a gameplay
        this.whiteOverlay.setVisible(false);
        this.scene.stop("Menus"); // Detener la escena de Menus
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.lanzarGameplay(); // Llama a la función en EscenaMaestra para lanzar Gameplay
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
        }).setDepth(30); // No agregar origen para que quede bien

        this.indiceConfiguracion = this.add.image(centroX + 55, 0, "Indice").setOrigin(0.5).setDepth(30);

        this.TextoVolumenSonidos = this.add.text(centroX + 100, centroY + 80 - 52, "VOLUMEN", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#1a5754' // Color por defecto
        }).setDepth(30).setVisible(true); // Asegurar visibilidad

        this.TextoBrillo = this.add.text(centroX + 100, centroY + 180 - 52, "BRILLO", {
            fontSize: '34px',
            fontFamily: 'Impact',
            fill: '#1a5754' // Color por defecto
        }).setDepth(30).setVisible(true); // Asegurar visibilidad

        // Asegurar que TextoPantallaCompleta sea visible al entrar al menú de configuración
        if (this.TextoPantallaCompleta) {
            this.TextoPantallaCompleta.setVisible(true);
        }

        // Crear los gráficos de línea para los sliders
        this.GraficoLineaVolumen = this.add.graphics();
        this.GraficoLineaVolumen.fillStyle(0x42ded9, 1);
        this.GraficoLineaVolumen.fillRect(centroX + 280, centroY + 90  - 52, 350, 20);
        this.GraficoLineaVolumen.setDepth(30).setVisible(true); // Asegurar visibilidad

        this.GraficoLineaBrillo = this.add.graphics();
        this.GraficoLineaBrillo.fillStyle(0x42ded9, 1);
        this.GraficoLineaBrillo.fillRect(centroX + 280, centroY + 190 - 52, 350, 20);
        this.GraficoLineaBrillo.setDepth(30).setVisible(true); // Asegurar visibilidad

        // Crear los sliders
        this.SliderVolumen = this.add.image(0, centroY + 90 + 10 - 52, "ValorSlider").setDepth(31).setVisible(true); // Asegurar visibilidad
        this.SliderBrillo = this.add.image(0, centroY + 190 + 10 - 52, "ValorSlider").setDepth(31).setVisible(true); // Asegurar visibilidad

        // Crear subrayados para las opciones de configuración
        // Los subrayados se manejan en actualizarSeleccionConfiguracion
        let subrayadoVolumen = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
        subrayadoVolumen.setDepth(31);
        this.subrayadosConfiguracion.push(subrayadoVolumen);

        let subrayadoBrillo = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
        subrayadoBrillo.setDepth(31);
        this.subrayadosConfiguracion.push(subrayadoBrillo);

        let subrayadoPantallaCompleta = this.add.graphics({ lineStyle: { width: 2, color: 0x42DED9 } });
        subrayadoPantallaCompleta.setDepth(31);
        this.subrayadosConfiguracion.push(subrayadoPantallaCompleta);


        this.opcionConfiguracionSeleccionada = 0; // Iniciar en Volumen
        this.actualizarSeleccionConfiguracion();
        this.actualizarSlidersConfiguracion(); // Posicionar sliders según valores guardados
        this.actualizarDisplayPantallaCompleta(); // Actualizar el texto de pantalla completa

        this.blackOverlay.setVisible(true); // Asegurar que los overlays de brillo estén visibles
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo(); // Aplicar el brillo
        //console.log("Entrando al CONFIGURAR PROGRAMA");
    }

    actualizarSeleccionConfiguracion() {
        const opciones = [this.TextoVolumenSonidos, this.TextoBrillo, this.TextoPantallaCompleta];
        const centroX = this.cameras.main.width / 2;

        opciones.forEach((textoObjeto, index) => {
            const subrayadoObjeto = this.subrayadosConfiguracion[index];

            if (index === this.opcionConfiguracionSeleccionada) {
                textoObjeto.setFill('#42DED9'); // Color de selección
                subrayadoObjeto.clear(); // Limpiar cualquier dibujo anterior
                // Dibujar la línea debajo del texto
                subrayadoObjeto.lineStyle(2, 0x42DED9); // Grosor 2, color del texto
                subrayadoObjeto.beginPath();
                // Coordenadas corregidas para el subrayado (considerando origin 0.5, 0.5 del texto)
                subrayadoObjeto.moveTo(textoObjeto.x, textoObjeto.y + textoObjeto.height + 5);
                subrayadoObjeto.lineTo(textoObjeto.x + textoObjeto.width, textoObjeto.y + textoObjeto.height + 5);
                subrayadoObjeto.strokePath();
                subrayadoObjeto.setVisible(true);

                // Posicionar el índice al lado del texto seleccionadoddd
                this.indiceConfiguracion.y = textoObjeto.y + 20; // La Y del objeto de texto es su centro Y
                this.indiceConfiguracion.x = centroX + 55; // Asegurar la posición X del índice
            } else {
                textoObjeto.setFill('#1a5754'); // Color por defecto
                subrayadoObjeto.setVisible(false);
            }
        });
    }

    actualizarSlidersConfiguracion() {
        const centroX = this.cameras.main.width / 2;
        const anchoBarra = 350; // Ancho de la barra del slider

        // Actualizar Slider de Volumen
        // El slider se mueve de 0 a 350px. El valor va de 0 a 2.
        // Posición inicial de la barra: centroX + 280
        const xVolumen = (centroX + 280) + (this.volumenConfiguracion / 2) * anchoBarra;
        this.SliderVolumen.x = xVolumen;
        // Guardar en EscenaMaestra
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.volumenConfiguracion = this.volumenConfiguracion;
        //console.log(`Volumen: ${this.volumenConfiguracion.toFixed(2)}`);

        // Actualizar Slider de Brillo
        const xBrillo = (centroX + 280) + (this.brilloConfiguracion / 2) * anchoBarra;
        this.SliderBrillo.x = xBrillo;
        // Guardar en EscenaMaestra
        escenaMaestra.brilloConfiguracion = this.brilloConfiguracion;
        //console.log(`Brillo: ${this.brilloConfiguracion.toFixed(2)}`);
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
        // Brillo de 0 a 1 (oscurecer con overlay negro)
        if (this.brilloConfiguracion <= 1) {
            const opacidadBlack = 1 - this.brilloConfiguracion; // 1 (0% brillo) a 0 (100% brillo)
            this.blackOverlay.setAlpha(opacidadBlack);
            this.blackOverlay.setVisible(opacidadBlack > 0);
            this.whiteOverlay.setAlpha(0); // Asegurarse de que el blanco esté oculto
            this.whiteOverlay.setVisible(false);
        }
        // Brillo de 1 a 2 (aclarar con overlay blanco)
        else { // this.brilloConfiguracion > 1
            const opacidadWhite = this.brilloConfiguracion - 1; // 0 (100% brillo) a 1 (200% brillo)
            this.whiteOverlay.setAlpha(opacidadWhite);
            this.whiteOverlay.setVisible(opacidadWhite > 0);
            this.blackOverlay.setAlpha(0); // Asegurarse de que el negro esté oculto
            this.blackOverlay.setVisible(false);
        }
    }

    MenuCreditos() {
        this.ocultarTodosLosMenus();
        this.mostrarMarcoYLogo(true);
        this.estadoActualMenu = 'creditos';

        const centroX = this.cameras.main.width / 2;
        const centroY = this.cameras.main.height / 2;

        // Elementos del menú de créditos
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

        this.blackOverlay.setVisible(true); // Asegurar que los overlays de brillo estén visibles
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo(); // Aplicar el brillo
        //console.log("Entrando al Menú de Créditos");
    }

    // --- Menú de Fin de Juego (Ingreso de High Score) ---
    MenuFinDelJuego() {
        this.ocultarTodosLosMenus();
        this.estadoActualMenu = 'ingresoHighScore'; // Cambiar el estado a ingreso de high score
        this.menuFinJuegoImagen.setVisible(true);
        this.textoPuntajeFinal.setText(`${this.puntajeTotal}`.padStart(10, "0")).setVisible(true); // Mostrar el puntaje final
        this.ImagenRoca.setVisible(true);

        // Mostrar los campos de letras
        this.textoLetrasEmpresa.forEach((text, index) => {
            text.setText(this.letrasEmpresa[index]); // Set initial letters (e.g., "AAAA")
            text.setVisible(true);
        });

        this.indiceLetraSeleccionada = 0; // Resetear la selección de letra
        this.actualizarSeleccionLetra(); // Mostrar el subrayado inicial

        this.blackOverlay.setVisible(true); // Asegurar que los overlays de brillo estén visible
        this.whiteOverlay.setVisible(true);
        this.aplicarBrillo(); // Aplicar el brillo
        //console.log("Entrando al Menú de Fin de Juego para ingresar High Score");
    }

    // Actualiza la posición del subrayado debajo de la letra seleccionada
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

    // Cambia la letra en la posición seleccionada
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

    // Guarda el high score y el nombre de la empresa
    guardarHighScore() {
        const nombreEmpresa = this.letrasEmpresa.join(''); // Une las letras para formar el nombre
        const nuevoPuntaje = this.puntajeTotal;

        const escenaMaestra = this.scene.get('EscenaMaestra');
        let inserted = false;

        // Caso especial: si la puntuación es 0 y hay un slot vacío con puntuación 0
        if (nuevoPuntaje === 0) {
            for (let i = 0; i < escenaMaestra.TopExtractor.length; i++) {
                if (escenaMaestra.TopExtractor[i].puntaje === 0 && escenaMaestra.TopExtractor[i].Empresa === "") {
                    escenaMaestra.TopExtractor[i].Empresa = nombreEmpresa;
                    escenaMaestra.TopExtractor[i].puntaje = nuevoPuntaje;
                    inserted = true;
                    break; // Se insertó, salir del bucle
                }
            }
        }

        // Si no se insertó en el caso especial, proceder con la lógica general de high score
        if (!inserted) {
            for (let i = 0; i < escenaMaestra.TopExtractor.length; i++) {
                if (nuevoPuntaje > escenaMaestra.TopExtractor[i].puntaje) {
                    // Mover las puntuaciones menores hacia abajo
                    for (let j = escenaMaestra.TopExtractor.length - 1; j > i; j--) {
                        escenaMaestra.TopExtractor[j].Empresa = escenaMaestra.TopExtractor[j - 1].Empresa;
                        escenaMaestra.TopExtractor[j].puntaje = escenaMaestra.TopExtractor[j - 1].puntaje;
                    }
                    // Insertar la nueva puntuación
                    escenaMaestra.TopExtractor[i].Empresa = nombreEmpresa;
                    escenaMaestra.TopExtractor[i].puntaje = nuevoPuntaje;
                    inserted = true;
                    break;
                }
            }
        }

        this.actualizarDisplayHighscores(); // Actualiza la visualización de los high scores
        this.MenuGeneral(); // Volver al menú principal
    }

    // Actualiza la visualización de los high scores en el menú
    actualizarDisplayHighscores() {
        const escenaMaestra = this.scene.get('EscenaMaestra');
        escenaMaestra.TopExtractor.forEach((data, index) => {
            const entryTextObjs = this.textosHighscore[index]; // Obtener los objetos de texto para esta entrada

            // Lógica para Empresa
            const empresaData = data.Empresa;
            const empresaTotalLength = 4;
            const empresaPaddingLength = empresaTotalLength - empresaData.length;
            const empresaPaddingString = '-'.repeat(Math.max(0, empresaPaddingLength));

            entryTextObjs.empresaPadding.setText(empresaPaddingString);
            entryTextObjs.empresaValue.setText(empresaData);

            // Ajustar las posiciones X para que el texto combinado esté centrado
            const empresaPaddingWidth = entryTextObjs.empresaPadding.width;
            const empresaValueWidth = entryTextObjs.empresaValue.width;
            const totalEmpresaWidth = empresaPaddingWidth + empresaValueWidth;

            const empresaBaseX = 295; // El centro X original
            entryTextObjs.empresaPadding.x = empresaBaseX - (totalEmpresaWidth / 2) + (empresaPaddingWidth / 2);
            entryTextObjs.empresaValue.x = empresaBaseX - (totalEmpresaWidth / 2) + empresaPaddingWidth + (empresaValueWidth / 2);

            // Lógica para Puntaje
            const puntajeData = `${data.puntaje}`; // Asegurarse de que sea una cadena
            const puntajeTotalLength = 10;
            const puntajePaddingLength = puntajeTotalLength - puntajeData.length;
            const puntajePaddingString = '0'.repeat(Math.max(0, puntajePaddingLength));

            entryTextObjs.puntajePadding.setText(puntajePaddingString);
            entryTextObjs.puntajeValue.setText(puntajeData);

            // Ajustar las posiciones X para que el texto combinado esté centrado
            const puntajePaddingWidth = entryTextObjs.puntajePadding.width;
            const puntajeValueWidth = entryTextObjs.puntajeValue.width;
            const totalPuntajeWidth = puntajePaddingWidth + puntajeValueWidth;

            const puntajeBaseX = 490; // El centro X original
            entryTextObjs.puntajePadding.x = puntajeBaseX - (totalPuntajeWidth / 2) + (puntajePaddingWidth / 2);
            entryTextObjs.puntajeValue.x = puntajeBaseX - (totalPuntajeWidth / 2) + puntajePaddingWidth + (puntajeValueWidth / 2);

            // Asegurarse de que los textos sean visibles
            entryTextObjs.empresaPadding.setVisible(true);
            entryTextObjs.empresaValue.setVisible(true);
            entryTextObjs.puntajePadding.setVisible(true);
            entryTextObjs.puntajeValue.setVisible(true);
        });
    }
}
