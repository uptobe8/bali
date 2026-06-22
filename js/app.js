'use strict';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1800&q=88',
  temple: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=88',
  rice: 'https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=1600&q=88',
  beach: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=88',
  villa: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=88',
  snorkel: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=88',
  waterfall: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=88',
  sunset: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=88',
  jungle: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=88',
  plane: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=88'
};

const pages = ['inicio','preferencias','propuestas','itinerario','mapa','vuelos','alojamientos','actividades','transportes','checklist','decision'];
const mainNav = ['inicio','preferencias','propuestas','itinerario','mapa','reservas','decision'];
let currentPage = 0;
let selectedOption = 'A';
let selectedDay = 0;
let activeReserve = 'vuelos';
let selectedMap = 0;
let mapInstance = null;
let mapMarkers = [];
let jungleAudio = null;
let audioOn = false;

const planState = {
  destination: 'Indonesia: Bali, Gili Meno y Padang Padang',
  dates: '14-16 días en agosto',
  travellers: 'Pareja + dos hijos de 18 y 19',
  budget: 'Equilibrado: bonito sin tirar el dinero',
  pace: 'Activo pero sin paliza',
  musts: 'Gili Meno, Padang Padang, snorkel, arrozales, templos, actividades molonas, beach club, 2 noches finales en villa tropical con piscina privada.',
  restrictions: 'Separar precios confirmados de importes orientativos. Evitar escalas absurdas, traslados innecesarios y días sobrecargados.'
};

const options = [
  {
    id:'A', name:'Opción A · Equilibrada', tag:'La recomendada', dates:'14-29 agosto', duration:'16 días / 14 noches', route:'Denpasar · Ubud · Sidemen · Gili Meno · Uluwatu · hotel final', budget:'2.650-3.450 €/persona', total:'10.600-13.800 € total orientativo', image:IMG.temple,
    pros:['Ritmo completo sin ir corriendo','Incluye Gili Meno y Padang Padang con margen','Buen equilibrio entre hoteles bonitos y coste'],
    cons:['Requiere reservar ferries y hoteles con antelación','No es la opción más barata si los vuelos suben'],
    verdict:'Elegir esta opción si queréis viaje memorable, cómodo y sin sensación de tour organizado.'
  },
  {
    id:'B', name:'Opción B · Más barata', tag:'Control de presupuesto', dates:'18 agosto-1 septiembre', duration:'15 días / 13 noches', route:'Denpasar · Ubud · Gili Meno · Uluwatu · Seminyak/Canggu', budget:'2.150-2.950 €/persona', total:'8.600-11.800 € total orientativo', image:IMG.rice,
    pros:['Menos noches premium','Más margen si vuelos salen caros','Mantiene lo imprescindible'],
    cons:['Cierre menos espectacular','Más riesgo de hoteles normales en agosto'],
    verdict:'Elegirla si el vuelo se dispara y preferís mantener actividades antes que hoteles caros.'
  },
  {
    id:'C', name:'Opción C · Premium cómoda', tag:'Menos fricción', dates:'10-26 agosto', duration:'17 días / 15 noches', route:'Denpasar · Ubud boutique · Gili Meno · Uluwatu · villa privada final', budget:'3.450-4.900 €/persona', total:'13.800-19.600 € total orientativo', image:IMG.villa,
    pros:['Hoteles muy visuales y cómodos','Traslados privados y menos esperas','Final wow con piscina privada'],
    cons:['Presupuesto alto','Conviene cerrar alojamiento cuanto antes'],
    verdict:'Elegirla si queréis que el viaje sea más experiencia que logística.'
  }
];

const mapPoints = [
  {name:'Aeropuerto Denpasar', days:'Días 1 y final', coords:[-8.7467,115.1668], image:IMG.plane, transport:'Llegada internacional. Taxi privado o Grab hacia Ubud: 1 h 15 min-2 h según tráfico.', cost:'18-35 € por coche', advice:'Si aterrizáis tarde, dormir cerca del aeropuerto o salir directos a Ubud al día siguiente.', query:'Ngurah Rai International Airport'},
  {name:'Ubud', days:'Días 2-5', coords:[-8.5069,115.2625], image:IMG.rice, transport:'Base interior para arrozales, templos, masaje, cafés y excursiones a cascadas.', cost:'Actividades 3-35 € por persona', advice:'Reservar alojamiento con piscina y buena ubicación; evitar alojarse lejos si no queréis depender de coche para todo.', query:'Ubud Bali'},
  {name:'Sidemen / Cascadas', days:'Día 6', coords:[-8.4667,115.4333], image:IMG.waterfall, transport:'Ruta escénica desde Ubud. Coche privado 1 h 30 min-2 h.', cost:'Coche con conductor 45-70 € día', advice:'Ideal para fotos, arrozales reales y una pausa menos masificada antes del barco.', query:'Sidemen Bali'},
  {name:'Padang Bai', days:'Día 7', coords:[-8.5311,115.5082], image:IMG.beach, transport:'Puerto práctico para barco rápido a Gili. Llegar con margen.', cost:'Barco rápido orientativo 35-65 € por persona/trayecto', advice:'Elegir ferry con buena reputación y horario de mañana para evitar mala mar por la tarde.', query:'Padang Bai Harbour'},
  {name:'Gili Meno', days:'Días 7-10', coords:[-8.3517,116.0584], image:IMG.snorkel, transport:'Isla tranquila sin tráfico convencional. Bicicleta, caminar o cidomo.', cost:'Snorkel 18-45 € por persona', advice:'Dormir cerca de playa oeste o sureste si queréis atardecer y buen acceso al agua.', query:'Gili Meno'},
  {name:'Uluwatu', days:'Días 11-13', coords:[-8.8291,115.0849], image:IMG.sunset, transport:'Base sur para acantilados, templo, beach clubs y Padang Padang.', cost:'Traslado desde puerto 35-65 € coche', advice:'No planificar demasiados cambios de playa el mismo día. El tráfico del sur pesa.', query:'Uluwatu Bali'},
  {name:'Padang Padang', days:'Día 12', coords:[-8.8107,115.1024], image:IMG.beach, transport:'Playa pequeña con acceso por escaleras. Mejor temprano o al final de la tarde.', cost:'Entrada local orientativa 1-3 € por persona', advice:'Llevar pocas cosas por los monos y porque el acceso es estrecho.', query:'Padang Padang Beach Bali'},
  {name:'Villa final selva', days:'Días 14-16', coords:[-8.267,115.066], image:IMG.villa, transport:'Cierre en Munduk, Ubud alto o costa tranquila con piscina privada.', cost:'Villa premium 180-480 €/noche orientativo', advice:'No cargar estos días: piscina, masaje, cena y fotos. El objetivo es terminar arriba.', query:'Munduk Bali villa private pool'}
];

