let preguntasActuales = [];
let indiceActual = 0;
let aciertos = 0;
let totalPreguntasTest = 0;
let errores = [];
let seleccionesMultiples = [];

// Navegación
function cambiarVista(vistaId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${vistaId}-container` || vistaId).classList.add('active');
}

// Iniciar Test Teórico
document.querySelectorAll('.btn-nivel').forEach(btn => {
    btn.addEventListener('click', () => {
        const start = parseInt(btn.dataset.start);
        const end = parseInt(btn.dataset.end);
        const pool = bancoPreguntas.filter(p => p.id >= start && p.id <= end);
        iniciarTest(pool, Math.min(pool.length, 35));
    });
});

// Iniciar Test de Señales
document.getElementById('btn-start-signs').addEventListener('click', () => {
    iniciarTest(bancoSenales, 30);
});

function iniciarTest(pool, cantidad) {
    preguntasActuales = shuffleArray([...pool]).slice(0, cantidad);
    indiceActual = 0;
    aciertos = 0;
    errores = [];
    totalPreguntasTest = preguntasActuales.length;
    
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
    
    // UI Updates
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('pregunta-counter').innerText = `Pregunta ${indiceActual + 1} de ${totalPreguntasTest}`;
    document.getElementById('score-counter').innerText = `Aciertos: ${aciertos}`;
    
    // Texto de la pregunta
    document.getElementById('pregunta-text').innerText = preguntaActual.pregunta;
    
    // Manejo de Imagen
    const imgContainer = document.getElementById('pregunta-image-container');
    const imgElement = document.getElementById('pregunta-image');
    
    if (preguntaActual.imagen) {
        imgElement.src = preguntaActual.imagen;
        imgContainer.classList.remove('hidden');
        imgContainer.style.display = 'block';
    } else {
        imgContainer.classList.add('hidden');
        imgContainer.style.display = 'none';
    }
    
    const contenedorOpciones = document.getElementById('opciones-container');
    contenedorOpciones.innerHTML = '';
    seleccionesMultiples = [];
    
    const isMultiple = preguntaActual.type === 'multiple' || Array.isArray(preguntaActual.correcta);
    
    preguntaActual.opciones.forEach((opcionTexto, index) => {
        const btnOpcion = document.createElement('button');
        btnOpcion.className = 'opcion';
        btnOpcion.innerText = opcionTexto;
        
        btnOpcion.onclick = () => {
            if (isMultiple) {
                toggleSeleccion(btnOpcion, index);
            } else {
                evaluarRespuesta(btnOpcion, index, preguntaActual.correcta);
            }
        };
        contenedorOpciones.appendChild(btnOpcion);
    });
    
    document.getElementById('btn-siguiente').classList.add('hidden');
    
    if (isMultiple) {
        document.getElementById('btn-confirmar').classList.remove('hidden');
    } else {
        document.getElementById('btn-confirmar').classList.add('hidden');
    }
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

document.getElementById('btn-confirmar').onclick = () => {
    if (seleccionesMultiples.length === 0) return;
    const preguntaActual = preguntasActuales[indiceActual];
    evaluarRespuestaMultiples(seleccionesMultiples, preguntaActual.correcta);
};

function evaluarRespuestaMultiples(seleccionados, correctos) {
    document.getElementById('btn-confirmar').classList.add('hidden');
    const todosLosBotones = document.querySelectorAll('.opcion');
    const preguntaActual = preguntasActuales[indiceActual];
    todosLosBotones.forEach(btn => btn.disabled = true);
    
    // Si correctos no es array (caso id 70 que vi), lo volvemos array
    const correctosArr = Array.isArray(correctos) ? correctos : [correctos];
    
    const esCorrecto = seleccionados.length === correctosArr.length && 
                       seleccionados.every(s => correctosArr.includes(s));
    
    if (esCorrecto) {
        aciertos++;
        seleccionados.forEach(idx => todosLosBotones[idx].classList.add('correct'));
    } else {
        // Mostrar marcados incorrectos en rojo
        seleccionados.forEach(idx => {
            if (!correctosArr.includes(idx)) todosLosBotones[idx].classList.add('wrong');
        });
        // Mostrar los que eran correctos en verde
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

document.getElementById('btn-siguiente').addEventListener('click', () => {
    indiceActual++;
    if (indiceActual < totalPreguntasTest) {
        mostrarPregunta();
    } else {
        mostrarResultados();
    }
});

function mostrarResultados() {
    cambiarVista('resultados');
    const porcentaje = Math.round((aciertos / totalPreguntasTest) * 100);
    const resultElement = document.getElementById('resultado-final');
    const estadoElement = document.getElementById('estado-final');
    const mensajeElement = document.getElementById('mensaje-final');
    
    resultElement.innerText = `${porcentaje}%`;
    document.getElementById('progress-bar').style.width = `100%`;

    if (porcentaje >= 80) {
        estadoElement.innerText = 'APROBADO';
        estadoElement.className = 'score-label aprobado';
        mensajeElement.innerText = `¡Felicidades! Has superado el test con ${aciertos} de ${totalPreguntasTest} respuestas correctas. Estás listo para el examen municipal.`;
    } else {
        estadoElement.innerText = 'REPROBADO';
        estadoElement.className = 'score-label reprobado';
        mensajeElement.innerText = `Has obtenido un ${porcentaje}%. Necesitas al menos un 80% para aprobar. ¡Sigue practicando!`;
    }

    // Mostrar errores
    const divErrores = document.getElementById('revision-errores');
    divErrores.innerHTML = errores.length > 0 ? '<h3>Revisión de Errores:</h3>' : '';
    errores.forEach(err => {
        const card = document.createElement('div');
        card.className = 'error-card';
        card.innerHTML = `
            <p><strong>Pregunta:</strong> ${err.pregunta}</p>
            <p class="text-wrong">✖ Tu respuesta: ${err.tuRespuesta}</p>
            <p class="text-correct">✔ Correcta: ${err.respuestaCorrecta}</p>
        `;
        divErrores.appendChild(card);
    });
}

document.getElementById('btn-volver').onclick = () => {
    cambiarVista('menu-niveles');
};
