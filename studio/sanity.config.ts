import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './schemaTypes';
const projectId=process.env.SANITY_STUDIO_PROJECT_ID;
if(!projectId) throw new Error('Falta SANITY_STUDIO_PROJECT_ID. Configura studio/.env amb el projecte real de Sanity.');
export default defineConfig({
 name:'som-canet',title:'SOM CANET · Continguts',projectId,
 dataset:process.env.SANITY_STUDIO_DATASET || 'production',schema:{types:schemaTypes,templates:previous=>previous.filter(template=>template.schemaType!=='siteSettings')},
 document:{actions:(previous,context)=>context.schemaType==='siteSettings' || ['equip','revista','videos','contacte','participa'].includes(context.documentId||'') ? previous.filter(action=>!['delete','duplicate'].includes(action.action||'')) : previous},
 plugins:[structureTool({structure:S=>S.list().title('SOM CANET').items([
  S.listItem().title('Configuració del web').child(S.document().schemaType('siteSettings').documentId('site-settings')),
  ...S.documentTypeListItems().filter(item=>item.getId()!=='siteSettings'),
 ])})],
});
