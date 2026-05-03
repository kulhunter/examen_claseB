let preguntasActuales = [];
let indiceActual = 0;
let aciertos = 0;
let totalPreguntasTest = 0;
let errores = [];
let seleccionesMultiples = [];

// Navegación
function cambiarVista(vistaId) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden'); // Ocultar totalmente
    });
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    
    const el = document.getElementById(`${vistaId}-container`) || document.getElementById(vistaId);
    if (el) {
        el.classList.remove('hidden'); // Remover el candado de visibilidad
        el.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Intro Modal Logic
function mostrarIntroSenales(callback) {
    const modal = document.getElementById('intro-signals-modal');
    modal.classList.remove('hidden');
    
    const startBtn = document.getElementById('btn-entendido-signals');
    const closeBtn = document.getElementById('btn-close-intro');
    
    const closeHandler = () => {
        modal.classList.add('hidden');
        callback();
    };
    
    startBtn.onclick = closeHandler;
    closeBtn.onclick = closeHandler;
}

// Iniciar Test Teórico (Dashboard Cards)
document.querySelectorAll('.card-action[data-start]').forEach(card => {
    card.addEventListener('click', () => {
        const start = parseInt(card.dataset.start);
        const end = parseInt(card.dataset.end);
        const pool = bancoPreguntas.filter(p => p.id >= start && p.id <= end);
        iniciarTest(pool, Math.min(pool.length, 35));
    });
});

// Iniciar Test de Señales
if(document.getElementById('btn-start-signs')) document.getElementById('btn-start-signs').addEventListener('click', (e) => {
    e.stopPropagation();
    mostrarIntroSenales(() => {
        iniciarTest(bancoSenales, 30);
    });
});

// Simulacro de Examen
const btnExam = document.getElementById('btn-exam-sim');
if (btnExam) {
    btnExam.addEventListener('click', () => {
        iniciarTest(bancoPreguntas, 35);
    });
}

// ENTRY POINT: Recorrido Virtual
if(document.getElementById('btn-open-virtual')) document.getElementById('btn-open-virtual').onclick = () => {
    cambiarVista('virtual-drive');
    resetProtocolSetup();
};

let timerInterval = null;
let timeRemaining = 45 * 60; // 45 minutos en segundos

function updateTimer() {
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        mostrarResultados();
        return;
    }
    timeRemaining--;
    const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const s = (timeRemaining % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById('timer-counter');
    if (timerEl) {
        timerEl.innerText = `⏱ ${m}:${s}`;
        if (timeRemaining < 300) timerEl.style.color = "var(--danger)"; // Rojo en los últimos 5 min
    }
}

function iniciarTest(pool, cantidad) {
    const poolValido = pool.filter(p => p.opciones && p.opciones.length >= 2);
    
    // Algoritmo de 8 Puntos Críticos
    const palabrasClave = ['alcohol', 'velocidad', 'pare', 'ceda', 'peatón', 'distancia', 'reacción', 'noche', 'droga'];
    let criticas = poolValido.filter(p => palabrasClave.some(kw => p.pregunta.toLowerCase().includes(kw)));
    let normales = poolValido.filter(p => !palabrasClave.some(kw => p.pregunta.toLowerCase().includes(kw)));
    
    criticas = shuffleArray(criticas);
    normales = shuffleArray(normales);
    
    // Asegurar al menos 8 preguntas críticas si existen suficientes
    const qtyCriticas = Math.min(criticas.length, 8);
    let seleccionFinal = criticas.slice(0, qtyCriticas).concat(normales.slice(0, cantidad - qtyCriticas));
    
    preguntasActuales = shuffleArray(seleccionFinal).slice(0, cantidad); // Mezclar todo al final
    indiceActual = 0;
    aciertos = 0;
    errores = [];
    totalPreguntasTest = preguntasActuales.length;
    
    // Iniciar Cronómetro
    clearInterval(timerInterval);
    timeRemaining = 45 * 60;
    const timerEl = document.getElementById('timer-counter');
    if (timerEl) timerEl.style.color = ""; // Reset color
    timerInterval = setInterval(updateTimer, 1000);
    
    const header = document.getElementById('main-header');
    if (header) header.style.display = 'none';
    
    cambiarVista('quiz');
    mostrarPregunta();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function mostrarPregunta() {
    const preguntaActual = preguntasActuales[indiceActual];
    const progress = (indiceActual / totalPreguntasTest) * 100;
    
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('pregunta-counter').innerText = `Pregunta ${indiceActual + 1} de ${totalPreguntasTest}`;
    document.getElementById('score-counter').innerText = `Aciertos: ${aciertos}`;
    document.getElementById('pregunta-text').innerText = preguntaActual.pregunta;
    
    const imgContainer = document.getElementById('pregunta-image-container');
    const imgElement = document.getElementById('pregunta-image');
    
    if (preguntaActual.imagen) {
        imgElement.src = preguntaActual.imagen;
        imgElement.onerror = function() {
            this.style.display = 'none';
            imgContainer.classList.add('hidden');
        };
        imgElement.onload = function() {
            this.style.display = 'block';
        };
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.classList.add('hidden');
    }
    
    const contenedorOpciones = document.getElementById('opciones-container');
    contenedorOpciones.innerHTML = '';
    seleccionesMultiples = [];
    
    const isMultiple = preguntaActual.type === 'multiple' || Array.isArray(preguntaActual.correcta);
    const instructionEl = document.getElementById('pregunta-instruction');
    if (isMultiple) {
        const numRespuestas = Array.isArray(preguntaActual.correcta) ? preguntaActual.correcta.length : 2;
        instructionEl.innerText = `(Marque ${numRespuestas} respuestas)`;
        instructionEl.classList.remove('hidden');
    } else {
        instructionEl.classList.add('hidden');
    }
    
    preguntaActual.opciones.forEach((opcionTexto, index) => {
        const btnOpcion = document.createElement('button');
        btnOpcion.className = 'opcion';
        btnOpcion.innerText = opcionTexto;
        btnOpcion.onclick = () => {
            if (isMultiple) toggleSeleccion(btnOpcion, index);
            else evaluarRespuesta(btnOpcion, index, preguntaActual.correcta);
        };
        contenedorOpciones.appendChild(btnOpcion);
    });
    
    document.getElementById('btn-siguiente').classList.add('hidden');
    document.getElementById('btn-confirmar').classList.toggle('hidden', !isMultiple);
}

function toggleSeleccion(btn, index) {
    if (seleccionesMultiples.includes(index)) {
        seleccionesMultiples = seleccionesMultiples.filter(i => i !== index);
        btn.classList.remove('selected');
    } else {
        seleccionesMultiples.push(index);
        btn.classList.add('selected');
    }
}

if(document.getElementById('btn-confirmar')) document.getElementById('btn-confirmar').onclick = () => {
    if (seleccionesMultiples.length === 0) return;
    const preguntaActual = preguntasActuales[indiceActual];
    evaluarRespuestaMultiples(seleccionesMultiples, preguntaActual.correcta);
};

function evaluarRespuestaMultiples(seleccionados, correctos) {
    document.getElementById('btn-confirmar').classList.add('hidden');
    const todosLosBotones = document.querySelectorAll('.opcion');
    const preguntaActual = preguntasActuales[indiceActual];
    todosLosBotones.forEach(btn => btn.disabled = true);
    
    const correctosArr = Array.isArray(correctos) ? correctos : [correctos];
    const esCorrecto = seleccionados.length === correctosArr.length && seleccionados.every(s => correctosArr.includes(s));
    
    if (esCorrecto) {
        aciertos++;
        seleccionados.forEach(idx => todosLosBotones[idx].classList.add('correct'));
    } else {
        seleccionados.forEach(idx => { if (!correctosArr.includes(idx)) todosLosBotones[idx].classList.add('wrong'); });
        correctosArr.forEach(idx => todosLosBotones[idx].classList.add('correct'));
        errores.push({
            pregunta: preguntaActual.pregunta,
            tuRespuesta: seleccionados.map(i => preguntaActual.opciones[i]).join(', '),
            respuestaCorrecta: correctosArr.map(i => preguntaActual.opciones[i]).join(', ')
        });
    }
    document.getElementById('score-counter').innerText = `Aciertos: ${aciertos}`;
    document.getElementById('btn-siguiente').classList.remove('hidden');
}

function evaluarRespuesta(btnSeleccionado, indiceSeleccionado, indiceCorrecto) {
    const todosLosBotones = document.querySelectorAll('.opcion');
    const preguntaActual = preguntasActuales[indiceActual];
    todosLosBotones.forEach(btn => btn.disabled = true);
    
    if (indiceSeleccionado === indiceCorrecto) {
        btnSeleccionado.classList.add('correct');
        aciertos++;
    } else {
        btnSeleccionado.classList.add('wrong');
        todosLosBotones[indiceCorrecto].classList.add('correct');
        errores.push({
            pregunta: preguntaActual.pregunta,
            tuRespuesta: preguntaActual.opciones[indiceSeleccionado],
            respuestaCorrecta: preguntaActual.opciones[indiceCorrecto]
        });
    }
    document.getElementById('score-counter').innerText = `Aciertos: ${aciertos}`;
    document.getElementById('btn-siguiente').classList.remove('hidden');
}

if(document.getElementById('btn-siguiente')) document.getElementById('btn-siguiente').addEventListener('click', () => {
    indiceActual++;
    if (indiceActual < totalPreguntasTest) mostrarPregunta();
    else mostrarResultados();
});

function mostrarResultados() {
    const header = document.getElementById('main-header');
    if (header) header.style.display = '';
    
    cambiarVista('resultados-container');
    const porcentaje = Math.round((aciertos / totalPreguntasTest) * 100);
    const resultElement = document.getElementById('resultado-final');
    const estadoElement = document.getElementById('estado-final');
    const mensajeElement = document.getElementById('mensaje-final');
    const scoreCircle = document.getElementById('score-circle');
    
    resultElement.innerText = `${porcentaje}%`;
    scoreCircle.classList.remove('aprobado-ring', 'reprobado-ring');

    if (porcentaje >= 80) {
        estadoElement.innerText = 'APROBADO';
        estadoElement.className = 'score-label aprobado';
        scoreCircle.classList.add('aprobado-ring');
        mensajeElement.innerText = `¡Felicidades! Estás listo para el examen municipal.`;
    } else {
        estadoElement.innerText = 'REPROBADO';
        estadoElement.className = 'score-label reprobado';
        scoreCircle.classList.add('reprobado-ring');
        mensajeElement.innerText = `Obtuviste ${porcentaje}%. Necesitas 80% para aprobar.`;
    }

    const divErrores = document.getElementById('revision-errores');
    if (divErrores) {
        divErrores.innerHTML = errores.length > 0 ? `<h3>Revisión de Errores (${errores.length})</h3>` : '<p class="text-correct" style="font-size:1.5rem; color:var(--success);">🎉 ¡Sin errores! Examen Perfecto.</p>';
        errores.forEach((err, i) => {
            const card = document.createElement('div');
            card.className = 'error-card';
            card.style.background = '#111';
            card.style.padding = '20px';
            card.style.borderRadius = '12px';
            card.style.marginBottom = '15px';
            card.style.borderLeft = '4px solid var(--danger)';
            card.innerHTML = `<p style="margin-bottom:10px; font-size:1.1rem;"><strong>${i + 1}. ${err.pregunta}</strong></p><p style="color:var(--danger); margin-bottom:5px;">✖ ${err.tuRespuesta}</p><p style="color:var(--success);">✔ ${err.respuestaCorrecta}</p>`;
            divErrores.appendChild(card);
        });
    }

    // WhatsApp Share Logic
    const btnWsp = document.getElementById('btn-whatsapp-share');
    if (btnWsp) {
        btnWsp.onclick = () => {
            const icon = porcentaje >= 80 ? '✅' : '❌';
            const text = `¡Acabo de obtener un ${porcentaje}% ${icon} en el Simulador Oficial Clase B de la Municipalidad de Macul!\n\nPractica tú también aquí sin registro y con cero fricción:\n👉 https://examenconducir.cl`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        };
    }
}

// ============================================
// VIRTUAL DRIVE ENGINE (OFFICIAL PROTOCOL)
// ============================================
let driveState = {
    phase: 'reception',
    idVerified: false,
    docsVerified: false,
    ctrlsVerified: false,
    belt: false,
    mirrors: false,
    doors: false,
    engine: false,
    handbrake: true,
    carPos: 0,
    fails: [],
    theoreticalAciertos: 0
};

const driveScenarios = [
    { pos: 100, type: 'action', id: 'inter-stop', msg: "Se aproxima a una señal PARE. ¿Qué debe hacer?", action: "Frenar totalmente" },
    { pos: 200, type: 'question', q: "¿Quién tiene la preferencia en este cruce sin señalizar?", options: ["Usted", "El vehículo que viene por la derecha", "El vehículo que viene por la izquierda", "El más rápido"], correct: 1 },
    { pos: 300, type: 'action', id: 'inter-yield', msg: "Señal CEDA EL PASO detectada. Evalúe el tráfico.", action: "Ceder el paso" },
    { pos: 400, type: 'action', id: 'inter-light', msg: "Semáforo en ROJO. Detenga el vehículo.", action: "Detenerse" },
    { pos: 500, type: 'question', q: "Si un vehículo de emergencia viene con sirenas detrás de usted, ¿qué debe hacer?", options: ["Aumentar la velocidad", "Frenar en seco", "Desviarse a la derecha y detenerse", "Ignorarlo"], correct: 2 },
    { pos: 600, type: 'action', id: 'curve-right', msg: "Zona de curvas. Reduzca la velocidad.", action: "Girar con precaución" },
    { pos: 700, type: 'action', id: 'inter-pedestrian', msg: "Peatón cruzando en el paso de cebra.", action: "Dar preferencia" },
    { pos: 800, type: 'question', q: "Al enfrentar esta señal de Cruce Ferroviario (Cruz de San Andrés), ¿qué es obligatorio?", options: ["Acelerar", "Parar, mirar y escuchar", "Tocar la bocina", "Pasar sin mirar"], correct: 1 },
    { pos: 900, type: 'action', id: 'inter-bus', msg: "Bus detenido en parada. Mantenga distancia.", action: "Reducir velocidad" },
    { pos: 1000, type: 'final', msg: "Llegada al punto de destino. Fase de Conducción Libre finalizada. Inicie Conducción Guiada." }
];

function resetProtocolSetup() {
    driveState = { phase: 'reception', idVerified: false, docsVerified: false, ctrlsVerified: false, belt: false, mirrors: false, doors: false, engine: false, handbrake: true, carPos: 0, fails: [], theoreticalAciertos: 0 };
    document.getElementById('drive-setup').classList.remove('hidden');
    document.getElementById('drive-game').classList.add('hidden');
    document.getElementById('drive-results').classList.add('hidden');
    
    document.getElementById('setup-instruction').innerText = 'Examinador: "Buenos días. Por favor, identifíquese con su cédula de identidad."';
    document.getElementById('group-id').classList.remove('hidden');
    document.getElementById('group-docs').classList.add('hidden');
    document.getElementById('group-controls').classList.add('hidden');
    document.getElementById('btn-start-drive').classList.add('hidden');
    
    document.querySelectorAll('.status-item').forEach(el => el.classList.remove('done'));
}

// Interacciones de Etapa 1
if(document.getElementById('action-show-id')) document.getElementById('action-show-id').onclick = () => {
    driveState.idVerified = true;
    document.getElementById('stat-id').classList.add('done');
    document.getElementById('stat-id').innerText = '✓ Identificación';
    document.getElementById('group-id').classList.add('hidden');
    document.getElementById('group-docs').classList.remove('hidden');
    document.getElementById('setup-instruction').innerText = 'Examinador: "Identifique el Seguro Obligatorio (SOAP) del vehículo."';
};

document.querySelectorAll('.btn-check-doc').forEach(btn => {
    btn.onclick = () => {
        if (btn.dataset.doc === 'soap') {
            driveState.docsVerified = true;
            document.getElementById('stat-docs').classList.add('done');
            document.getElementById('stat-docs').innerText = '✓ Documentación';
            document.getElementById('group-docs').classList.add('hidden');
            document.getElementById('group-controls').classList.remove('hidden');
            document.getElementById('setup-instruction').innerText = 'Examinador: "Muestre el funcionamiento de los limpiaparabrisas."';
        } else {
            registrarFallo("Error al identificar documento solicitado");
            alert("Examinador: 'Ese no es el documento solicitado.'");
        }
    };
});

document.querySelectorAll('.btn-check-ctrl').forEach(btn => {
    btn.onclick = () => {
        if (btn.dataset.ctrl === 'limpia') {
            driveState.ctrlsVerified = true;
            document.getElementById('stat-ctrl').classList.add('done');
            document.getElementById('stat-ctrl').innerText = '✓ Mandos';
            document.getElementById('group-controls').classList.add('hidden');
            document.getElementById('btn-start-drive').classList.remove('hidden');
            document.getElementById('setup-instruction').innerText = 'Examinador: "Perfecto. Suba al vehículo y prepárese para iniciar la conducción libre."';
        }
    };
});

// Inicio de Conducción
if(document.getElementById('btn-start-drive')) document.getElementById('btn-start-drive').onclick = () => {
    document.getElementById('drive-setup').classList.add('hidden');
    document.getElementById('drive-game').classList.remove('hidden');
    iniciarExamenVirtual();
};

function updateDriveUI(msg) {
    document.getElementById('game-instruction').innerText = `Examinador: "${msg}"`;
    document.getElementById('ctrl-belt').classList.toggle('active', driveState.belt);
    document.getElementById('ctrl-mirrors').classList.toggle('active', driveState.mirrors);
    document.getElementById('ctrl-doors').classList.toggle('active', driveState.doors);
    document.getElementById('ctrl-start').classList.toggle('active', driveState.engine);
    document.getElementById('ctrl-handbrake').classList.toggle('active', driveState.handbrake);
}

function iniciarExamenVirtual() {
    updateDriveUI("Acomode su asiento, espejos, asegure puertas, encienda y quite el freno de mano.");
    resetMap();
}

if(document.getElementById('ctrl-belt')) document.getElementById('ctrl-belt').onclick = () => { driveState.belt = true; updateDriveUI("Cinturón abrochado."); };
if(document.getElementById('ctrl-mirrors')) document.getElementById('ctrl-mirrors').onclick = () => { driveState.mirrors = true; updateDriveUI("Espejos ajustados."); };
if(document.getElementById('ctrl-doors')) document.getElementById('ctrl-doors').onclick = () => { driveState.doors = true; updateDriveUI("Puertas cerradas."); };

if(document.getElementById('ctrl-start')) document.getElementById('ctrl-start').onclick = () => {
    if (!driveState.belt || !driveState.mirrors || !driveState.doors) {
        registrarFallo("Iniciar motor sin comprobaciones previas (Cinturón, Espejos, Puertas).");
        updateDriveUI("¡Error! Debe asegurar cinturón, espejos y puertas primero.");
    } else {
        driveState.engine = true;
        updateDriveUI("Motor encendido. Desactive el freno de mano para iniciar.");
    }
};

if(document.getElementById('ctrl-handbrake')) document.getElementById('ctrl-handbrake').onclick = () => {
    if (!driveState.engine) {
        registrarFallo("Quitar freno de mano con motor apagado.");
        updateDriveUI("¡Error! Encienda el motor primero.");
    } else {
        driveState.handbrake = false;
        document.getElementById('btn-drive-continue').classList.remove('hidden');
        document.querySelector('.cockpit-controls').classList.add('hidden'); // Ocultar controles al iniciar
        updateDriveUI("Freno liberado. Inicie la marcha libre hacia el punto de destino.");
    }
};

if(document.getElementById('btn-drive-continue')) document.getElementById('btn-drive-continue').onclick = () => avanzarSimulacion();

function avanzarSimulacion() {
    if (driveState.handbrake) {
        registrarFallo("Intentar avanzar con el freno de mano puesto.");
        updateDriveUI("¡Error! Quite el freno de mano antes de avanzar.");
        return;
    }
    
    document.querySelector('.animated-markings').classList.remove('paused');
    driveState.carPos += 100;
    
    // Eliminado: car.style.bottom para evitar que el volante flote hacia arriba.
    
    const scenario = driveScenarios.find(s => s.pos === driveState.carPos);
    if (scenario) {
        setTimeout(() => ejecutarEscenario(scenario), 600); // Dar tiempo a que el auto se mueva
    } else if (driveState.carPos >= 1000) {
        setTimeout(finalizarExamenVirtual, 800);
    }
}

function ejecutarEscenario(s) {
    document.getElementById('btn-drive-continue').classList.add('hidden');
    document.querySelector('.animated-markings').classList.add('paused'); // Pausar animación de vía
    
    // Activar gráficos de entorno y dinámicos
    if (s.q && s.q.includes('cruce') || s.action === 'Detenerse' || s.action === 'Frenar totalmente' || s.action === 'Ceder el paso') {
        document.getElementById('env-intersection').classList.remove('hidden');
        if (s.pos === 200) {
            const otherCar = document.getElementById('td-other-car');
            otherCar.classList.remove('hidden');
            setTimeout(() => otherCar.classList.add('enter'), 100);
        }
    }
    if (s.q && s.q.includes('peatón') || s.action === 'Dar preferencia') {
        document.getElementById('env-crosswalk').classList.remove('hidden');
    }
    if (s.pos === 500) { // Ambulancia
        const amb = document.getElementById('td-ambulance');
        amb.classList.remove('hidden');
        setTimeout(() => amb.classList.add('enter'), 100);
    }
    if (s.pos === 600) { // Curva
        const curve = document.getElementById('td-curve-road');
        curve.classList.remove('hidden');
        setTimeout(() => curve.classList.add('enter'), 100);
    }
    if (s.pos === 300) { // Ceda el paso
        document.getElementById('inter-yield').classList.remove('hidden');
    }
    
    if (s.type === 'action') {
        const el = document.getElementById(s.id);
        if (el) el.classList.remove('hidden');
        const actionBtn = document.getElementById('btn-drive-action');
        actionBtn.classList.remove('hidden');
        actionBtn.innerText = s.action;
        updateDriveUI(s.msg);
        
        actionBtn.onclick = () => {
            if (el) el.classList.add('hidden');
            document.getElementById('env-intersection').classList.add('hidden');
            document.getElementById('env-crosswalk').classList.add('hidden');
            document.getElementById('td-other-car').classList.add('hidden');
            document.getElementById('td-other-car').classList.remove('enter');
            document.getElementById('td-ambulance').classList.add('hidden');
            document.getElementById('td-ambulance').classList.remove('enter');
            document.getElementById('td-curve-road').classList.add('hidden');
            document.getElementById('td-curve-road').classList.remove('enter');
            document.getElementById('inter-yield').classList.add('hidden');
            actionBtn.classList.add('hidden');
            document.getElementById('btn-drive-continue').classList.remove('hidden');
            updateDriveUI("Correcto. Prosiga.");
        };
    } else if (s.type === 'question') {
        const qBox = document.getElementById('drive-question-box');
        const qText = document.getElementById('drive-q-text');
        const qOptions = document.getElementById('drive-q-options');
        
        qBox.classList.remove('hidden');
        qText.innerText = s.q;
        qOptions.innerHTML = '';
        updateDriveUI("Pregunta de situación en ruta...");
        
        s.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'opcion';
            btn.innerText = opt;
            btn.onclick = () => {
                if (idx === s.correct) {
                    driveState.theoreticalAciertos++;
                    updateDriveUI("Decisión Correcta. Avance.");
                } else {
                    registrarFallo(`Fallo de Criterio: Respondió mal a '${s.q}'`);
                    updateDriveUI("Decisión Incorrecta. Tenga precaución.");
                }
                qBox.classList.add('hidden');
                document.getElementById('env-intersection').classList.add('hidden');
                document.getElementById('env-crosswalk').classList.add('hidden');
                document.getElementById('td-other-car').classList.add('hidden');
                document.getElementById('td-other-car').classList.remove('enter');
                document.getElementById('td-ambulance').classList.add('hidden');
                document.getElementById('td-ambulance').classList.remove('enter');
                document.getElementById('td-curve-road').classList.add('hidden');
                document.getElementById('td-curve-road').classList.remove('enter');
                document.getElementById('inter-yield').classList.add('hidden');
                document.getElementById('btn-drive-continue').classList.remove('hidden');
            };
            qOptions.appendChild(btn);
        });
    } else if (s.type === 'final') {
        updateDriveUI(s.msg);
        setTimeout(finalizarExamenVirtual, 2000);
    }
}

