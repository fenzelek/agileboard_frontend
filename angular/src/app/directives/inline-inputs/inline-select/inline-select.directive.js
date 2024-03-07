(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineSelect', inlineSelectDirective);

    /** @ngInject */
    function inlineSelectDirective($parse)
    {
        return {
            restrict   : 'E',
            scope      : true,
            transclude : true,

            template: function(elem, attr) {
                // Multiple sucks-condition... see ->  https://github.com/angular/material/issues/3068
                var multiple = (attr.multiple && attr.multiple == 'true') ? 'multiple' : '';

                return "<div class=\"inline-edit\">\n" +
                "    <div ng-transclude ng-if=\"!edit\" ng-click=\"toggleEdit()\"></div>\n" +
                "    <div ng-if=\"edit\" class=\"md-block\">\n" +
                "       <md-input-container class=\"md-block inline-select-input\" flex=\"100\"> \n" +
                "           <label>{{ label }}</label> \n" +
                "           <md-select ng-model=\"selectedItems\" name=\"{{ name }}\" " + multiple + " > \n" +
                "               <md-option ng-value=\"item.id\" ng-repeat=\"item in items\" > \n" +
                "                   <md-icon ng-if=\"item.status && item.status == 'none'\" md-font-icon=\"icon-checkbox-blank-circle-outline grey-400-fg\" aria-label=\"active\" class=\"option-status s14\"></md-icon> \n" +
                "                   <md-icon ng-if=\"item.status && item.status == 'active'\" md-font-icon=\"icon-checkbox-blank-circle green-600-fg\" aria-label=\"active\" class=\"option-status s14\"></md-icon> \n" +
                "                   <md-icon ng-if=\"item.status && item.status == 'paused'\" md-font-icon=\"icon-checkbox-blank-circle amber-700-fg\" aria-label=\"active\" class=\"option-status s14\"></md-icon> \n" +
                "                   <md-icon ng-if=\"item.status && item.status == 'inactive'\" md-font-icon=\"icon-checkbox-blank-circle grey-400-fg\" aria-label=\"inactive\" class=\"option-status s14\"></md-icon> \n" +
                "                   <span translate=\"{{ translation + item.name}}\"></span></md-option> \n" +
                "           </md-select> \n" +
                "       </md-input-container>\n" +
                "        <div ng-if=\"apiError || customError\" class=\"inline-errors\">\n" +
                "            <span ng-if=\"apiError\" translate=\"{{ 'ERRORS.'+apiError | translate }}\"></span>\n" +
                "            <span ng-if=\"customError\" translate=\"{{ customError | translate }}\"></span>\n" +
                "        </div>\n" +
                "        <div class=\"inline-actions\" flex layout=\"row\" layout-align=\"start center\">\n" +
                "            <md-button class=\"inline-save md-raised md-accent\" id=\"inline-text-save-button\" ng-click=\"save(selectedItems)\" ng-disabled=\"sending\">\n" +
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
                scope.selectedItems = [];

                scope.init = function() {
                    scope.items = $parse(attrs.items)(scope);
                    scope.label = angular.isUndefined(attrs.label) ? '' : attrs.label;
                    scope.name = angular.isUndefined(attrs.name) ? '' : attrs.name;
                    scope.translation = angular.isUndefined(attrs.itemsTranslation) ? '' : attrs.itemsTranslation;
                    // select items from ng-model
                    if(angular.isArray($parse(attrs.ngModel)(scope))) {
                        // for array of objects
                        angular.forEach($parse(attrs.ngModel)(scope), function(item) {
                            scope.selectedItems.push(item.id);
                        });
                    } else if ($parse(attrs.ngModel)(scope).id) {
                        // for single object
                        scope.selectedItems = $parse(attrs.ngModel)(scope).id;
                    } else {
                        // for olny id (int)
                        scope.selectedItems = $parse(attrs.ngModel)(scope);
                    }

                    scope.apiError = null;
                    scope.customError = null;
                }

                scope.toggleEdit = function() {
                    scope.edit = !scope.edit;

                    if (scope.edit) {
                        if (attrs.onOpen) {
                            $parse(attrs.onOpen)(scope)(function() {
                                scope.init();
                            });
                        } else {
                            scope.init();
                        }
                    }
                }

                scope.save = function(selectedItems) {
                    scope.apiError = null;
                    scope.customError = null;
                    scope.sending = true;

                    $parse(attrs.onSave)(scope)(attrs.name, selectedItems,
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
