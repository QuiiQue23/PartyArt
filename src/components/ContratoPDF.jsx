import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b' },
  
  // Encabezado
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ec4899', paddingBottom: 8, marginBottom: 12 },
  brandTitle: { fontSize: 18, fontWeight: 'bold', color: '#db2777' },
  brandSlogan: { fontSize: 8, fontStyle: 'italic', color: '#64748b' },
  headerContact: { textAlign: 'right', fontSize: 8, color: '#334155' },
  
  docTitle: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginVertical: 8, textTransform: 'uppercase' },

  // Párrafos y Secciones
  introText: { leading: 1.3, marginBottom: 8, textAlign: 'justify' },
  boldText: { fontWeight: 'bold' },

  sectionBox: { border: '1px solid #cbd5e1', borderRadius: 4, padding: 8, marginBottom: 10, backgroundColor: '#f8fafc' },
  sectionHeader: { fontSize: 9, fontWeight: 'bold', color: '#db2777', marginBottom: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  colHalf: { width: '48%' },

  clausulaText: { leading: 1.3, marginBottom: 6, textAlign: 'justify' },

  // Firmas
  signaturesArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureImage: { width: 120, height: 45, marginBottom: 4 },
  signatureLine: { borderTop: '1px solid #64748b', width: '100%', marginTop: 4 },
  signatureLabel: { fontSize: 8, fontWeight: 'bold', marginTop: 4, color: '#1e293b', textAlign: 'center' }
});

