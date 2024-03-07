(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('formService', formService);

    /** @ngInject */
    function formService($timeout, $location)
    {
        var service = {
            formUp: formUp,
            generateForm: generateForm
        };

        return service;

        function formUp() {
            $timeout(function () {
                $location.hash('up');
            });
        }

        function generateForm(form, data, accept_null) {

            if (typeof accept_null == 'undefined') {
                accept_null = false;
            }

            //add fields
            angular.forEach(data, function(value, key) {

                if (form.hasOwnProperty(key)) {

                    if (value == null && !accept_null) {
                        value = '';
                    }

                    //remove data
                    if (value !== null && value.hasOwnProperty('data')) {

                        if (value.data != null && value.data.length != 0) {
                            form[key] = value.data;
                        }

                    } else {
                        form[key] = value;
                    }
                }

            });
        }

    }
})();
