(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineTexteditor', inlineTexteditorDirective);

    /** @ngInject */
    function inlineTexteditorDirective($rootScope)
    {
        return {
            restrict   : 'E',
            scope      : {
                ngModel: '=',
                onSave: '=',
                userId: '=',
                ticketId: '=',
                pageId: '=',
                projectId: '=',
                ee: '=',
            },
            transclude : true,
            require    : '?ngModel',

            template: function() {
                return "<div class=\"inline-edit\">\n" +
                "    <div ng-transclude ng-if=\"!edit\" ng-click=\"handleClick()\" class=\"transclude\"></div>\n" + 
                "    <div ng-if=\"edit\" class=\"md-block editor-wrap\">\n" +
                "       <md-input-container class=\"md-block inline-texteditor-input\" flex=\"100\"> \n" +
                "           <textarea-editor ng-model=\"value\" config=\"config\" height=\"{{ height }}\" compact=\"{{ compact }}\"></textarea-editor> \n" + 
                "           <div ng-if=\"maxLength\" class=\"md-char-counter\" layout=\"row\" layout-align=\"end none\" ng-class=\"{'error': value.length > maxLength}\">{{ value.length ? value.length : 0 }}/{{ maxLength }}</div> \n" +
                "       </md-input-container>\n" +
                "        <div ng-if=\"apiError || customError\" class=\"inline-errors\">\n" +
                "            <span ng-if=\"apiError\" translate=\"{{ 'ERRORS.'+apiError | translate }}\"></span>\n" +
                "            <span ng-if=\"customError\" translate=\"{{ customError | translate }}\"></span>\n" +
                "        </div>\n" + 
                "        <div class=\"inline-actions\" flex layout=\"row\" layout-align=\"start center\">\n" +
                "            <md-button class=\"inline-save md-raised md-accent\" id=\"inline-text-save-button\" ng-click=\"save(value)\" ng-disabled=\"sending\">\n" +
                "                <span translate=\"OTHER.SAVE\"></span>\n" +
                "            </md-button>\n" +
                "            <md-button class=\"inline-close md-raised\" id=\"inline-text-cancel-button\" ng-click=\"toggleEdit()\" ng-disabled=\"sending\">\n" +
                "                <span translate=\"OTHER.CANCEL\"></span>\n" +
                "            </md-button>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</div>";
            },
            link: function (scope, elem, attrs, ngModel) {
                var onSave = new $rootScope.Deferred();
                onSave.promise.catch(() => {}); // just to avoid Uncaught Error

                scope.edit = false;
                scope.sending = false;
                scope.apiError = null;
                scope.customError = null;
                // default values
                scope.value = '';
                scope.maxLength = 0;
                scope.compact = true;
                scope.height = 120;

                scope.config = {
                    type: scope.type,
                    userId: scope.userId,
                    ticketId: scope.ticketId,
                    pageId: scope.pageId,
                    onSave: onSave.promise,
                    projectId: scope.projectId,
                    mentions: [],
                };

                scope.$watch('userId', function () {
                    scope.config = {
                        userId: scope.userId,
                        ticketId: scope.ticketId,
                        pageId: scope.pageId,
                        onSave: onSave.promise,
                        projectId: scope.projectId,
                        mentions: [],
                    };
                });

                scope.$watch('ticketId', function () {
                    scope.config = {
                        userId: scope.userId,
                        ticketId: scope.ticketId,
                        pageId: scope.pageId,
                        onSave: onSave.promise,
                        projectId: scope.projectId,
                        mentions: [],
                    };
                });

                scope.toggleEdit = function() {
                    scope.edit = !scope.edit;

                    if (scope.edit) {
                        scope.apiError = null;
                        scope.customError = null;
                        // from directive values
                        if (angular.isDefined(attrs.compact)) scope.compact = attrs.compact;
                        if (angular.isDefined(attrs.height)) scope.height = attrs.height;
                        if (angular.isDefined(attrs.maxLength)) scope.maxLength = attrs.maxLength;
                        if (ngModel) scope.value = ngModel.$viewValue;
                    }
                };

                scope.handleClick = function () {
                    if (!scope.ee) {
                        scope.toggleEdit();
                    }
                }

                // toggle edit from outside

                function toggleEditListener() {
                    scope.toggleEdit();
                }

                if (scope.ee) {
                    scope.ee.on('toggle-edit:' + attrs.id, toggleEditListener);
                }

                scope.$on('$destroy', function() {
                    if (scope.ee) {
                        scope.ee.off('toggle-edit:' + attrs.id, toggleEditListener);
                    }
                });

                // toggle edit from outside //

                scope.save = function(value) {
                    scope.apiError = null;
                    scope.customError = null;
                    scope.sending = true;
                    
                    if (value.length > scope.maxLength) {
                        scope.customError = 'ERRORS.FORM.MAX_' + scope.maxLength;
                        scope.sending = false;
                        return;
                    }
                    
                    console.log('mentions', scope.config.mentions);

                    const data = {
                        id: attrs.id,
                        name: attrs.name,
                        value: value,
                        mentions: scope.config.mentions,
                    };

                    scope.onSave(data, onSaveSuccess, onSaveError);
                }

                function onSaveSuccess() {
                    scope.edit = false;
                    scope.sending = false;
                    onSave.resolve();
                } 

                /**
                 * Error callback
                 * 
                 * @param {string} apiError - response from api
                 * @param {string} customError - string to translate, eg. 'ERRORS.general.validation_filed'
                 */
                function onSaveError(apiError, customError) {
                    scope.sending = false;
                    // show api error
                    if (apiError && apiError.code) {
                        scope.apiError = apiError.code;
                    } else if (customError) {
                        scope.customError = customError;
                    } else {
                        scope.customError = 'ERRORS.general.api_error';
                    }
                    onSave.reject();
                }

            }
        };
    }
})();
