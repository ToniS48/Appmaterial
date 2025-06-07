/**
 * Script para crear materiales de prueba si no existen
 */
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../src/config/firebase';

const createTestMaterials = async () => {
  console.log('🛠️ Creando materiales de prueba...');
  
  const testMaterials = [
    {
      nombre: 'Cuerda Dinámica 60m',
      tipo: 'cuerda',
      estado: 'disponible',
      cantidadDisponible: 2,
      longitud: 60,
      diametro: 9.5,
      codigo: 'CUE001',
      descripcion: 'Cuerda dinámica para escalada deportiva',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    },
    {
      nombre: 'Mosquetón HMS',
      tipo: 'anclaje',
      estado: 'disponible',
      cantidadDisponible: 10,
      codigo: 'ANC001',
      descripcion: 'Mosquetón con seguro HMS para asegurar',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    },
    {
      nombre: 'Arnés Completo',
      tipo: 'varios',
      estado: 'disponible',
      cantidadDisponible: 5,
      codigo: 'VAR001',
      descripcion: 'Arnés completo para espeleología',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    }
  ];
  
  try {
    const materialCollection = collection(db, 'material_deportivo');
    
    for (const material of testMaterials) {
      const docRef = await addDoc(materialCollection, material);
      console.log('✅ Material creado:', docRef.id, material.nombre);
    }
    
    console.log('🎉 Materiales de prueba creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando materiales:', error);
  }
};

export { createTestMaterials };
