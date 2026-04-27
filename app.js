let preguntasActuales = [];
let indiceActual = 0;
let aciertos = 0;
let totalPreguntasTest = 10;

const vistas = {
    menu: document.getElementById('menu-niveles'),
    quiz: document.getElementById('quiz-container'),
    resultados: document.getElementById('resultados-container')
};

document.querySelectorAll('.btn-nivel').forEach(btn => {
    btn.addEventListener('click', () => {
        const inicio = parseInt(btn.dataset.start);
        const fin = parseInt(btn.dataset.end);
        iniciarTest(inicio, fin);
    });
});

function iniciarTest(inicio, fin) {
    const preguntasFiltradas = bancoPreguntas.filter(p => p.id >= inicio && p.id <= fin);
    
    if(preguntasFiltradas.length === 0) {
        alert(`Aún no has cargado preguntas del ${inicio} al ${fin} en tu archivo preguntas.js`);
        return;
    }

    totalPreguntasTest = Math.min(10, preguntasFiltradas.length);
    preguntasActuales = preguntasFiltradas.sort(() => 0.5 - Math.random()).slice(0, totalPreguntasTest);
    
    indiceActual = 0;
    aciertos = 0;
    
    cambiarVista('quiz');
    mostrarPregunta();
}

function mostrarPregunta() {
    const preguntaActual = preguntasActuales[indiceActual];
    
    document.getElementById('pregunta-counter').innerText = `Pregunta ${indiceActual + 1} de ${totalPreguntasTest}`;
    document.getElementById('score-counter').innerText = `Aciertos: ${aciertos}`;
    document.getElementById('pregunta-text').innerText = `${preguntaActual.id}. ${preguntaActual.pregunta}`;
    
    const contenedorOpciones = document.getElementById('opciones-container');
    contenedorOpciones.innerHTML = '';
    
    preguntaActual.opciones.forEach((opcionTexto, index) => {
        const btnOpcion = document.createElement('button');
        btnOpcion.className = 'opcion';
        btnOpcion.innerText = opcionTexto;
        btnOpcion.onclick = () => evaluarRespuesta(btnOpcion, index, preguntaActual.correcta);
        contenedorOpciones.appendChild(btnOpcion);
    });
    
    document.getElementById('btn-siguiente').classList.add('hidden');
}

function evaluarRespuesta(btnSeleccionado, indiceSeleccionado, indiceCorrecto) {
    const todosLosBotones = document.querySelectorAll('.opcion');
    todosLosBotones.forEach(btn => btn.disabled = true);
    
    if (indiceSeleccionado === indiceCorrecto) {
        btnSeleccionado.classList.add('correct');
        aciertos++;
        document.getElementById('score-counter').innerText = `Aciertos: ${aciertos}`;
    } else {
        btnSeleccionado.classList.add('wrong');
        todosLosBotones[indiceCorrecto].classList.add('correct');
    }
    
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
    document.getElementById('resultado-final').innerText = `${aciertos}/${totalPreguntasTest}`;
    
    const mensaje = document.getElementById('mensaje-final');
    const porcentaje = (aciertos / totalPreguntasTest) * 100;

    if(porcentaje >= 80) {
        mensaje.innerText = "¡Aprobado! Excelente nivel de conocimiento.";
    } else if (porcentaje >= 50) {
        mensaje.innerText = "Cerca de aprobar. Necesitas repasar un poco más el Libro del Nuevo Conductor.";
    } else {
        mensaje.innerText = "Reprobado. Te recomendamos volver a estudiar el manual antes de dar el examen.";
    }
}

document.getElementById('btn-volver').addEventListener('click', () => {
    cambiarVista('menu');
});

function cambiarVista(vistaActiva) {
    Object.values(vistas).forEach(v => v.classList.remove('active'));
    vistas[vistaActiva].classList.add('active');
}