const itinerary = [
  {day:'1', zone:'Llegada a Bali', title:'Llegada, respiro y traslado inteligente', image:IMG.plane, morning:'Vuelo internacional y llegada a Denpasar.', lunch:'Comida ligera según hora de aterrizaje.', afternoon:'Traslado privado a Ubud o noche cerca del aeropuerto si llegáis tarde.', night:'Cena sencilla y descanso. Nada de agenda dura.', transport:'Aeropuerto-Ubud 1 h 15 min-2 h', cost:'18-35 € coche', time:'Llegar, instalarse, dormir', map:'Ngurah Rai International Airport to Ubud', advice:'El primer día no se gana haciendo planes largos; se gana evitando empezar cansados.'},
  {day:'2', zone:'Ubud', title:'Arrozales, piscina y primera cena bonita', image:IMG.rice, morning:'Paseo por arrozales de Tegallalang o Campuhan Ridge temprano.', lunch:'Warung con vistas o restaurante de arrozales.', afternoon:'Piscina, masaje y paseo por el centro de Ubud.', night:'Cena especial suave, sin traslados largos.', transport:'Coche local o taxi corto', cost:'25-55 € actividades + comida', time:'08:00-21:30', map:'Tegallalang Rice Terrace Ubud', advice:'Ir pronto evita calor, tráfico y fotos llenas de gente.'},
  {day:'3', zone:'Ubud', title:'Templos, agua sagrada y mercado', image:IMG.temple, morning:'Tirta Empul o Goa Gajah con guía local.', lunch:'Comida en Ubud con pausa de calor.', afternoon:'Mercado, cafés y taller de plata o cocina balinesa.', night:'Cena familiar divertida y paseo corto.', transport:'Coche privado medio día', cost:'45-90 € grupo + entradas', time:'08:00-22:00', map:'Tirta Empul Temple', advice:'Llevar sarong o alquilarlo en el templo; vestir cómodo y respetuoso.'},
  {day:'4', zone:'Ubud', title:'Cascadas y día molón de aventura suave', image:IMG.waterfall, morning:'Tibumana o Kanto Lampo temprano.', lunch:'Comida cerca de cascadas.', afternoon:'Café, columpio o quad suave si encaja con el grupo.', night:'Noche libre en Ubud.', transport:'Coche privado 6-8 h', cost:'65-120 € grupo + entradas', time:'07:30-21:30', map:'Tibumana Waterfall Bali', advice:'Zapatillas con agarre. En agosto puede haber mucha gente si se sale tarde.'},
  {day:'5', zone:'Ubud', title:'Día flexible: familia, pareja y fotos', image:IMG.jungle, morning:'Yoga suave, spa o paseo por Monkey Forest si os apetece.', lunch:'Comida bonita en Ubud.', afternoon:'Tiempo de compras, piscina y descanso real.', night:'Cena romántica con plan alternativo para los chicos.', transport:'A pie + taxis cortos', cost:'40-110 € según spa', time:'09:30-22:30', map:'Ubud Monkey Forest', advice:'Meter un día flexible evita que el viaje parezca una carrera.'},
  {day:'6', zone:'Sidemen', title:'Arrozales auténticos y valle menos masificado', image:IMG.rice, morning:'Salida a Sidemen con paradas fotográficas.', lunch:'Comida con vistas al valle.', afternoon:'Paseo rural, piscina o mirador al Agung.', night:'Dormir en alojamiento con vistas o volver a Ubud según ruta.', transport:'Ubud-Sidemen 1 h 30 min-2 h', cost:'55-120 € grupo', time:'08:00-21:00', map:'Sidemen Bali', advice:'Muy buena transición antes de ir al puerto y cambiar de ritmo.'},
  {day:'7', zone:'Gili Meno', title:'Barco a la isla mediana y modo calma', image:IMG.snorkel, morning:'Traslado temprano a Padang Bai o Sanur.', lunch:'Barco rápido y llegada a Gili Meno.', afternoon:'Check-in, playa y reconocimiento de la isla.', night:'Cena frente al mar.', transport:'Coche + ferry rápido 1,5-2,5 h de cruce habitual', cost:'35-65 € ferry p/p + traslado', time:'06:30-21:00', map:'Padang Bai to Gili Meno', advice:'Elegir barco de mañana y no poner actividades fuertes el día de cruce.'},
  {day:'8', zone:'Gili Meno', title:'Snorkel con tortugas y agua turquesa', image:IMG.snorkel, morning:'Salida de snorkel: tortugas, estatuas submarinas y coral.', lunch:'Comida sencilla de playa.', afternoon:'Bicicleta o descanso en hamacas.', night:'Atardecer tranquilo.', transport:'Barca local + bici', cost:'18-45 € p/p snorkel', time:'08:30-21:30', map:'Gili Meno Turtle Point', advice:'Camiseta UV y crema reef-safe. Las fotos subacuáticas aquí merecen la pena.'},
  {day:'9', zone:'Gili Meno', title:'Isla sin prisa y plan de pareja/familia', image:IMG.beach, morning:'Vuelta a la isla caminando o en bici.', lunch:'Comida junto al mar.', afternoon:'Kayak, paddle o playa tranquila.', night:'Cena especial mirando a Lombok.', transport:'Bici/caminar/cidomo', cost:'15-70 € según actividad', time:'09:00-22:00', map:'Gili Meno Island', advice:'Gili Meno funciona mejor con agenda ligera. Ese es el lujo.'},
  {day:'10', zone:'Gili Meno', title:'Día colchón para mar, fotos y descanso', image:IMG.snorkel, morning:'Segundo snorkel o playa norte.', lunch:'Comida sin desplazamientos.', afternoon:'Tiempo libre para cada uno: pareja, hijos, lectura, baño.', night:'Última noche de isla.', transport:'Sin coche', cost:'20-80 € p/p', time:'Libre', map:'Gili Meno', advice:'Este día cubre mala mar, cansancio o ganas de repetir lo mejor.'},
  {day:'11', zone:'Uluwatu', title:'Regreso a Bali y acantilados del sur', image:IMG.sunset, morning:'Barco de vuelta a Bali.', lunch:'Comida cerca del puerto o ya en Uluwatu.', afternoon:'Check-in en zona sur y primer mirador.', night:'Cena con vistas.', transport:'Ferry + coche privado 2-4 h total según puerto', cost:'70-150 € grupo + ferry', time:'07:30-22:00', map:'Gili Meno to Uluwatu Bali', advice:'No contratar actividad fuerte después del ferry. Mejor atardecer y cena.'},
  {day:'12', zone:'Padang Padang', title:'Playa icónica, surf suave y beach club', image:IMG.beach, morning:'Padang Padang temprano y fotos antes de la masa.', lunch:'Comida en Bingin o zona Uluwatu.', afternoon:'Clase de surf suave o beach club.', night:'Atardecer en acantilado.', transport:'Taxis cortos o conductor local', cost:'35-120 € p/p según club/surf', time:'08:00-23:00', map:'Padang Padang Beach Bali', advice:'La playa es pequeña: temprano o tarde. Para estar horas, combinar con Bingin o Thomas Beach.'},
  {day:'13', zone:'Uluwatu', title:'Templo, Kecak y noche potente', image:IMG.temple, morning:'Mañana libre: piscina, café o playa.', lunch:'Comida sin correr.', afternoon:'Templo de Uluwatu y Kecak al atardecer.', night:'Cena especial en Uluwatu.', transport:'Coche local/taxi', cost:'Entradas y Kecak orientativo 13-18 € p/p', time:'16:00-22:30 para templo y cena', map:'Uluwatu Temple', advice:'Llevar gafas y móvil guardados por los monos. Comprar Kecak con margen.'},
  {day:'14', zone:'Villa final', title:'Llegada al hotel wow de selva y piscina privada', image:IMG.villa, morning:'Traslado sin madrugar hacia villa final.', lunch:'Comida en ruta o en el hotel.', afternoon:'Check-in, piscina privada, fotos y descanso.', night:'Cena romántica en el hotel.', transport:'Uluwatu-Munduk/Ubud alto 2,5-3,5 h', cost:'55-90 € coche + hotel', time:'10:00-22:00', map:'Munduk Bali private pool villa', advice:'No meter excursiones. Este día es para que el alojamiento sea protagonista.'},
  {day:'15', zone:'Villa final', title:'Masaje, cascada suave y cierre emocional', image:IMG.jungle, morning:'Desayuno lento y masaje.', lunch:'Comida en hotel o restaurante panorámico.', afternoon:'Cascada cercana o sesión de fotos.', night:'Cena final con brindis.', transport:'Coche corto opcional', cost:'50-140 € p/p según spa/cena', time:'09:30-22:30', map:'Munduk waterfalls Bali', advice:'Último día completo: elegir una sola actividad y dejar mucho margen.'},
  {day:'16', zone:'Salida', title:'Margen inteligente según vuelos', image:IMG.plane, morning:'Desayuno y salida sin prisas.', lunch:'Comida cerca de ruta al aeropuerto.', afternoon:'Traslado a Denpasar con margen amplio.', night:'Vuelo de regreso.', transport:'Villa-aeropuerto 2,5-4 h según zona/tráfico', cost:'45-85 € coche', time:'Según vuelo', map:'Munduk to Ngurah Rai International Airport', advice:'En Bali el tráfico puede romper el día. Salir pronto es parte del plan.'}
];