function registrarFallo(desc) { driveState.fails.push(desc); }

function finalizarExamenVirtual() {
    document.getElementById('drive-game').classList.add('hidden');
    document.getElementById('drive-results').classList.remove('hidden');
    
    const status = document.getElementById('drive-status');
    const feedback = document.getElementById('drive-feedback');
    const scoreCircle = document.getElementById('drive-score-circle');
    const scoreValue = document.getElementById('drive-score-value');
    
    // Cálculo de penalizaciones (cada fallo quita un % del 100%)
    let maxScore = 100;
    let finalScore = Math.max(0, maxScore - (driveState.fails.length * 20));
    
    scoreValue.innerText = `${finalScore}%`;
    const reprobado = finalScore < 80;
    
    if (reprobado) {
        status.innerText = "REPROBADO";
        status.className = "final-verdict fail";
        scoreCircle.className = "circle-chart fail";
        
        const htmlFails = driveState.fails.map(f => `
            <div class="eval-item fail">
                <span class="icon">❌</span>
                <div><strong>Infracción Registrada</strong><br>${f}</div>
            </div>
        `).join('');
        
        feedback.innerHTML = `
            <p style="margin-bottom: 20px; color: var(--text-muted);">El sistema ha detectado errores críticos durante la simulación que resultarían en una reprobación inmediata según el protocolo municipal vigente.</p>
            ${htmlFails}
        `;
    } else {
        status.innerText = "APROBADO";
        status.className = "final-verdict pass";
        scoreCircle.className = "circle-chart pass";
        
        feedback.innerHTML = `
            <div class="eval-item success">
                <span class="icon">✅</span>
                <div><strong>Conducción Segura</strong><br>Ha completado todas las etapas del protocolo de evaluación oficial satisfactoriamente.</div>
            </div>
        `;
    }
}



