$(document).ready(function () {
  inicializarLanding();
  inicializarBuscador();
});

// ---------- Inicializaciones ----------
function inicializarLanding() {
  if (!$('#carrusel').length) return;
  cargarCarrusel();
}

function inicializarBuscador() {
  if (!$('#busqueda-form').length) return;

  cargarRazas();

  $('#raza').on('change', function () {
    const razaSeleccionada = $(this).val();
    if (razaSeleccionada) {
      cargarSubrazas(razaSeleccionada);
    } else {
      $('#subraza').hide();
    }
  });

  $('#busqueda-form').on('submit', function (event) {
    event.preventDefault();
    buscarImagenes();
  });
}

// ---------- Funciones Landing ----------
function cargarCarrusel() {
  $.get('https://dog.ceo/api/breeds/image/random/5')
    .done(function (data) {
      const imagenes = data.message;
      $('#carrusel').empty();
      imagenes.forEach(url => {
        $('#carrusel').append(`<img src="${url}" alt="Perro">`);
      });
    })
    .fail(() => mostrarError('Error al cargar el carrusel'));
}

// ---------- Funciones Search ----------
function cargarRazas() {
  $.get('https://dog.ceo/api/breeds/list/all')
    .done(function (data) {
      const razas = data.message;
      $('#raza').append(
        Object.keys(razas)
          .map(raza => `<option value="${raza}">${raza}</option>`)
          .join('')
      );
    })
    .fail(() => mostrarError('No se pudieron cargar las razas'));
}

function cargarSubrazas(raza) {
  $.get(`https://dog.ceo/api/breed/${raza}/list`)
    .done(function (data) {
      const subrazas = data.message;
      if (subrazas.length > 0) {
        $('#subraza').empty().append('<option value="">Selecciona una subraza</option>');
        subrazas.forEach(sub => {
          $('#subraza').append(`<option value="${sub}">${sub}</option>`);
        });
        $('#subraza').show();
      } else {
        $('#subraza').hide();
      }
    })
    .fail(() => mostrarError('No se pudieron cargar las subrazas'));
}

async function buscarImagenes() {
  const raza = $('#raza').val();
  const subraza = $('#subraza').val();
  const cantidad = parseInt($('#cantidad').val(), 10);

  limpiarErrores();

  if (!raza || !cantidad || cantidad <= 0) {
    mostrarError('Completa todos los campos correctamente');
    return;
  }

  const construirUrl = cantidadSolicitada =>
    subraza
      ? `https://dog.ceo/api/breed/${raza}/${subraza}/images/random/${cantidadSolicitada}`
      : `https://dog.ceo/api/breed/${raza}/images/random/${cantidadSolicitada}`;

  try {
    const { imagenesUnicas, sinMasResultados } = await obtenerImagenesUnicas(
      cantidad,
      construirUrl
    );

    const imagenesFinales = await completarConDuplicados(
      imagenesUnicas,
      cantidad,
      sinMasResultados,
      construirUrl
    );

    renderizarImagenes(imagenesFinales);
  } catch (error) {
    mostrarError('Error al cargar imágenes de la API');
  }
}

async function obtenerImagenesUnicas(cantidad, construirUrl) {
  const imagenes = new Set();
  const maxIntentos = 10;
  let intentos = 0;

  while (imagenes.size < cantidad && intentos < maxIntentos) {
    const faltantes = cantidad - imagenes.size;
    const respuesta = await $.get(construirUrl(faltantes));
    [].concat(respuesta.message).forEach(url => imagenes.add(url));
    intentos++;
  }

  const sinMasResultados = intentos === maxIntentos && imagenes.size < cantidad;
  return { imagenesUnicas: Array.from(imagenes), sinMasResultados };
}

async function completarConDuplicados(imagenesUnicas, cantidad, sinMasResultados, construirUrl) {
  if (imagenesUnicas.length >= cantidad) {
    return imagenesAncladas(imagenesUnicas, cantidad);
  }

  const faltantes = cantidad - imagenesUnicas.length;
  const respuesta = await $.get(construirUrl(faltantes));
  const adicionales = [].concat(respuesta.message).slice(0, faltantes);

  if (sinMasResultados) {
    return [...imagenesUnicas, ...adicionales];
  }

  const nuevasUnicas = [...imagenesUnicas, ...adicionales.filter(url => !imagenesUnicas.includes(url))];
  if (nuevasUnicas.length >= cantidad) {
    return imagenesAncladas(nuevasUnicas, cantidad);
  }

  return [...nuevasUnicas, ...imagenesAncladas(adicionales, cantidad - nuevasUnicas.length)];
}

function imagenesAncladas(imagenes, limite) {
  return imagenes.slice(0, limite);
}

function renderizarImagenes(imagenes) {
  $('#resultados').empty();
  imagenes.forEach(img => {
    $('#resultados').append(`<img src="${img}" alt="Perro">`);
  });
}

function limpiarErrores() {
  $('#mensaje-error').text('');
  $('#mensaje-error-landing').remove();
}

function mostrarError(msg) {
  const $mensajeError = $('#mensaje-error');

  if ($mensajeError.length) {
    $mensajeError.text(msg).attr('role', 'alert').show();
    return;
  }

  const $fallback = $('#mensaje-error-landing');
  if ($fallback.length) {
    $fallback.text(msg).attr('role', 'alert').show();
    return;
  }

  if ($('#carrusel').length) {
    const $nuevoError = $('<div>', {
      id: 'mensaje-error-landing',
      class: 'error',
      text: msg,
      role: 'alert'
    });
    $('#carrusel').after($nuevoError);
    return;
  }

  $('body').prepend(
    `<div id="mensaje-error-landing" class="error" role="alert">${msg}</div>`
  );
}