const flights = [
  {title:'Madrid/Barcelona-Denpasar equilibrado', image:IMG.plane, apps:['Skyscanner','Trip.com','eDreams','Wego'], price:'850-1.250 € p/p', schedule:'Salida tarde/noche, llegada +1 día', stops:'1 escala razonable', airlines:'Qatar, Emirates, Turkish, Etihad o Singapore según fecha', pros:'Mejor balance coste/duración', cons:'Se agota rápido en agosto', link:'https://www.skyscanner.es/transporte/vuelos/mad/dps/'},
  {title:'Comodidad por duración total', image:IMG.plane, apps:['Flight Network','FareFirst','HappyFares'], price:'1.100-1.550 € p/p', schedule:'Evitar escalas de madrugada demasiado largas', stops:'1 escala o 2 muy limpias', airlines:'Priorizar conexión clara y equipaje incluido', pros:'Menos fatiga al llegar', cons:'Puede costar 200-400 € más por persona', link:'https://www.google.com/travel/flights?q=Madrid%20to%20Denpasar%20August'},
  {title:'Flexibilidad por ventanas', image:IMG.plane, apps:['Skyscanner','Flygresor.se','Almosafer'], price:'Comparar 3 ventanas', schedule:'10-26, 14-29 y 18-1', stops:'Descartar escalas absurdas', airlines:'Mirar también salida desde Barcelona', pros:'Puede ahorrar mucho', cons:'Hay que revisar equipaje y horarios', link:'https://www.skyscanner.es/'}
];

