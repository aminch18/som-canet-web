import {defineConfig} from 'sanity';
import {defineLocations,presentationTool} from 'sanity/presentation';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './schemaTypes';
const projectId=process.env.SANITY_STUDIO_PROJECT_ID;
if(!projectId) throw new Error('Falta SANITY_STUDIO_PROJECT_ID. Configura studio/.env amb el projecte real de Sanity.');
const previewOrigin=process.env.SANITY_STUDIO_PREVIEW_URL;
const locationFor=(prefix:string)=>defineLocations({
 select:{title:'title',slug:'slug.current'},
 resolve: document => ({
  locations:document?.slug ? [{title:document.title || 'Mostra al web',href:`${prefix}${document.slug}/`}] : [],
 }),
});
export default defineConfig({
 name:'som-canet',title:'SOM CANET · Continguts',projectId,
 dataset:process.env.SANITY_STUDIO_DATASET || 'production',schema:{types:schemaTypes,templates:previous=>previous.filter(template=>template.schemaType!=='siteSettings')},
 document:{actions:(previous,context)=>context.schemaType==='siteSettings' || ['equip','revista','videos','contacte','participa'].includes(context.documentId||'') ? previous.filter(action=>!['delete','duplicate'].includes(action.action||'')) : previous},
 plugins:[structureTool({
  title:'Continguts',
  structure:S=>{
   const editPage=(id:string,title:string)=>S.listItem().id(id).title(title)
    .child(S.document().schemaType('page').documentId(id));
   const collection=(type:string,title:string)=>S.listItem().id(type).title(title)
    .child(S.documentTypeList(type).title(title));
   return S.list().title('Què vols editar?').items([
    collection('post','Notícies de l’Arxiu'),
    S.listItem().id('site-settings').title('Portada i dades de contacte')
     .child(S.document().schemaType('siteSettings').documentId('site-settings')),
    S.listItem().id('main-pages').title('Pàgines principals').child(
     S.list().title('Tria una pàgina').items([
      editPage('projecte','El projecte'),
      editPage('historia','La nostra història'),
      editPage('grup-municipal','Grup municipal'),
      editPage('equip','Qui és qui'),
      editPage('revista','La revista'),
      editPage('videos','Vídeos'),
      editPage('participa','Participa'),
      editPage('contacte','Contacte'),
      S.divider(),
      collection('page','Totes les pàgines'),
     ]),
    ),
    S.divider(),
    collection('publication','Revistes i documents PDF'),
    collection('person','Persones de l’equip'),
    collection('video','Vídeos de l’arxiu'),
   ]);
  },
 }), ...(previewOrigin ? [presentationTool({
  title:'Edició visual',
  previewUrl:{initial:previewOrigin,previewMode:{enable:'/api/editor-preview/',shareAccess:false}},
  resolve:{
   mainDocuments:[
    {route:'/',filter:'_id == "site-settings"'},
    {route:'/articles/:slug',filter:'_type == "post" && slug.current == $slug'},
    {route:'/documents/:slug',filter:'_type == "publication" && slug.current == $slug'},
    {route:'/:slug',filter:'_type == "page" && slug.current == $slug'},
   ],
   locations:{
   siteSettings:defineLocations({locations:[{title:'Portada',href:'/'}]}),
   page:locationFor('/'),
   post:locationFor('/articles/'),
   publication:locationFor('/documents/'),
   person:defineLocations({locations:[{title:'Equip',href:'/equip/'}]}),
   video:defineLocations({locations:[{title:'Vídeos',href:'/videos/'}]}),
  }},
 })] : [])],
});
