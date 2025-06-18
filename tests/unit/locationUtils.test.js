/**
 * Tests unitarios para las utilidades de ubicación
 */

import { 
  truncateLocationText, 
  isLongLocationText, 
  formatLocationForCard 
} from '../src/utils/locationUtils';

// Test para truncateLocationText
console.log('🧪 Probando truncateLocationText...');

// Caso 1: Texto largo de Nominatim
const textoLargo = 'Montanejos, El Alto Mijares, Castellón, Comunidad Valenciana, 12448, España';
console.log('Entrada:', textoLargo);
console.log('Salida:', truncateLocationText(textoLargo));
console.log('Esperado: "Montanejos, El Alto Mijares" o similar');
console.log('---');

// Caso 2: Texto corto que no necesita truncado
const textoCorto = 'Madrid, España';
console.log('Entrada:', textoCorto);
console.log('Salida:', truncateLocationText(textoCorto));
console.log('Esperado: "Madrid, España" (sin cambios)');
console.log('---');

// Caso 3: Texto muy largo con una sola parte
const textoUnico = 'NombreDeLugarMuyLargoQueNoTieneComas';
console.log('Entrada:', textoUnico);
console.log('Salida:', truncateLocationText(textoUnico, 20));
console.log('Esperado: "NombreDeLugarMu..." o similar');
console.log('---');

// Test para isLongLocationText
console.log('🧪 Probando isLongLocationText...');
console.log('Texto largo:', isLongLocationText(textoLargo), '(esperado: true)');
console.log('Texto corto:', isLongLocationText(textoCorto), '(esperado: false)');
console.log('---');

// Test para formatLocationForCard
console.log('🧪 Probando formatLocationForCard...');
console.log('Texto largo:', formatLocationForCard(textoLargo));
console.log('Texto corto:', formatLocationForCard(textoCorto));
console.log('Texto vacío:', formatLocationForCard(''));
console.log('---');

console.log('✅ Tests completados');