const hotels = [
  {zone:'Ubud', title:'Boutique entre arrozales', image:IMG.rice, price:'75-180 €/noche', fit:'Primera base bonita, cómoda y fotogénica', pros:'Piscina, restaurantes, excursiones fáciles', cons:'Centro con tráfico; elegir ubicación con cuidado'},
  {zone:'Sidemen', title:'Eco lodge con valle', image:IMG.jungle, price:'90-220 €/noche', fit:'Pausa visual y menos masificada', pros:'Vistas, calma, fotos, autenticidad', cons:'Menos oferta nocturna'},
  {zone:'Gili Meno', title:'Hotel de playa tranquilo', image:IMG.snorkel, price:'80-210 €/noche', fit:'Isla mediana, snorkel y calma', pros:'Sin tráfico, mar cerca, tortugas', cons:'Oferta limitada en agosto'},
  {zone:'Uluwatu', title:'Hotel surfero premium', image:IMG.beach, price:'95-260 €/noche', fit:'Padang Padang, acantilados y beach clubs', pros:'Atardeceres y planes molones', cons:'Desplazamientos en el sur pueden ser lentos'},
  {zone:'Final wow', title:'Villa tropical con piscina privada', image:IMG.villa, price:'180-480 €/noche', fit:'Dos últimas noches memorables', pros:'Vegetación, intimidad, descanso, fotos', cons:'Reservar pronto; en agosto sube rápido'},
  {zone:'Alternativa costa', title:'Resort tranquilo frente al mar', image:IMG.sunset, price:'160-420 €/noche', fit:'Cierre más cómodo si el vuelo sale temprano', pros:'Menos traslado final', cons:'Menos sensación de selva'}
];

const activities = [
  {title:'Snorkel con tortugas', zone:'Gili Meno', image:IMG.snorkel, time:'08:30-12:00', cost:'18-45 € p/p', duration:'3-4 h', vibe:'Agua · familia · fotos', text:'La actividad más clara para el grupo: divertida, visual y con recuerdo real.'},
  {title:'Padang Padang temprano', zone:'Uluwatu', image:IMG.beach, time:'08:00-10:30', cost:'1-3 € p/p entrada orientativa', duration:'2-3 h', vibe:'Playa · surf suave', text:'Playa icónica, pequeña y muy fotogénica. Mejor evitar horas centrales.'},
  {title:'Kecak en Uluwatu', zone:'Uluwatu', image:IMG.temple, time:'17:00-19:30', cost:'13-18 € p/p orientativo', duration:'2 h', vibe:'Cultura · atardecer', text:'Plan potente de tarde: templo, acantilado y espectáculo con luz dorada.'},
  {title:'Arrozales de Ubud', zone:'Ubud', image:IMG.rice, time:'07:30-10:30', cost:'3-15 € p/p según acceso', duration:'2-3 h', vibe:'Paisaje · fotos', text:'Imprescindible visual. Conviene ir temprano y combinar con café o templo.'},
  {title:'Cascada balinesa', zone:'Ubud / Sidemen', image:IMG.waterfall, time:'08:00-12:30', cost:'2-8 € p/p entrada orientativa', duration:'3-4 h', vibe:'Aventura suave', text:'Actividad molona sin ser extrema. Llevar calzado de agua o zapatilla con agarre.'},
  {title:'Beach club con atardecer', zone:'Uluwatu', image:IMG.sunset, time:'15:30-20:30', cost:'30-120 € p/p según consumo', duration:'4-5 h', vibe:'Pareja · hijos adultos', text:'Día social y divertido. Reservar si queréis mesa buena en agosto.'},
  {title:'Clase de surf suave', zone:'Padang Padang / Uluwatu', image:IMG.beach, time:'09:00-11:00', cost:'25-50 € p/p', duration:'2 h', vibe:'Divertido · activo', text:'Perfecto para los chicos y para hacerlo en pareja si el mar está tranquilo.'},
  {title:'Spa y cena privada', zone:'Hotel final', image:IMG.villa, time:'16:00-22:00', cost:'60-160 € p/p', duration:'Tarde-noche', vibe:'Romántico · final wow', text:'Cierre con sensación de viaje especial: masaje, piscina y cena sin desplazamientos.'}
];

const transports = [
  {from:'Denpasar', to:'Ubud', time:'1 h 15 min-2 h', cost:'18-35 € coche', comfort:'Alta', advice:'Reservar traslado privado si llegáis cansados.'},
  {from:'Ubud', to:'Sidemen / Padang Bai', time:'1 h 30 min-2 h 15 min', cost:'45-70 € coche día', comfort:'Alta', advice:'Aprovechar el traslado como excursión escénica.'},
  {from:'Padang Bai / Sanur', to:'Gili Meno', time:'1,5-2,5 h cruce habitual', cost:'35-65 € p/p trayecto', comfort:'Media', advice:'Barco de mañana y operador bien valorado.'},
  {from:'Gili Meno', to:'Uluwatu', time:'Ferry + coche 2-4 h', cost:'70-150 € grupo + ferry', comfort:'Media', advice:'No meter planes fuertes ese día.'},
  {from:'Uluwatu / Villa final', to:'Aeropuerto', time:'2-4 h según zona y tráfico', cost:'45-85 € coche', comfort:'Alta', advice:'Salir con margen. Bali castiga la prisa.'}
];

const checklist = {
  'Reservas principales':['Comparar 3 ventanas de vuelos','Cerrar vuelos con equipaje claro','Reservar Ubud','Reservar Gili Meno','Reservar Uluwatu','Bloquear villa final con piscina privada'],
  'Transportes':['Contratar traslado aeropuerto','Reservar coche Ubud-Sidemen/Puerto','Comprar ferry rápido a Gili Meno','Cerrar traslado puerto-Uluwatu','Planificar salida al aeropuerto con margen'],
  'Actividades':['Snorkel tortugas Gili Meno','Kecak Uluwatu','Padang Padang temprano','Beach club o surf suave','Spa/cena final','Cascada o arrozales'],
  'Documentación y salud':['Pasaportes vigentes','Seguro de viaje','Revisar requisitos de entrada','Tarjeta sin comisiones','Botiquín básico','Protector solar reef-safe'],
  'Equipaje':['Ropa ligera transpirable','Zapatillas con agarre','Escarpines o sandalia de agua','Bolsa estanca','Adaptador enchufe','Cámara/GoPro opcional'],
  'Decisiones':['Elegir opción A/B/C','Definir presupuesto máximo total','Elegir zona exacta de villa final','Confirmar ritmo del grupo','Dejar un día colchón','Imprimir resumen final']
};

