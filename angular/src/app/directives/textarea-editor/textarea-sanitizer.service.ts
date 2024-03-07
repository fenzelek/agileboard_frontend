import { ISCEService } from 'angular';
import { DeltaToHtmlConverter } from './delta-to-html-converter';


export class TextareaSanitizerService {

  constructor(
    private $sanitize: any,
    private $sce: ISCEService,
  ) { }

  /**
   * @description We want to keep inline styles that set font color,
   * so we match it, change attribute so it passes sanitization, and set it back again.
   * We match it precisely, so no vulnerablity is created.
   */
  sanitizeHTML(content: string) {
    if (!content) return;

    content = this.parseToHtmlString(content);

    const regStyle = /style(="color:#[a-f0-9]{3,6}")/g;
    const regReplacedStyle = /color(="color:#[a-f0-9]{3,6}")/g;

    const regRef = /data-ref(="[0-9]{8}")/g;
    const regReplacedRef = /target(="[0-9]{8}")/g;

    const replacedAttrs = content
      .replace(regStyle, 'color\$1')
      .replace(regRef, 'target\$1');

    const sanitized = this.$sanitize(replacedAttrs);

    const replacedWithProperAttrs = sanitized
      .replace(regReplacedStyle, 'style\$1')
      .replace(regReplacedRef, 'data-ref\$1');

    const trusted = this.$sce.trustAsHtml(replacedWithProperAttrs);

    return trusted;
  }

  parseToHtmlString(content: string): string {
    try { // content is delta (new implementation)
      const delta = JSON.parse(content);
      return DeltaToHtmlConverter.convert(delta.ops);
    } catch (err) { // content is html (legacy implementation)
      return content;
    }
  }

}


TextareaSanitizerService.$inject = ['$sanitize', '$sce'];
// @ts-ignore
angular.module('app.core').service('textareaSanitizerService', TextareaSanitizerService);