function resetMap() {
    document.getElementById('virtual-car').style.bottom = '20px';
    document.querySelector('.animated-markings').classList.add('paused');
    document.getElementById('env-crosswalk').classList.add('hidden');
    document.getElementById('env-intersection').classList.add('hidden');
    document.querySelectorAll('.top-down-road > div.td-map-object').forEach(el => el.classList.add('hidden'));
    document.getElementById('drive-question-box').classList.add('hidden');
    document.getElementById('btn-drive-continue').classList.add('hidden');
    document.getElementById('btn-drive-action').classList.add('hidden');
}



/* =========================================================
   GABINETE PSICOTÉCNICO (LÓGICA MODULAR V4)
   ========================================================= */
let psicoState = {
    attempts: 0,
    maxAttempts: 3,
    startTime: 0,
    waitingForGreen: false,
    times: [],
    timeoutId: null
};

let punteadoState = {
    hits: 0,
    needed: 35,
    timeLeft: 45,
    timerId: null,
    active: false,
    startTime: 0
};

function cambiarPruebaPsico(prueba) {
    document.getElementById('psico-menu').classList.add('hidden');
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    
    if (prueba === 'reaccion') {
        document.getElementById('psico-reaccion-view').classList.remove('hidden');
        resetPsicoReaccion();
    } else {
        document.getElementById('psico-punteado-view').classList.remove('hidden');
        resetPunteado();
    }
}