function qs(selector, root=document){ return root.querySelector(selector); }
function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }
function googleMapUrl(q){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
function googleRouteUrl(q){ return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`; }
function moneyNote(){ return 'Importes orientativos para ordenar decisiones. Antes de reservar se contrastan en fuente real.'; }
function imageStyle(url){ return `style="background-image:url('${url}')"`; }

function renderAll(){
  renderInicio(); renderPreferencias(); renderPropuestas(); renderItinerario(); renderMapa(); renderVuelos(); renderAlojamientos(); renderActividades(); renderTransportes(); renderChecklist(); renderDecision(); renderDots();
}

function renderInicio(){
  qs('#page-inicio').innerHTML = `
    <div class="page-grid">
      <div class="panel glow">
        <div class="panel-inner">
          <span class="kicker">Indonesia · Bali · Gili Meno · Padang Padang</span>
          <h1>Diseña un viaje vivo, visual y fácil de decidir.</h1>
          <p class="lead">Un plan completo por pantallas: propuestas, mapa real, itinerario día a día, vuelos, alojamientos, actividades, transportes y checklist de reservas.</p>
          <div class="cta-row">
            <button class="primary-btn" data-page="preferencias">Crear mi viaje</button>
            <button class="secondary-btn" data-page="itinerario">Ver itinerario Indonesia</button>
            <button class="secondary-btn" data-page="mapa">Abrir mapa</button>
          </div>
          <div class="metrics">
            <div class="metric"><strong>16</strong><span>días diseñados</span></div>
            <div class="metric"><strong>3</strong><span>opciones de agosto</span></div>
            <div class="metric"><strong>8</strong><span>zonas en mapa</span></div>
            <div class="metric"><strong>0</strong><span>precios inventados</span></div>
          </div>
        </div>
      </div>
      <div class="hero-card" style="--hero-img:url('${IMG.hero}')">
        <span class="badge">Plan Indonesia preparado</span>
        <h3>Indonesia 14-16 días</h3>
        <p>Bali + Gili Meno + Padang Padang + dos noches finales en villa tropical con piscina privada.</p>
        <div class="route-line"><span>Ubud</span><span>Gili Meno</span><span>Uluwatu</span><span>Villa final</span></div>
      </div>
    </div>`;
}

function renderPreferencias(){
  qs('#page-preferencias').innerHTML = `
    <div class="page-grid">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Preferencias</span>
          <h2>Cuéntale a la app el viaje que quieres</h2>
          <div class="form-grid panel-scroll">
            ${field('Destino principal','destination',planState.destination)}
            ${field('Duración y fechas','dates',planState.dates)}
            ${field('Viajeros','travellers',planState.travellers)}
            <label class="field"><span>Presupuesto orientativo</span><select id="budget"><option>Equilibrado: bonito sin tirar el dinero</option><option>Más barato: priorizar precio</option><option>Premium: comodidad y hoteles especiales</option></select></label>
            <label class="field"><span>Ritmo del viaje</span><select id="pace"><option>Activo pero sin paliza</option><option>Muy activo</option><option>Relajado y visual</option></select></label>
            ${textarea('Imprescindibles','musts',planState.musts)}
            ${textarea('Condiciones de reserva','restrictions',planState.restrictions)}
          </div>
          <div class="cta-row">
            <button class="primary-btn" id="savePrefs">Actualizar viaje</button>
            <button class="secondary-btn" data-page="propuestas">Ver propuestas</button>
          </div>
        </div>
      </div>
      <aside class="panel glow">
        <div class="panel-inner">
          <span class="kicker">Resumen vivo</span>
          <h3>Viaje familiar, romántico y divertido</h3>
          <p>El plan mantiene equilibrio entre pareja, hijos adultos, playas, selva, cultura y hoteles con impacto visual.</p>
          <div class="chip-list">
            <span class="chip sun">Gili Meno</span><span class="chip coral">Padang Padang</span><span class="chip blue">Snorkel</span><span class="chip">Villa privada</span><span class="chip">Arrozales</span><span class="chip">Beach club</span>
          </div>
          <div class="tile selected">
            <div class="tile-img" ${imageStyle(IMG.villa)}></div>
            <div class="tile-body">
              <div class="tile-title">Cierre final recomendado</div>
              <p class="small">Dos noches en villa tropical con piscina privada, vegetación intensa, cena especial y un día sin desplazamientos largos.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>`;
  qs('#savePrefs').addEventListener('click', savePreferences);
}
function field(label,id,value){ return `<label class="field"><span>${label}</span><input id="${id}" value="${value}"></label>`; }
function textarea(label,id,value){ return `<label class="field full"><span>${label}</span><textarea id="${id}" rows="4">${value}</textarea></label>`; }

function savePreferences(){
  ['destination','dates','travellers','budget','pace','musts','restrictions'].forEach(id => { const el=qs('#'+id); if(el) planState[id]=el.value.trim(); });
  renderDecision();
  toast('Viaje actualizado. Las propuestas ya reflejan tus preferencias.');
}

function renderPropuestas(){
  qs('#page-propuestas').innerHTML = `
    <div class="page-grid wide">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">3 opciones de agosto</span>
          <h2>Elige por equilibrio, precio o comodidad</h2>
          <p class="lead">Las cifras son rangos orientativos para decidir. La reserva final se confirma en buscadores y proveedores reales antes de pagar.</p>
          <div class="option-grid panel-scroll">
            ${options.map(optionCard).join('')}
          </div>
        </div>
      </div>
    </div>`;
  qsa('.option-card').forEach(card => card.addEventListener('click', () => { selectedOption=card.dataset.option; renderPropuestas(); renderDecision(); }));
}
function optionCard(o){
  return `<article class="tile option-card ${selectedOption===o.id?'selected':''}" data-option="${o.id}">
    <div class="tile-img" ${imageStyle(o.image)}><span class="badge">${o.tag}</span></div>
    <div class="tile-body">
      <div class="tile-title">${o.name}</div>
      <div class="chip-list"><span class="chip sun">${o.dates}</span><span class="chip blue">${o.duration}</span></div>
      <p class="small"><strong>Ruta:</strong> ${o.route}</p>
      <div class="price">${o.budget}</div>
      <p class="small">${o.total}</p>
      <div class="procon"><div><strong>Pros</strong><br>${o.pros.join('<br>')}</div><div><strong>Contras</strong><br>${o.cons.join('<br>')}</div></div>
      <p class="small"><strong>Recomendación:</strong> ${o.verdict}</p>
    </div>
  </article>`;
}

function renderItinerario(){
  const d = itinerary[selectedDay];
  qs('#page-itinerario').innerHTML = `
    <div class="panel">
      <div class="panel-inner">
        <div class="day-layout">
          <aside class="day-list">${itinerary.map((day,i)=>`<button class="day-btn ${i===selectedDay?'active':''}" data-day="${i}">Día ${day.day}<br><span class="muted">${day.zone}</span></button>`).join('')}</aside>
          <div class="day-detail">
            <div class="day-photo" ${imageStyle(d.image)}>
              <div class="day-photo-content">
                <span class="kicker">Día ${d.day} · ${d.zone}</span>
                <h2>${d.title}</h2>
              </div>
            </div>
            <div class="panel-scroll">
              <div class="schedule-grid">
                <div class="schedule-card"><strong>Mañana</strong>${d.morning}</div>
                <div class="schedule-card"><strong>Comida</strong>${d.lunch}</div>
                <div class="schedule-card"><strong>Tarde</strong>${d.afternoon}</div>
                <div class="schedule-card"><strong>Noche</strong>${d.night}</div>
              </div>
              <div class="day-meta">
                <div class="meta-box"><strong>Horario</strong>${d.time}</div>
                <div class="meta-box"><strong>Transporte</strong>${d.transport}</div>
                <div class="meta-box"><strong>Coste</strong>${d.cost}</div>
                <div class="meta-box"><strong>Consejo</strong>${d.advice}</div>
              </div>
              <div class="cta-row">
                <a class="open-btn" href="${googleRouteUrl(d.map)}" target="_blank" rel="noopener">Ver ruta en mapa</a>
                <button class="secondary-btn" id="prevDay">Día anterior</button>
                <button class="primary-btn" id="nextDay">Siguiente día</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  qsa('.day-btn').forEach(btn => btn.addEventListener('click',()=>{selectedDay=Number(btn.dataset.day); renderItinerario();}));
  qs('#prevDay').addEventListener('click',()=>{selectedDay=(selectedDay-1+itinerary.length)%itinerary.length; renderItinerario();});
  qs('#nextDay').addEventListener('click',()=>{selectedDay=(selectedDay+1)%itinerary.length; renderItinerario();});
}

function renderMapa(){
  const point = mapPoints[selectedMap];
  qs('#page-mapa').innerHTML = `
    <div class="map-shell">
      <div id="map" role="application" aria-label="Mapa interactivo de la ruta"></div>
      <aside class="panel map-card">
        <div class="panel-inner">
          <span class="kicker">Mapa interactivo</span>
          <h3>${point.name}</h3>
          <div class="tile-img" ${imageStyle(point.image)} style="border-radius:22px;height:150px"></div>
          <p><strong>${point.days}</strong><br>${point.transport}</p>
          <div class="chip-list"><span class="chip sun">${point.cost}</span><span class="chip blue">${point.days}</span></div>
          <p class="small"><strong>Consejo:</strong> ${point.advice}</p>
          <div class="map-actions">
            <a href="${googleMapUrl(point.query)}" target="_blank" rel="noopener">Abrir ubicación</a>
            <a href="${googleRouteUrl(point.query)}" target="_blank" rel="noopener">Ver ruta</a>
          </div>
          <div class="three-d" aria-label="Vista 3D visual de la ruta">
            <div class="route-3d"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="map-point-list">${mapPoints.map((p,i)=>`<button class="map-point ${i===selectedMap?'active':''}" data-map="${i}"><strong>${p.name}</strong><br><span class="muted">${p.days}</span></button>`).join('')}</div>
        </div>
      </aside>
    </div>`;
  qsa('.map-point').forEach(btn => btn.addEventListener('click',()=>{selectedMap=Number(btn.dataset.map); renderMapa();}));
  setTimeout(initMap,50);
}

function initMap(){
  if (!window.L || !qs('#map')) {
    qs('#map').innerHTML = '<div class="panel-inner"><h3>Mapa listo</h3><p>Con conexión a internet se carga el mapa con zoom, marcadores y rutas. Los botones de cada zona abren Google Maps.</p></div>';
    return;
  }
  mapInstance = L.map('map', { zoomControl:true, scrollWheelZoom:true }).setView([-8.55,115.45], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18, attribution: '&copy; OpenStreetMap'}).addTo(mapInstance);
  const coords = mapPoints.map(p=>p.coords);
  L.polyline(coords, {color:'#ffd400', weight:5, opacity:.9, dashArray:'10,10'}).addTo(mapInstance);
  mapMarkers = mapPoints.map((p,i)=>{
    const marker = L.marker(p.coords).addTo(mapInstance).bindPopup(`<strong>${p.name}</strong><br>${p.days}<br>${p.transport}`);
    marker.on('click',()=>{selectedMap=i; renderMapa();});
    return marker;
  });
  const bounds = L.latLngBounds(coords);
  mapInstance.fitBounds(bounds.pad(.18));
  if(mapMarkers[selectedMap]) mapMarkers[selectedMap].openPopup();
}

