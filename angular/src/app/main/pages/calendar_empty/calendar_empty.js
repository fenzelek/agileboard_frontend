(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('CalendarEmptyDialogController', CalendarEmptyDialogController);

    /** @ngInject */
    function CalendarEmptyDialogController($mdDialog, transService, $location)
    {
        var vm = this;
        transService.loadFile('main/pages/calendar_empty');

        vm.goToCalendar = goToCalendar;
        vm.hide = hide;

        function goToCalendar() {
            $location.path('/calendar/working');
            $mdDialog.hide();
        }
        function hide() {
            $mdDialog.hide();
        }
    }

})();