export default function ContratoPDF({ cotizacion, cliente, detalles, firmaUrl }) {
  // Formatear Fecha Actual
  const hoy = new Date();
  const diaHoy = hoy.getDate();
  const mesHoy = hoy.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
  const anioHoy = hoy.getFullYear();

  // Formatear Fecha del Evento
  let fechaEventoStr = 'POR DEFINIR';
  if (cotizacion.fecha_evento) {
    const fe = new Date(cotizacion.fecha_evento);
    fechaEventoStr = fe.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase();
  }

  // Extraer Hora del Evento si viene formateada en fecha_evento
  let horaEventoStr = 'POR DEFINIR';
  if (cotizacion.fecha_evento) {
    horaEventoStr = new Date(cotizacion.fecha_evento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  // Generar string del desglose del servicio
  const listaServicios = detalles.map(d => {
    const nombre = d.descripcion_custom || d.inventario?.nombre || 'Artículo';
    return `${d.cantidad} ${nombre}`;
  }).join(', ');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* ENCABEZADO "PARTY ART" */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.brandTitle}>PARTY ART</Text>
            <Text style={styles.brandSlogan}>"Decoramos tu evento o momento tan especial"</Text>
          </View>
          <View style={styles.headerContact}>
            <Text style={{ fontWeight: 'bold' }}>Tel: 2287571345</Text>
            <Text>Xalapa-Coatepec y alrededores</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>CONTRATO DE PRESTACIÓN DE SERVICIOS</Text>

        {/* COMPARECIENTES */}
        <Text style={styles.introText}>
          CONTRATO DE PRESTACIÓN DE SERVICIOS QUE CELEBRAN POR UNA PARTE LA <Text style={styles.boldText}>C. MIRYAM DOMÍNGUEZ</Text> EN SU CALIDAD DE REPRESENTANTE DEL SERVICIO DE DECORACIÓN DENOMINADA <Text style={styles.boldText}>"PARTY ART DECORACIONES"</Text>, QUE EN LO SUCESIVO SE LE DENOMINARÁ "EL CONTRATADO" Y POR LA OTRA <Text style={styles.boldText}>{cliente?.nombre ? cliente.nombre.toUpperCase() : '____________________'}</Text>, QUE EN LO SUCESIVO SE LE DENOMINARÁ "EL CONTRATANTE".
        </Text>

        {/* ANTECEDENTES */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>ANTECEDENTES</Text>
          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>DE "EL CONTRATADO":</Text> REPRESENTA LA EMPRESA "PARTY ART DECORACIONES", CON DOMICILIO EN 16 DE SEPTIEMBRE No. 117 COL. CENTRO, COATEPEC, VER., RECONOCE POSEER FACULTADES Y VOLUNTAD PARA CELEBRAR EL PRESENTE CONTRATO.
          </Text>
          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>DE "EL CONTRATANTE":</Text> TEL: {cliente?.telefono || 'N/A'}. MANIFIESTA TENER SU DOMICILIO EN: {cliente?.direccion_habitual ? cliente.direccion_habitual.toUpperCase() : 'XALAPA/ZONA METROPOLITANA'}. TAMBIÉN RECONOCE POSEER FACULTADES Y VOLUNTAD PARA LA CELEBRACIÓN DEL PRESENTE CONTRATO.
          </Text>
        </View>

        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 6 }}>
          AMBAS PARTES RECONOCEN LA PERSONALIDAD CON QUE SE OSTENTAN Y ACUERDAN CELEBRAR EL PRESENTE CONTRATO, DESARROLLÁNDOSE BAJO LAS SIGUIENTES:
        </Text>

        {/* CLÁUSULAS */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionHeader}>CLÁUSULAS</Text>
          
          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>I.-</Text> "EL CONTRATANTE" <Text style={styles.boldText}>{cliente?.nombre?.toUpperCase()}</Text> CONTRATA EL SERVICIO DE DECORACIÓN EN EL SALÓN / LUGAR UBICADO EN: <Text style={styles.boldText}>{cotizacion.lugar_evento ? cotizacion.lugar_evento.toUpperCase() : 'XALAPA/COATEPEC'}</Text>. TIPO DE EVENTO: <Text style={styles.boldText}>{cotizacion.tematica ? cotizacion.tematica.toUpperCase() : 'CUMPLEAÑOS / SOCIAL'}</Text>. HORA DEL EVENTO: <Text style={styles.boldText}>{horaEventoStr}</Text>.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>II.-</Text> EL EVENTO SE EFECTUARÁ EL DÍA: <Text style={styles.boldText}>{fechaEventoStr}</Text>.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>III.-</Text> EL COSTO DEL SERVICIO ES POR LA CANTIDAD DE: <Text style={styles.boldText}>${parseFloat(cotizacion.total || 0).toFixed(2)} MXN</Text>.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>IV.- EL SERVICIO CONTRATADO INCLUYE:</Text> {listaServicios || 'DECORACIÓN SEGÚN PROPUESTA ADJUNTA'}.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>V.-</Text> "EL CONTRATANTE" PAGA LA CANTIDAD DE <Text style={styles.boldText}>${parseFloat(cotizacion.monto_pagado || (cotizacion.total * 0.5)).toFixed(2)} MXN</Text> POR CONCEPTO DE ANTICIPO Y EL RESTO EL DÍA DEL EVENTO.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>VI.-</Text> SI POR CUALQUIER CIRCUNSTANCIA "EL CONTRATANTE" CANCELARE EL PRESENTE CONTRATO, POR ESTE HECHO PAGARÁ EL EQUIVALENTE AL 50% DEL MONTO TOTAL QUE SEÑALA LA CLÁUSULA TERCERA, DANDO POSIBILIDAD DE CAMBIO DE FECHA (SUJETA A DISPONIBILIDAD DE AGENDA) 7 DÍAS PREVIOS AL EVENTO.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>VII.-</Text> SI "EL CONTRATADO" CANCELARE EL CONTRATO SE SUJETARÁ A LO ESTABLECIDO EN LA CLÁUSULA ANTERIOR.
          </Text>

          <Text style={styles.clausulaText}>
            <Text style={styles.boldText}>VIII.-</Text> EN CASO DE SUSCITARSE CUALQUIER DAÑO AL EQUIPO DEL SERVICIO COMO ES: MOBILIARIO, MANTELERÍA, ESTRUCTURAS RENTADAS, "EL CONTRATANTE" SE OBLIGA DIRECTAMENTE DE LA RESPONSABILIDAD QUE DE ELLO DERIVE.
          </Text>

          <Text style={styles.clausulaText}>
            "EL CONTRATADO" SE COMPROMETE A CUMPLIR A TODAS Y CADA UNA DE LOS SERVICIOS ESTIPULADOS EN EL CONTRATO, NO DEJANDO DUDAS, TODO QUEDARÁ PLASMADO POR ESCRITO EN ESTE DOCUMENTO, Y ENTREGAR EN TIEMPO Y FORMA EL SERVICIO AL TIEMPO PREVIO DE INICIAR EL EVENTO.
          </Text>

          {cotizacion.notas && (
            <Text style={styles.clausulaText}>
              <Text style={styles.boldText}>ADICIONALES / FESTEJADOS:</Text> {cotizacion.notas.toUpperCase()}
            </Text>
          )}

          <Text style={{ fontSize: 8, marginTop: 4, textAlign: 'justify' }}>
            EL CONTRATANTE SE COMPROMETE A RESPETAR LOS TÉRMINOS DEL PRESENTE CONTRATO PRECISADOS EN LAS CLÁUSULAS ANTERIORES Y ESTÁ DE ACUERDO EN TODAS Y CADA UNA DE ELLAS ESTANDO DEBIDAMENTE ENTERADO POR HABERLES SIDO LEÍDAS Y TENER CAPACIDAD Y VOLUNTAD PARA LA CELEBRACIÓN DEL PRESENTE, SUJETÁNDOSE EN LIQUIDAR EL COMPLETO DEL MONTO TOTAL AL TÉRMINO DEL SERVICIO.
          </Text>
        </View>

        {/* LUGAR Y FECHA DE FIRMA */}
        <Text style={{ textAlign: 'right', fontSize: 8.5, fontWeight: 'bold', marginVertical: 6 }}>
          XALAPA, VER. A {diaHoy} DE {mesHoy} DE {anioHoy}.
        </Text>

        {/* FIRMAS DE AMBAS PARTES */}
        <View style={styles.signaturesArea}>
          <View style={styles.signatureBox}>
            <View style={{ height: 45, justifyContent: 'center', alignItems: 'center' }}>
              {firmaUrl ? (
                <Image src={firmaUrl} style={styles.signatureImage} />
              ) : (
                <Text style={{ fontSize: 8, color: '#94a3b8' }}>Pendiente de firma digital</Text>
              )}
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>"EL CONTRATANTE"</Text>
            <Text style={{ fontSize: 7.5, color: '#475569', textAlign: 'center' }}>
              {cliente?.nombre ? cliente.nombre.toUpperCase() : 'NOMBRE Y FIRMA'}
            </Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={{ height: 45, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontStyle: 'italic', fontWeight: 'bold', color: '#db2777' }}>
                MIRYAM L. DOMÍNGUEZ
              </Text>
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>"EL CONTRATADO"</Text>
            <Text style={{ fontSize: 7.5, color: '#475569', textAlign: 'center' }}>
              MIRYAM L. DOMÍNGUEZ / PARTY ART
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}