// --- TEST REACCIÓN ---
function resetPsicoReaccion() {
    psicoState = { attempts: 0, maxAttempts: 3, startTime: 0, waitingForGreen: false, times: [], timeoutId: null };
    document.getElementById('psico-instructions').classList.remove('hidden');
    document.getElementById('psico-results').classList.add('hidden');
    document.getElementById('btn-psico-pedal').disabled = true;
}

if(document.getElementById('btn-start-psico-sequence')) {
    document.getElementById('btn-start-psico-sequence').onclick = () => {
        document.getElementById('psico-instructions').classList.add('hidden');
        document.getElementById('btn-psico-pedal').disabled = false;
        iniciarIntentoPsico();
    };
}

function iniciarIntentoPsico() {
    psicoState.waitingForGreen = false;
    document.querySelector('.hud-light').classList.remove('active');
    document.getElementById('psico-feedback-msg').classList.add('hidden');
    
    const randomDelay = Math.random() * 3000 + 2000;
    psicoState.timeoutId = setTimeout(() => {
        psicoState.waitingForGreen = true;
        document.querySelector('.hud-light').classList.add('active');
        psicoState.startTime = performance.now();
    }, randomDelay);
}

const pedalReaccion = document.getElementById('btn-psico-pedal');
if(pedalReaccion) {
    const fn = (e) => {
        if(e) e.preventDefault();
        if (psicoState.attempts >= psicoState.maxAttempts) return;
        
        const msg = document.getElementById('psico-feedback-msg');
        msg.classList.remove('hidden');

        if (!psicoState.waitingForGreen) {
            clearTimeout(psicoState.timeoutId);
            msg.innerText = "¡FALSO ARRANQUE!";
            msg.style.color = "var(--danger)";
            setTimeout(iniciarIntentoPsico, 1500);
            return;
        }

        const reactionTime = performance.now() - psicoState.startTime;
        psicoState.waitingForGreen = false;
        document.querySelector('.hud-light').classList.remove('active');
        psicoState.times.push(reactionTime);
        psicoState.attempts++;
        
        document.getElementById('psico-time-last').innerText = `ÚLTIMO: ${reactionTime.toFixed(0)} ms`;
        msg.innerText = `${(reactionTime / 1000).toFixed(3)}s`;
        msg.style.color = "var(--success)";
        
        if (psicoState.attempts < psicoState.maxAttempts) {
            document.getElementById('psico-attempt-counter').innerText = `INTENTO ${psicoState.attempts + 1}/3`;
            setTimeout(iniciarIntentoPsico, 1500);
        } else {
            setTimeout(() => finalizarTestGabinete('reaccion'), 1000);
        }
    };
    pedalReaccion.onmousedown = fn;
    pedalReaccion.ontouchstart = fn;
}

