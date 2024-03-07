(function ()
{
    'use strict';

    angular
        .module('app.sample', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.sample', {
                url    : '/sample',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/sample/sample.html',
                        controller : 'SampleController as vm'
                    }
                },
                resolve: {
                    SampleData: function (apiResolver)
                    {
                        return apiResolver.resolve('sample@get');
                    }
                }
            });

        // // Navigation
        // msNavigationServiceProvider.saveItem('CEP', {
        //     title : 'SAMPLE',
        //     group : true,
        //     weight: 1
        // });
        //
        // msNavigationServiceProvider.saveItem('CEP.sample', {
        //     title    : 'Sample',
        //     icon     : 'icon-tile-four',
        //     state    : 'app.sample',
        //     /*stateParams: {
        //         'param1': 'page'
        //      },*/
        //     translate: 'SAMPLE.SAMPLE_NAV',
        //     weight   : 1
        // });
    }
})();