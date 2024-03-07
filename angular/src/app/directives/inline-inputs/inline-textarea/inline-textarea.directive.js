(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineTextarea', inlineTextareaDirective);

    /** @ngInject */
    function inlineTextareaDirective($parse, projectsService, $document, $timeout)
    {
        return {
            restrict   : 'E',
            scope      : true,
            transclude : true,

            template: function() {
                return "<div class=\"inline-edit\">\n" +
                "    <div ng-transclude ng-if=\"!edit\" ng-click=\"toggleEdit()\"></div>\n" +
                "    <div ng-if=\"edit\" class=\"md-block\">\n" +
                "       <md-input-container class=\"md-block inline-text-input\" flex=\"100\"> \n" +
                "           <textarea id=\"inline-textarea-field\" placeholder=\"{{ placeholder }}\" ng-model=\"value\" rows=\"{{ rows }}\" max-rows=\"{{ max_rows }}\" ng-keyup=\"keysEvent($event)\" ></textarea> \n" +
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
            link: function (scope, elem, attrs) {
                scope.edit = false;
                scope.sending = false;
                scope.apiError = null;
                scope.customError = null;
                
                scope.toggleEdit = function() {
                    scope.edit = !scope.edit;

                    if (scope.edit) {
                        scope.apiError = null;
                        scope.customError = null;
                        // load fresh values for input                
                        scope.value = angular.isUndefined($parse(attrs.ngModel)(scope)) ? '' : $parse(attrs.ngModel)(scope);
                        scope.placeholder = angular.isUndefined(attrs.placeholder) ? '' : attrs.placeholder;
                        scope.maxLength = angular.isUndefined(attrs.maxLength) ? 0 : attrs.maxLength;
                        scope.rows = angular.isUndefined(attrs.rows) ? 3 : attrs.rows;
                        scope.max_rows = angular.isUndefined(attrs.maxRows) ? 10 : attrs.maxRows;
                        // autofocus
                        $timeout(function () {
                            angular.element('#inline-textarea-field')[0].focus();
                        }, 100);
                    }
                };

                /**
                 * ESC key event - toggle edit
                 * @param {evemt} e 
                 */
                scope.keysEvent = function(e) {
                    if (e.keyCode === 27) scope.toggleEdit();
                }

                scope.save = function(value) {
                    scope.apiError = null;
                    scope.customError = null;
                    scope.sending = true;

                    if(value.length > scope.maxLength) {
                        scope.customError = 'ERRORS.FORM.MAX_' + scope.maxLength;
                        scope.sending = false;                        
                    } else {
                        $parse(attrs.onSave)(scope)(attrs.name, value,
                            // success callback
                            function () {
                                scope.edit = false;
                                scope.sending = false;
                            }, 

                            /**
                             * Error callback
                             * 
                             * @param {string} apiError - response from api
                             * @param {string} customError - string to translate, eg. 'ERRORS.general.validation_filed'
                             */
                            function(apiError, customError) {
                                scope.sending = false;
                                // show api error
                                if(apiError && apiError.code) {
                                    scope.apiError = apiError.code;
                                } else if (customError) {
                                    scope.customError = customError;
                                } else {
                                    scope.customError = 'ERRORS.general.api_error';
                                }
                            }
                        );
                    }

                }


            }
        };
    }
})();