// --- TEST PUNTEADO ---
function resetPunteado() {
    punteadoState = { hits: 0, needed: 35, timeLeft: 45, timerId: null, active: false, startTime: 0 };
    document.getElementById('punteado-instructions').classList.remove('hidden');
    document.getElementById('psico-punteado-box').classList.add('hidden');
    document.getElementById('btn-punteado-pedal').disabled = true;
    document.getElementById('punteado-hits').innerText = "ACIERTOS: 0/35";
    document.getElementById('punteado-timer').innerText = "TIEMPO: 45s";
}

if(document.getElementById('btn-start-punteado')) {
    document.getElementById('btn-start-punteado').onclick = () => {
        document.getElementById('punteado-instructions').classList.add('hidden');
        document.getElementById('psico-punteado-box').classList.remove('hidden');
        document.getElementById('btn-punteado-pedal').disabled = false;
        
        punteadoState.active = true;
        punteadoState.startTime = performance.now();
        
        punteadoState.timerId = setInterval(() => {
            punteadoState.timeLeft--;
            document.getElementById('punteado-timer').innerText = `TIEMPO: ${punteadoState.timeLeft}s`;
            if (punteadoState.timeLeft <= 0) finalizarPunteado(false);
        }, 1000);
    };
}

const pedalPunteado = document.getElementById('btn-punteado-pedal');
if(pedalPunteado) {
    const fn = (e) => {
        if(e) e.preventDefault();
        manejarAccionPunteado();
    };
    pedalPunteado.onmousedown = fn;
    pedalPunteado.ontouchstart = fn;
}

