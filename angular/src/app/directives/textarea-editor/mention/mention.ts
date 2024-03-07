import Quill, { DeltaOperation } from 'quill';
import { GroupRecipient, Interaction, MentionSuggestionItem, QuillMentionConfig, User } from './model';
import { DeltaToHtmlConverter } from '../delta-to-html-converter';


export class Mention {
  private static readonly minAdjacentContextLength = 50;
  private static readonly maxMessageLength = 255;
  private static apiUrl: string;
  private static transService: any;
  private static authService: any;
  private static users: User[];
  private static projectId: number;

  static getConfig(apiUrl: string, projectId: number, transService: any, authService: any): QuillMentionConfig {
    this.apiUrl = apiUrl;
    this.transService = transService;
    this.authService = authService;

    // if project has changed, fetch users for current project (getUsers())
    if (+this.projectId !== +projectId) {
      this.users = null
    }

    this.projectId = projectId;

    return {
      dataAttributes: ['ref', 'targetType'],
      source: this.getSuggestionItems.bind(this),
      positioningStrategy: 'normal',
      renderItem: this.renderItem.bind(this)
    };
  }

  /**
   * 
   * @param existingMentions Array of interaction refs
   */
  static getMentions(editor: Quill, existingMentions: string[]): Interaction[] {
    const result = [];
    const delta = editor.getContents();

    if (!delta.ops) return result;

    delta.ops.forEach((op, index) => {
      const isMention = op.insert && op.insert.mention;
      if (!isMention) return;

      const mention: MentionSuggestionItem = op.insert.mention;

      if (existingMentions.includes(mention.ref)) return;

      const interaction: Interaction = {
        message: this.getMentionContextMessage(delta.ops, index),
        notifiable: mention.targetType,
        recipient_id: mention.id,
        ref: mention.ref,
      };
      result.push(interaction);
    });

    return result;
  }

  private static getMentionContextMessage(ops: DeltaOperation[], index: number): string {
    const preContext = this.getContextOperations(ops, index, -1);
    const mentionOp = ops[index];
    const postContext = this.getContextOperations(ops, index, 1);

    const operations = [...preContext, mentionOp, ...postContext];

    let message = DeltaToHtmlConverter.convert(operations);

    // set only the mention as message if content is very rich in html and the length exceeds max db field length
    if (message.length > this.maxMessageLength) {
      message = DeltaToHtmlConverter.convert([mentionOp]);
    }

    return message;
  }

  /**
   * @description Get adjacent operations, which in summary have at least {minAdjacentContextLength} text length.
   */
  private static getContextOperations(ops: DeltaOperation[], index: number, direction: number): DeltaOperation[] {
    let textLength = 0;
    let result: DeltaOperation[] = [];
    let currentIndex = index + direction;

    while (textLength < this.minAdjacentContextLength) {
      // @ts-ignore
      const op = angular.copy(ops[currentIndex]);
      if (!op) return result;

      const isMention = op.insert && op.insert.mention;
      const isText = op.insert && typeof op.insert === 'string';

      if (!isText && !isMention) {
        currentIndex += direction;
        continue;
      }

      if (op.attributes && op.attributes.link) {
        delete op.attributes.link;
      }

      const text = isText ? this.getOperationText(op.insert, textLength, direction) : op.insert.mention.value;
      if (isText) op.insert = text;

      if (direction > 0) {
        result.push(op);
      } else {
        result.unshift(op);
      }

      textLength += text.length;

      currentIndex += direction;
    }

    return result;
  }

  private static getOperationText(text: string, currentLength: number, direction: number): string {
    const lengthMissing = this.minAdjacentContextLength - currentLength;
    let textToAdd: string;

    if (direction > 0) {
      textToAdd = text.substring(0, lengthMissing);
    } else {
      textToAdd = text.substring(text.length - lengthMissing - 1);
    }

    // add ... if value has been truncated
    if (text.length > lengthMissing) {
      if (direction > 0) textToAdd = `${textToAdd}...`;
      else textToAdd = `...${textToAdd}`;
    }

    return textToAdd;
  }

  private static getSuggestionItems(searchTerm: string, renderList: (items: MentionSuggestionItem[]) => unknown): void {
    this.getUsers().then(users => {
      const matchedUsers = this.getMatchingUsersSuggestions(users, searchTerm);
      const matchedGroups = this.getGroupsSuggestions();

      const items: MentionSuggestionItem[] = [...matchedGroups, ...matchedUsers];
      renderList(items);
    });
  }

  private static getMatchingUsersSuggestions(users: User[], searchTerm: string): MentionSuggestionItem[] {
    return users
      .filter(user => this.checkSearchMatch(this.getUserName(user), searchTerm))
      .map(user => {
        const userSuggestionItem: MentionSuggestionItem = {
          id: user.id,
          value: this.getUserName(user),
          targetType: 'user',
          ref: this.generateRef(),
          imgUrl: user.avatar,
        }
        return userSuggestionItem;
      });
  }

  private static getGroupsSuggestions(): MentionSuggestionItem[] {
    const all: MentionSuggestionItem = {
      id: GroupRecipient.all,
      value: this.transService.translate('OTHER.ALL_PERSONS'),
      targetType: 'group',
      ref: this.generateRef(),
      icon: 'icon icon-account-multiple',
    }

    // uncomment this when involved functionality is ready
    // const involved: MentionSuggestionItem = {
    //   id: GroupRecipient.involved,
    //   value: this.transService.translate('OTHER.INVOLVED'),
    //   targetType: 'group',
    //   ref: this.generateRef(),
    //   icon: 'icon icon-account-multiple',
    // }

    return [all, /* involved */];
  }

  private static checkSearchMatch(name: string, searchTerm: string): boolean {
    name = name.toLowerCase();
    searchTerm = searchTerm.toLowerCase();
    return name.includes(searchTerm);
  }

  private static getUserName(user: User): string {
    return `${user.first_name} ${user.last_name}`;
  }

  private static getUsers(): Promise<User[]> {
    if (this.users) {
      return Promise.resolve(this.users);
    } else {
      return this.fetchUsers();
    }
  }

  private static fetchUsers(): Promise<User[]> {
    const compayId = localStorage.getItem('current_company');
    const url = `${this.apiUrl}projects/${this.projectId}/users?selected_company_id=${compayId}`;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    return new Promise((resolve, reject) => {

      fetch(url, { headers }).then(async (resp) => {
        const json: { data: { user: { data: User } }[] } = await resp.json();

        if (resp.ok) {
          this.users = json.data.map((user) => user.user.data);
          resolve(this.users);
        } else {
          reject(json);
        }
      }, (err) => {
        reject(err);
      });

    });
  }

  private static renderItem(item: MentionSuggestionItem, searchTerm: string): string {
    return item.targetType === 'user' ? `
      <div class="mention-item">
        <img src="${this.authService.getAvatar(item.imgUrl)}" />
        <span class="name">${item.value}</span>
      </div>
    ` : `
      <div class="mention-item">
        <span class="${item.icon}"></span>
        <span class="name">${item.value}</span>
      </div>
    `;
  }

  private static generateRef(): string {
    return `${Math.random()}`.split('.')[1].substring(0, 8); // 8 digits
  }

}

// 
