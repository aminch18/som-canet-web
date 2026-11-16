import {defineType, defineField, defineArrayMember} from 'sanity';
const route = defineField({name:'slug',title:'Adreça de la pàgina',description:'Si és un contingut nou, escriu el títol i prem Genera.',type:'slug',readOnly:({document})=>document?._type==='page' && !!document?.legacyPath,options:{source:'title',maxLength:110},validation:rule=>rule.required().custom(value=>!value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) ? true : 'Utilitza lletres minúscules sense accents, números i guions.')});
const seo = defineType({name:'seo',title:'Cercadors i xarxes',type:'object',fields:[
 defineField({name:'title',title:'Títol per a cercadors',type:'string',validation:r=>r.max(70).warning('Recomanem un títol breu.')}),
 defineField({name:'description',title:'Descripció per a cercadors',type:'text',rows:3,validation:r=>r.max(180).warning('Recomanem una descripció breu.')}),
 defineField({name:'image',title:'Imatge per compartir',type:'image',options:{hotspot:true}}),
 defineField({name:'noindex',title:'No mostrar als cercadors',type:'boolean',initialValue:false}),
]});
const media = defineType({name:'media',title:'Imatge',type:'object',fields:[
 defineField({name:'image',title:'Imatge',type:'image',options:{hotspot:true}}),
 defineField({name:'alt',title:'Descripció accessible',type:'string',validation:r=>r.required()}),
 defineField({name:'caption',title:'Peu de foto',type:'string'}),
 defineField({name:'localPath',title:'Fitxer migrat',type:'string',hidden:true,readOnly:true}),
],preview:{select:{title:'alt',media:'image'}}});
export const blockContent = defineType({name:'blockContent',title:'Contingut',type:'array',of:[
 defineArrayMember({type:'block',styles:[{title:'Text',value:'normal'},{title:'Títol de secció',value:'h2'},{title:'Subtítol',value:'h3'},{title:'Cita',value:'blockquote'}],lists:[{title:'Llista',value:'bullet'},{title:'Llista numerada',value:'number'}],marks:{decorators:[{title:'Negreta',value:'strong'},{title:'Cursiva',value:'em'},{title:'Subratllat',value:'underline'}],annotations:[{name:'link',title:'Enllaç',type:'object',fields:[defineField({name:'href',title:'Adreça',type:'url',validation:r=>r.uri({allowRelative:true,scheme:['http','https','mailto','tel']})})]}]}}),
 defineArrayMember({type:'media'}),
]});
const textSection = defineType({name:'textSection', title:'Text', type:'object', fields:[
 defineField({name:'title',title:'Títol',type:'string'}),
 defineField({name:'text',title:'Contingut',type:'blockContent',validation:rule=>rule.required().min(1)}),
], preview:{select:{title:'title'},prepare:({title})=>({title:title || 'Text'})}});
const imageSection = defineType({name:'imageSection', title:'Imatge', type:'object', fields:[
 defineField({name:'photo',title:'Fotografia',type:'media',validation:rule=>rule.required().custom(value=>
  (value as {image?:{asset?:{_ref?:string}}} | undefined)?.image?.asset?._ref ? true : 'Selecciona una fotografia.'
 )}),
], preview:{select:{title:'photo.alt',media:'photo.image'}}});
const actionSection = defineType({name:'actionSection', title:'Crida a l’acció', type:'object', fields:[
 defineField({name:'title',title:'Títol',type:'string',validation:rule=>rule.required()}),
 defineField({name:'description',title:'Text',type:'text',rows:2}),
 defineField({name:'label',title:'Text del botó',type:'string',validation:rule=>rule.required()}),
 defineField({name:'href',title:'Destinació del botó',type:'url',description:'Per exemple, /contacte/ o una adreça HTTPS.',validation:rule=>rule.required().uri({allowRelative:true,scheme:['http','https']}).custom(value=>
  !value || /^(?:\/(?![\/\\])|https?:\/\/)/i.test(value) ? true : 'Utilitza una ruta del web o una adreça HTTP o HTTPS.'
 )}),
]});
const editorialBlocks = defineField({
 name:'blocks',title:'Blocs de contingut',type:'array',
 description:'Afegeix blocs de text, imatge o botó i arrossega’ls per canviar-ne l’ordre.',
 of:[defineArrayMember({type:'textSection'}),defineArrayMember({type:'imageSection'}),defineArrayMember({type:'actionSection'})],
});
const common=[defineField({name:'title',title:'Títol',type:'string',validation:r=>r.required()}),route,
 defineField({name:'summary',title:'Resum',type:'text',rows:3}),
 defineField({name:'body',title:'Text',type:'blockContent'}),
 defineField({name:'historical',title:'Contingut històric',type:'boolean',initialValue:false}),
 defineField({name:'cover',title:'Imatge principal',type:'media'}),
 defineField({name:'gallery',title:'Galeria',type:'array',of:[defineArrayMember({type:'media'})]}),
 defineField({name:'documents',title:'Documents relacionats',type:'array',of:[defineArrayMember({type:'reference',to:[{type:'publication'}]})]}),
 defineField({name:'sourceUrl',title:'Font històrica',type:'url'}),
 defineField({name:'legacyPath',title:'Adreça anterior',type:'string',hidden:true,readOnly:true}),
 defineField({name:'seo',title:'Cercadors i xarxes',type:'seo'}),
];
const post=defineType({name:'post',title:'Notícies i articles',type:'document',
 initialValue:()=>({publishedAt:new Date().toISOString()}),
 fields:[...common,editorialBlocks,
 defineField({name:'publishedAt',title:'Data de publicació',type:'datetime',validation:r=>r.required()}),
 defineField({name:'author',title:'Autor/a',type:'string'}),
 defineField({name:'category',title:'Filtre de l’Arxiu',description:'Les notícies es mostren a l’Arxiu. Tria amb quin filtre es trobaran.',type:'string',options:{list:[{title:'Actualitat',value:'actualitat'},{title:'Hemeroteca',value:'hemeroteca'},{title:'Revista',value:'revista'}]},initialValue:'actualitat'}),
],orderings:[{title:'Més recents',name:'dateDesc',by:[{field:'publishedAt',direction:'desc'}]}]});
const page=defineType({name:'page',title:'Pàgines',type:'document',fields:[...common,editorialBlocks,
 defineField({name:'section',title:'Secció del web',type:'string',options:{list:['projecte','grup-municipal','revista','arxiu','participa','contacte']}}),
 defineField({name:'faqs',title:'Preguntes freqüents',type:'array',of:[defineArrayMember({name:'faq',type:'object',fields:[defineField({name:'question',title:'Pregunta',type:'string'}),defineField({name:'answer',title:'Resposta',type:'text'})]})]}),
]});
const person=defineType({name:'person',title:'Persones',type:'document',fields:[
 defineField({name:'name',title:'Nom',type:'string',validation:r=>r.required()}),
 defineField({name:'role',title:'Responsabilitat',type:'string'}),defineField({name:'bio',title:'Presentació',type:'blockContent'}),
 defineField({name:'portrait',title:'Fotografia',type:'media'}),defineField({name:'historical',title:'Fitxa històrica',type:'boolean',initialValue:false}),
 defineField({name:'order',title:'Ordre',type:'number',initialValue:0}),
]});
const publication=defineType({name:'publication',title:'Revistes i documents',type:'document',fields:[
 defineField({name:'title',title:'Títol',type:'string',validation:r=>r.required()}),route,
 defineField({name:'description',title:'Descripció',type:'text'}),defineField({name:'file',title:'PDF',type:'file',options:{accept:'.pdf'}}),
 defineField({name:'cover',title:'Portada',type:'media'}),defineField({name:'historical',title:'Document històric',type:'boolean',initialValue:false}),
 defineField({name:'sourceUrl',title:'Font original',type:'url'}),defineField({name:'pdfPath',title:'PDF migrat',type:'string',hidden:true,readOnly:true}),
 defineField({name:'renderedFileRef',title:'Versió renderitzada del PDF',type:'string',hidden:true,readOnly:true}),
 defineField({name:'pages',title:'Pàgines renderitzades',type:'array',of:[defineArrayMember({type:'string'})],hidden:true,readOnly:true}),
 defineField({name:'transcript',title:'Text extret del document',type:'text',description:'Text accessible i cercable del PDF.'}),
 defineField({name:'legacyPath',title:'Adreça anterior',type:'string',hidden:true,readOnly:true}),
 defineField({name:'seo',title:'Cercadors i xarxes',type:'seo'}),
]});
const video=defineType({name:'video',title:'Vídeos',type:'document',fields:[
 defineField({name:'title',title:'Títol',type:'string',validation:r=>r.required()}),
 defineField({name:'youtubeId',title:'Identificador de YouTube',type:'string',validation:r=>r.required().regex(/^[\w-]{11}$/)}),
 defineField({name:'order',title:'Ordre',type:'number',initialValue:0}),
]});
const siteSettings=defineType({name:'siteSettings',title:'Configuració del web',type:'document',fields:[
 defineField({name:'homeDirectoryTitle',title:'Títol de la secció Coneix SOM CANET',type:'string'}),
 defineField({name:'homeDirectoryIntro',title:'Introducció de la secció Coneix SOM CANET',type:'text',rows:2}),
 defineField({name:'homeParticipationTitle',title:'Títol de la secció Participa',type:'string'}),
 defineField({name:'homeParticipationIntro',title:'Text de la secció Participa',type:'text',rows:2}),
 editorialBlocks,
 defineField({name:'title',title:'Nom',type:'string',initialValue:'SOM CANET'}),
 defineField({name:'tagline',title:'Frase de capçalera',type:'string'}),defineField({name:'homeTitle',title:'Títol de portada',type:'string'}),
 defineField({name:'homeIntro',title:'Presentació de portada',type:'text'}),defineField({name:'homeImage',title:'Imatge de portada',type:'media'}),
 defineField({name:'logo',title:'Logotip',type:'media'}),defineField({name:'contactEmail',title:'Correu de contacte',type:'string',validation:r=>r.email()}),
 defineField({name:'contactPhone',title:'Telèfon',type:'string'}),defineField({name:'seo',title:'Cercadors i xarxes',type:'seo'}),
]});
export const schemaTypes=[seo,media,blockContent,textSection,imageSection,actionSection,post,page,person,publication,video,siteSettings];
