(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inlineAutocomplete', inlineAutocompleteDirective);

    /** @ngInject */
    function inlineAutocompleteDirective($parse, $timeout, $auth)
    {
        return {
            restrict   : 'E',
            scope      : true,
            transclude : true,

            template: function(element, attr) {
                return "<div ng-style=\"{ 'width': edit ? '100%' : 'auto' }\">\n" +
                "    <div ng-transclude ng-if=\"!edit\" ng-click=\"toggleEdit()\"></div>\n" +
                "    <div ng-if=\"edit\" class=\"md-block\">\n" +
                "        <md-autocomplete id=\"inline-autocomplete-input\" \n" +
                "                md-selected-item=\"selectedItem\"\n" +
                "                md-search-text=\"search_text\"\n" +
                "                md-items=\"item in onSearch(search_text)\"\n" +
                "                md-item-text=\"" + attr.itemText + "\"\n" +
                "                md-autoselect=\"true\"\n"+
                "                md-floating-label=\"{{ label }}\" \n" +
                "                md-delay=\"200\"\n" +
                "                md-clear-button=\"true\">\n" +
                "            <md-item-template>\n" +
                "                <span md-highlight-text=\"search_text\">{{" + attr.itemText + "}}</span>\n" +
                "            </md-item-template>\n" +
                "            <md-not-found><span translate=\"OTHER.NOT_FOUND\"></span></md-not-found>\n" +
                "            <div ng-if=\"!selectedItem && !search_text\" class=\"me-avatar\" ng-click=\"me()\">\n" +
                "               <md-icon md-font-icon=\"icon-chevron-right\" />\n" +
                "               <img ng-src=\"{{ getAvatar(user.avatar) }}\" />\n" +
                "            </div>\n" +
                "        </md-autocomplete>\n" +
                "        <div ng-if=\"apiError || customError\" class=\"inline-errors\">\n" +
                "            <span ng-if=\"apiError\" translate=\"{{ 'ERRORS.'+apiError | translate }}\"></span>\n" +
                "            <span ng-if=\"customError\" translate=\"{{ customError | translate }}\"></span>\n" +
                "        </div>\n" +
                "        <div class=\"inline-actions\" flex layout=\"row\" layout-align=\"start center\">\n" +
                "            <md-button class=\"inline-save md-raised md-accent\" ng-click=\"save(selectedItem)\" ng-disabled=\"sending\">\n" +
                "                <span translate=\"OTHER.SAVE\"></span>\n" +
                "            </md-button>\n" +
                "            <md-button class=\"inline-close md-raised\" ng-click=\"toggleEdit()\" ng-disabled=\"sending\">\n" +
                "                <span translate=\"OTHER.CANCEL\"></span>\n" +
                "            </md-button>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</div>";
            },
            link: function (scope, elem, attrs) {
                scope.edit = false;
                scope.sending = false;
                scope.apiError = false;
                scope.customError = null;
                scope.selectedItem = null;
                scope.require = false;
                scope.onSearch = $parse(attrs.onSearch)(scope);
                scope.user = null;
                scope.getAvatar = $auth.getAvatar;

                scope.toggleEdit = function () {
                    scope.edit = !scope.edit;

                    if (scope.edit) {
                        scope.apiError = false;
                        scope.customError = null;
                        scope.selectedItem = $parse(attrs.default)(scope);
                        scope.require = $parse(attrs.require)(scope) == true ? true : false;
                        scope.label = angular.isUndefined(attrs.label) ? '' : attrs.label;
                        $auth.getUser(function (user) {
                            scope.user = user;
                        });
                        // autofocus
                        $timeout(function () {
                            angular.element('#inline-autocomplete-input input')[0].focus();
                        }, 100);
                    }
                };

                scope.me = function () {
                    scope.save(scope.user);
                };

                scope.save = function (selected_item) {
                    if(scope.require && !selected_item) {
                        scope.customError = 'ERRORS.FORM.REQUIRE';
                        $timeout(function () {
                            angular.element('#inline-autocomplete-input input')[0].focus();
                        });
                        return;
                    }

                    scope.apiError = false;
                    scope.customError = null;
                    scope.sending = true;
                    $parse(attrs.onSave)(scope)(attrs.name, selected_item,
                        // success callback
                        function () {
                            scope.edit = false;
                            scope.sending = false;
                        },
                        // api error callback
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