function renderVuelos(){
  qs('#page-vuelos').innerHTML = `
    <div class="page-grid wide">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Vuelos internacionales</span>
          <h2>Buscar Denpasar sin caer en escalas absurdas</h2>
          <p class="lead">Objetivo: comparar Madrid y Barcelona, equipaje incluido, duración total razonable y tres ventanas de agosto.</p>
          <div class="flight-grid panel-scroll">${flights.map(f=>reserveTile(f)).join('')}</div>
        </div>
      </div>
    </div>`;
}
function reserveTile(f){
  return `<article class="tile">
    <div class="tile-img" ${imageStyle(f.image)}></div>
    <div class="tile-body">
      <div class="tile-title">${f.title}</div>
      <div class="chip-list">${f.apps.map(a=>`<span class="chip blue">${a}</span>`).join('')}</div>
      <div class="price">${f.price}</div>
      <p class="small"><strong>Horario:</strong> ${f.schedule}<br><strong>Escalas:</strong> ${f.stops}<br><strong>Aerolíneas:</strong> ${f.airlines}</p>
      <div class="procon"><div><strong>Pros</strong><br>${f.pros}</div><div><strong>Contras</strong><br>${f.cons}</div></div>
      <a class="open-btn" href="${f.link}" target="_blank" rel="noopener">Abrir búsqueda</a>
    </div>
  </article>`;
}

