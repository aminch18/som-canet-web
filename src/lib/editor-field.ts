import {createDataAttribute} from '@sanity/visual-editing';
import type {ContentDoc} from './content';

export function editorField(locals: App.Locals, doc: ContentDoc, path: string) {
 if (!locals.editorPreview) return undefined;
 return createDataAttribute({
  id:doc._id, type:doc._type, path, workspace:'som-canet',
 }).toString();
}
