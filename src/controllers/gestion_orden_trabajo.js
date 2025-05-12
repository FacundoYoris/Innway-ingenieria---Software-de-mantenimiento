import moment from "moment";
import connection from "../database/db.js";
import express from 'express';

const save = (req, res) => {
  const tipo = req.body.select;
  const tarea = req.body.tarea;
  const fecha = req.body.fecha;
  const activo = req.body.activo;
  const Responsable = req.body.Responsable;
  const Prioridad = req.body.Prioridad;
  const descripcion = req.body.descripcion;
  const lapso = req.body.lapsoPeriodica;
  const elemento = req.body.elemento;

  // Nuevos campos
  const produccion = req.body.produccion === 'on' ? 1 : 0;
  const unidad = req.body.unidadTiempo;
  const intervencion = req.body.tipoIntervencion;

  connection.query('INSERT INTO orden_trabajo SET ?', {
    tipo: tipo,
    actividad: tarea,
    fecha_inicio: fecha,
    activo: activo,
    responsable: Responsable,
    prioridad: Prioridad,
    lapsoProgramada: lapso,
    usuario_creador: req.session.userName,
    descripción_problematica: descripcion,
    elemento: elemento,
    tarea_produccion: produccion,
    unidad: unidad,
    intervencion: intervencion,
  }, (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect('/orden-de-trabajo/generar-orden');
    }
  });
};


const update = (req, res)=>{
   const id = req.body.id;
   const tipo = req.body.select;
   const tarea = req.body.tarea; //Esto es "actividad" en la BDD
   const activo = req.body.activo;
   const Responsable = req.body.Responsable;
   const Prioridad = req.body.Prioridad;
   const descripcion = req.body.descripcion;
   const lapso = req.body.lapPeriodica;
   const estado = req.body.estado;
   const solucion = req.body.descripcionSolucion;
   const elemento = req.body.elemento;

   // //formatear fecha 
   // const dateDB = new Date(req.body.fecha);//Toma la fecha que viene del formulario
   // let year = dateDB.getFullYear();//filtra el año
   // let month = dateDB.getMonth() + 1;//filtra el mes (tira siempre un mes menos, empieza desde el cero)
   // let day  = dateDB.getDate(); // filtra el dia
   // let hour = dateDB.getHours(); //filtra la hora
   // let minute = dateDB.getMinutes(); //filtra los minutos
   // month = (month < 10 ? "0" : "") + month; //Le da formato "0X si es menor a 10"
   // day = (day < 10 ? "0" : "") + day; 
   // hour = (hour < 10 ? "0" : "") + hour;
   // minute = (minute < 10 ? "0" : "") + minute;
   // const fechaFormateada = `${day}/${month}/${year} ${hour}:${minute}`;
   //ACá cambié fechaFormateada por req.body.fecha
   connection.query('UPDATE orden_trabajo SET ? WHERE id_orden_trabajo = ?', [{estado:estado,tipo: tipo, actividad: tarea, fecha_inicio:req.body.fecha, activo:activo, responsable:Responsable,  prioridad:Prioridad, usuario_creador: req.session.userName, descripción_problematica:descripcion,lapsoProgramada:lapso,descripcion_solucion:solucion,elemento:elemento},id],(error,results)=>{
      if(error){
         console.log(error);
      }else{
         res.redirect('/orden-de-trabajo/generar-orden');
      }
   })
};

