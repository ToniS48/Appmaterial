#!/usr/bin/env node
/**
 * Script para actualizar todas las referencias al materialService obsoleto
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/material/QRPrintPage.tsx',
  'src/pages/material/MaterialDetallePage.tsx',
  'src/components/prestamos/PrestamoForm.tsx',
  'src/components/material/MaterialInventoryView.tsx',
  'src/components/material/dashboard/useDashboardMateriales.ts',
  'src/components/material/dashboard/SeguimientoAnualMaterialesTab.tsx',
  'src/components/material/dashboard/GestionMaterialesTab.tsx',
  'src/components/admin/ReparacionMaterialesDesactualizados.tsx',
  'src/components/admin/RecalcularEstadosMateriales.tsx',
  'src/components/admin/DiagnosticoMaterialesInactivos.tsx',
  'src/components/admin/DiagnosticoDetalladoMateriales.tsx'
];

const replacements = [
  {
    from: "../../services/materialService",
    to: "../../services/MaterialService"
  },
  {
    from: "../../../services/materialService",
    to: "../../../services/MaterialService"
  }
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from, 'g'), replacement.to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⚪ No changes needed: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Update completed!');
