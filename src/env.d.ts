declare namespace App {
 interface Locals {
  editorPreview?: boolean;
  editorContent?: Promise<import('./lib/content').ContentDoc[]>;
 }
}