const cambiarEstadoPendienteEnProceso = (req, res) => {
   const idOrden = req.body.id;
   const inhabilitarActivo = req.body.inhabilitarActivo === 'on';
 
   const fechaInicioReal = new Date();
   const fechaMoment = moment(fechaInicioReal, 'YYYY-MM-DD HH:mm:ss.SSS').format('YYYY-MM-DDTHH:mm');
   console.log(fechaMoment);
 
   // Actualizar orden de trabajo
   connection.query(
     'UPDATE orden_trabajo SET ? WHERE id_orden_trabajo = ?',
     [{ estado: "En proceso", fecha_inicio_real: fechaMoment }, idOrden],
     (error, results) => {
       if (error) {
         console.log(error);
         return res.status(500).send("Error al actualizar la orden.");
       }
 
       if (inhabilitarActivo) {
         // Obtener el nombre del activo asociado
         connection.query(
           'SELECT activo FROM orden_trabajo WHERE id_orden_trabajo = ?',
           [idOrden],
           (err, result) => {
             if (err) {
               console.log(err);
               return res.status(500).send("Error al obtener el activo.");
             }
 
             if (result.length === 0) return res.redirect('/orden-de-trabajo/pendiente');
 
             const nombreActivo = result[0].activo;
 
             // Actualizar el estado del activo en la tabla activos
             connection.query(
               'UPDATE activos SET estado = "Fuera de servicio" WHERE nombre = ?',
               [nombreActivo],
               (err2) => {
                 if (err2) {
                   console.log(err2);
                   // Continua redirección aunque falle la actualización del activo
                 }
                 return res.redirect('/orden-de-trabajo/pendiente');
               }
             );
           }
         );
       } else {
         return res.redirect('/orden-de-trabajo/pendiente');
       }
     }
   );
 };
 

 const cambiarEstadoEnProcesoTerminada = (req, res) => {
   console.log("Datos recibidos:");
   console.log(req.body);
 
   const id = req.body.id;
   const tipo = req.body.tipo;
   const descripcionSolucion = req.body.descripcionSolucion;
   const lapsoHorasMilisegundos = req.body.horas * 3600000;
   const fechaInicioReal = req.body.inicioReal;
   const switchActivoDisponible = req.body.activoDisponible === 'on';
 
   const fechaFin = new Date(req.body.fechaFin);
   const fechaMomentFin = moment(fechaFin).format('YYYY-MM-DDTHH:mm');
 
   const year = fechaInicioReal.substring(0, 4);
   const month = fechaInicioReal.substring(5, 7) - 1;
   const day = fechaInicioReal.substring(8, 10);
   const hour = fechaInicioReal.substring(11, 13);
   const minute = fechaInicioReal.substring(14, 16);
   const fechaInicioRealTipoDate = new Date(year, month, day, hour, minute);
   const duracionOT = (fechaFin.getTime() - fechaInicioRealTipoDate.getTime()) / 3600000;
 
   // Procesar materiales
   let materiales = [];
   Object.keys(req.body).forEach(key => {
     const match = key.match(/materiales\[(\d+)\]\[(id|cantidad)\]/);
     if (match) {
       const index = match[1];
       const field = match[2];
       if (!materiales[index]) materiales[index] = { id: null, cantidad: 0 };
       if (field === 'id') materiales[index].id = req.body[key];
       if (field === 'cantidad') materiales[index].cantidad = parseInt(req.body[key], 10);
     }
   });
 
   const materialesActualizables = materiales.filter(material => material.cantidad > 0);
   materialesActualizables.forEach(({ id, cantidad }) => {
     connection.query(
       'UPDATE stock SET cantidad = cantidad - ? WHERE idstock = ?',
       [cantidad, id],
       (error) => {
         if (error) {
           console.log(`Error al actualizar stock para el material ${id}:`, error);
         }
       }
     );
   });
 
   // Función auxiliar para cambiar el activo a "Disponible" si corresponde
   function actualizarActivoSiCorresponde(callback) {
     if (!switchActivoDisponible) return callback(); // Si no está marcado, continuar
 
     // Obtener nombre del activo
     connection.query(
       'SELECT activo FROM orden_trabajo WHERE id_orden_trabajo = ?',
       [id],
       (error, result) => {
         if (error || result.length === 0) {
           console.log("Error al obtener el activo para actualizar:", error);
           return callback(); // Continuar sin romper si hay error
         }
 
         const nombreActivo = result[0].activo;
         connection.query(
           'UPDATE activos SET estado = "Disponible" WHERE nombre = ?',
           [nombreActivo],
           (err2) => {
             if (err2) {
               console.log("Error al actualizar el estado del activo:", err2);
             } else {
               console.log(`Activo "${nombreActivo}" actualizado a Disponible.`);
             }
             return callback(); // Continuar luego del update
           }
         );
       }
     );
   }
 
   if (tipo === "Correctiva") {
     connection.query(
       'UPDATE orden_trabajo SET ? WHERE id_orden_trabajo = ?',
       [{ estado: "Finalizada", fecha_fin: fechaMomentFin, horas_totales: duracionOT }, id],
       (error) => {
         if (error) {
           console.error(error);
           return res.status(500).send("Error al actualizar la orden de trabajo.");
         }
 
         actualizarActivoSiCorresponde(() => {
           res.redirect('/orden-de-trabajo/en-proceso');
         });
       }
     );
   } else {
     const nuevaFechaInicio = new Date(fechaFin.getTime() + lapsoHorasMilisegundos);
     const fechaMomentInicio = moment(nuevaFechaInicio).format("YYYY-MM-DDTHH:mm");
 
     connection.query(
       'INSERT INTO ot_programada_finalizada SET ?',
       {
         id_orden_programada: id,
         fecha_inicio: fechaInicioReal,
         fecha_inicio_real: fechaInicioReal,
         fecha_fin: fechaMomentFin,
         observacion: descripcionSolucion,
         horas_totales: duracionOT
       },
       (error) => {
         if (error) {
           console.error(error);
           return res.status(500).send("Error al insertar en ot_programada_finalizada.");
         }
 
         connection.query(
           'UPDATE orden_trabajo SET ? WHERE id_orden_trabajo = ?',
           [{ estado: "Pendiente", fecha_inicio: fechaMomentInicio }, id],
           (error) => {
             if (error) {
               console.error("Error al actualizar la orden programada:", error);
               return res.status(500).send("Error al actualizar la orden programada.");
             }
 
             actualizarActivoSiCorresponde(() => {
               console.log("Orden programada finalizada y activo actualizado si correspondía.");
               res.redirect('/orden-de-trabajo/en-proceso');
             });
           }
         );
       }
     );
   }
 };
 

