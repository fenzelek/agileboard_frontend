(function ()
{
    'use strict';

    angular
        .module('app.home', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.home', {
            url      : '/',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/home/home.html',
                    controller : 'HomeController as vm'
                }
            }
        });
    }
})();
