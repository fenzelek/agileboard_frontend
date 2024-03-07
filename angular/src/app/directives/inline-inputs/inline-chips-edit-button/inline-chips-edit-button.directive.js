(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineChipsEditButton', inlineChipsEditButtonDirective);

    /** @ngInject */
    function inlineChipsEditButtonDirective($parse, $timeout)
    {
        return {
            restrict   : 'E',
            scope      : true,
            transclude : true,

            template: function() {
                return "<div class=\"inline-edit w-full\" layout=\"column\" layout-align=\"start stretch\"> \n" +
                "   <div layout=\"row\" layout-align=\"start center\" class=\"pr-10\">\n" +
                "       <span style=\"font-size: 0.7em\"> \n" +
                "           {{ showTitle }} \n" +
                "       </span> \n" +
                "       <button ng-click=\"toggleEdit()\" class=\"edit-button ml-10\"> \n" +
                "           <md-icon md-font-icon=\"icon-edit\" class=\"icon s18 grey-600-fg\"></md-icon> \n" +
                "           <md-tooltip>{{ 'OTHER.EDIT' | translate }}</md-tooltip> \n" +
                "       </button> \n" +
                "   </div> \n" +
                "   <div class=\"inline-edit\">\n" +
                "       <div ng-transclude ng-if=\"!edit\" class=\"w-full\"></div>\n" +
                "       <div class=\"inline-input\" ng-if=\"edit\" class=\"md-block\">\n" +
                "           <md-input-container>\n" +
                "             <md-contact-chips id=\"inline-chips-field\" \n" +
                "                 ng-model=\"selectedItems\"  \n" +
                "                 md-contacts=\"searchItems($query)\" \n" +
                "                 md-contact-name=\"{{ showName }}\"  \n" +
                "                 md-contact-image=\"{{ showImage }}\"  \n" +
                "                 md-contact-email=\"{{ showEmail }}\"  \n" +
                "                 placeholder=\"{{ placeholder }}\"  \n" +
                "                 secondary-placeholder=\"{{ secondaryPlaceholder }}\">  \n" +
                "             </md-contact-chips>  \n" +
                "           </md-input-container>\n" +
                "           <div ng-if=\"apiError || customError\" class=\"inline-errors\">\n" +
                "               <span ng-if=\"apiError\" translate=\"{{ 'ERRORS.'+apiError | translate }}\"></span>\n" +
                "               <span ng-if=\"customError\" translate=\"{{ customError | translate }}\"></span>\n" +
                "           </div>\n" +
                "           <div class=\"inline-actions\" flex layout=\"row\" layout-align=\"start center\">\n" +
                "               <md-button class=\"inline-save md-raised md-accent\" ng-click=\"save(selectedItems)\" ng-disabled=\"sending\">\n" +
                "                   <span translate=\"OTHER.SAVE\"></span>\n" +
                "               </md-button>\n" +
                "               <md-button class=\"inline-close md-raised\" ng-click=\"toggleEdit()\" ng-disabled=\"sending\">\n" +
                "                   <span translate=\"OTHER.CANCEL\"></span>\n" +
                "               </md-button>\n" +
                "           </div>\n" +
                "       </div>\n" +
                "   </div> \n" +
                "</div>";
            },
            link: function (scope, elem, attrs) {
                scope.selectedItems = [];
                scope.edit = false;
                scope.sending = false;
                scope.apiError = null;
                scope.customError = null;
                scope.searchItems = $parse(attrs.onSearch)(scope);
                scope.showTitle = angular.isUndefined(attrs.showTitle) ? '' : attrs.showTitle;

                scope.toggleEdit = function () {
                    scope.edit = !scope.edit;

                    if (scope.edit) {
                        scope.apiError = null;
                        scope.customError = null;
                        // load 'fresh' values from model
                        scope.selectedItems = angular.copy($parse(attrs.selectedItems)(scope));
                        scope.showName = angular.isUndefined(attrs.showName) ? 'name' : attrs.showName;
                        scope.showImage = angular.isUndefined(attrs.showImage) ? '' : attrs.showImage;
                        scope.showEmail = angular.isUndefined(attrs.showEmail) ? '' : attrs.showEmail;
                        scope.placeholder = angular.isUndefined(attrs.placeholder) ? '' : attrs.placeholder;
                        scope.secondaryPlaceholder = angular.isUndefined(attrs.secondaryPlaceholder) ? '' : attrs.secondaryPlaceholder;
                        // autofocus
                        $timeout(function () {
                            angular.element('#inline-chips-field input')[0].focus();
                        }, 100);
                    }
                };

                scope.save = function (selected_items) {
                    scope.apiError = null;
                    scope.customError = null;
                    scope.sending = true;

                    $parse(attrs.onSave)(scope)(attrs.name, selected_items,
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
