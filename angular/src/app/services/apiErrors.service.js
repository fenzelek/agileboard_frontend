(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('apiErrorsService', apiErrorsService);

    /** @ngInject */
    function apiErrorsService(transService)
    {
        var service = {
            show: show,
            clear: clear,
            isError: isError
        };

        return service;


        /**
         * show errors
         *
         * @param form_id
         * @param response
         * @param vm
         * @param custom_names
         */
        function show(form_id, response, vm, custom_names) {

            var data = {};
            if (response.hasOwnProperty('data')) {
                data = response.data;
            } else {
                data = response;
            }

            vm.msg_error = transService.getErrorMassage(data);

            angular.forEach(data.fields, function(value, key) {
                if (value.length > 0 && typeof value[0] == 'string') {
                    try {
                        var errors = value.join(' ');

                        if (custom_names) {
                            angular.forEach(custom_names, function(new_name, old_name) {
                                if (old_name == key) {
                                    key = new_name;
                                }
                            });
                        }

                        key = key.split('.').join('_');

                        var elem = $(form_id + " [name=" + key + "]");
                        elem.addClass('is-error');
                        elem.after("<span class='api-error'>" + errors + "</span>");
                    } catch (e) {}
                }
            });
        }

        /**
         * clear errors
         *
         * @param form_id
         */
        function clear(form_id, vm) {

            vm.msg_error = '';

            try {
                $( form_id + " .api-error" ).remove();
                $( form_id + " .is-error" ).removeClass('is-error');
            } catch (e) {}
        }

        /**
         * is error
         *
         * @param response
         * @param field
         * @returns {boolean}
         */
        function isError(response, field) {
            return typeof response.fields[field] !== 'undefined';
        }

    }
})();