const eliminarOrden = (req, res)=>{
   const id = req.body.id;
   connection.query('DELETE FROM orden_trabajo WHERE id_orden_trabajo = ?', [id], (error, results)=>{
       
       if(error){
           throw error;
       }else{
           res.redirect('/orden-de-trabajo/generar-orden');
       }

       });
};

const modificarDatosPersonales = (req, res) => {
   const usuario = req.body.usuario;
   const password = req.body.passwordActual;
   const userModification = req.body.userModification;
   const usuarioNuevo = req.body.usuarioNuevo;
   const passwordModification = req.body.passwordModification;
   const newPassword = req.body.newPassword;
   const repetirNewPassword = req.body.repetirNewPassword;
   const nombre = req.body.nombre;
   const apellido = req.body.apellido;
   const telefono = req.body.telefono;

   if (usuario === req.session.userName) {
      connection.query('SELECT contraseña FROM usuarios WHERE usuario = ?', [usuario], (error, results) => {
         if (error) {
            console.error(error);
            return res.render('feedback', { message: 'Error interno del servidor', success: false });
         }

         if (results.length > 0 && results[0].contraseña === password) {
            const updateData = { nombre, apellido, telefono };

            // Modificar usuario
            if (userModification === "yes") {
               updateData.usuario = usuarioNuevo;
            }

            // Modificar contraseña
            if (passwordModification === "yes") {
               if (newPassword === repetirNewPassword) {
                  updateData.contraseña = newPassword;
               } else {
                  return res.render('feedback', { message: 'Las contraseñas no coinciden', success: false });
               }
            }

            // Actualizar en la base de datos
            connection.query('UPDATE usuarios SET ? WHERE usuario = ?', [updateData, usuario], (error) => {
               if (error) {
                  console.error(error);
                  return res.render('feedback', { message: 'Error al actualizar los datos', success: false });
               }

               const message = passwordModification === "yes" || userModification === "yes"
                  ? 'Datos actualizados con éxito. Inicie sesión nuevamente.'
                  : 'Datos actualizados con éxito.';
               const redirect = passwordModification === "yes" || userModification === "yes";

               res.render('feedback', { message, success: true });

               // Redirigir tras mostrar feedback, si es necesario
               if (redirect) {
                  setTimeout(() => res.redirect('/cerrarSesion'), 3000); // 3 segundos
               }
            });
         } else {
            res.render('feedback', { message: 'Usuario o contraseña incorrectos', success: false });
         }
      });
   } else {
      res.render('feedback', { message: 'Usuario inválido o sesión expirada', success: false });
   }
};




export default {
   save, 
   update,
   cambiarEstadoPendienteEnProceso,
   cambiarEstadoEnProcesoTerminada,
   eliminarOrden,
   modificarDatosPersonales,
};









// //formatear fecha 
   // const dateDB = new Date(req.body.fecha);//Toma la fecha que viene del formulario
   // let year = dateDB.getFullYear();//filtra el año
   // let month = dateDB.getMonth() + 1;//filtra el mes (tira siempre un mes menos, empieza desde el cero)
   // let day  = dateDB.getDate(); // filtra el dia
   // let hour = dateDB.getHours(); //filtra la hora
   // let minute = dateDB.getMinutes(); //filtra los minutos
   // month = (month < 10 ? "0" : "") + month; //Le da formato "0X si es menor a 10"
   // day = (day < 10 ? "0" : "") + day; 
   // hour = (hour < 10 ? "0" : "") + hour;
   // minute = (minute < 10 ? "0" : "") + minute;
   // const fechaFormateada = `${day}/${month}/${year} ${hour}:${minute}`;