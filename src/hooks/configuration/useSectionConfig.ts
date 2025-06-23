import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export function useSectionConfig<T extends { [x: string]: any }>(section: string, defaultValue: T) {
  const toast = useToast();
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'configuracion', section);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData({ ...defaultValue, ...docSnap.data() });
      } else {
        setData(defaultValue);
      }
    } catch (e) {
      toast({ title: 'Error', description: `No se pudo cargar la configuración de ${section}`, status: 'error' });
      setData(defaultValue);
    } finally {
      setLoading(false);
    }
  };

  const save = async (newData: T) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'configuracion', section);
      await setDoc(docRef, newData, { merge: true });
      setData(newData);
      toast({ title: 'Guardado', description: 'Configuración guardada correctamente.', status: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: `No se pudo guardar la configuración de ${section}`, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  return { data, setData, loading, reload, save };
}
