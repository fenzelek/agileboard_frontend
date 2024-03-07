(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineText', inlineTextDirective);

    /** @ngInject */
    function inlineTextDirective($parse, projectsService, $document, $timeout)
    {
        return {
            restrict   : 'E',
            scope      : true,
            transclude : true,

            template: function() {
                return "<div class=\"inline-edit\">\n" +
                "    <div ng-transclude ng-if=\"!edit\" ng-click=\"toggleEdit()\"></div>\n" +
                "    <div ng-if=\"edit\" class=\"md-block\">\n" +
                "       <md-input-container ng-class=\"{ 'md-block inline-text-input': !simple, 'inline-text-simple-input': simple }\" flex=\"100\" layout=\"row\" layout-align=\"start center\"> \n" +
                "           <input placeholder=\"{{ placeholder }}\" id=\"inline-text-field\" ng-model=\"value\" style=\"color: {{ textColor }}\" ng-keyup=\"keysEvent($event)\" >\n" +
                "           <div ng-if=\"simple\" layout=\"row\" layout-align=\"start center\" class=\"mb-5\"> \n" +
                "               <md-button class=\"md-icon-button\" id=\"inline-text-save-button\" ng-click=\"save(value)\" ng-disabled=\"sending\"> \n" +
                "                   <md-icon md-font-icon=\"icon-checkbox-marked-circle\" style=\"color: {{ approveColor }}\"></md-icon> \n" +
                "               </md-button> \n" +
                "               <md-button class=\"md-icon-button\" id=\"inline-text-cancel-button\"  ng-click=\"closeWithoutSaving()\" ng-disabled=\"sending\"> \n" +
                "                   <md-icon md-font-icon=\"icon-close\" style=\"color: {{ cancelColor }}\"></md-icon> \n" +
                "               </md-button> \n" +
                "           </div>\n" +
                "       </md-input-container>\n" +
                "        <div ng-if=\"apiError || customError\" class=\"inline-errors\">\n" +
                "            <span ng-if=\"apiError\" translate=\"{{ 'ERRORS.'+apiError | translate }}\"></span>\n" +
                "            <span ng-if=\"customError\" translate=\"{{ customError | translate }}\"></span>\n" +
                "        </div>\n" +
                "        <div ng-if=\"!simple\" class=\"inline-actions\" flex layout=\"row\" layout-align=\"start center\">\n" +
                "            <md-button class=\"inline-save md-raised md-accent\" id=\"inline-text-save-button\" ng-click=\"save(value)\" ng-disabled=\"sending\">\n" +
                "                <span translate=\"OTHER.SAVE\"></span>\n" +
                "            </md-button>\n" +
                "            <md-button class=\"inline-close md-raised\" id=\"inline-text-cancel-button\" ng-click=\"closeWithoutSaving()\" ng-disabled=\"sending\">\n" +
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
                scope.simple = false;
                scope.textColor = attrs.textColor || 'inherit';
                scope.approveColor = attrs.approveColor || '#43A047';
                scope.cancelColor = attrs.cancelColor || '#757575';

                /**
                 * Toggle view: display-data / edit-data
                 * On edit-data get directive values from parent
                 */
                scope.toggleEdit = function() {
                    scope.edit = !scope.edit;

                    if (scope.edit) {
                        scope.apiError = null;
                        scope.customError = null;
                        // load fresh values
                        scope.value = $parse(attrs.ngModel)(scope);
                        // on load function
                        if (angular.isDefined($parse(attrs.onEnter)(scope))) {
                            scope.value = $parse(attrs.onEnter)(scope)(scope.value);
                        }
                        scope.placeholder = angular.isUndefined(attrs.placeholder) ? '' : attrs.placeholder;
                        if (attrs.simple == 'true') scope.simple = true;

                        // autofocus
                        $timeout(function () {
                            angular.element('#inline-text-field')[0].focus();
                        }, 100);

                    }
                };

                scope.closeWithoutSaving = function() {
                    scope.toggleEdit();
                    $parse(attrs.onClose)(scope);
                }

                /**
                 * Fake clicks on submit/cancel button from keyboard
                 * @param {evemt} e
                 */
                scope.keysEvent = function(e) {
                    // ESC
                    if (e.keyCode === 27) scope.toggleEdit();
                    // ENTER
                    if ( e.keyCode === 13 ) {
                        $timeout( function() {
                            angular.element('#inline-text-save-button').click();
                        }, 100);
                    }
                };

                /**
                 * Runs 'onSave' parent function
                 * @param {string} value
                 */
                scope.save = function(value) {
                    scope.apiError = null;
                    scope.customError = null;
                    scope.sending = true;

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
                };


            }
        };
    }
})();