function manejarAccionPunteado() {
    if (!punteadoState.active) return;
    
    const target = document.querySelector('.target-zone');
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const elements = document.elementsFromPoint(cx, cy);
    const hole = elements.find(el => el.classList.contains('hole'));
    
    const msg = document.getElementById('punteado-msg');
    msg.classList.remove('hidden');
    
    if (hole) {
        punteadoState.hits++;
        document.getElementById('punteado-hits').innerText = `ACIERTOS: ${punteadoState.hits}/35`;
        msg.innerText = "¡ACIERTO!";
        msg.style.color = "var(--success)";
        if (punteadoState.hits >= punteadoState.needed) {
            finalizarPunteado(true);
        }
    } else {
        msg.innerText = "FALLO";
        msg.style.color = "var(--danger)";
    }
}

function finalizarPunteado(exito) {
    punteadoState.active = false;
    clearInterval(punteadoState.timerId);
    document.getElementById('btn-punteado-pedal').disabled = true;
    
    const msg = document.getElementById('punteado-msg');
    msg.innerText = exito ? "¡META ALCANZADA!" : "TIEMPO AGOTADO";
    msg.style.color = exito ? "var(--success)" : "var(--danger)";
    
    setTimeout(() => finalizarTestGabinete('punteado'), 1500);
}

