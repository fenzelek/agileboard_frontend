(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineDatepicker', inlineDatepickerDirective);

    /** @ngInject */
    function inlineDatepickerDirective($parse, projectsService, $document, $timeout, $window, transService)
    {
        return {
            restrict   : 'E',
            scope      : true,
            transclude : true,

            template: function() {
                return "<div class=\"inline-edit\" style=\"width: 100%; max-width: 200px\">\n" +
                "    <div ng-transclude ng-if=\"!edit\" ng-click=\"toggleEdit()\"></div>\n" +
                "    <div ng-if=\"edit\" class=\"md-block\">\n" +
                "       <md-input-container class=\"md-block inline-datepicker-input\"> \n" +
                "           <input placeholder=\"{{ placeholder }}\" id=\"inline-datepicker-field\" ng-model=\"date\" input-clear \n" +
                "                moment-picker=\"date\" format=\"{{ format }}\" locale=\"{{ lang }}\" start-view=\"month\" position=\"bottom right\" inline=\"true\" " +
                "                min-date=\"minDate\" max-date=\"maxDate\"" +
                "                change=\"change(newValue, oldValue)\" >\n" +
                "       </md-input-container>\n" +
                "        <div ng-if=\"apiError || customError\" class=\"inline-errors\">\n" +
                "            <span ng-if=\"apiError\" translate=\"{{ 'ERRORS.'+apiError | translate }}\"></span>\n" +
                "            <span ng-if=\"customError\" translate=\"{{ customError | translate }}\"></span>\n" +
                "        </div>\n" + 
                "        <div class=\"inline-actions\" flex layout=\"row\" layout-align=\"start center\">\n" +
                "            <md-button class=\"inline-save md-raised md-accent\" id=\"inline-text-save-button\" ng-click=\"save(date)\" ng-disabled=\"sending\">\n" +
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
                scope.format = attrs.format || "YYYY-MM-DD HH:mm:ss";
                scope.minDate = attrs.minDate || "";
                scope.maxDate = attrs.maxDate || "";

                scope.change = function(newValue, oldValue)  {
                    if (moment(newValue).format(scope.format) !== moment(oldValue).format(scope.format)) {
                        scope.save(newValue);
                    }
                }

                scope.toggleEdit = function() {
                    scope.edit = !scope.edit;
                    
                    if (scope.edit) {
                        scope.apiError = null;
                        scope.customError = null;
                        // load fresh values           
                        scope.item = $parse(attrs.item)(scope) || null;
                        scope.date = $parse(attrs.ngModel)(scope) || '';
                        scope.placeholder = angular.isUndefined(attrs.placeholder) ? '' : attrs.placeholder;
                        scope.lang = transService.getLanguage();
                        // autofocus
                        $timeout(function () {
                            angular.element('#inline-datepicker-field')[0].focus();
                        });
                        $timeout(function () {
                            angular.element('#inline-datepicker-field')[0].click();
                        }, 160);
                    }
                };

                scope.save = function(date) {
                    scope.apiError = null;
                    scope.customError = null;
                    scope.sending = true;

                    $parse(attrs.onSave)(scope)(attrs.name, date,
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
                        }, 
                        scope.item
                    );
                };


            }
        };
    }
})();
