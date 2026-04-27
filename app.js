let preguntasActuales = [];
let indiceActual = 0;
let aciertos = 0;
let totalPreguntasTest = 35; // Real exam standard
let testActivo = 'teorico';

const vistas = {
    menu: document.getElementById('menu-niveles'),
    quiz: document.getElementById('quiz-container'),
    resultados: document.getElementById('resultados-container')
};

// Event Listeners para el menú
document.querySelectorAll('.btn-nivel[data-start]').forEach(btn => {
    btn.addEventListener('click', () => {
        const inicio = parseInt(btn.dataset.start);
        const fin = parseInt(btn.dataset.end);
        iniciarTestTeorico(inicio, fin);
    });
});

document.getElementById('btn-start-signs').addEventListener('click', () => {
    iniciarTestSenales();
});

function iniciarTestTeorico(inicio, fin) {
    testActivo = 'teorico';
    if (typeof bancoPreguntas === 'undefined') {
        alert("Error: Banco de preguntas no cargado.");
        return;
    }
    const preguntasFiltradas = bancoPreguntas.filter(p => p.id >= inicio && p.id <= fin);
    
    if(preguntasFiltradas.length === 0) {
        alert("Error al cargar preguntas de este rango.");
        return;
    }

    // Seleccionamos un máximo de 35 preguntas aleatorias del rango
    totalPreguntasTest = Math.min(35, preguntasFiltradas.length);
    preguntasActuales = shuffleArray([...preguntasFiltradas]).slice(0, totalPreguntasTest);
    
    prepararQuiz();
}

function iniciarTestSenales() {
    testActivo = 'senales';
    if (typeof bancoSenales === 'undefined') {
        alert("Error: Banco de señales no cargado.");
        return;
    }
    // Usamos todas las señales disponibles o un máximo de 30
    totalPreguntasTest = Math.min(30, bancoSenales.length);
    preguntasActuales = shuffleArray([...bancoSenales]).slice(0, totalPreguntasTest);
    
    prepararQuiz();
}

function prepararQuiz() {
    indiceActual = 0;
    aciertos = 0;
    cambiarVista('quiz');
    mostrarPregunta();
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
        btnSeleccionado.style.transform = 'scale(1.02)';
    } else {
        btnSeleccionado.classList.add('wrong');
        todosLosBotones[indiceCorrecto].classList.add('correct');
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
        estadoElement.innerText = "APROBADO";
        estadoElement.className = "score-label aprobado";
        mensajeElement.innerHTML = `¡Felicidades! Has superado el test con <strong>${aciertos} de ${totalPreguntasTest}</strong> respuestas correctas.<br><small>Estás listo para el examen municipal.</small>`;
    } else {
        estadoElement.innerText = "REPROBADO";
        estadoElement.className = "score-label reprobado";
        mensajeElement.innerHTML = `No has alcanzado el 80% mínimo (Obtuviste <strong>${aciertos} de ${totalPreguntasTest}</strong>).<br><small>Te recomendamos repasar los contenidos y volver a intentarlo.</small>`;
    }
}

document.getElementById('btn-volver').addEventListener('click', () => {
    cambiarVista('menu');
});

// Helpers
function cambiarVista(vistaActiva) {
    Object.values(vistas).forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const activeView = vistas[vistaActiva];
    activeView.style.display = 'block';
    void activeView.offsetWidth;
    activeView.classList.add('active');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
