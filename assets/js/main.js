$(document).ready(function () {
  // ------------------- INDEX -------------------
  if ($('#carrusel').length) {
    cargarCarrusel();
  }

  // ------------------ SEARCH -------------------
  if ($('#busqueda-form').length) {
    cargarRazas();

    $('#raza').on('change', function () {
      const raza = $(this).val();
      if (raza) {
        cargarSubrazas(raza);
      } else {
        $('#subraza').hide();
      }
    });

    $('#busqueda-form').on('submit', function (e) {
      e.preventDefault();
      buscarImagenes();
    });
  }
});

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

function buscarImagenes() {
  const raza = $('#raza').val();
  const subraza = $('#subraza').val();
  const cantidad = parseInt($('#cantidad').val());

  $('#mensaje-error').text('');

  if (!raza || !cantidad || cantidad <= 0) {
    return mostrarError('Completa todos los campos correctamente');
  }

  let url = subraza
    ? `https://dog.ceo/api/breed/${raza}/${subraza}/images/random/${cantidad}`
    : `https://dog.ceo/api/breed/${raza}/images/random/${cantidad}`;

  $.get(url)
    .done(function (data) {
      const urls = [...new Set(data.message)]; // Elimina duplicados
      $('#resultados').empty();
      urls.forEach(img => {
        $('#resultados').append(`<img src="${img}" alt="Perro">`);
      });
    })
    .fail(() => mostrarError('Error al cargar imágenes de la API'));
}

function mostrarError(msg) {
  $('#mensaje-error').text(msg);
}