function renderAlojamientos(){
  qs('#page-alojamientos').innerHTML = `
    <div class="page-grid wide">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Alojamientos</span>
          <h2>Hoteles por zona con final de impacto</h2>
          <p class="lead">La ruta funciona si cada alojamiento cumple una misión: interior visual, isla tranquila, sur divertido y cierre premium.</p>
          <div class="hotel-grid panel-scroll">${hotels.map(h=>`
            <article class="tile ${h.zone==='Final wow'?'selected':''}">
              <div class="tile-img" ${imageStyle(h.image)}>${h.zone==='Final wow'?'<span class="badge">Prioridad</span>':''}</div>
              <div class="tile-body">
                <div class="tile-title">${h.title}</div>
                <div class="chip-list"><span class="chip sun">${h.zone}</span><span class="chip blue">${h.price}</span></div>
                <p class="small"><strong>Encaje:</strong> ${h.fit}</p>
                <div class="procon"><div><strong>Pros</strong><br>${h.pros}</div><div><strong>Contras</strong><br>${h.cons}</div></div>
                <a class="open-btn" href="${googleMapUrl(h.zone+' Bali hotel') }" target="_blank" rel="noopener">Ver zona en mapa</a>
              </div>
            </article>`).join('')}</div>
        </div>
      </div>
    </div>`;
}

function renderActividades(){
  qs('#page-actividades').innerHTML = `
    <div class="page-grid wide">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Actividades</span>
          <h2>Planes molones sin quemar al grupo</h2>
          <p class="lead">Cada actividad está pensada para combinar pareja, hijos adultos, fotos, agua, cultura y descanso.</p>
          <div class="activity-grid panel-scroll">${activities.map(a=>`
            <article class="tile">
              <div class="tile-img" ${imageStyle(a.image)}></div>
              <div class="tile-body">
                <div class="tile-title">${a.title}</div>
                <div class="chip-list"><span class="chip sun">${a.zone}</span><span class="chip blue">${a.time}</span><span class="chip coral">${a.duration}</span></div>
                <p class="small">${a.text}</p>
                <p class="small"><strong>Coste:</strong> ${a.cost}<br><strong>Encaje:</strong> ${a.vibe}</p>
                <a class="open-btn" href="https://www.viator.com/searchResults/all?text=${encodeURIComponent(a.title+' '+a.zone)}" target="_blank" rel="noopener">Buscar actividad</a>
              </div>
            </article>`).join('')}</div>
        </div>
      </div>
    </div>`;
}

function renderTransportes(){
  qs('#page-transportes').innerHTML = `
    <div class="page-grid wide">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Transportes internos</span>
          <h2>Ruta limpia por tramos</h2>
          <p class="lead">La clave es no perder días cambiando de base. Interior primero, isla después, sur y cierre premium al final.</p>
          <div class="transport-timeline panel-scroll">${transports.map(t=>`
            <article class="segment">
              <h3>${t.from}<br>→ ${t.to}</h3>
              <div class="chip-list"><span class="chip sun">${t.time}</span><span class="chip blue">${t.cost}</span><span class="chip">${t.comfort}</span></div>
              <p class="small">${t.advice}</p>
              <a class="open-btn" href="${googleRouteUrl(t.from+' to '+t.to+' Indonesia')}" target="_blank" rel="noopener">Ver ruta</a>
            </article>`).join('')}</div>
        </div>
      </div>
    </div>`;
}

function renderChecklist(){
  qs('#page-checklist').innerHTML = `
    <div class="page-grid wide">
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Checklist</span>
          <h2>Reserva sin dejar cabos sueltos</h2>
          <div class="progress-wrap"><div id="progressBar" class="progress-bar"></div></div>
          <p id="progressText" class="muted">0% completado</p>
          <div class="check-grid panel-scroll">${Object.entries(checklist).map(([group,items])=>`
            <div class="check-group"><h3>${group}</h3>${items.map((item,i)=>`<label class="check-item"><input type="checkbox" data-check="${group}-${i}"><span>${item}</span></label>`).join('')}</div>`).join('')}</div>
        </div>
      </div>
    </div>`;
  qsa('[data-check]').forEach(cb => cb.addEventListener('change', updateProgress));
  updateProgress();
}

function updateProgress(){
  const boxes=qsa('[data-check]');
  const done=boxes.filter(b=>b.checked).length;
  const pct=boxes.length?Math.round(done/boxes.length*100):0;
  const bar=qs('#progressBar'); const txt=qs('#progressText');
  if(bar) bar.style.width=pct+'%';
  if(txt) txt.textContent=`${pct}% completado · ${done}/${boxes.length} tareas`;
}

function renderDecision(){
  const opt = options.find(o=>o.id===selectedOption) || options[0];
  qs('#page-decision').innerHTML = `
    <div class="decision-layout">
      <div class="reco-card">
        <span class="kicker" style="color:#06120d">Decisión final</span>
        <h2>Elegiría la ${opt.name.replace(' · ',' ')}</h2>
        <p style="color:#06120d;font-weight:900;margin-top:16px">${opt.verdict}</p>
        <div class="cta-row">
          <button class="secondary-btn" style="background:#06120d;color:#fff" onclick="window.print()">Guardar PDF</button>
          <button class="secondary-btn" style="background:#fff;color:#06120d" id="downloadTxt">Descargar resumen</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-inner">
          <span class="kicker">Resumen para usuario</span>
          <h3>${planState.destination}</h3>
          <div class="final-grid panel-scroll">
            <div class="final-card"><strong>Fechas</strong><p>${planState.dates}</p></div>
            <div class="final-card"><strong>Viajeros</strong><p>${planState.travellers}</p></div>
            <div class="final-card"><strong>Presupuesto</strong><p>${planState.budget}</p></div>
            <div class="final-card"><strong>Ritmo</strong><p>${planState.pace}</p></div>
            <div class="final-card"><strong>Ruta elegida</strong><p>${opt.route}</p></div>
            <div class="final-card"><strong>Presupuesto orientativo</strong><p>${opt.total}</p></div>
            <div class="final-card"><strong>Imprescindibles</strong><p>${planState.musts}</p></div>
            <div class="final-card"><strong>Siguiente acción</strong><p>Confirmar vuelos en tres ventanas, bloquear Gili Meno y reservar la villa final antes de cerrar actividades.</p></div>
          </div>
        </div>
      </div>
    </div>`;
  const dl=qs('#downloadTxt'); if(dl) dl.addEventListener('click', downloadSummary);
}

