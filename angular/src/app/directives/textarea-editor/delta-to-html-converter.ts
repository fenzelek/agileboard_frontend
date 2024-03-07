import { DeltaOperation } from 'quill';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';


export class DeltaToHtmlConverter {

  static convert(ops: DeltaOperation[]): string {
    const converter = new QuillDeltaToHtmlConverter(ops);

    converter.renderCustomWith((customOp) => {
      const isMention = customOp.insert.type === 'mention';

      if (isMention) {
        const mention = customOp.insert.value;
        return `<span class="mention" data-ref="${mention.ref}">@${mention.value}</span>`;
      } else {
        const blotName = customOp.insert.type;
        return `[Error | no parser for: ${blotName}]`;
      }
    });

    const html = converter.convert();
    return html;
  }

}