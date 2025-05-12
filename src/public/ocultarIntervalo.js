$(function () {
  const $tipoTarea = $('#crearOrden #select');
  const $intPeriodica = $('#crearOrden #intPeriodica');
  const $intervaloPeriodica = $('#crearOrden #intervaloPeriodica');
  const $lapsoPeriodica = $('#crearOrden #lapsoPeriodica');
  const $unidadperiodica = $('#crearOrden #unidadperiodica');

  function actualizarVisibilidadCamposPeriodicos() {
    const esProgramada = $tipoTarea.val() === 'Programada';
    $intPeriodica.toggle(esProgramada);
    $intervaloPeriodica.toggle(esProgramada);
    $lapsoPeriodica.toggle(esProgramada);
    $unidadperiodica.toggle(esProgramada);
  }

  // Cambio en el select "Tipo de tarea"
  $tipoTarea.on('change', actualizarVisibilidadCamposPeriodicos);

  // Cada vez que se abre el modal
  $('#crearOrden').on('shown.bs.modal', function () {
    actualizarVisibilidadCamposPeriodicos();
    actualizarCamposProduccion(); // También actualiza los campos por si el checkbox ya está marcado
  });

  // Manejo del checkbox "Tarea de producción"
  const $produccion = $('#crearOrden #produccion');
  const $grupoElemento = $('#crearOrden #grupoElemento');
  const $grupoDescripcion = $('#crearOrden #grupoDescripcion');

  function actualizarCamposProduccion() {
    if ($produccion.is(':checked')) {
      $grupoElemento.hide();
      $grupoDescripcion.hide();
    } else {
      $grupoElemento.show();
      $grupoDescripcion.show();
    }
  }

  $produccion.on('change', actualizarCamposProduccion);
});