function renderReservas(){
  const page = qs('#page-vuelos');
}

function showReserveTab(tab){ activeReserve=tab; renderReservasPage(); }

function renderReservasPage(){
  qs('#page-vuelos').innerHTML = '';
}

function renderDots(){
  qs('#pageDots').innerHTML = pages.map((p,i)=>`<button class="dot ${i===currentPage?'active':''}" aria-label="Ir a ${p}" data-index="${i}"></button>`).join('');
  qsa('.dot').forEach(dot=>dot.addEventListener('click',()=>goToPage(Number(dot.dataset.index))));
}

function goToPage(index){
  currentPage = Math.max(0, Math.min(pages.length-1, index));
  qsa('.page').forEach(p=>p.classList.remove('active'));
  qs('#page-'+pages[currentPage]).classList.add('active');
  qsa('.nav-pill').forEach(btn=>btn.classList.toggle('active', btn.dataset.page===pages[currentPage] || (btn.dataset.page==='reservas' && ['vuelos','alojamientos','actividades','transportes','checklist'].includes(pages[currentPage]))));
  renderDots();
  if(pages[currentPage]==='mapa') setTimeout(initMap,80);
}

function navTo(page){
  if(page==='reservas') page='vuelos';
  const index=pages.indexOf(page);
  if(index>=0) goToPage(index);
}

function bindGlobal(){
  qsa('[data-page]').forEach(btn=>btn.addEventListener('click',()=>navTo(btn.dataset.page)));
  qs('#prevPage').addEventListener('click',()=>goToPage(currentPage-1));
  qs('#nextPage').addEventListener('click',()=>goToPage(currentPage+1));
  qs('#soundToggle').addEventListener('click',toggleJungleAudio);
  window.addEventListener('keydown', ev=>{ if(ev.key==='ArrowRight') goToPage(currentPage+1); if(ev.key==='ArrowLeft') goToPage(currentPage-1); });
}

function toast(text){
  const el=document.createElement('div');
  el.textContent=text;
  el.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:linear-gradient(135deg,#00c875,#00d5ff);color:#04120d;padding:14px 18px;border-radius:999px;font-weight:1000;z-index:99;box-shadow:0 18px 40px rgba(0,0,0,.35)';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}

function downloadSummary(){
  const opt = options.find(o=>o.id===selectedOption) || options[0];
  const lines = [
    'NUSA TRAVEL OS · RESUMEN FINAL',
    '',
    `Destino: ${planState.destination}`,
    `Fechas: ${planState.dates}`,
    `Viajeros: ${planState.travellers}`,
    `Opción recomendada: ${opt.name}`,
    `Ruta: ${opt.route}`,
    `Presupuesto: ${opt.total}`,
    '',
    'Siguiente acción: confirmar vuelos en tres ventanas, bloquear Gili Meno y reservar la villa final antes de cerrar actividades.'
  ];
  const blob = new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='nusa-travel-os-resumen.txt'; a.click();
  URL.revokeObjectURL(url);
}

function toggleJungleAudio(){
  if(!audioOn) startJungleAudio(); else stopJungleAudio();
}

function startJungleAudio(){
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if(!AudioCtx){ toast('Este navegador no permite sonido Web Audio.'); return; }
  const ctx = new AudioCtx();
  const master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++) data[i]=(Math.random()*2-1)*0.28;
  const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
  const low = ctx.createBiquadFilter(); low.type='lowpass'; low.frequency.value=850;
  const trem = ctx.createGain(); trem.gain.value=.35;
  noise.connect(low); low.connect(trem); trem.connect(master); noise.start();
  const lfo = ctx.createOscillator(); lfo.frequency.value=.18;
  const lfoGain = ctx.createGain(); lfoGain.gain.value=.16;
  lfo.connect(lfoGain); lfoGain.connect(trem.gain); lfo.start();
  const intervals=[];
  function chirp(){
    if(!audioOn) return;
    const osc=ctx.createOscillator(); const gain=ctx.createGain();
    osc.type='sine'; osc.frequency.value=900+Math.random()*1800;
    gain.gain.setValueAtTime(0,ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05+Math.random()*0.04,ctx.currentTime+.05);
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+.55+Math.random()*.55);
    osc.connect(gain); gain.connect(master); osc.start(); osc.stop(ctx.currentTime+1.4);
  }
  function water(){
    const osc=ctx.createOscillator(); const gain=ctx.createGain();
    osc.type='triangle'; osc.frequency.value=130+Math.random()*90;
    gain.gain.value=.018;
    osc.connect(gain); gain.connect(master); osc.start(); osc.stop(ctx.currentTime+1.2);
  }
  intervals.push(setInterval(chirp, 850+Math.random()*900));
  intervals.push(setInterval(water, 1500));
  jungleAudio = {ctx, nodes:[noise,lfo], intervals}; audioOn=true;
  qs('#soundToggle').textContent='Pausar sonido'; qs('#soundToggle').classList.add('playing');
  qs('#soundLabel').textContent='Selva activada';
}
function stopJungleAudio(){
  if(!jungleAudio) return;
  jungleAudio.intervals.forEach(clearInterval);
  jungleAudio.nodes.forEach(n=>{try{n.stop()}catch(e){}});
  jungleAudio.ctx.close(); jungleAudio=null; audioOn=false;
  qs('#soundToggle').textContent='Activar sonido de selva'; qs('#soundToggle').classList.remove('playing');
  qs('#soundLabel').textContent='Ambiente selva indonesia';
}

function installServiceWorker(){
  if('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

function init(){
  renderAll();
  bindGlobal();
  goToPage(0);
  installServiceWorker();
}

document.addEventListener('DOMContentLoaded', init);