function finalizarTestGabinete(tipo) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('psico-results').classList.remove('hidden');
    
    const statusEl = document.getElementById('psico-final-status');
    const timeEl = document.getElementById('psico-avg-time');
    const nameEl = document.getElementById('psico-test-name');

    if (tipo === 'reaccion') {
        nameEl.innerText = "Prueba de Reacción";
        const avg = psicoState.times.reduce((a, b) => a + b, 0) / 3 / 1000;
        timeEl.innerText = `Promedio: ${avg.toFixed(3)}s`;
        if (avg <= 0.45) { statusEl.innerText = "ÓPTIMO"; statusEl.style.color = "var(--neon-cyan)"; }
        else if (avg <= 0.60) { statusEl.innerText = "NORMAL"; statusEl.style.color = "var(--success)"; }
        else { statusEl.innerText = "DEFICIENTE"; statusEl.style.color = "var(--danger)"; }
    } else {
        nameEl.innerText = "Prueba de Punteado";
        timeEl.innerText = `Aciertos: ${punteadoState.hits}/35`;
        if (punteadoState.hits >= 35) { statusEl.innerText = "ÓPTIMO"; statusEl.style.color = "var(--neon-cyan)"; }
        else if (punteadoState.hits >= 25) { statusEl.innerText = "NORMAL"; statusEl.style.color = "var(--success)"; }
        else { statusEl.innerText = "DEFICIENTE"; statusEl.style.color = "var(--danger)"; }
    }
}

