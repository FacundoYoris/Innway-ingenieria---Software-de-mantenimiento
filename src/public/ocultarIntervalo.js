$(document).ready(function() {
  $('select').on('change', function() { //Change detecta cuando se hace un cambio en el input del formulario que tiene id=select
    var selectedValue = $(this).val();
    $('#intervaloPeriodica, #lapsoPeriodica, #intPeriodica, #lapPeriodica').toggle(selectedValue === "Programada");
  });

  const $produccion = $('#produccion');
  const $grupoElemento = $('#grupoElemento');
  const $grupoDescripcion = $('#grupoDescripcion');

  function toggleCamposProduccion() {
    if ($produccion.is(':checked')) {
      $grupoElemento.hide();
      $grupoDescripcion.hide();
    } else {
      $grupoElemento.show();
      $grupoDescripcion.show();
    }
  }

  // Ejecutar cuando se marca/desmarca
  $produccion.on('change', toggleCamposProduccion);

  // Ejecutar al cargar (por si viene ya marcado)
  toggleCamposProduccion();

});


