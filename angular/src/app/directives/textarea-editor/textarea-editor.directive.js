// import Quill from '../../../../../angular/node_modules/quill/dist/quill';
import Quill from 'quill';
import ImageUploader from 'quill-image-uploader';
import BlotFormatter from 'quill-format-img';
import 'quill-mention';

import { Mention } from './mention/mention';

Quill.register('modules/imageUploader', ImageUploader);
Quill.register('modules/blotFormatter', BlotFormatter);


/* 
scope.config: {
    projectId?: number
    userId: number
    ticketId: number
    pageId: number
    onSave: Promise
    mentions: []
}
*/

function textareaEditorDirective($stateParams, $timeout, $rootScope, $http, filesService, transService, $auth, api, __env) {
  return {
    restrict: 'E',
    scope: {
      ngModel: '=',
      config: '='
    },
    require: '?ngModel',

    template: function () {
      return `<div class="textarea-editor">
        <div class="textarea-editor-toolbar">
          <div class="toolbar-group">
            <select class="ql-size">
              <option value="small"></option>
              <option selected></option> 
              <option value="large"></option>
              <option value="huge"></option>
            </select>
            <select class="ql-align">
              <option selected=""></option>
              <option value="center"></option>
              <option value="right"></option>
              <option value="justify"></option>
            </select>
          </div>
          <div class="toolbar-group">
            <button class="ql-list" value="ordered"></button>
            <button class="ql-list" value="bullet"></button>
          </div>
          <div class="toolbar-group">
            <button class="ql-image">image</button>
            <button class="ql-link">link</button>
          </div>
          <div class="toolbar-group">
            <button class="ql-bold">Bold</button>
            <button class="ql-italic">Italic</button>
            <button class="ql-underline">underline</button>
            <button class="ql-strike">strike</button>
            <button class="ql-script" value="sub"></button>
            <button class="ql-script" value="super"></button>
            <select class="ql-color"></select>
          </div>
        </div>
        <div class="editor"></div>
      </div>`;
    },
    link: link,
  };

  function link(scope, elem, attrs, ngModel) {
    const editorHostEl = elem[0].querySelector('.editor');
    const toolbarHostEl = elem[0].querySelector('.textarea-editor-toolbar');
    const quillConfig = {
      modules: {
        toolbar: toolbarHostEl,
        imageUploader: {
          upload: file => handleFileUpload(file, scope.config),
        },
        blotFormatter: {},
        mention: Mention.getConfig(__env.apiUrl, scope.config.projectId ? scope.config.projectId : $stateParams.project_id, transService, $auth),
      },
      theme: 'snow',
    };

    const editor = new Quill(editorHostEl, quillConfig);

    editor.focus();

    ngModel.$render = displayNgModel;
    const debouncedUpdateModel = $rootScope.debounce(updateNgModel, 250);
    editor.on('text-change', () => debouncedUpdateModel());

    let existingMentions;

    function displayNgModel() {
      if (ngModel.$viewValue) {
        let delta;

        try { // content is delta (new implementation)
          delta = JSON.parse(ngModel.$viewValue);
          existingMentions = existingMentions || getExistingMentions(delta);
        } catch (err) { // content is html (legacy implementation)
          delta = editor.clipboard.convert(ngModel.$viewValue); // html to delta
        }

        editor.setContents(delta);
      }
    };

    function updateNgModel() {
      $timeout(() => {
        scope.$apply(() => {
          const delta = editor.getContents();
          const deltaJsonString = JSON.stringify(delta);
          ngModel.$setViewValue(deltaJsonString);
          scope.config.mentions = Mention.getMentions(editor, existingMentions || []);
        }, 1000);
      });
    }
  }

  function getExistingMentions(delta) {
    const result = [];

    delta.ops.forEach(op => {
      const isMention = op.insert && op.insert.mention;
      if (!isMention) return;

      const mention = op.insert.mention;
      result.push(mention.ref);
    });

    return result;
  }

  function handleFileUpload(file, config) {
    const def = new $rootScope.Deferred();
    const params = getUploadParams(config, file.name);

    upload(params, file).then(onUploadSuccess).catch(onUploadError);

    function onUploadSuccess(resp) {
      const fileId = resp.data.data.id;
      const fileUrl = filesService.getImageThumbnail(fileId, null, config.projectId);
      const persistParams = Object.assign({ id: fileId, name: file.name }, config);

      persistFileOnSave(config.onSave, persistParams);
      def.resolve(fileUrl);
    }

    function onUploadError(error) {
      console.error('File upload error', error);
      toastService.showError(transService.translate('ERRORS.WYSIWYG.upload'));
      def.reject('File upload error');
    }

    return def.promise;
  }

  function getUploadParams(config, name) {
    const params = { name: name };

    if (config.userId) params['users[0]'] = config.userId;
    if (config.pageId) params['pages[0]'] = config.pageId;
    if (config.ticketId) params['tickets[0]'] = config.ticketId;
    if (config.projectId) params.projectId = config.projectId;

    return params;
  }

  function upload(params, file) {
    const projectId = params.projectId || $stateParams.project_id;
    const url = __env.apiUrl + 'projects/' + projectId + '/files';
    const fd = new FormData();

    Object.keys(params).forEach(name => fd.set(name, params[name]));
    fd.set('file', file);
    fd.set('temp', 1); // removed after 1h, if not confirmed (PUT { temp: 0 })

    const req = $http({
      url: url,
      headers: { 'Content-Type': undefined },
      data: fd,
      method: 'POST',
    });

    return req;
  }

  function persistFileOnSave(onSave, config) {
    const params = {
      id: config.id,
      name: config.name,
      project_id: config.projectId || $stateParams.project_id,
      temp: 0,
    };

    if (config.userId) params.users = [config.userId];
    if (config.pageId) params.pages = [config.pageId];
    if (config.ticketId) params.tickets = [config.ticketId];

    onSave.then(function (data) {
      if (data) {
        if (data.type === 'ticket') params.tickets = [data.id];
        if (data.type === 'page') params.pages = [data.id];
      }
      api.file.put(params);
    });
  }

}

textareaEditorDirective.$inject =
  ['$stateParams', '$timeout', '$rootScope', '$http', 'filesService', 'transService', '$auth', 'api', '__env'];

angular.module('app.core').directive('textareaEditor', textareaEditorDirective);
